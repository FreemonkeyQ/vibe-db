/**
 * @file schema.service.js - Schema（数据库方案）的业务逻辑层
 *
 * 【文件用途】
 * 处理与 Schema 相关的业务流程。本文件是三层架构的中间层。
 *
 * 【三层架构完整流程说明（以创建 Schema 为例）】
 *
 *   1. API 路由层（route.js）接收前端 POST 请求
 *        ↓
 *   2. Schema验证层：createSchemaSchema.parse(input) ← zod.schema.js
 *      - 检查 name 是否非空、长度是否合法
 *      - 检查 description 是否超长
 *      - 不合法则自动抛出 ZodError，请求到此终止
 *        ↓
 *   3. Service业务逻辑层（本文件）：schemaMapper.create(validData)
 *      - 编排业务流程（如创建表时的"获取或创建 Schema"逻辑）
 *      - 调用 Mapper 执行数据库操作
 *        ↓
 *   4. Mapper数据映射层：prisma.schema.create(...) ← schema.mapper.js
 *      - 执行实际的 SQL/ORM 操作
 *
 * 【Service 层存在的意义】
 * - 集中业务规则（如 "getOrCreateSchema" 的逻辑：有就用，没有就建）
 * - 解耦路由层和数据库层，让 route.js 只做路由，不关心业务细节
 * - 方便多个路由复用同一段业务逻辑
 */

import { schemaMapper } from '@/server/mappers/schema.mapper';
import { createSchemaSchema } from '@/server/schemas/schema.schema';

export const schemaService = {
  /**
   * 获取所有 Schema 列表
   *
   * 这是一个简单的透传方法：Service 层直接调用 Mapper 层的 findAll，
   * 没有额外的业务逻辑。保留这一层是为了架构的一致性，
   * 将来如果有过滤、权限校验等逻辑，可以在这里添加。
   *
   * @returns {Promise<Array>} Schema 列表
   */
  async getSchemas() {
    return schemaMapper.findAll();
  },

  /**
   * 创建一个新 Schema
   *
   * 【工作流程】
   * 1. 用 createSchemaSchema 验证输入数据（name 是否合法等）
   * 2. 将 name 两端空格去掉（trim），避免用户不小心输入多余空格
   * 3. 调用 Mapper 层创建数据库记录
   *
   * @param {object} input - 来自前端的请求体数据
   * @param {string} input.name - Schema 名称
   * @param {string} [input.description] - 可选描述
   * @returns {Promise<object>} 新创建的 Schema 对象
   */
  async createSchema(input) {
    const data = createSchemaSchema.parse(input);
    return schemaMapper.create({
      name: data.name.trim(),
      description: data.description,
    });
  },

  /**
   * 获取或创建 Schema
   *
   * 【这个方法的业务场景】
   * 用户在画布上直接新建表时，可能还没有创建任何 Schema。
   * 此时前端可能不传 schemaId，或者传了一个不存在的 ID。
   * 这个方法的处理逻辑是：
   * - 如果有 schemaId 且该 Schema 存在 → 返回该 Schema 的 ID
   * - 否则 → 自动创建一个"默认Schema"并返回其 ID
   * 这样用户可以"零配置"开始使用，不需要先手动创建 Schema。
   *
   * @param {string} [schemaId] - 可选的 Schema ID
   * @returns {Promise<string>} 确保存在的 Schema ID
   */
  async getOrCreateSchema(schemaId) {
    if (schemaId) {
      const existing = await schemaMapper.findById(schemaId);
      if (existing) return existing.id;
    }
    // Schema 不存在或没有传 schemaId，自动创建一个默认的
    const newSchema = await schemaMapper.create({ name: '默认Schema' });
    return newSchema.id;
  },
};

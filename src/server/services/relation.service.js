/**
 * @file relation.service.js - Relation（表关联关系）的业务逻辑层
 *
 * 【文件用途】
 * 处理与"表关联关系"相关的 CRUD 业务逻辑。
 * Relation 描述了数据库表之间的连接（如外键关系），
 * 是 ER 图（实体关系图）可视化的重要组成部分。
 *
 * 【三层架构在本文件中的体现】
 * 每个方法都遵循统一的模式：
 * 1. 接收前端输入 → 2. 用 Zod schema 验证 → 3. 调用 Mapper 操作数据库
 */

import { relationMapper } from '@/server/mappers/relation.mapper';
import { createRelationSchema, updateRelationSchema } from '@/server/schemas/relation.schema';

export const relationService = {
  /**
   * 获取指定 Schema 下的所有关联关系
   *
   * 【参数校验】
   * 在调用 Mapper 之前先检查 schemaId 是否存在，如果不存在直接抛出错误。
   * 这样做可以避免无效查询，也能给前端更明确的错误提示。
   *
   * @param {string} schemaId - Schema 的 ID
   * @returns {Promise<Array>} 关联关系列表
   */
  async getRelationsBySchemaId(schemaId) {
    if (!schemaId) throw new Error('schemaId is required');
    return relationMapper.findBySchemaId(schemaId);
  },

  /**
   * 创建一条新的关联关系
   *
   * @param {object} input - 前端传来的关联数据
   * @returns {Promise<object>} 新创建的关联关系对象
   */
  async createRelation(input) {
    const data = createRelationSchema.parse(input);
    return relationMapper.create(data);
  },

  /**
   * 更新一条关联关系
   *
   * 【解构赋值 { id, ...rest } 的作用】
   * Zod 验证后的 data 包含 id 和可能更新的其他字段（name、cardinality）。
   * 但 Mapper 的 update 方法签名是 update(id, data)，
   * 所以需要把 id 单独提取出来，剩下的用 ...rest 收集作为更新数据。
   *
   * @param {object} input - 包含 id 和需要更新的字段
   * @returns {Promise<object>} 更新后的关联关系对象
   */
  async updateRelation(input) {
    const data = updateRelationSchema.parse(input);
    const { id, ...rest } = data;
    return relationMapper.update(id, rest);
  },

  /**
   * 删除一条关联关系（物理删除）
   *
   * @param {string} id - 关联关系的 ID
   * @returns {Promise<object>} 被删除的关联关系对象
   */
  async deleteRelation(id) {
    if (!id) throw new Error('关联 ID 不能为空');
    return relationMapper.delete(id);
  },
};

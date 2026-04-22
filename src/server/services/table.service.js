/**
 * @file table.service.js - Table（数据库表）的业务逻辑层
 *
 * 【文件用途】
 * 处理与"数据库表"相关的业务逻辑。
 * 这是五个 Service 中最复杂的一个，因为 Table 是整个系统的核心实体。
 *
 * 【与其他 Service 的关系】
 * Table Service 是"父级"：
 * - Table 属于 Schema（依赖 schemaService）
 * - Table 包含 Field（字段服务独立为 fieldService）
 * - Table 包含 Index（索引服务独立为 indexService）
 * - Table 之间通过 Relation 关联（关联服务独立为 relationService）
 *
 * 【特殊逻辑说明】
 * createTable 方法中调用了 schemaService.getOrCreateSchema()，
 * 这是唯一跨 Service 调用的地方。它确保在创建表之前，所属的 Schema 一定存在。
 */

import { tableMapper } from '@/server/mappers/table.mapper';
import {
  createTableSchema,
  updateTableSchema,
  reorderTablesSchema,
} from '@/server/schemas/table.schema';
import { schemaService } from '@/server/services/schema.service';

export const tableService = {
  /**
   * 获取指定 Schema 下的所有表（包含字段和索引子数据）
   *
   * @param {string} schemaId - Schema 的 ID
   * @returns {Promise<Array>} 表列表，每张表自带 fields 和 indexes 属性
   */
  async getTablesBySchemaId(schemaId) {
    if (!schemaId) throw new Error('schemaId is required');
    return tableMapper.findBySchemaId(schemaId);
  },

  /**
   * 创建一张新表
   *
   * 【特殊处理：getOrCreateSchema】
   * 用户可能还没有创建任何 Schema 就直接新建表（例如从欢迎页进入）。
   * 此时前端可能不传 schemaId，或传了一个无效的 ID。
   * getOrCreateSchema 会确保拿到一个真实存在的 Schema ID：
   * - 有就用，没有就自动创建"默认Schema"
   *
   * 【name.trim()】
   * 去掉表名两端的空格，避免用户不小心输入多余空格导致表名不规范。
   *
   * @param {object} input - 前端传来的表数据
   * @returns {Promise<object>} 新创建的表对象（包含默认的 id 字段和 id 索引）
   */
  async createTable(input) {
    const data = createTableSchema.parse(input);

    // 获取或创建 Schema，确保返回的是一个真实存在的 Schema ID
    const schemaId = await schemaService.getOrCreateSchema(data.schemaId);

    return tableMapper.create({
      schemaId,
      name: data.name.trim(),
      color: data.color,
      positionX: data.positionX,
      positionY: data.positionY,
    });
  },

  /**
   * 更新表的属性（名称、颜色、备注、画布位置等）
   *
   * @param {object} input - 包含 id 和需要更新的表属性
   * @returns {Promise<object>} 更新后的表对象（包含 fields 和 indexes）
   */
  async updateTable(input) {
    const data = updateTableSchema.parse(input);
    const { id, ...rest } = data;

    return tableMapper.update(id, rest);
  },

  /**
   * 删除一张表（软删除）
   *
   * 【为什么用软删除？】
   * 软删除将 enable 设为 false，而不是真的删除记录。
   * 好处：
   * 1. 数据可恢复（用户可能误删）
   * 2. 不破坏关联完整性（该表关联的字段、索引仍然存在，不会被级联删除）
   * 3. 可以统计删除历史
   *
   * @param {string} id - 表 ID
   * @returns {Promise<object>} 软删除后的表对象
   */
  async deleteTable(id) {
    if (!id) throw new Error('表 ID 不能为空');
    return tableMapper.softDelete(id);
  },

  /**
   * 重新排序表
   *
   * @param {object} input - 包含 schemaId 和新的表顺序数组
   * @param {string} input.schemaId - Schema ID
   * @param {string[]} input.tableIds - 按新顺序排列的表 ID 数组
   * @returns {Promise<Array>} 批量更新结果
   */
  async reorderTables(input) {
    const { schemaId, tableIds } = reorderTablesSchema.parse(input);
    return tableMapper.reorder(schemaId, tableIds);
  },
};

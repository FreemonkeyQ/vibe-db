/**
 * @file index.service.js - Index（数据库索引）的业务逻辑层
 *
 * 【文件用途】
 * 处理与"数据库索引"相关的 CRUD 和排序业务逻辑。
 *
 * 【与 field.service.js 的结构对比】
 * 本文件的结构和 field.service.js 几乎一模一样。
 * 这是因为字段（Field）和索引（Index）在业务上都是"表的子项"，
 * 都支持相同的四种操作（创建、更新、删除、排序）。
 * 虽然看起来重复，但分开写是好的实践——将来两者的业务逻辑可能分化，
 * 比如索引可能有更复杂的验证（唯一性检查、覆盖字段等）。
 */

import { indexMapper } from '@/server/mappers/index.mapper';
import {
  createIndexSchema,
  updateIndexSchema,
  deleteIndexSchema,
  reorderIndexesSchema,
} from '@/server/schemas/index.schema';

export const indexService = {
  /**
   * 创建一个新索引
   *
   * @param {object} input - 前端传来的索引数据
   * @returns {Promise<object>} 新创建的索引对象
   */
  async createIndex(input) {
    const data = createIndexSchema.parse(input);
    return indexMapper.create(data);
  },

  /**
   * 更新一个索引
   *
   * @param {object} input - 包含 id 和需要更新的索引属性
   * @returns {Promise<object>} 更新后的索引对象
   */
  async updateIndex(input) {
    const data = updateIndexSchema.parse(input);
    const { id, ...rest } = data;
    return indexMapper.update(id, rest);
  },

  /**
   * 删除一个索引（物理删除）
   *
   * @param {object} input - 包含要删除索引的 id
   * @returns {Promise<object>} 被删除的索引对象
   */
  async deleteIndex(input) {
    const { id } = deleteIndexSchema.parse(input);
    return indexMapper.delete(id);
  },

  /**
   * 重新排序索引
   *
   * @param {object} input - 包含 tableId 和新的索引顺序数组
   * @param {string} input.tableId - 所属表 ID
   * @param {string[]} input.indexIds - 按新顺序排列的索引 ID 数组
   * @returns {Promise<Array>} 批量更新结果
   */
  async reorderIndexes(input) {
    const { tableId, indexIds } = reorderIndexesSchema.parse(input);
    return indexMapper.reorder(tableId, indexIds);
  },
};

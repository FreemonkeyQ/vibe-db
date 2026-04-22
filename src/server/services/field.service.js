/**
 * @file field.service.js - Field（表字段）的业务逻辑层
 *
 * 【文件用途】
 * 处理与"表字段"相关的 CRUD 和排序业务逻辑。
 * 字段是表的核心组成部分，用户可以在可视化界面中增删改字段、拖拽排序。
 *
 * 【四层操作】
 * - createField:  新增字段
 * - updateField:  修改字段属性（名称、类型、主键、空值约束等）
 * - deleteField:  删除字段
 * - reorderFields: 调整字段顺序（拖拽排序）
 */

import { fieldMapper } from '@/server/mappers/field.mapper';
import {
  createFieldSchema,
  updateFieldSchema,
  deleteFieldSchema,
  reorderFieldsSchema,
} from '@/server/schemas/field.schema';

export const fieldService = {
  /**
   * 创建一个新字段
   *
   * @param {object} input - 前端传来的字段数据
   * @returns {Promise<object>} 新创建的字段对象
   */
  async createField(input) {
    const data = createFieldSchema.parse(input);
    return fieldMapper.create(data);
  },

  /**
   * 更新一个字段
   *
   * @param {object} input - 包含 id 和需要更新的字段属性
   * @returns {Promise<object>} 更新后的字段对象
   */
  async updateField(input) {
    const data = updateFieldSchema.parse(input);
    const { id, ...rest } = data;
    return fieldMapper.update(id, rest);
  },

  /**
   * 删除一个字段（物理删除）
   *
   * 与 relationService.deleteRelation 的写法略有不同：
   * 这里用 Zod schema 验证后解构提取 id，而不是直接判断 id 是否为空。
   * 两种方式都可以，用 Zod 的好处是验证逻辑集中管理。
   *
   * @param {object} input - 包含要删除字段的 id
   * @returns {Promise<object>} 被删除的字段对象
   */
  async deleteField(input) {
    const { id } = deleteFieldSchema.parse(input);
    return fieldMapper.delete(id);
  },

  /**
   * 重新排序字段
   *
   * 用户在可视化界面拖拽字段调整顺序后，前端将新顺序的字段 ID 数组传给后端。
   * 后端批量更新每个字段的 order 值，保证下次查询时按新顺序返回。
   *
   * @param {object} input - 包含 tableId 和新的字段顺序数组
   * @param {string} input.tableId - 所属表 ID
   * @param {string[]} input.fieldIds - 按新顺序排列的字段 ID 数组
   * @returns {Promise<Array>} 批量更新结果
   */
  async reorderFields(input) {
    const { tableId, fieldIds } = reorderFieldsSchema.parse(input);
    return fieldMapper.reorder(tableId, fieldIds);
  },
};

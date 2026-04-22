/**
 * @file index.mapper.js - Index（数据库索引）的数据映射层
 *
 * 【文件用途】
 * 封装所有与"数据库索引"相关的 CRUD 和排序操作。
 * 索引是加速数据库查询的重要机制，本文件负责管理索引的元数据。
 *
 * 【在项目架构中的角色 —— Mapper 数据映射层】
 * 直接使用 Prisma ORM 操作 index 表。
 * 本文件的结构与 field.mapper.js 非常相似，因为字段和索引都属于"表的子项"，
 * 都有 create、update、delete、reorder 四种操作，都使用 order 字段控制排序。
 */

import prisma from '@/lib/prisma';

export const indexMapper = {
  /**
   * 创建一个新索引
   *
   * 【自动排序逻辑】
   * 与 fieldMapper.create 相同：查询当前最大 order，新索引排在最后。
   *
   * 【默认值处理】
   * - type: 默认 'BTREE'（B 树索引是最通用的索引类型，适合大多数查询场景）
   * - isUnique: 默认 false（普通索引，不强制唯一性约束）
   *
   * @param {object} params - 索引数据
   * @param {string} params.tableId - 所属表的 ID
   * @param {string} params.name - 索引名称
   * @param {string} [params.type] - 索引类型，默认 BTREE
   * @param {boolean} [params.isUnique] - 是否为唯一索引，默认 false
   * @returns {Promise<object>} 新创建的索引对象
   */
  async create({ tableId, name, type, isUnique }) {
    // 获取当前最大 order
    const maxOrder = await prisma.index.aggregate({
      where: { tableId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    return prisma.index.create({
      data: {
        tableId,
        name,
        type: type ?? 'BTREE',
        isUnique: isUnique ?? false,
        order,
      },
    });
  },

  /**
   * 更新一个索引
   *
   * @param {string} id - 索引 ID
   * @param {object} data - 需要更新的索引属性
   * @returns {Promise<object>} 更新后的索引对象
   */
  async update(id, data) {
    return prisma.index.update({
      where: { id },
      data,
    });
  },

  /**
   * 删除一个索引（物理删除）
   *
   * @param {string} id - 索引 ID
   * @returns {Promise<object>} 被删除的索引对象
   */
  async delete(id) {
    return prisma.index.delete({
      where: { id },
    });
  },

  /**
   * 批量重新排序索引
   *
   * 使用 Prisma $transaction 在一个事务中批量更新所有索引的 order 值。
   * 原理同 fieldMapper.reorder：数组下标即为新的 order 值。
   *
   * @param {string} tableId - 表 ID
   * @param {string[]} indexIds - 按新顺序排列的索引 ID 数组
   * @returns {Promise<Array>} 批量更新的结果数组
   */
  async reorder(tableId, indexIds) {
    return prisma.$transaction(
      indexIds.map((id, index) =>
        prisma.index.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  },
};

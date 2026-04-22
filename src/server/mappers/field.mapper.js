/**
 * @file field.mapper.js - Field（表字段）的数据映射层
 *
 * 【文件用途】
 * 封装所有与"表字段"相关的数据库 CRUD 操作和排序操作。
 * 字段是表的列定义，如 users 表中的 id、username、email 都是字段。
 *
 * 【在项目架构中的角色 —— Mapper 数据映射层】
 * 直接使用 Prisma ORM 操作 field 表，为上层 Service 提供数据访问接口。
 *
 * 【排序机制说明】
 * 每个字段有一个 order 字段（整数），用于控制显示顺序。
 * 创建新字段时自动分配 order（当前最大值 + 1），拖拽排序时批量更新 order。
 */

import prisma from '@/lib/prisma';

export const fieldMapper = {
  /**
   * 创建一个新字段
   *
   * 【自动排序逻辑】
   * 1. 先用 aggregate 查询该表中所有字段的最大 order 值
   * 2. 新字段的 order = 最大值 + 1，这样新字段自动排在最后
   * 3. 如果表中还没有字段（_max.order 为 null），则用 ?? -1 兜底，+1 后 order = 0
   *
   * 【默认值处理】
   * - isPrimary: 默认 false（大多数字段不是主键）
   * - isNullable: 默认 true（允许 NULL 是数据库的常见默认行为）
   * - remark: 默认 null（没有备注）
   *
   * @param {object} params - 字段数据
   * @param {string} params.tableId - 所属表的 ID
   * @param {string} params.name - 字段名
   * @param {string} params.type - 数据类型
   * @param {boolean} [params.isPrimary] - 是否为主键
   * @param {boolean} [params.isNullable] - 是否允许 NULL
   * @param {string|null} [params.remark] - 字段备注
   * @returns {Promise<object>} 新创建的字段对象
   */
  async create({ tableId, name, type, isPrimary, isNullable, remark }) {
    // 获取当前最大 order
    const maxOrder = await prisma.field.aggregate({
      where: { tableId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    return prisma.field.create({
      data: {
        tableId,
        name,
        type,
        isPrimary: isPrimary ?? false,
        isNullable: isNullable ?? true,
        remark: remark ?? null,
        order,
      },
    });
  },

  /**
   * 更新一个字段
   *
   * @param {string} id - 字段 ID
   * @param {object} data - 需要更新的字段属性
   * @returns {Promise<object>} 更新后的字段对象
   */
  async update(id, data) {
    return prisma.field.update({
      where: { id },
      data,
    });
  },

  /**
   * 删除一个字段（物理删除）
   *
   * @param {string} id - 字段 ID
   * @returns {Promise<object>} 被删除的字段对象
   */
  async delete(id) {
    return prisma.field.delete({
      where: { id },
    });
  },

  /**
   * 批量重新排序字段
   *
   * 【事务机制 - $transaction】
   * Prisma 的 $transaction 确保所有更新操作要么全部成功，要么全部回滚。
   * 这在排序场景中非常重要——如果只更新了一半就出错，字段顺序会乱掉。
   *
   * 【实现原理】
   * 将 fieldIds 数组的下标（index）作为新的 order 值：
   * - fieldIds[0] → order: 0（排第一）
   * - fieldIds[1] → order: 1（排第二）
   * - ...以此类推
   *
   * @param {string} tableId - 表 ID（虽然当前未使用，但保留用于后续校验）
   * @param {string[]} fieldIds - 按新顺序排列的字段 ID 数组
   * @returns {Promise<Array>} 批量更新的结果数组
   */
  async reorder(tableId, fieldIds) {
    return prisma.$transaction(
      fieldIds.map((id, index) =>
        prisma.field.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  },
};

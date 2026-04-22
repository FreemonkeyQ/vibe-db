/**
 * @file table.mapper.js - Table（数据库表）的数据映射层
 *
 * 【文件用途】
 * 封装所有与"数据库表"相关的数据库操作。
 * 这是 Mapper 层中最复杂的文件，因为 Table 是核心实体，
 * 它的创建过程涉及关联创建（自动生成默认字段和索引），
 * 查询时也需要包含字段和索引的子数据。
 *
 * 【在项目架构中的角色 —— Mapper 数据映射层】
 * 直接使用 Prisma ORM 操作 table 表及其关联的 field、index 表。
 *
 * 【软删除 vs 物理删除】
 * 本文件使用"软删除"（soft delete）：不是真的删除记录，而是将 enable 字段设为 false。
 * 这样做的好处是数据可以恢复，而且不会破坏关联数据的完整性。
 */

import prisma from '@/lib/prisma';

/**
 * 表的关联查询配置（常量提取）
 *
 * 【为什么提取为常量？】
 * 多个方法（findBySchemaId、create、update）都需要 include 字段和索引数据。
 * 提取为常量避免了重复代码，修改时也只需要改一处。
 *
 * 【include 的含义】
 * Prisma 的 include 相当于 SQL 的 JOIN，会自动关联查询子表数据。
 * 这里表示：查询表的同时，把它的所有字段（fields）和索引（indexes）一起查出来，
 * 并按 order 升序排列。
 */
const TABLE_INCLUDE = {
  fields: { orderBy: { order: 'asc' } },
  indexes: { orderBy: { order: 'asc' } },
};

export const tableMapper = {
  /**
   * 根据 Schema ID 查询该方案下的所有表（包含字段和索引）
   *
   * 【where 条件 enable: true】
   * 只查询未被软删除的表。被删除的表（enable: false）不会出现在结果中。
   *
   * @param {string} schemaId - Schema 的 ID
   * @returns {Promise<Array>} 表列表，每个表包含 fields 和 indexes 子数据
   */
  async findBySchemaId(schemaId) {
    return prisma.table.findMany({
      where: { schemaId, enable: true },
      include: TABLE_INCLUDE,
      orderBy: { order: 'asc' },
    });
  },

  /**
   * 创建一张新表（含默认字段和默认索引）
   *
   * 【创建流程】
   * 1. 查询当前 Schema 中表的最大 order，新表排在最后
   * 2. 创建表记录的同时，通过 Prisma 的嵌套创建（nested create）自动创建：
   *    - 一个默认的 id 字段（serial 自增主键、不可为空）
   *    - 一个默认的 id 索引（BTREE 类型、唯一索引）
   *    这样用户新建表后就有一个可用的基础结构，不需要手动添加主键。
   *
   * 【Prisma 嵌套创建语法】
   * fields: { create: { ... } } 表示在创建 table 的同时，
   * 在 field 表中也创建一条关联记录。这是 Prisma 的一大便利之处，
   * 等价于两条 INSERT 语句 + 自动填充外键，但写法更简洁。
   *
   * @param {object} params - 表数据
   * @param {string} params.schemaId - 所属 Schema ID
   * @param {string} params.name - 表名
   * @param {string} [params.color] - 表颜色，默认蓝色 '#2b80ff'
   * @param {number} [params.positionX] - 画布 X 坐标，默认 0
   * @param {number} [params.positionY] - 画布 Y 坐标，默认 0
   * @returns {Promise<object>} 新创建的表对象（包含 fields 和 indexes）
   */
  async create({ schemaId, name, color, positionX, positionY }) {
    // 获取当前最大 order
    const maxOrder = await prisma.table.aggregate({
      where: { schemaId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    return prisma.table.create({
      data: {
        schemaId,
        name,
        color: color ?? '#2b80ff',
        positionX: positionX ?? 0,
        positionY: positionY ?? 0,
        order,
        // 创建默认的 id 字段：自增主键，不允许为空
        fields: {
          create: {
            name: 'id',
            type: 'serial',
            isPrimary: true,
            isNullable: false,
            order: 0,
          },
        },
        // 创建默认的 id 索引：B 树唯一索引
        indexes: {
          create: {
            name: 'id',
            type: 'BTREE',
            isUnique: true,
            order: 0,
          },
        },
      },
      include: TABLE_INCLUDE,
    });
  },

  /**
   * 更新表的属性
   *
   * 【条件展开语法 ...(xxx !== undefined && { xxx })】
   * 这是一种优雅的"部分更新"写法：
   * - 如果 name 不是 undefined（即前端传了这个字段），则加入 { name } 到 data 中
   * - 如果 name 是 undefined（前端没传），展开空对象 {}，等于没有这个字段
   * 这样就实现了"只更新传入的字段，未传的保持不变"。
   *
   * @param {string} id - 表 ID
   * @param {object} params - 需要更新的表属性
   * @returns {Promise<object>} 更新后的表对象（包含 fields 和 indexes）
   */
  async update(id, { name, color, remark, positionX, positionY }) {
    return prisma.table.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(remark !== undefined && { remark }),
        ...(positionX !== undefined && { positionX }),
        ...(positionY !== undefined && { positionY }),
      },
      include: TABLE_INCLUDE,
    });
  },

  /**
   * 软删除一张表
   *
   * 【软删除（Soft Delete）】
   * 不是真的从数据库中删除记录，而是将 enable 字段设为 false。
   * 查询时通过 where: { enable: true } 过滤掉已删除的表。
   * 优点：数据可恢复，不会破坏关联关系（如字段、索引仍然存在）。
   *
   * @param {string} id - 表 ID
   * @returns {Promise<object>} 更新后的表对象（enable 已变为 false）
   */
  async softDelete(id) {
    return prisma.table.update({
      where: { id },
      data: { enable: false },
    });
  },

  /**
   * 批量重新排序表
   *
   * 使用 Prisma $transaction 保证原子性，原理同 fieldMapper.reorder。
   *
   * @param {string} schemaId - Schema ID（用于上下文标识）
   * @param {string[]} tableIds - 按新顺序排列的表 ID 数组
   * @returns {Promise<Array>} 批量更新的结果数组
   */
  async reorder(schemaId, tableIds) {
    return prisma.$transaction(
      tableIds.map((id, index) =>
        prisma.table.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  },
};

/**
 * @file relation.mapper.js - Relation（表关联关系）的数据映射层
 *
 * 【文件用途】
 * 封装所有与"表关联关系"相关的数据库 CRUD 操作。
 * Relation 描述了两张表之间的关联（如：用户表 → 订单表 的一对多关系）。
 *
 * 【在项目架构中的角色 —— Mapper 数据映射层】
 * 三层架构的最底层，直接使用 Prisma 操作 relation 表。
 * Service 层调用本文件的方法来完成实际的数据库读写。
 */

import prisma from '@/lib/prisma';

export const relationMapper = {
  /**
   * 根据 Schema ID 查询该方案下的所有关联关系
   *
   * 按创建时间升序排列，保证先创建的关联排在前面。
   *
   * @param {string} schemaId - Schema 的 ID
   * @returns {Promise<Array>} 关联关系列表
   */
  async findBySchemaId(schemaId) {
    return prisma.relation.findMany({
      where: { schemaId },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * 创建一条新的关联关系
   *
   * data 包含 schemaId、name、cardinality、sourceTableId 等所有必要字段，
   * 已经在 Schema 验证层通过了 Zod 校验。
   *
   * @param {object} data - 关联关系数据（经过 Zod 验证后的安全数据）
   * @returns {Promise<object>} 新创建的关联关系对象
   */
  async create(data) {
    return prisma.relation.create({ data });
  },

  /**
   * 更新一条关联关系
   *
   * @param {string} id - 关联关系的 ID
   * @param {object} data - 需要更新的字段（如 name、cardinality）
   * @returns {Promise<object>} 更新后的关联关系对象
   */
  async update(id, data) {
    return prisma.relation.update({
      where: { id },
      data,
    });
  },

  /**
   * 删除一条关联关系（物理删除）
   *
   * 注意这里是物理删除（直接从数据库中移除记录），不是软删除。
   * 因为关联关系不像表那样有复杂的级联数据，删除后影响较小。
   *
   * @param {string} id - 关联关系的 ID
   * @returns {Promise<object>} 被删除的关联关系对象
   */
  async delete(id) {
    return prisma.relation.delete({
      where: { id },
    });
  },
};

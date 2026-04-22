/**
 * @file schema.mapper.js - Schema（数据库方案）的数据映射层
 *
 * 【文件用途】
 * 封装所有与 Schema 相关的数据库操作（查询、创建等）。
 * 这是三层架构中的最底层，直接通过 Prisma ORM 与数据库交互。
 *
 * 【在项目架构中的角色 —— Mapper 数据映射层】
 * 三层架构：Schema验证 → Service业务逻辑 → Mapper数据映射（本层）
 *
 *   - Schema验证层：确保入参合法
 *   - Service业务逻辑层：编排业务流程，调用 Mapper
 *   - Mapper数据映射层（本文件）：直接操作数据库
 *
 * 【为什么要有 Mapper 层？】
 * 1. 隔离数据库细节：如果将来要换数据库或换 ORM，只需要修改 Mapper 层
 * 2. 复用数据库查询：多个 Service 可以共用同一个 Mapper 方法
 * 3. 集中管理 SQL/ORM 逻辑：所有 Prisma 调用都在这里，方便审计和优化
 *
 * 【什么是 Prisma？】
 * Prisma 是 Node.js/TypeScript 生态最流行的 ORM（对象关系映射）工具。
 * 它让你用 JavaScript 对象的方式操作数据库，而不需要手写 SQL。
 * 例如：prisma.schema.findMany() 相当于 SELECT * FROM schema
 */

import prisma from '@/lib/prisma';

export const schemaMapper = {
  /**
   * 查询所有 Schema 列表
   *
   * 【select 的作用】
   * 只选择需要的字段返回，而不是返回所有字段。这样做有两个好处：
   * 1. 减少数据传输量，提升性能
   * 2. 避免敏感或无用字段暴露给前端
   *
   * 【_count 聚合】
   * _count: { select: { tables: true } } 是 Prisma 的关联计数功能，
   * 会在结果中附加一个 _count.tables 字段，表示每个 Schema 下有多少张表。
   * 这样前端列表页可以直接显示"表数量"，而不需要额外请求。
   *
   * 【orderBy】
   * 按 updatedAt 降序排列，最近修改的排在最前面
   *
   * @returns {Promise<Array>} Schema 列表，包含 id、name、description、时间戳、表数量
   */
  async findAll() {
    return prisma.schema.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { tables: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  /**
   * 根据 ID 查询单个 Schema
   *
   * findUnique 只会返回一条记录或 null，适用于按主键/唯一索引查询。
   *
   * @param {string} id - Schema 的唯一标识符
   * @returns {Promise<object|null>} Schema 对象，不存在时返回 null
   */
  async findById(id) {
    return prisma.schema.findUnique({
      where: { id },
    });
  },

  /**
   * 创建一个新的 Schema
   *
   * @param {object} params
   * @param {string} params.name - Schema 名称，如果为空则默认 '未命名'
   * @param {string} [params.description] - 可选的描述信息
   * @returns {Promise<object>} 新创建的 Schema 对象（包含自动生成的 id、时间戳等）
   */
  async create({ name, description }) {
    return prisma.schema.create({
      data: {
        name: name || '未命名',
        description,
      },
    });
  },
};

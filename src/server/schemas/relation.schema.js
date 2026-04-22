/**
 * @file relation.schema.js - Relation（表关联关系）的 Zod 验证模式
 *
 * 【文件用途】
 * 定义创建和更新"表之间关联关系"时的输入参数验证规则。
 * 在数据库设计中，表与表之间通常存在关联（如：用户表 → 订单表），
 * 本文件定义了描述这些关联所需的字段及其约束。
 *
 * 【关联关系的核心概念】
 * - sourceTable / sourceField：关联的"源表"及"源字段"（如：订单表的 userId 字段）
 * - targetTable / targetField：关联的"目标表"及"目标字段"（如：用户表的 id 字段）
 * - cardinality（基数）：描述两张表之间的数量关系
 *   - ONE_TO_ONE:   一对一（如：用户 ↔ 用户详情）
 *   - ONE_TO_MANY:  一对多（如：用户 → 多个订单），这是最常见的关系
 *   - MANY_TO_MANY: 多对多（如：学生 ↔ 课程）
 *
 * 【在项目架构中的角色 —— Schema 验证层】
 * 请求数据先经过本文件的 Zod schema 验证，确保参数合法后再传给 Service 层处理。
 */

import { z } from 'zod';

/**
 * 创建关联关系时的验证规则
 *
 * 创建一个关联需要指定：
 * - schemaId:      所属的 Schema（数据库方案）ID
 * - name:          关联名称（如 "user_orders"），长度 1~128
 * - cardinality:   基数类型，只能是三种枚举值之一，默认 ONE_TO_MANY
 * - sourceTableId: 源表 ID
 * - sourceFieldId: 源表中的关联字段 ID（通常是外键）
 * - targetTableId: 目标表 ID
 * - targetFieldId: 目标表中的关联字段 ID（通常是主键）
 */
export const createRelationSchema = z.object({
  schemaId: z.string().min(1, 'schemaId 不能为空'),
  name: z.string().min(1, '关联名称不能为空').max(128, '关联名称不能超过 128 个字符'),
  cardinality: z.enum(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY']).default('ONE_TO_MANY'),
  sourceTableId: z.string().min(1, 'sourceTableId 不能为空'),
  sourceFieldId: z.string().min(1, 'sourceFieldId 不能为空'),
  targetTableId: z.string().min(1, 'targetTableId 不能为空'),
  targetFieldId: z.string().min(1, 'targetFieldId 不能为空'),
});

/**
 * 更新关联关系时的验证规则
 *
 * 更新时只需要 id（必填）+ 需要修改的字段（可选）。
 * 注意：源表/目标表等结构性字段不允许修改，只能改名称和基数。
 * 这是因为改变关联的源/目标会破坏数据完整性，应该删除后重建。
 */
export const updateRelationSchema = z.object({
  id: z.string().min(1, '关联 ID 不能为空'),
  name: z.string().min(1).max(128).optional(),
  cardinality: z.enum(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY']).optional(),
});

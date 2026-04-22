/**
 * @file index.schema.js - Index（数据库索引）的 Zod 验证模式
 *
 * 【文件用途】
 * 定义对数据库表"索引"进行增、改、删、排序操作时的输入参数验证规则。
 *
 * 【什么是数据库索引？】
 * 索引类似于书的目录——它帮助数据库快速找到数据，而不必扫描整张表。
 * 例如，给 users 表的 email 字段加索引后，按 email 查询会快很多。
 *
 * 【索引属性说明】
 * - name:     索引名称（如 "idx_users_email"）
 * - type:     索引类型（如 "BTREE" 是最常见的 B 树索引，还有 HASH 等）
 * - isUnique: 是否为唯一索引（保证索引列的值不重复，如 email 不能重复）
 *
 * 【在项目架构中的角色 —— Schema 验证层】
 * 和其他 schema 文件一样，本文件负责验证前端传入的参数，确保数据合法后再交给 Service 层。
 */

import { z } from 'zod';

/**
 * 创建索引时的验证规则
 *
 * - tableId:  必填，该索引所属的表 ID
 * - name:     索引名称，最长 64 字符，默认空字符串
 * - type:     可选，索引类型（如 BTREE、HASH），不传时由 mapper 层默认设为 BTREE
 * - isUnique: 可选，是否为唯一索引
 */
export const createIndexSchema = z.object({
  tableId: z.string().min(1, 'tableId 不能为空'),
  name: z.string().max(64, '索引名不能超过 64 个字符').default(''),
  type: z.string().optional(),
  isUnique: z.boolean().optional(),
});

/**
 * 更新索引时的验证规则
 *
 * 同样采用"部分更新"模式：id 必填，其余字段可选
 */
export const updateIndexSchema = z.object({
  id: z.string().min(1, '索引 ID 不能为空'),
  name: z.string().min(1).max(64).optional(),
  type: z.string().optional(),
  isUnique: z.boolean().optional(),
});

/**
 * 删除索引时的验证规则
 */
export const deleteIndexSchema = z.object({
  id: z.string().min(1, '索引 ID 不能为空'),
});

/**
 * 索引重新排序时的验证规则
 *
 * 与字段排序类似，用户拖拽调整索引顺序后，前端将新顺序的 ID 数组发给后端。
 *
 * - tableId:  排序哪张表的索引
 * - indexIds: 按新顺序排列的索引 ID 数组
 */
export const reorderIndexesSchema = z.object({
  tableId: z.string().min(1, 'tableId 不能为空'),
  indexIds: z.array(z.string().min(1)).min(1, '索引 ID 列表不能为空'),
});

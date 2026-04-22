/**
 * @file field.schema.js - Field（表字段）的 Zod 验证模式
 *
 * 【文件用途】
 * 定义对数据库表"字段"进行增、改、删、排序操作时的输入参数验证规则。
 * 字段（Field）是表的核心组成部分，如 users 表的 id、name、email 等都是字段。
 *
 * 【在项目架构中的角色 —— Schema 验证层】
 * 请求数据先经过 Zod 验证，确保参数合法后再传给 Service 层，
 * 这样 Service 层可以放心使用数据，不必再做重复的参数检查。
 *
 * 【字段属性说明】
 * - name:       字段名（如 "username"、"email"）
 * - type:       字段数据类型（如 "varchar"、"int"、"serial" 等）
 * - isPrimary:  是否为主键（主键是表中每行数据的唯一标识）
 * - isNullable: 是否允许为空（NULL），数据库中非常重要的约束
 * - remark:     字段备注/注释，用于说明字段用途
 */

import { z } from 'zod';

/**
 * 创建字段时的验证规则
 *
 * - tableId:    必填，该字段所属的表 ID
 * - name:       字段名，最长 64 字符，默认为空字符串（新建后可重命名）
 * - type:       必填，字段的数据类型
 * - isPrimary:  可选，是否为主键
 * - isNullable: 可选，是否允许 NULL
 * - remark:     可选，可以是字符串或 null（nullish() = optional + nullable）
 */
export const createFieldSchema = z.object({
  tableId: z.string().min(1, 'tableId 不能为空'),
  name: z.string().max(64, '字段名不能超过 64 个字符').default(''),
  type: z.string().min(1, '字段类型不能为空'),
  isPrimary: z.boolean().optional(),
  isNullable: z.boolean().optional(),
  remark: z.string().nullish(),
});

/**
 * 更新字段时的验证规则
 *
 * 更新操作采用"部分更新"模式：id 必填用于定位记录，其余字段都是 optional，
 * 只传需要修改的字段即可，未传的字段保持原值不变。
 */
export const updateFieldSchema = z.object({
  id: z.string().min(1, '字段 ID 不能为空'),
  name: z.string().min(1).max(64).optional(),
  type: z.string().optional(),
  isPrimary: z.boolean().optional(),
  isNullable: z.boolean().optional(),
  remark: z.string().nullish(),
});

/**
 * 删除字段时的验证规则
 *
 * 只需要传字段的 ID 即可
 */
export const deleteFieldSchema = z.object({
  id: z.string().min(1, '字段 ID 不能为空'),
});

/**
 * 字段重新排序时的验证规则
 *
 * 【为什么需要排序？】
 * 在可视化设计工具中，用户可以通过拖拽来调整字段的显示顺序。
 * 前端将新的字段顺序（ID 数组）发送给后端，后端按数组顺序更新每个字段的 order 值。
 *
 * - tableId:  排序哪张表的字段
 * - fieldIds: 按新顺序排列的字段 ID 数组（数组下标就是新的 order 值）
 */
export const reorderFieldsSchema = z.object({
  tableId: z.string().min(1, 'tableId 不能为空'),
  fieldIds: z.array(z.string().min(1)).min(1, '字段 ID 列表不能为空'),
});

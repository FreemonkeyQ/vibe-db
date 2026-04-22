/**
 * @file table.schema.js - Table（数据库表）的 Zod 验证模式
 *
 * 【文件用途】
 * 定义对"数据库表"进行创建、更新、排序操作时的输入参数验证规则。
 * Table 是数据库设计的核心实体，在可视化工具中对应画布上的一个"节点/卡片"。
 *
 * 【表的可视化属性】
 * 除了常规的数据库属性（name），表还有可视化相关的属性：
 * - color:     表的颜色标识，用于在画布上区分不同的表
 * - positionX: 表在画布上的 X 坐标（水平位置）
 * - positionY: 表在画布上的 Y 坐标（垂直位置）
 * 这些属性是 vibe-db 作为"可视化设计工具"特有的，普通数据库不需要这些信息。
 *
 * 【在项目架构中的角色 —— Schema 验证层】
 * 和其他 schema 文件一样，负责确保 API 接收到的参数格式正确、类型合法。
 */

import { z } from 'zod';

/**
 * 创建表时的验证规则
 *
 * - schemaId:  必填，该表所属的 Schema（数据库方案）ID
 * - name:      必填，表名，长度 1~64 字符
 * - color:     可选，表的颜色（十六进制色值如 "#2b80ff"）
 * - positionX: 可选，画布上的 X 坐标
 * - positionY: 可选，画布上的 Y 坐标
 */
export const createTableSchema = z.object({
  schemaId: z.string().min(1, 'schemaId 不能为空'),
  name: z.string().min(1, '表名不能为空').max(64, '表名不能超过 64 个字符'),
  color: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

/**
 * 更新表时的验证规则
 *
 * 采用"部分更新"模式：id 必填，其余字段可选。
 * 注意 remark 使用 nullish()：允许传 null 来"清除备注"，
 * 这和 optional()（不传就不改）有微妙区别。
 */
export const updateTableSchema = z.object({
  id: z.string().min(1, '表 ID 不能为空'),
  name: z.string().min(1, '表名不能为空').max(64, '表名不能超过 64 个字符').optional(),
  color: z.string().optional(),
  remark: z.string().nullish(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

/**
 * 表重新排序时的验证规则
 *
 * 用户在侧边栏拖拽调整表的显示顺序后，前端将新顺序的表 ID 数组发给后端。
 *
 * - schemaId: 排序哪个 Schema 下的表
 * - tableIds: 按新顺序排列的表 ID 数组
 */
export const reorderTablesSchema = z.object({
  schemaId: z.string().min(1, 'schemaId 不能为空'),
  tableIds: z.array(z.string().min(1)).min(1, '表 ID 列表不能为空'),
});

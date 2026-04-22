/**
 * 文件: src/app/api/field/reorder/route.js
 * 用途: 字段排序 API
 *
 * 本文件处理字段的排序调整。当用户在表的字段列表中通过拖拽改变字段顺序时，
 * 前端会调用此接口来持久化新的排序顺序。
 *
 * 字段的顺序在数据库设计中很重要，它决定了：
 * - 表在可视化画布中各字段的显示顺序
 * - 导出 SQL/DBML 时字段的定义顺序
 *
 * 对应 URL 路径: /api/field/reorder
 */

import { fieldService } from '@/server/services/field.service';
import { Ok, BadRequest } from '@/server/lib/response';
import { withLogger } from '@/server/lib/withLogger';

/**
 * POST /api/field/reorder
 * 批量更新字段的排序顺序
 *
 * 请求体 (JSON): [{ id: string, order: number }, ...]
 *   - 包含每个字段的 ID 和新的排序序号
 *
 * 响应格式: { data: null } - 排序成功返回 null
 */
// POST /api/field/reorder
export const POST = withLogger(async (request) => {
  try {
    const body = await request.json();
    // 批量更新字段的 order 字段，确保顺序与用户拖拽后的结果一致
    await fieldService.reorderFields(body);
    return Ok(null);
  } catch (error) {
    return BadRequest(error.message);
  }
});

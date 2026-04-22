/**
 * 文件: src/app/api/index/reorder/route.js
 * 用途: 索引排序 API
 *
 * 本文件处理索引的排序调整。当用户在界面中拖拽改变索引的显示顺序时，
 * 前端会调用此接口来持久化新的排序顺序。
 *
 * 对应 URL 路径: /api/index/reorder
 * 与 /api/table/reorder 的设计思路一致，将排序操作单独抽取为子路由。
 */

import { indexService } from '@/server/services/index.service';
import { Ok, BadRequest } from '@/server/lib/response';
import { withLogger } from '@/server/lib/withLogger';

/**
 * POST /api/index/reorder
 * 批量更新索引的排序顺序
 *
 * 请求体 (JSON): [{ id: string, order: number }, ...]
 *   - 包含每个索引的 ID 和新的排序序号
 *
 * 响应格式: { data: null } - 排序成功返回 null
 */
// POST /api/index/reorder
export const POST = withLogger(async (request) => {
  try {
    const body = await request.json();
    // 批量更新索引的 order 字段
    await indexService.reorderIndexes(body);
    return Ok(null);
  } catch (error) {
    return BadRequest(error.message);
  }
});

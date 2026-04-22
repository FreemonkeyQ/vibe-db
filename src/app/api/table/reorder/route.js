/**
 * 文件: src/app/api/table/reorder/route.js
 * 用途: 数据表排序 API
 *
 * 本文件处理表的排序调整。当用户在侧边面板中通过拖拽改变表的显示顺序时，
 * 前端会调用此接口来持久化新的排序顺序。
 *
 * 为什么单独建一个 reorder 路由？
 * - 排序是一个批量更新操作（同时更新多条记录的 order 字段），
 *   与普通的单条记录 CRUD 操作逻辑不同，所以单独抽取为一个子路由。
 * - 对应的 URL 路径: /api/table/reorder
 */

import { tableService } from '@/server/services/table.service';
import { Ok, BadRequest } from '@/server/lib/response';
import { withLogger } from '@/server/lib/withLogger';

/**
 * POST /api/table/reorder
 * 批量更新表的排序顺序
 *
 * 请求体 (JSON): [{ id: string, order: number }, ...]
 *   - 包含每个表的 ID 和新的排序序号
 *
 * 响应格式: { data: null } - 排序成功返回 null
 *
 * 为什么用 POST 而不是 PUT？
 * - 这里是对"排序"这个动作的操作，语义上更接近"执行一个操作"而非"更新一个资源"
 * - 也有项目用 PATCH，这只是团队的约定选择
 */
// POST /api/table/reorder
export const POST = withLogger(async (request) => {
  try {
    // 解析请求体，获取新的排序数据
    const body = await request.json();
    // 调用 service 层批量更新表的 order 字段
    await tableService.reorderTables(body);
    return Ok(null);
  } catch (error) {
    return BadRequest(error.message);
  }
});

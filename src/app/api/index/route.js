/**
 * 文件: src/app/api/index/route.js
 * 用途: 数据库索引（Index）的 CRUD API 路由
 *
 * 本文件对应路径 /api/index，提供索引的创建、更新和删除操作。
 *
 * 索引（Index）是数据库性能优化的关键工具，它可以加速数据查询。
 * 在本应用中，用户可以为每个表定义索引，指定哪些字段需要被索引，
 * 以及索引的类型（普通索引、唯一索引等）。
 *
 * 本文件提供的接口：
 * - POST   /api/index          - 创建新索引
 * - PUT    /api/index          - 更新索引配置
 * - DELETE /api/index?id=xxx   - 删除索引
 */

// indexService: 索引的业务逻辑服务层
import { indexService } from '@/server/services/index.service';
import { Ok, BadRequest } from '@/server/lib/response';
import { withLogger } from '@/server/lib/withLogger';

/**
 * Index API 路由
 * POST   /api/index - 创建索引
 * PUT    /api/index - 更新索引
 * DELETE /api/index?id=xxx - 删除索引
 */

/**
 * POST /api/index
 * 创建新的索引
 *
 * 请求体 (JSON): { tableId: string, name: string, fields: string[], unique?: boolean, ... }
 *   - tableId: 所属表的 ID
 *   - name: 索引名称
 *   - fields: 包含的字段列表
 *   - unique: 是否为唯一索引
 *
 * 响应格式: { data: Index } - 创建成功的索引对象
 */
// POST /api/index
export const POST = withLogger(async (request) => {
  try {
    const body = await request.json();
    const index = await indexService.createIndex(body);
    return Ok(index);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * PUT /api/index
 * 更新索引配置
 *
 * 请求体 (JSON): { id: string, name?: string, fields?: string[], unique?: boolean, ... }
 * 响应格式: { data: Index } - 更新后的索引对象
 */
// PUT /api/index
export const PUT = withLogger(async (request) => {
  try {
    const body = await request.json();
    const index = await indexService.updateIndex(body);
    return Ok(index);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * DELETE /api/index?id=xxx
 * 删除指定的索引
 *
 * 请求参数 (Query String):
 *   - id: string (必填) - 要删除的索引 ID
 *
 * 响应格式: { data: { id: string } } - 返回被删除的索引 ID
 */
// DELETE /api/index?id=xxx
export const DELETE = withLogger(async (request) => {
  try {
    // 从查询参数中获取索引 ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return BadRequest('id is required');
    }

    // 执行删除操作
    await indexService.deleteIndex({ id });
    // 返回被删除的 ID，便于前端从本地状态中移除对应数据
    return Ok({ id });
  } catch (error) {
    return BadRequest(error.message);
  }
});

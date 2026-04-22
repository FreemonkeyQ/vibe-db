/**
 * 文件: src/app/api/table/route.js
 * 用途: 数据表（Table）的 CRUD API 路由
 *
 * 在 Next.js App Router 中，route.js 定义 API 路由处理器。
 * 本文件对应路径 /api/table，提供数据表的增删改查操作。
 *
 * 数据表是 Schema 的核心组成部分，每个表包含多个字段（Field）和索引（Index）。
 * 在可视化画布中，每个表会显示为一个节点（Node）。
 *
 * 本文件提供的接口：
 * - GET    /api/table?schemaId=xxx  - 根据 Schema ID 查询其下所有表
 * - POST   /api/table               - 创建新表
 * - PUT    /api/table               - 更新表信息
 * - DELETE /api/table?id=xxx        - 删除表（逻辑删除）
 */

// tableService: 表的业务逻辑服务层
import { tableService } from '@/server/services/table.service';

// 统一的响应工具函数
import { Ok, BadRequest } from '@/server/lib/response';

// 日志中间件
import { withLogger } from '@/server/lib/withLogger';

/**
 * Table API 路由
 * GET  /api/table?schemaId=xxx  - 查询表列表
 * POST /api/table               - 创建表
 * PUT  /api/table               - 更新表
 * DELETE /api/table?id=xxx      - 删除表（逻辑删除）
 */

/**
 * GET /api/table?schemaId=xxx
 * 查询指定 Schema 下的所有表
 *
 * 请求参数 (Query String):
 *   - schemaId: string (必填) - 所属 Schema 的 ID
 *
 * 响应格式: { data: Table[] } - 表对象数组
 */
// GET /api/table?schemaId=xxx
export const GET = withLogger(async (request) => {
  try {
    // 从 URL 的查询参数中提取 schemaId
    // 例如: /api/table?schemaId=abc123 → schemaId = "abc123"
    const { searchParams } = new URL(request.url);
    const schemaId = searchParams.get('schemaId');

    // 参数校验：schemaId 是必需的
    if (!schemaId) {
      return BadRequest('schemaId is required');
    }

    // 查询该 Schema 下的所有表
    const tables = await tableService.getTablesBySchemaId(schemaId);
    return Ok(tables);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * POST /api/table
 * 创建新的数据表
 *
 * 请求体 (JSON): { schemaId: string, name: string, ... }
 * 响应格式: { data: Table } - 创建成功的表对象
 */
// POST /api/table
export const POST = withLogger(async (request) => {
  try {
    const body = await request.json();
    const table = await tableService.createTable(body);
    return Ok(table);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * PUT /api/table
 * 更新表信息（如表名、位置坐标等）
 *
 * 请求体 (JSON): { id: string, name?: string, x?: number, y?: number, ... }
 * 响应格式: { data: Table } - 更新后的表对象
 */
// PUT /api/table
export const PUT = withLogger(async (request) => {
  try {
    const body = await request.json();
    const table = await tableService.updateTable(body);
    return Ok(table);
  } catch (error) {
    return BadRequest(error.message);
  }
});

/**
 * DELETE /api/table?id=xxx
 * 删除指定的表（逻辑删除，不会真正从数据库中移除）
 *
 * 请求参数 (Query String):
 *   - id: string (必填) - 要删除的表的 ID
 *
 * 响应格式: { data: null } - 删除成功返回 null
 */
// DELETE /api/table?id=xxx
export const DELETE = withLogger(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return BadRequest('id is required');
    }

    // 执行逻辑删除
    await tableService.deleteTable(id);
    return Ok(null);
  } catch (error) {
    return BadRequest(error.message);
  }
});

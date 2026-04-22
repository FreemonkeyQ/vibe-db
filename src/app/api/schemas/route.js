/**
 * 文件: src/app/api/schemas/route.js
 * 用途: Schema（数据库模式）的 CRUD API 路由
 *
 * 在 Next.js App Router 中，route.js 文件用于定义 API 路由处理器（Route Handler）。
 * 放在 src/app/api/schemas/ 目录下，对应的 API 路径就是 /api/schemas。
 *
 * 通过导出不同的 HTTP 方法函数（GET、POST、PUT、DELETE），
 * Next.js 会自动将请求分发到对应的处理函数。
 *
 * 本文件提供的接口：
 * - GET  /api/schemas   - 获取所有 Schema 列表
 * - POST /api/schemas   - 创建新的 Schema
 *
 * Schema 是本应用的顶层数据结构，一个 Schema 代表一个数据库设计方案，
 * 包含多个表（Table）、字段（Field）、索引（Index）和关联关系（Relation）。
 */

// schemaService: Schema 业务逻辑层，封装了与数据库交互的具体操作
import { schemaService } from '@/server/services/schema.service';

// Ok: 返回成功响应的工具函数（HTTP 200）
// BadRequest: 返回错误响应的工具函数（HTTP 400）
import { Ok, BadRequest } from '@/server/lib/response';

// withLogger: 日志中间件装饰器，为 API 处理函数添加请求日志记录功能
import { withLogger } from '@/server/lib/withLogger';

/**
 * GET /api/schemas
 * 获取所有 Schema 列表
 *
 * 请求参数: 无
 * 响应格式: { data: Schema[] } - Schema 对象数组
 *
 * withLogger 是一个高阶函数，它包裹实际的处理逻辑，
 * 在请求前后添加日志记录（如请求时间、响应状态等）
 */
// GET /api/schemas
export const GET = withLogger(async () => {
  try {
    // 调用 service 层获取所有 Schema 数据
    const schemas = await schemaService.getSchemas();
    // 返回成功响应，schemas 会被包装为 JSON 格式
    return Ok(schemas);
  } catch (error) {
    // 捕获异常并返回 400 错误响应
    return BadRequest(error.message);
  }
});

/**
 * POST /api/schemas
 * 创建新的 Schema
 *
 * 请求体 (JSON): { name: string, ... } - Schema 的基本信息
 * 响应格式: { data: Schema } - 创建成功的 Schema 对象
 */
// POST /api/schemas
export const POST = withLogger(async (request) => {
  try {
    // 解析请求体中的 JSON 数据
    const body = await request.json();
    // 调用 service 层创建 Schema
    const schema = await schemaService.createSchema(body);
    return Ok(schema);
  } catch (error) {
    return BadRequest(error.message);
  }
});

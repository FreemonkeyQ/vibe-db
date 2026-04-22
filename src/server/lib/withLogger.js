/**
 * @file withLogger.js - API 路由日志中间件
 *
 * 【文件用途】
 * 提供一个高阶函数 withLogger，用于包装 Next.js API Route 的处理函数，
 * 自动记录每次请求的方法、路径、耗时、状态码等信息，以及捕获未处理的异常日志。
 *
 * 【在项目中的角色】
 * 在 Next.js 的 App Router 中，每个 API 路由（如 route.js）导出 GET/POST 等函数。
 * 直接在每个路由中手写 console.log 既冗余又容易遗漏。
 * withLogger 作为"中间件"角色，统一为所有 API 路由添加日志功能。
 *
 * 【设计模式】
 * 这是"装饰器/高阶函数"模式：不修改原始 handler 的逻辑，
 * 而是在它的前后分别插入日志记录，实现关注点分离。
 *
 * 【使用方式】
 * 在 API 路由文件中：
 *   export const GET = withLogger(async (request) => { ... });
 *   export const POST = withLogger(async (request) => { ... });
 */

import logger from '@/lib/logger';
import config from '@/lib/config';

// 从配置中获取是否为开发环境，开发环境会记录更详细的日志（如请求体）
const { isDev } = config;

/**
 * 安全地提取请求体（Request Body）
 *
 * 【为什么需要单独提取？】
 * 1. Request.json() 只能调用一次（流式读取），所以必须先 clone() 再读取
 * 2. 只有 POST/PUT/PATCH/DELETE 等请求才可能有 body
 * 3. 需要检查 Content-Type 是否为 JSON 格式
 * 4. 整个过程可能出错（比如 body 不是合法 JSON），所以用 try-catch 兜底
 *
 * @param {Request} request - Web 标准 Request 对象
 * @returns {Promise<object|null>} 解析后的请求体对象，无法解析时返回 null
 */
async function extractRequestBody(request) {
  // 只处理有 body 的请求方法（GET/HEAD 等不会携带请求体）
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return null;
  }

  try {
    // 克隆 request 以便读取 body（因为 request.json() 只能调用一次）
    // 如果不克隆，后续的 handler 就无法再次读取 body 了
    const clonedRequest = request.clone();
    const contentType = request.headers.get('content-type') || '';

    // 只有 Content-Type 为 JSON 时才尝试解析
    if (contentType.includes('application/json')) {
      return await clonedRequest.json();
    }

    return null;
  } catch {
    // 解析失败时静默返回 null，不影响正常请求流程
    return null;
  }
}

/**
 * API 路由包装器 —— 为路由处理函数添加统一的日志记录和错误处理
 *
 * 【工作流程】
 * 1. 记录请求开始时间
 * 2. 提取请求信息（方法、路径、请求体）
 * 3. 打印"请求进入"日志（→ GET /api/schemas）
 * 4. 执行原始 handler
 * 5. 打印"请求完成"日志，包含状态码和耗时（← GET /api/schemas 200 12ms）
 * 6. 如果 handler 抛出异常，记录错误日志并继续向上抛出
 *
 * @param {Function} handler - 原始的路由处理函数，签名为 (request, context) => Response
 * @returns {Function} 包装后的路由处理函数，签名不变，但多了日志能力
 */
export function withLogger(handler) {
  return async (request, context) => {
    // 记录请求开始时间，用于计算耗时
    const start = Date.now();
    const { method } = request;

    // 解析完整 URL，提取路径和查询参数部分
    const url = new URL(request.url);
    const path = url.pathname + url.search;

    // 仅在开发环境下提取请求体，避免生产环境的性能开销
    const requestBody = isDev ? await extractRequestBody(request) : null;

    // 打印请求进入日志（开发环境下额外打印请求体，方便调试）
    if (isDev && requestBody) {
      logger.info({ method, path, body: requestBody }, `→ ${method} ${path}`);
    } else {
      logger.info({ method, path }, `→ ${method} ${path}`);
    }

    try {
      // 执行原始的路由处理函数
      const response = await handler(request, context);
      const duration = Date.now() - start;
      const status = response.status;

      // 根据状态码选择日志级别：4xx 用 warn（客户端错误），其余用 info
      const logMethod = status >= 400 ? 'warn' : 'info';
      logger[logMethod](
        { method, path, status, duration: `${duration}ms` },
        `← ${method} ${path} ${status} ${duration}ms`
      );

      return response;
    } catch (error) {
      // handler 抛出未捕获异常时，记录 error 级别日志
      const duration = Date.now() - start;
      logger.error(
        { method, path, duration: `${duration}ms`, error: error.message, stack: error.stack },
        `✗ ${method} ${path} ${duration}ms`
      );
      // 重新抛出异常，交给上层（Next.js 框架）处理
      throw error;
    }
  };
}

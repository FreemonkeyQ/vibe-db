/**
 * @file response.js - 统一 API 响应工具函数
 *
 * 【文件用途】
 * 本文件封装了一组标准化的 HTTP 响应函数，用于在所有 API 路由中返回格式一致的 JSON 响应。
 *
 * 【在项目中的角色】
 * 在 Next.js 的 API Route 中，我们需要手动构造 JSON 响应。如果每个接口都自己写
 * NextResponse.json(...)，格式容易不统一（比如有的用 code，有的用 status）。
 * 因此抽取这个工具文件，所有接口统一调用 Ok()、BadRequest() 等函数，
 * 保证返回给前端的数据结构始终一致：{ code, data, msg, success }。
 *
 * 【统一响应格式说明】
 * 每个响应都包含以下字段：
 * - code:    HTTP 状态码（如 200、400、404、500）
 * - data:    实际返回的业务数据（成功时有值，失败时为 null）
 * - msg:     提示信息（成功时为 'ok'，失败时为错误描述）
 * - success: 布尔值，前端可直接用来判断请求是否成功
 */

import { NextResponse } from 'next/server';

/**
 * 成功响应 —— 请求处理成功时使用
 * @param {any} data - 需要返回给前端的业务数据（如查询结果、新创建的记录等）
 * @param {number} status - HTTP 状态码，默认 200（也可传 201 表示"已创建"）
 * @returns {NextResponse} 格式化的 JSON 响应
 *
 * 使用示例：return Ok(schemaList)        // 200 + 数据
 *          return Ok(newTable, 201)    // 201 + 新建的表数据
 */
export const Ok = (data, status = 200) =>
  NextResponse.json({ code: status, data, msg: 'ok', success: true }, { status });

/**
 * 客户端错误响应（400 Bad Request）—— 请求参数不合法时使用
 * @param {string} message - 错误提示信息，描述请求为什么失败（如 "字段名不能为空"）
 * @returns {NextResponse} 格式化的 JSON 错误响应
 *
 * 常见场景：Zod 验证失败时返回此响应
 */
export const BadRequest = (message) =>
  NextResponse.json({ code: 400, data: null, msg: message, success: false }, { status: 400 });

/**
 * 资源未找到响应（404 Not Found）—— 请求的数据不存在时使用
 * @param {string} message - 错误提示信息，默认为 '资源不存在'
 * @returns {NextResponse} 格式化的 JSON 错误响应
 *
 * 常见场景：根据 ID 查询表/字段时，记录不存在
 */
export const NotFound = (message = '资源不存在') =>
  NextResponse.json({ code: 404, data: null, msg: message, success: false }, { status: 404 });

/**
 * 服务器内部错误响应（500 Internal Server Error）—— 服务端未预期的异常时使用
 * @param {string} message - 错误提示信息，默认为 '服务器内部错误'
 * @returns {NextResponse} 格式化的 JSON 错误响应
 *
 * 常见场景：数据库操作异常、未捕获的运行时错误
 */
export const ServerError = (message = '服务器内部错误') =>
  NextResponse.json({ code: 500, data: null, msg: message, success: false }, { status: 500 });

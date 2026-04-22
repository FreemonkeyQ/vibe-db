/**
 * HTTP 请求封装模块
 *
 * 【文件用途】
 * 对浏览器原生的 fetch API 进行二次封装，提供：
 * 1. 请求/响应拦截器机制（类似 axios 的拦截器）
 * 2. 自动序列化请求体为 JSON
 * 3. 自动处理 URL 查询参数
 * 4. 超时控制
 * 5. 统一的错误处理和用户提示（toast）
 * 6. 便捷的 get/post/put/del 快捷方法
 *
 * 【在项目中的角色】
 * 这是前端与后端 API 通信的唯一出口。所有 API 调用都通过这个模块发出，
 * 确保了请求行为的一致性（统一的错误提示、统一的超时处理等）。
 *
 * 【关键概念】
 * - 拦截器（Interceptor）：在请求发送前或响应返回后执行的"钩子函数"，
 *   可以统一添加认证 token、统一处理 401 未授权等
 * - AbortController：浏览器原生的请求取消机制，用于实现超时控制
 * - toast：页面上弹出的轻量级提示信息（本项目使用 sonner 库）
 */

import { toast } from 'sonner';

// API 基础路径前缀，为空字符串表示使用相对路径（即同域请求）
// 在 Next.js 中，前端调用 /api/xxx 会自动路由到本项目的 API 路由
const BASE_URL = '';

// ────────────────────────────── 拦截器注册表 ──────────────────────────────

/**
 * 拦截器存储对象
 *
 * 【为什么需要拦截器】
 * - 请求拦截器：可以在每个请求发送前统一添加 Authorization header、记录日志等
 * - 响应拦截器：可以统一处理特定错误码（如 401 跳转登录页）、统一数据转换等
 */
const interceptors = {
  request: [], // 请求拦截器数组，每个元素是 { fulfilled, rejected }
  response: [], // 响应拦截器数组，每个元素是 { fulfilled, rejected }
};

/**
 * 添加请求拦截器
 *
 * @param {Function} fulfilled - 请求发送前的处理函数，接收 config 对象，返回修改后的 config
 * @param {Function} rejected - 请求配置出错时的处理函数
 *
 * 【使用示例】
 * addRequestInterceptor((config) => {
 *   config.headers['Authorization'] = `Bearer ${token}`;
 *   return config;
 * });
 */
export function addRequestInterceptor(fulfilled, rejected) {
  interceptors.request.push({ fulfilled, rejected });
}

/**
 * 添加响应拦截器
 *
 * @param {Function} fulfilled - 响应成功时的处理函数，接收响应数据，返回处理后的数据
 * @param {Function} rejected - 响应错误时的处理函数，接收 error 对象
 *
 * 【使用示例】
 * addResponseInterceptor(null, (error) => {
 *   if (error.code === 401) router.push('/login');
 * });
 */
export function addResponseInterceptor(fulfilled, rejected) {
  interceptors.response.push({ fulfilled, rejected });
}

// ────────────────────────────── 统一请求函数 ──────────────────────────────

/**
 * 核心请求函数 - 所有 HTTP 请求的统一入口
 *
 * @param {string} url - 请求的 URL 路径（如 '/api/schemas'）
 * @param {Object} options - 请求配置选项
 * @param {string} options.method - HTTP 方法，默认 'GET'
 * @param {Object} options.headers - 自定义请求头
 * @param {Object} options.params - URL 查询参数（会拼接到 URL 后面，如 ?schemaId=xxx）
 * @param {Object} options.data - 请求体数据（会被 JSON.stringify 序列化）
 * @param {number} options.timeout - 超时时间（毫秒），默认 10000（10秒）
 * @param {boolean} options.silent - 是否静默模式（不弹 toast 错误提示），默认 false
 * @returns {Promise<Object>} 后端返回的 JSON 数据
 * @throws {Error} 请求失败时抛出错误（包含 code 和 data 属性）
 */
export async function request(url, options = {}) {
  // 解构配置项，设置默认值
  let {
    method = 'GET',
    headers = {},
    params = {},
    data = null,
    timeout = 10000,
    silent = false,
  } = options;

  // ===== 第一步：执行请求拦截器 =====
  // 将所有配置打包成 config 对象，依次传递给每个拦截器处理
  let config = { url, method, headers, params, data, timeout, silent };
  for (const { fulfilled } of interceptors.request) {
    if (fulfilled) config = (await fulfilled(config)) || config;
  }

  // ===== 第二步：构建完整的请求 URL =====
  let requestUrl = BASE_URL + config.url;

  // 将 params 对象转换为 URL 查询字符串（自动过滤 null/undefined 值）
  const queryParams = new URLSearchParams();
  Object.keys(config.params).forEach((key) => {
    if (config.params[key] !== undefined && config.params[key] !== null) {
      queryParams.append(key, config.params[key]);
    }
  });
  const queryString = queryParams.toString();
  if (queryString) requestUrl += `?${queryString}`;

  // ===== 第三步：构建 fetch 请求配置 =====
  const fetchOptions = {
    method: config.method,
    headers: { 'Content-Type': 'application/json', ...config.headers },
  };

  // GET 和 HEAD 请求不能有请求体，其他方法（POST/PUT/DELETE）才序列化 body
  if (config.data && !['GET', 'HEAD'].includes(config.method.toUpperCase())) {
    fetchOptions.body = JSON.stringify(config.data);
  }

  // ===== 第四步：超时控制 =====
  // 使用 AbortController 实现超时：设定时间后自动取消请求
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  fetchOptions.signal = controller.signal; // 将信号绑定到 fetch 请求

  try {
    // ===== 第五步：发送请求 =====
    const response = await fetch(requestUrl, fetchOptions);
    clearTimeout(timeoutId); // 请求成功返回，清除超时定时器

    // 解析 JSON 响应体，如果解析失败返回空对象（防止非 JSON 响应导致崩溃）
    const resData = await response.json().catch(() => ({}));

    // ===== 第六步：处理错误响应 =====
    // HTTP 状态码非 2xx 或者业务层面返回 success: false 都视为失败
    if (!response.ok || resData.success === false) {
      const rawMsg = resData.msg || `请求失败: ${response.status}`;

      // 特殊处理：Zod 校验错误返回的 msg 是 JSON 数组字符串
      // 例如 '[{"message":"字段名不能为空","path":["name"]}]'
      // 这里提取第一条错误的 message 作为用户可读的提示
      let errMsg = rawMsg;
      if (typeof rawMsg === 'string' && rawMsg.startsWith('[')) {
        try {
          const issues = JSON.parse(rawMsg);
          errMsg = issues[0]?.message || rawMsg;
        } catch {} // 解析失败就使用原始消息
      }

      // 构造错误对象，附带业务错误码和完整响应数据
      const error = new Error(errMsg);
      error.code = resData.code || response.status;
      error.data = resData;

      // 执行响应错误拦截器（如统一处理 401 未授权）
      for (const { rejected } of interceptors.response) {
        if (rejected) await rejected(error);
      }

      throw error;
    }

    // ===== 第七步：处理成功响应 =====
    // 依次执行响应成功拦截器，可以对数据做统一转换
    let result = resData;
    for (const { fulfilled } of interceptors.response) {
      if (fulfilled) result = (await fulfilled(result)) || result;
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId); // 确保清除定时器，防止内存泄漏

    // 处理超时错误（AbortController 取消请求时会抛出 AbortError）
    if (error.name === 'AbortError') {
      const timeoutError = new Error('请求超时');
      timeoutError.code = 'TIMEOUT';
      if (!config.silent) toast.error('请求超时，请稍后重试');
      throw timeoutError;
    }

    // 非静默模式下自动弹出错误提示 toast
    if (!config.silent) toast.error(error.message || '网络请求异常');

    throw error;
  }
}

// ────────────────────────────── 快捷方法 ──────────────────────────────

/**
 * GET 请求快捷方法
 * @param {string} url - 请求路径
 * @param {Object} params - URL 查询参数
 * @param {Object} options - 其他配置选项
 * @returns {Promise<Object>} 响应数据
 */
export function get(url, params, options = {}) {
  return request(url, { ...options, method: 'GET', params });
}

/**
 * POST 请求快捷方法
 * @param {string} url - 请求路径
 * @param {Object} data - 请求体数据
 * @param {Object} options - 其他配置选项
 * @returns {Promise<Object>} 响应数据
 */
export function post(url, data, options = {}) {
  return request(url, { ...options, method: 'POST', data });
}

/**
 * PUT 请求快捷方法
 * @param {string} url - 请求路径
 * @param {Object} data - 请求体数据
 * @param {Object} options - 其他配置选项
 * @returns {Promise<Object>} 响应数据
 */
export function put(url, data, options = {}) {
  return request(url, { ...options, method: 'PUT', data });
}

/**
 * DELETE 请求快捷方法
 * 注意：命名为 del 而非 delete，因为 delete 是 JavaScript 保留字
 * @param {string} url - 请求路径
 * @param {Object} data - 请求体数据
 * @param {Object} options - 其他配置选项
 * @returns {Promise<Object>} 响应数据
 */
export function del(url, data, options = {}) {
  return request(url, { ...options, method: 'DELETE', data });
}

export default request;

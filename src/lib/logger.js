/**
 * 日志工具模块
 *
 * 【文件用途】
 * 提供统一的日志记录功能，基于 pino（高性能 Node.js 日志库）实现。
 * 支持按日期分割日志文件，开发环境同时输出到控制台（带颜色美化），生产环境只写文件。
 *
 * 【在项目中的角色】
 * 供服务端代码（API 路由、中间件等）使用，用于记录请求信息、错误、调试信息等。
 * 使用方式：`import logger from '@/lib/logger'; logger.info('消息');`
 *
 * 【关键概念】
 * - pino：Node.js 生态中最快的日志库，比 winston 快 5-10 倍，采用 JSON 格式输出
 * - 日志级别：trace < debug < info < warn < error < fatal，级别越高越重要
 * - multistream：pino 的多路输出功能，可以同时输出到多个目标（控制台 + 文件）
 */

import pino from 'pino';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import config from './config';

// 日志文件存放目录，位于项目根目录下的 logs/ 文件夹
const LOG_DIR = join(process.cwd(), 'logs');

/**
 * 确保日志目录存在
 *
 * 【为什么这样写】
 * - 如果 logs/ 目录不存在就直接写文件会报错，所以需要先创建
 * - recursive: true 表示如果父目录也不存在，会递归创建（类似 mkdir -p）
 * - 使用同步方法（mkdirSync）是因为这段代码在模块加载时执行，需要确保目录就绪后再创建 logger
 */
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 生成当天的日志文件名
 *
 * @returns {string} 日志文件完整路径，如 "/项目路径/logs/app-2026-04-20.log"
 *
 * 【为什么按日期分割】
 * - 方便按天查看和清理日志
 * - 避免单个日志文件过大导致难以打开
 */
const getLogFileName = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // 提取 YYYY-MM-DD 部分
  return join(LOG_DIR, `app-${date}.log`);
};

// 从全局配置中解构出环境标识和日志配置
const { isDev, log } = config;

// 日志级别优先取环境变量 LOG_LEVEL，否则使用配置文件中的默认值
const logLevel = process.env.LOG_LEVEL || log.level;

let logger;

if (isDev) {
  /**
   * 开发环境：控制台 + 文件双写
   *
   * 【为什么开发环境要同时输出到控制台】
   * - 开发时需要实时看到日志，方便调试
   * - pino-pretty 会将 JSON 日志转换为人类可读的彩色格式
   * - 同时写入文件是为了可以回溯历史日志
   */
  logger = pino(
    { level: logLevel },
    pino.multistream([
      // 第一路：控制台输出（带颜色美化，方便开发时阅读）
      {
        level: logLevel,
        stream: pino.transport({
          target: 'pino-pretty', // 美化输出插件
          options: {
            colorize: true, // 启用颜色高亮
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss', // 时间格式化为本地时间
            ignore: 'pid,hostname', // 隐藏进程ID和主机名（开发时不需要）
          },
        }),
      },
      // 第二路：文件输出（JSON 格式，便于后续程序化分析）
      {
        level: logLevel,
        stream: pino.transport({
          target: 'pino/file', // pino 内置的文件写入目标
          options: { destination: getLogFileName() },
        }),
      },
    ])
  );
} else {
  /**
   * 生产环境：只写文件
   *
   * 【为什么生产环境不输出到控制台】
   * - 生产环境通常由进程管理器（如 PM2）管理，控制台输出会被丢弃或重复记录
   * - 直接写文件更高效，且方便运维人员收集和分析
   */
  logger = pino(
    { level: logLevel },
    pino.transport({
      target: 'pino/file',
      options: { destination: getLogFileName() },
    })
  );
}

export default logger;

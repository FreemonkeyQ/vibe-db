/**
 * 环境配置模块
 *
 * 【文件用途】
 * 集中管理应用的所有配置项，根据 NODE_ENV 环境变量自动切换开发/生产配置。
 * 这样做的好处是：配置只在一个地方定义，其他模块通过导入此文件获取配置，
 * 避免在代码中到处硬编码环境变量名。
 *
 * 【在项目中的角色】
 * 作为全局配置中心，被 logger.js、prisma.js 等模块引用。
 * 使用方式：`import config from '@/lib/config';`
 *
 * 【关键概念】
 * - NODE_ENV：Node.js 标准环境变量，常见值为 'development'（开发）和 'production'（生产）
 * - 环境变量：通过 process.env 访问，通常在 .env 文件或部署平台中设置
 * - NEXT_PUBLIC_ 前缀：Next.js 约定，带此前缀的环境变量会暴露给客户端代码
 */

// 环境判断：通过比较 NODE_ENV 得到布尔值，方便在代码中使用 if(isDev) 做条件判断
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const config = {
  // ========== 环境标识 ==========
  env: process.env.NODE_ENV || 'development', // 当前环境名称，默认为开发环境
  isDev, // 是否为开发环境（布尔值，方便条件判断）
  isProd, // 是否为生产环境

  // ========== 数据库配置 ==========
  database: {
    /**
     * 数据库连接字符串
     * 格式：postgresql://用户名:密码@主机:端口/数据库名
     * 例如：postgresql://postgres:123456@localhost:5432/vibedb
     */
    url: process.env.DATABASE_URL,
  },

  // ========== 应用配置 ==========
  app: {
    /**
     * 应用的公开访问地址
     * 用于生成绝对 URL（如 OAuth 回调地址、邮件链接等）
     * 开发环境默认为 localhost:3000
     */
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // ========== 日志配置 ==========
  log: {
    /**
     * 日志级别
     * - 开发环境用 'debug'：输出更详细的调试信息
     * - 生产环境用 'info'：只输出重要信息，减少日志量
     */
    level: isDev ? 'debug' : 'info',
    /**
     * 是否美化输出（仅开发环境开启）
     * 美化后的日志带颜色和缩进，更易阅读
     */
    prettyPrint: isDev,
  },
};

export default config;

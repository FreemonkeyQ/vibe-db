/**
 * ========================================================================
 * prisma.config.ts — Prisma ORM 配置文件
 * ========================================================================
 *
 * 【文件用途】
 * 这是 Prisma ORM 的配置入口文件（Prisma 6 新增的功能）。
 * 它用来集中管理 Prisma 的运行时配置，比如 schema 文件位置和数据库连接地址。
 *
 * 【在项目中的角色】
 * vibe-db 使用 Prisma 作为数据库 ORM（对象关系映射）工具。
 * 当你运行 prisma migrate、prisma generate 等命令时，
 * Prisma CLI 会读取这个配置文件来确定去哪里找 schema 文件、连接哪个数据库。
 *
 * 【为什么用 .ts 而不是 .js？】
 * Prisma 6 开始支持 TypeScript 配置文件，可以获得类型提示和自动补全，
 * 减少配置出错的可能性。
 * ========================================================================
 */

// 引入 Node.js 内置的 path 模块，用于拼接文件路径（跨平台兼容）
import path from 'node:path';

// 从 prisma/config 引入 defineConfig 辅助函数
// 这个函数提供了 TypeScript 类型支持，让你写配置时有智能提示
import { defineConfig } from 'prisma/config';

// 加载 .env 文件中的环境变量（如 DATABASE_URL）到 process.env 中
// 这样下面就可以通过 process.env.DATABASE_URL 读取数据库连接字符串
import 'dotenv/config';

export default defineConfig({
  /**
   * schema — Prisma Schema 文件的路径
   *
   * 使用 path.join() 拼接路径，而不是直接写字符串 'prisma/schema.prisma'，
   * 是为了保证在不同操作系统（Windows / macOS / Linux）上路径分隔符都正确。
   * （Windows 用 \，macOS/Linux 用 /）
   */
  schema: path.join('prisma', 'schema.prisma'),

  /**
   * datasource — 数据源（数据库连接）配置
   *
   * url: 数据库连接字符串，从环境变量 DATABASE_URL 中读取。
   * 典型的 PostgreSQL 连接字符串格式：
   *   postgresql://用户名:密码@主机:端口/数据库名
   *
   * 为什么用环境变量而不是直接写死？
   * - 安全性：避免把数据库密码提交到代码仓库
   * - 灵活性：开发、测试、生产环境可以使用不同的数据库，只需修改 .env 文件
   */
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

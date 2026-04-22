/**
 * Prisma 客户端单例模块
 *
 * 【文件用途】
 * 创建并导出一个全局唯一的 Prisma 客户端实例，用于在服务端与 PostgreSQL 数据库进行交互。
 * 所有的数据库 CRUD 操作（增删改查）都通过这个实例来执行。
 *
 * 【在项目中的角色】
 * 这是整个后端数据访问层的核心入口。所有 API 路由（如 /api/schemas、/api/table 等）
 * 都会 `import prisma from '@/lib/prisma'` 来获取数据库连接并执行查询。
 *
 * 【关键概念】
 * - Prisma：一个现代的 Node.js ORM（对象关系映射），可以用 JavaScript 对象的方式操作数据库
 * - PrismaPg：Prisma 的 PostgreSQL 适配器，负责底层的数据库连接
 * - 单例模式：确保整个应用只创建一个数据库连接实例，避免连接泄漏
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * 使用 globalThis 来存储 Prisma 实例的引用
 *
 * 【为什么这样写】
 * Next.js 在开发环境下会频繁进行"热重载"（Hot Reload），每次热重载都会重新执行模块代码。
 * 如果每次都创建新的 PrismaClient，会导致数据库连接数不断增长，最终耗尽连接池。
 * 将实例存储在 globalThis 上，即使模块被重新加载，也能复用之前创建的实例。
 */
const globalForPrisma = globalThis;

/**
 * 创建 Prisma 客户端实例的工厂函数
 *
 * 【为什么这样写】
 * - 使用 PrismaPg 适配器而非默认引擎，这是 Prisma 5+ 推荐的 PostgreSQL 连接方式
 * - connectionString 从环境变量 DATABASE_URL 读取，符合 12-Factor App 的配置管理原则
 * - 封装为函数是为了延迟创建（lazy initialization），只在真正需要时才建立连接
 */
const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

/**
 * 导出的 Prisma 客户端实例
 *
 * 【逻辑解释】
 * 使用 ?? （空值合并运算符）：
 * - 如果 globalForPrisma.prisma 已经存在（说明之前已创建过），直接复用
 * - 如果不存在（首次运行），调用工厂函数创建新实例
 */
const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * 开发环境下将实例挂载到全局对象上
 *
 * 【为什么只在非生产环境做这件事】
 * - 开发环境：需要防止热重载导致的连接泄漏，所以要缓存到 globalThis
 * - 生产环境：不会有热重载问题，且挂载到全局可能带来安全隐患，所以不缓存
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

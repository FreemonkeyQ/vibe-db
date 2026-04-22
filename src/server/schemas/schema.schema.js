/**
 * @file schema.schema.js - Schema（数据库方案）的 Zod 验证模式
 *
 * 【文件用途】
 * 定义创建 Schema 时的输入参数验证规则。
 * 在本项目中，"Schema" 是最顶层的概念，相当于一个数据库设计方案/项目，
 * 一个 Schema 下可以包含多张 Table（表）。
 *
 * 【在项目架构中的角色 —— Schema 验证层】
 * 本项目采用三层架构：Schema验证 → Service业务逻辑 → Mapper数据映射
 *
 *   1. Schema验证层（本文件）：负责校验前端传入的参数是否合法
 *      - 使用 Zod 库定义数据的"形状"和约束
 *      - 如果数据不合法，Zod 会自动抛出带有详细错误信息的异常
 *      - 这样 Service 层就不需要再做参数校验，职责更清晰
 *
 *   2. Service业务逻辑层：编排业务流程（如"获取或创建 Schema"）
 *   3. Mapper数据映射层：直接操作数据库（Prisma ORM）
 *
 * 【什么是 Zod？】
 * Zod 是一个 TypeScript-first 的数据验证库。即使在 JS 项目中，
 * 它也能在运行时检查数据类型和格式，比手写 if-else 验证更简洁可靠。
 * 用法：定义一个 schema，然后调用 schema.parse(data) 即可验证并返回类型安全的数据。
 */

import { z } from 'zod';

/**
 * 创建 Schema 时的验证规则
 *
 * z.object({...}) 定义一个对象类型的验证规则，每个字段是一个属性：
 * - name:        必填，字符串，长度 1~64
 * - description: 可选，字符串，最大 255 字符
 *
 * 使用方式：createSchemaSchema.parse({ name: '用户系统', description: '...' })
 * 如果验证失败会抛出 ZodError，包含具体哪个字段不合法的详细信息
 */
export const createSchemaSchema = z.object({
  name: z.string().min(1, 'Schema 名称不能为空').max(64, 'Schema 名称不能超过 64 个字符'),
  description: z.string().max(255, '描述不能超过 255 个字符').optional(),
});

/**
 * Schema API 路径常量
 *
 * 【文件用途】
 * 定义与 Schema（数据库模式/项目）相关的 API 路径常量。
 * Schema 是本项目中最顶层的概念，一个 Schema 代表一个数据库设计项目，
 * 包含多张表（Table）、字段（Field）、索引（Index）和关系（Relation）。
 *
 * 【在项目中的角色】
 * 被前端的请求函数引用，避免在业务代码中硬编码 URL 字符串。
 * 统一管理路径可以：
 * 1. 方便全局搜索某个接口被哪些地方调用
 * 2. 接口路径变更时只需修改一处
 *
 * 【对应后端】src/app/api/schemas/
 */
export const SCHEMA_API = {
  // GET /api/schemas - 获取 Schema 列表
  // POST /api/schemas - 创建新的 Schema
LIST: '/api/schemas',
};

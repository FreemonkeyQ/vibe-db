/**
 * API 路径常量 - 统一导出入口
 *
 * 【文件用途】
 * 将所有分散在各个文件中的 API 路径常量集中从一个入口导出。
 * 这样使用时只需要 `import { SCHEMA_API, TABLE_API } from '@/lib/api'`，
 * 而不需要记住每个常量在哪个具体文件里。
 *
 * 【在项目中的角色】
 * 作为 API 路径的"索引文件"（barrel file），是前端调用后端接口时的路径来源。
 *
 * 【目录结构与后端 src/app/api/ 的对应关系】
 * - schema.js   → /api/schemas    （Schema/项目管理）
 * - table.js    → /api/table/     （表管理）
 * - field.js    → /api/field/     （字段管理）
 * - dbindex.js  → /api/index/     （索引管理）
 * - relation.js → /api/relation/  （关系管理）
 */
export { SCHEMA_API } from './schema';
export { TABLE_API } from './table';
export { FIELD_API } from './field';
export { INDEX_API } from './dbindex';
export { RELATION_API } from './relation';

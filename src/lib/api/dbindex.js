/**
 * Index（数据库索引）API 路径常量
 *
 * 【文件用途】
 * 定义与数据库索引相关的 API 路径常量。
 * 索引是数据库表上的一种数据结构，用于加速查询操作（类似书的目录）。
 * 注意：文件名为 dbindex.js 而非 index.js，是为了避免与目录的 index.js 入口文件冲突。
 *
 * 【在项目中的角色】
 * 当用户在可视化界面中为表添加、修改、删除索引或调整索引顺序时，
 * 前端会通过这些路径调用后端 API。
 *
 * 【对应后端】src/app/api/index/
 *
 * 【支持的操作】
 * - POST   /api/index         - 创建新索引
 * - PUT    /api/index         - 更新索引信息（如修改索引类型、包含的字段等）
 * - DELETE /api/index?id=xxx  - 根据 ID 删除索引
 * - POST   /api/index/reorder - 调整索引的显示顺序
 */
export const INDEX_API = {
  // POST /api/index - 创建索引
  // PUT /api/index - 更新索引
  // DELETE /api/index?id=xxx - 删除索引
  BASE: '/api/index',

  // POST /api/index/reorder - 索引排序
  REORDER: '/api/index/reorder',
};

/**
 * Table（数据库表）API 路径常量
 *
 * 【文件用途】
 * 定义与数据库表相关的 API 路径常量。
 * 表（Table）是数据库的核心对象，每张表包含多个字段（Field）和索引（Index），
 * 并可以通过关联关系（Relation）与其他表建立联系。
 *
 * 【在项目中的角色】
 * 在可视化画布上，每张表以一个节点（Node）的形式展示。
 * 用户可以创建新表、编辑表名、删除表、拖拽调整表的排列顺序等，
 * 这些操作都会通过以下路径调用后端 API。
 *
 * 【对应后端】src/app/api/table/
 *
 * 【支持的操作】
 * - GET    /api/table?schemaId=xxx - 查询某个 Schema 下所有的表列表
 * - POST   /api/table              - 创建新表
 * - PUT    /api/table              - 更新表信息（如修改表名、备注等）
 * - DELETE /api/table?id=xxx       - 删除表（逻辑删除，非物理删除）
 * - POST   /api/table/reorder      - 调整表在画布上的排列顺序
 */
export const TABLE_API = {
  // GET /api/table?schemaId=xxx - 查询表列表
  // POST /api/table - 创建表
  // PUT /api/table - 更新表
  // DELETE /api/table?id=xxx - 删除表（逻辑删除）
  BASE: '/api/table',

  // POST /api/table/reorder - 表排序
  REORDER: '/api/table/reorder',
};

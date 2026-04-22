/**
 * Relation（关联关系）API 路径常量
 *
 * 【文件用途】
 * 定义与表关联关系（如一对多、多对多）相关的 API 路径常量。
 * 关联关系描述了两张表之间的引用关系（外键关系），是数据库设计中的核心概念。
 *
 * 【在项目中的角色】
 * 在可视化画布上，关联关系以连线的形式展示在两个表节点之间。
 * 前端通过这些接口来获取、创建、更新、删除表之间的关联关系。
 *
 * 【对应后端】src/app/api/relation/
 *
 * 【支持的操作】
 * - GET    /api/relation?schemaId=xxx - 查询某个 Schema 下所有的关联关系列表
 * - POST   /api/relation              - 创建新的关联关系
 * - PUT    /api/relation              - 更新已有的关联关系
 * - DELETE /api/relation?id=xxx       - 根据 ID 删除关联关系
 */
export const RELATION_API = {
  // GET /api/relation?schemaId=xxx - 查询关联列表
  // POST /api/relation - 创建关联
  // PUT /api/relation - 更新关联
  // DELETE /api/relation?id=xxx - 删除关联
  BASE: '/api/relation',
};

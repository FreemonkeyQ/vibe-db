/**
 * Field（字段）API 路径常量
 *
 * 【文件用途】
 * 定义与数据库表字段相关的 API 路径常量。
 * 字段是表的组成部分，每个字段定义了列名、数据类型、是否可空、默认值等属性。
 *
 * 【在项目中的角色】
 * 当用户在可视化界面中编辑某张表的字段时（添加、修改、删除、排序字段），
 * 前端会调用这些接口与后端通信。
 *
 * 【对应后端】src/app/api/field/
 *
 * 【支持的操作】
 * - POST   /api/field         - 创建新字段
 * - PUT    /api/field         - 更新字段信息（如修改类型、名称等）
 * - DELETE /api/field?id=xxx  - 根据 ID 删除字段
 * - POST   /api/field/reorder - 调整字段的显示顺序（拖拽排序后保存）
 */
export const FIELD_API = {
  // POST /api/field - 创建字段
  // PUT /api/field - 更新字段
  // DELETE /api/field?id=xxx - 删除字段
  BASE: '/api/field',

  // POST /api/field/reorder - 字段排序（拖拽排序）
  REORDER: '/api/field/reorder',
};

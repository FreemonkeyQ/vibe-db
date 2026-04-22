/**
 * dbml.js - DBML 转换工具
 *
 * 【文件用途】
 * 将 SchemaContext 中的表结构（tables）和关联关系（relations）转换为 DBML 格式的字符串。
 * DBML（Database Markup Language）是一种可读性强的数据库结构描述语言。
 *
 * 【在项目中的角色】
 * 属于 schema 模块的工具层。被 DbmlPanel 组件调用，实时生成 DBML 文本供用户查看。
 *
 * 【转换策略】
 * 1. 首选方案：先将表结构转为 PostgreSQL DDL，再用 @dbml/core 库的 importer 转为标准 DBML
 * 2. 降级方案：如果 @dbml/core 转换失败，手动拼接简单的 DBML 文本
 * 3. 关联关系（Ref）始终手动生成，因为 SQL importer 不处理外键关系
 *
 * 【关键概念】
 * - DDL（Data Definition Language）：SQL 中定义表结构的语句（CREATE TABLE）
 * - DBML Ref：DBML 中描述表间关系的语法，如 Ref: users.id < posts.user_id
 * - Cardinality 运算符：'-'(一对一), '<'(一对多), '<>'(多对多)
 */

import { importer } from '@dbml/core';

// 基数类型到 DBML Ref 运算符的映射
// '-' 表示一对一，'<' 表示一对多（源端是"一"），'<>' 表示多对多
const REF_OPERATORS = {
  ONE_TO_ONE: '-',
  ONE_TO_MANY: '<',
  MANY_TO_MANY: '<>',
};

/**
 * toPostgresDDL - 将结构化表数据转为 PostgreSQL DDL 语句
 *
 * @param {Array} tables - 表数组，每个表包含 name 和 fields
 * @returns {string} PostgreSQL CREATE TABLE 语句
 *
 * 为什么要先转 DDL 再转 DBML？
 * 因为 @dbml/core 提供了 SQL -> DBML 的 importer，可以生成标准格式的 DBML，
 * 比手动拼接更规范、更美观。
 */
function toPostgresDDL(tables) {
  const statements = [];

  for (const table of tables) {
    const cols = [];    // 列定义列表
    const pks = [];     // 主键字段列表

    for (const field of table.fields || []) {
      // 拼接列定义：字段名 + 类型 + 约束（NOT NULL）
      const parts = [`"${field.name}"`, field.type];
      if (!field.isNullable) parts.push('NOT NULL');
      cols.push(`  ${parts.join(' ')}`);
      // 收集主键字段
      if (field.isPrimary) pks.push(`"${field.name}"`);
    }

    // 如果有主键，添加 PRIMARY KEY 约束
    if (pks.length > 0) {
      cols.push(`  PRIMARY KEY (${pks.join(', ')})`);
    }

    // 拼接完整的 CREATE TABLE 语句
    statements.push(`CREATE TABLE "${table.name}" (\n${cols.join(',\n')}\n);`);
  }

  return statements.join('\n\n');
}

/**
 * toRefLines - 生成 DBML 的 Ref（关联）行
 *
 * @param {Array} tables    - 表数组（用于查找表名和字段名）
 * @param {Array} relations - 关联关系数组
 * @returns {string} DBML Ref 语句，每行一个关联
 *
 * 为什么需要单独生成 Ref？
 * 因为 @dbml/core 的 SQL importer 只处理 CREATE TABLE 语句，不会处理外键关系，
 * 所以需要手动将 relations 数据转换为 DBML Ref 语法并追加到输出中。
 */
function toRefLines(tables, relations) {
  const lines = [];

  for (const rel of relations) {
    // 通过 ID 查找源表和目标表
    const srcTable = tables.find((t) => t.id === rel.sourceTableId);
    const tgtTable = tables.find((t) => t.id === rel.targetTableId);
    if (!srcTable || !tgtTable) continue;

    // 通过 ID 查找源字段和目标字段
    const srcField = srcTable.fields.find((f) => f.id === rel.sourceFieldId);
    const tgtField = tgtTable.fields.find((f) => f.id === rel.targetFieldId);
    if (!srcField || !tgtField) continue;

    // 获取 DBML 运算符（默认为 '<' 一对多）
    const op = REF_OPERATORS[rel.cardinality] || '<';
    // 生成 Ref 行，格式：Ref: "表A"."字段A" < "表B"."字段B"
    lines.push(
      `Ref: "${srcTable.name}"."${srcField.name}" ${op} "${tgtTable.name}"."${tgtField.name}"`
    );
  }

  return lines.join('\n');
}

/**
 * generateDbml - 主导出函数，生成完整的 DBML 字符串
 *
 * @param {Array} tables    - SchemaContext 中的 tables 数组
 * @param {Array} relations - SchemaContext 中的 relations 数组
 * @returns {string} 完整的 DBML 字符串
 *
 * 转换流程：
 * 1. 表结构 → PostgreSQL DDL → @dbml/core importer → DBML
 * 2. 关联关系 → 手动拼接 Ref 行 → 追加到 DBML 末尾
 * 3. 如果步骤 1 失败，降级为手动拼接
 */
export function generateDbml(tables = [], relations = []) {
  // 空表时显示提示注释
  if (tables.length === 0) return '// 暂无数据表\n';

  try {
    // 首选方案：通过 DDL -> DBML 转换
    const ddl = toPostgresDDL(tables);
    let dbml = importer.import(ddl, 'postgres');

    // 追加 Ref 行（关联关系）
    const refs = toRefLines(tables, relations);
    if (refs) {
      dbml = dbml.trimEnd() + '\n\n' + refs + '\n';
    }

    return dbml;
  } catch {
    // 降级方案：@dbml/core 转换失败时，手动拼接简单 DBML
    return fallbackDbml(tables, relations);
  }
}

/**
 * fallbackDbml - 降级方案：不依赖 @dbml/core，手动生成 DBML
 *
 * 当 @dbml/core 的 importer 因某些原因失败时（如字段类型不合法），
 * 使用这个函数手动拼接基本的 DBML 格式文本。
 *
 * DBML 格式示例：
 * Table users {
 *   id integer [pk, not null]
 *   name varchar
 * }
 */
function fallbackDbml(tables, relations) {
  const blocks = [];

  for (const table of tables) {
    const lines = [`Table ${table.name} {`];
    for (const field of table.fields || []) {
      // 收集字段属性标注
      const attrs = [];
      if (field.isPrimary) attrs.push('pk');
      if (!field.isNullable) attrs.push('not null');
      const suffix = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
      lines.push(`  ${field.name} ${field.type}${suffix}`);
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }

  // 追加 Ref 行
  const refs = toRefLines(tables, relations);
  if (refs) blocks.push(refs);

  return blocks.join('\n\n') + '\n';
}

/**
 * DbmlPanel.jsx - DBML 预览面板
 *
 * 【文件用途】
 * 将当前数据库 Schema（表结构和关联关系）实时转换为 DBML 格式的文本，
 * 并以只读代码编辑器的形式展示给用户。DBML（Database Markup Language）是一种
 * 用于描述数据库结构的标记语言，便于阅读和分享。
 *
 * 【在项目中的角色】
 * 属于 schema 模块的展示层。用户在编辑表结构时，可以切换到 DBML 面板查看
 * 当前 Schema 的文本化表示。这对于导出、文档化、与团队成员沟通数据库设计很有用。
 *
 * 【关键概念】
 * - DBML：Database Markup Language，一种数据库结构描述语言
 * - CodeMirror：功能强大的代码编辑器组件（这里用于语法高亮展示）
 * - useMemo：React Hook，当依赖不变时缓存计算结果，避免每次渲染都重新生成 DBML
 */

'use client';

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { useSchema } from './SchemaContext';
import { generateDbml } from './dbml';

// CodeMirror 扩展配置：使用 SQL 语法高亮（DBML 语法与 SQL 相似）
const extensions = [sql()];

/**
 * DbmlPanel - DBML 预览面板组件
 *
 * 从 SchemaContext 获取 tables 和 relations 数据，
 * 通过 generateDbml 转换为 DBML 文本，在 CodeMirror 中只读展示。
 */
const DbmlPanel = () => {
  // 从全局 Schema 上下文获取表和关联数据
  const { tables, relations } = useSchema();

  // 使用 useMemo 缓存 DBML 字符串，只有 tables 或 relations 变化时才重新生成
  const dbml = useMemo(() => generateDbml(tables, relations), [tables, relations]);

  return (
    <div className="flex h-full flex-col">
      {/* CodeMirror 代码编辑器（只读模式） */}
      <CodeMirror
        value={dbml}               // 显示的 DBML 文本内容
        readOnly                   // 只读，用户不能编辑
        editable={false}           // 不可编辑（连光标都不显示）
        extensions={extensions}    // 语法高亮扩展
        height="100%"
        className="min-h-0 flex-1 overflow-auto text-sm"
        basicSetup={{
          lineNumbers: true,          // 显示行号
          foldGutter: false,          // 不显示代码折叠按钮
          highlightActiveLine: false, // 不高亮当前行（因为是只读的）
        }}
      />
    </div>
  );
};

export default DbmlPanel;

/**
 * SidePanel.jsx - 侧边面板容器
 *
 * 【文件用途】
 * 侧边栏的面板路由器/容器组件。根据 activePanel 属性，切换显示不同的子面板：
 * - "dbml"：DBML 代码预览
 * - "tables"：数据表列表和编辑
 * - "relations"：关联关系管理
 *
 * 【在项目中的角色】
 * 属于 schema 模块的布局层。它将三个功能面板（TablesPanel、RelationsPanel、DbmlPanel）
 * 统一管理，通过条件渲染实现面板切换，同时提供统一的标题栏样式。
 *
 * 【关键概念】
 * - 面板路由：根据 activePanel 值决定渲染哪个组件（类似简单的路由机制）
 * - 组件映射：使用对象字面量（PANELS）将面板 key 映射到标题和渲染函数
 */

'use client';

import TablesPanel from './TablesPanel';
import RelationsPanel from './RelationsPanel';
import DbmlPanel from './DbmlPanel';

// 面板配置映射：key -> { title: 显示标题, render: 渲染函数 }
const PANELS = {
  dbml: {
    title: 'DBML',
    render: () => <DbmlPanel />,
  },
  tables: {
    title: '数据表',
    render: () => <TablesPanel />,
  },
  relations: {
    title: '关联',
    render: () => <RelationsPanel />,
  },
};

/**
 * SidePanel - 侧边面板容器组件
 *
 * @param {string} activePanel - 当前激活的面板 key（'dbml' | 'tables' | 'relations'）
 *
 * 根据 activePanel 值从 PANELS 映射中获取对应面板并渲染。
 * 如果传入无效的 key，返回 null（不渲染任何内容）。
 */
const SidePanel = ({ activePanel }) => {
  const panel = PANELS[activePanel];

  // 如果 activePanel 不在已知面板列表中，不渲染
  if (!panel) return null;

return (
    <div className="flex h-full flex-col">
      {/* 面板标题栏：左侧蓝色竖条 + 标题文字 */}
      <div className="flex flex-row items-center gap-2 px-4 py-2">
        <div className="h-4 w-1 rounded-md bg-blue-500" />
        <span className="font-semibold text-slate-700">{panel.title}</span>
      </div>
      {/* 面板内容区域：flex-1 + min-h-0 确保可滚动 */}
      <div className="min-h-0 flex-1">{panel.render()}</div>
    </div>
  );
};

export default SidePanel;

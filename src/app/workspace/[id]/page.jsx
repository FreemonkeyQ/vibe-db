/**
 * 文件: src/app/workspace/[id]/page.jsx
 * 用途: 具体工作区页面（路由 "/workspace/:id"）
 *
 * 在 Next.js App Router 中，[id] 是动态路由段（Dynamic Segment）。
 * 方括号表示这是一个参数化路由，URL 中的这部分会作为参数传递给组件。
 * 例如：/workspace/abc123 中的 "abc123" 就是 id 参数的值。
 *
 * 本页面是整个应用的核心工作区，用户在这里进行数据库 Schema 的可视化设计：
 * - 左侧工具栏：提供新建表、切换面板等快捷操作
 * - 左侧面板：显示 DBML 代码、数据表列表或关联关系列表
 * - 右侧画布：使用 @xyflow/react 渲染数据表的可视化流程图
 *
 * 'use client' 表示客户端组件，因为需要使用交互状态和浏览器 API
 */
'use client';

// useState: 管理当前激活的侧边面板
import { useState } from 'react';

// useParams: Next.js 钩子，用于获取动态路由参数（这里获取 Schema ID）
import { useParams } from 'next/navigation';

// Header: 页面顶部导航栏组件
import Header from '@/components/Header';

// Mantine UI 组件：ActionIcon（图标按钮）和 Divider（分隔线）
import { ActionIcon, Divider } from '@mantine/core';

// Lucide React 图标库：用于工具栏中的图标显示
import { Plus, Table, GitFork, FileCode } from 'lucide-react';

// SplitPane: 可拖拽调整大小的分割面板组件，实现左右面板可调整宽度
import { SplitPane, Pane } from 'react-split-pane';

// Workspace: 核心画布组件，基于 @xyflow/react 实现数据表的可视化拖拽设计
import Workspace from '@/features/canvas/Workspace';

// SidePanel: 侧边面板组件，根据 activePanel 显示不同内容（DBML/数据表/关联）
import SidePanel from '@/features/schema/SidePanel';

// SchemaProvider: Schema 数据的 Context Provider，为子组件提供 Schema 相关的状态和方法
// useSchema: 消费 SchemaContext 的钩子，获取 Schema 操作方法（如 addTable）
import { SchemaProvider, useSchema } from '@/features/schema/SchemaContext';

/**
 * Toolbar - 侧边栏工具栏组件
 * 位于页面最左侧的窄栏，提供快捷操作按钮：
 * - 新建表：创建一个新的数据库表
 * - DBML：切换到 DBML 代码视图
 * - 数据表：切换到数据表列表视图
 * - 关联：切换到表关联关系视图
 *
 * @param {object} props
 * @param {string} props.activePanel - 当前激活的面板标识（'dbml' | 'tables' | 'relations'）
 * @param {function} props.onTogglePanel - 切换面板的回调函数
 */
// 侧边栏工具栏组件
function Toolbar({ activePanel, onTogglePanel }) {
  // 从 SchemaContext 获取添加表的方法
  const { addTable } = useSchema();

  return (
    <div className="flex w-15 flex-col items-center gap-1 border-r border-slate-200 bg-white py-2">
      {/* 新建表按钮 */}
      <ActionIcon
        h={44}
        w={44}
        variant="subtle"
        color="gray"
        onClick={async () => {
          try {
            // 调用 SchemaContext 提供的 addTable 方法，创建一个名为"未命名"的新表
            await addTable('未命名');
          } catch (error) {
            console.error('创建表失败:', error);
          }
        }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <Plus size={16} className="text-gray-500" />
          <span className="text-[10px] leading-tight text-gray-500">新建</span>
        </div>
      </ActionIcon>

      {/* 分隔线，视觉上区分"新建"操作和"视图切换"操作 */}
      <Divider my="xs" w="70%" />

      {/* DBML 视图切换按钮 - 显示 Schema 的 DBML 代码表示 */}
      <ActionIcon
        h={44}
        w={44}
        variant="subtle"
        color={activePanel === 'dbml' ? 'blue.4' : 'gray'}
        onClick={() => onTogglePanel('dbml')}
      >
        <div className="flex flex-col items-center gap-0.5">
          <FileCode
            size={16}
            className={activePanel === 'dbml' ? 'text-blue-500' : 'text-gray-500'}
          />
          <span
            className={`text-[10px] leading-tight ${activePanel === 'dbml' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            DBML
          </span>
        </div>
      </ActionIcon>

      {/* 数据表列表视图切换按钮 */}
      <ActionIcon
        h={44}
        w={44}
        variant="subtle"
        color={activePanel === 'tables' ? 'blue.4' : 'gray'}
        onClick={() => onTogglePanel('tables')}
      >
        <div className="flex flex-col items-center gap-0.5">
          <Table
            size={16}
            className={activePanel === 'tables' ? 'text-blue-500' : 'text-gray-500'}
          />
          <span
            className={`text-[10px] leading-tight ${activePanel === 'tables' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            数据表
          </span>
        </div>
      </ActionIcon>

      {/* 关联关系视图切换按钮 */}
      <ActionIcon
        h={44}
        w={44}
        variant="subtle"
        color={activePanel === 'relations' ? 'blue.4' : 'gray'}
        onClick={() => onTogglePanel('relations')}
      >
        <div className="flex flex-col items-center gap-0.5">
          <GitFork
            size={16}
            className={activePanel === 'relations' ? 'text-blue-500' : 'text-gray-500'}
          />
          <span
            className={`text-[10px] leading-tight ${activePanel === 'relations' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            关联
          </span>
        </div>
      </ActionIcon>
    </div>
  );
}

/**
 * WorkspacePage - 工作区主页面组件
 *
 * 页面整体布局结构（从外到内）：
 * ┌─────────────────────────────────────────┐
 * │              Header（顶部导航）            │
 * ├────┬──────────────┬─────────────────────┤
 * │    │              │                     │
 * │工具│   侧边面板    │      画布区域        │
 * │ 栏 │ (SidePanel)  │   (Workspace)       │
 * │    │              │                     │
 * └────┴──────────────┴─────────────────────┘
 *
 * SchemaProvider 包裹整个页面，为所有子组件提供当前 Schema 的数据和操作方法。
 */
export default function WorkspacePage() {
  // 获取 URL 中的动态参数，params.id 就是当前 Schema 的 ID
  const params = useParams();
  const schemaId = params.id;

  // 当前激活的侧边面板，默认显示"数据表"面板
  const [activePanel, setActivePanel] = useState('tables');

  /**
   * 切换侧边面板的回调函数
   * @param {string} panel - 要切换到的面板标识
   */
  const togglePanel = (panel) => {
    setActivePanel(panel);
  };

  return (
    // SchemaProvider 接收 schemaId，内部会根据 ID 加载对应的 Schema 数据
    <SchemaProvider schemaId={schemaId}>
      <main className="flex h-screen flex-col">
        {/* 顶部导航栏 */}
        <Header />

        {/* 主内容区：工具栏 + 侧边面板 + 画布，水平排列 */}
        <div className="flex min-h-0 flex-1 flex-row">
          {/* 左侧工具栏 */}
          <Toolbar activePanel={activePanel} onTogglePanel={togglePanel} />

          {/* 可分割的面板区域：侧边面板和画布之间可拖拽调整宽度 */}
          <div className="relative flex min-h-0 flex-1">
            <SplitPane>
              {/* 左侧面板：显示 DBML / 数据表列表 / 关联关系 */}
              <Pane
                minSize="450px"
                defaultSize="450px"
                maxSize="700px"
                className="border-r border-slate-200"
              >
                <SidePanel activePanel={activePanel} />
              </Pane>

              {/* 右侧画布：@xyflow/react 实现的可视化 Schema 设计区域 */}
              <Pane className="h-full">
                <Workspace />
              </Pane>
            </SplitPane>
          </div>
        </div>
      </main>
    </SchemaProvider>
  );
}

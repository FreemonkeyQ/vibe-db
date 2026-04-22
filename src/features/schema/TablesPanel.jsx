/**
 * TablesPanel.jsx - 表列表面板
 *
 * 【文件用途】
 * 侧边栏的数据表列表面板。显示所有数据库表的卡片列表，支持搜索、新增、
 * 拖拽排序、展开/折叠，以及拖拽时的浮动预览。
 *
 * 【在项目中的角色】
 * 属于 schema 模块的核心 UI 组件。它是用户管理数据库表的主要入口：
 * 1. 新建表：输入表名 → 点击"新建"或按 Enter
 * 2. 查看/编辑表：点击展开表卡片
 * 3. 拖拽排序：拖拽调整表的排列顺序
 *
 * 【关键概念】
 * - @dnd-kit 拖拽系统：
 *   - DndContext：拖拽上下文容器
 *   - SortableContext：可排序元素容器
 *   - DragOverlay：拖拽时的浮动预览层
 *   - useSortable：使单个元素可拖拽的 Hook
 * - memo + 自定义 areEqual 函数：精细控制重渲染时机
 * - activeId：当前正在被拖拽的元素 ID，用于判断哪个项需要隐藏
 *
 * 【性能优化重点】
 * 拖拽列表中最常见的性能问题是：拖拽一个元素导致整个列表重渲染。
 * 这里通过以下方式优化：
 * 1. 不依赖 useSortable 的 isDragging（会导致每个 Sortable 组件各自计算）
 * 2. 改用外部 activeId 状态 + 自定义 areEqual 函数
 * 3. 只有被拖拽项的拖拽状态变化时才重渲染
 */

'use client';

import { memo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Input, Button, ScrollArea, Skeleton } from '@mantine/core';
import { Grid2x2Plus } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortableList } from '@/hooks/useSortableList';
import TableSchema from './TableSchema';
import { useSchema } from './SchemaContext';

// ─── DragPreview ────────────────────────────────────────────────────────────────

/**
 * DragPreview - 拖拽中的浮动预览组件
 *
 * 当用户拖拽表卡片时，鼠标下方跟随的小卡片预览。
 * 显示表的颜色标识和名称，使用户知道正在拖拽哪个表。
 */
const DragPreview = memo(({ table }) => (
  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
    <div className="flex items-center gap-2">
      {/* 颜色标识 */}
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: table.color || '#2b80ff' }} />
      {/* 表名 */}
      <span className="text-sm font-medium text-gray-800">{table.name}</span>
    </div>
  </div>
));

DragPreview.displayName = 'DragPreview';

// ─── SortableTableSchema ──────────────────────────────────────────────────────

/**
 * SortableTableSchema - 可拖拽的表卡片包装组件
 *
 * @param {object} table       - 表数据
 * @param {number} collapseKey - 折叠控制 key
 * @param {number} openKey     - 展开控制 key
 * @param {string} activeId    - 当前被拖拽的元素 ID（从父组件传入）
 *
 * 【关键设计】
 * 不依赖 useSortable 的 isDragging，改用外部传入的 activeId 判断。
 *
 * 原因：useSortable 内部通过事件系统计算 isDragging，每次拖拽开始/移动都会
 * 触发所有 Sortable 组件的 isDragging 变化，导致整个列表重渲染。
 * 改为外部传入 activeId 后，只有 activeId 变化时才会触发相关组件的 props 变化，
 * 配合自定义的 areEqual 函数，可以精确控制哪些组件需要重渲染。
 */
const SortableTableSchema = memo(
  ({ table, collapseKey, openKey, activeId }) => {
    // useSortable：提供拖拽需要的属性（ref、拖拽事件监听、位置变换等）
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: table.id,
    });

    // 从外部判断是否被拖拽，避免 useSortable 的 isDragging 状态更新触发重渲染
    const isDragging = activeId === table.id;

    return (
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform), // 拖拽时的位置偏移
          transition,                                   // 平滑过渡动画
          opacity: isDragging ? 0 : 1,                 // 被拖拽的项在原地设为透明（隐藏）
          height: isDragging ? 44 : 'auto',            // 拖拽时缩小占位
          overflow: 'hidden',
        }}
        // 被拖拽时显示虚线边框作为占位提示
        className={isDragging ? 'rounded-lg border border-dashed border-gray-300 bg-gray-50' : ''}
      >
        {/* 实际的表卡片渲染 */}
        <TableSchema
          table={table}
          dragHandleProps={{ ...attributes, ...listeners }} // 将拖拽事件传递给拖拽手柄
          collapseKey={collapseKey}
          openKey={openKey}
        />
      </div>
    );
  },
  // 自定义比较函数：精细控制重渲染时机
  (prevProps, nextProps) => {
    // 只有以下情况才重渲染：
    // 1. 拖拽状态变化（之前被拖拽 或 现在被拖拽）
    // 2. props 中的关键属性变化
    const wasDragging = prevProps.activeId === prevProps.table.id;
    const isNowDragging = nextProps.activeId === nextProps.table.id;
    const draggingChanged = wasDragging !== isNowDragging;

    const propsChanged =
      prevProps.table.id !== nextProps.table.id ||
      prevProps.collapseKey !== nextProps.collapseKey ||
      prevProps.openKey !== nextProps.openKey;

    // 返回 true 表示 "props 相等，不需要重渲染"
    // 返回 false 表示 "props 不同，需要重渲染"
    return !draggingChanged && !propsChanged;
  }
);

SortableTableSchema.displayName = 'SortableTableSchema';

// ─── TablesPanel ──────────────────────────────────────────────────────────────

/**
 * TablesPanel - 表列表面板主组件
 *
 * 功能：
 * 1. 顶部：搜索框 + "新建" 按钮
 * 2. 中部：可拖拽排序的表卡片列表
 * 3. 加载中显示骨架图，无数据时显示空状态插图
 */
const TablesPanel = () => {
  const { tables, loading, reorderTables, addTable } = useSchema();

  // useSortableList：自定义 Hook，封装拖拽排序的通用逻辑
  const { sensors, handleDragEnd } = useSortableList(tables, reorderTables);

  // 新建表的表名输入值
  const [name, setName] = useState('');
  // 折叠控制令牌（增加 token 值可触发所有面板折叠/展开）
  const [collapseToken, setCollapseToken] = useState(0);
  // 当前展开的表 ID
  const [expandedId, setExpandedId] = useState(null);
  // 当前正在被拖拽的表 ID
  const [activeId, setActiveId] = useState(null);

  /**
   * handleAdd - 新建表
   *
   * 1. 调用 addTable 创建新表（返回新表 ID）
   * 2. 清空输入框
   * 3. 增加 collapseToken（让新表展开）
   * 4. 设置 expandedId 让新表自动展开，方便用户立即编辑
   */
  const handleAdd = () => {
    const id = addTable(name.trim());
    setName('');
    setCollapseToken((t) => t + 1);
    setExpandedId(id);
  };

  // 预先计算 activeTable（拖拽预览的数据）
  const activeTable = activeId ? tables.find((t) => t.id === activeId) : null;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* 顶部操作栏：输入框 + 新建按钮 */}
      <div className="flex flex-row gap-1 px-3 pt-1">
        <Input
          placeholder="请输入表名"
          size="xs"
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()} // Enter 键创建
        />
        <Button size="xs" leftSection={<Grid2x2Plus size={16} />} onClick={handleAdd}>
          新建
        </Button>
      </div>

      {/* 表卡片列表区域（带滚动） */}
      <ScrollArea className="min-h-0 flex-1 px-3" type="never">
        {loading ? (
          // 加载中：显示骨架屏占位
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={48} radius="sm" />
            ))}
          </div>
        ) : tables.length === 0 ? (
          // 无数据：显示空状态插图
          <div className="flex h-full flex-col items-center justify-center gap-2 pt-40">
            <Image
              src="/empty.png"
              alt="暂无数据"
              width={140}
              height={140}
              loading="eager"
              priority
            />
            <span className="text-sm text-slate-400">暂无数据</span>
          </div>
        ) : (
          // 有数据：显示可拖拽的表列表
          <DndContext
            sensors={sensors}                    // 拖拽传感器配置
            collisionDetection={closestCenter}   // 碰撞检测：最近中心点
            onDragStart={({ active }) => setActiveId(active.id)} // 记录被拖拽的 ID
            onDragEnd={(event) => {
              setActiveId(null);                  // 清除拖拽 ID
              handleDragEnd(event);               // 执行排序更新
            }}
            onDragCancel={() => setActiveId(null)} // 拖拽取消时清除
          >
            {/* SortableContext：标记可排序的元素 */}
            <SortableContext items={tables.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2 pb-2">
                {tables.map((table) => (
                  <SortableTableSchema
                    key={table.id}
                    table={table}
                    // 所有面板共享同一个 collapseToken，实现"折叠全部"功能
                    collapseKey={collapseToken}
                    // 只有当前展开的表才会收到 openKey，触发展开
                    openKey={table.id === expandedId ? collapseToken : undefined}
                    activeId={activeId}
                  />
                ))}
              </div>
            </SortableContext>
            {/* DragOverlay：拖拽时跟随鼠标的浮动预览 */}
            <DragOverlay>{activeTable && <DragPreview table={activeTable} />}</DragOverlay>
          </DndContext>
        )}
      </ScrollArea>
    </div>
  );
};

export default TablesPanel;

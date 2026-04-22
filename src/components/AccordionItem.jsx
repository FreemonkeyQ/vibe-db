/**
 * AccordionItem.jsx - 手风琴/折叠面板组件
 *
 * 用途：提供一个可展开/折叠的容器，带有标题栏、操作按钮、拖拽手柄等功能。
 * 在项目中的角色：用于在侧边栏中展示数据库表的详情（字段列表等），
 *   每个表对应一个 AccordionItem，可以折叠收起节省空间，也支持拖拽排序。
 *
 * 技术要点：
 * - 使用 CSS Grid 的 grid-template-rows 技巧实现平滑的展开/折叠动画
 * - 支持外部控制展开/折叠状态（通过 collapseKey 和 openKey）
 * - 支持 @dnd-kit 的拖拽手柄集成
 * - 悬停时才显示操作按钮，优化视觉效果
 */
'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, GripVertical } from 'lucide-react';

/**
 * 手风琴/折叠面板组件
 * @param {React.ReactNode} title - 标题栏内容（可以是文字或自定义元素）
 * @param {React.ReactNode} actions - 右侧操作按钮区域（如删除、编辑按钮）
 * @param {React.ReactNode} children - 折叠区域中的子内容
 * @param {boolean} defaultOpen - 是否默认展开
 * @param {any} collapseKey - 外部折叠控制：当此值变化时，强制折叠。用于"全部收起"功能
 * @param {any} openKey - 外部展开控制：当此值变化时，强制展开。用于"全部展开"功能
 * @param {object} dragHandleProps - @dnd-kit 拖拽手柄的属性（包含事件监听器等）
 * @param {boolean} shadow - 是否显示外层阴影和边框
 * @param {boolean} draggable - 是否显示拖拽手柄图标
 * @param {React.ReactNode} leftElement - 标题栏左侧的自定义元素（如颜色条）
 */
const AccordionItem = ({
  title,
  actions,
  children,
  defaultOpen = false,
  collapseKey,
  openKey,
  dragHandleProps = {},
  shadow = true,
  draggable = true,
  leftElement, // 左侧元素（如颜色条）
}) => {
  // opened: 控制当前面板是否处于展开状态
  const [opened, setOpened] = useState(defaultOpen);
  // hovered: 标记鼠标是否悬停在标题栏上，用于控制操作按钮的显示/隐藏
  const [hovered, setHovered] = useState(false);

  /**
   * 监听 collapseKey 变化：当父组件改变 collapseKey 值时，强制折叠面板
   * 典型用途：用户点击"全部收起"按钮时，父组件更新 collapseKey 值
   */
  useEffect(() => {
    if (collapseKey !== undefined) setOpened(false);
  }, [collapseKey]);

  /**
   * 监听 openKey 变化：当父组件改变 openKey 值时，强制展开面板
   * 典型用途：用户点击"全部展开"按钮时，父组件更新 openKey 值
   */
  useEffect(() => {
    if (openKey !== undefined) setOpened(true);
  }, [openKey]);

  return (
    // 最外层容器：根据 shadow 属性决定是否添加圆角、边框、阴影样式
    <div className={shadow ? 'rounded-md border border-gray-100 bg-white shadow' : ''}>
      {/* 标题栏：点击可切换展开/折叠状态 */}
      <div
        className="group flex cursor-pointer items-center gap-1 rounded-md p-1.5 pr-1 hover:bg-blue-50"
        onClick={() => setOpened((o) => !o)} // 点击切换展开/折叠
        onMouseEnter={() => setHovered(true)} // 鼠标进入时标记悬停
        onMouseLeave={() => setHovered(false)} // 鼠标离开时取消悬停
      >
        {/* 左侧自定义元素（例如表示表颜色的色条） */}
        {leftElement}

        {/* 拖拽手柄：仅在 draggable=true 时显示 */}
        {draggable && (
          <span
            {...dragHandleProps} // 展开 @dnd-kit 提供的拖拽事件属性
            className="cursor-grab text-slate-400 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()} // 阻止冒泡，避免拖拽时触发折叠/展开
          >
            <GripVertical size={14} className="shrink-0" />
          </span>
        )}

        {/* 展开/折叠箭头指示器：展开时旋转 90 度 */}
        <ChevronRight
          size={14}
          className="shrink-0 text-slate-400 transition-transform duration-200"
          style={{ transform: opened ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />

        {/* 标题内容区域：flex-1 使其占据剩余空间 */}
        <span className="flex flex-1 items-center">{title}</span>

        {/* 操作按钮区域：悬停时才显示（通过 opacity 控制，实现淡入淡出效果） */}
        {actions && (
          <div
            className="flex items-center gap-0.5 transition-opacity duration-150"
            style={{ opacity: hovered ? 1 : 0 }}
            onClick={(e) => e.stopPropagation()} // 阻止冒泡，点击按钮不会触发折叠/展开
          >
            {actions}
          </div>
        )}
      </div>

      {/*
       * 折叠内容区域：使用 CSS Grid 的 grid-template-rows 实现平滑动画
       * 原理：
       * - 展开时 gridTemplateRows: '1fr'（占据所有可用空间）
       * - 折叠时 gridTemplateRows: '0fr'（高度为 0）
       * - 配合子元素的 minHeight: 0 和 overflow: hidden 实现内容隐藏
       * - transition 让高度变化有 0.2 秒的平滑过渡效果
       * 这是比 max-height 方案更优雅的 CSS 折叠动画实现方式
       */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: opened ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.2s ease',
        }}
      >
        <div style={{ minHeight: 0, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
};

export default AccordionItem;

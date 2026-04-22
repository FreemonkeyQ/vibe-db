/**
 * TableNode.jsx - 表节点组件
 *
 * 【文件用途】
 * 这是画布上每个数据库表的可视化组件。在 @xyflow/react 中，每个节点（Node）都可以
 * 自定义渲染内容，这个组件就是 "tableNode" 类型节点的渲染器。
 *
 * 【在项目中的角色】
 * 画布模块的核心组件之一。它将数据库表的结构（表名、字段、主键、索引等）
 * 以卡片形式展示在画布上，并提供连接点（Handle）让用户可以拖拽创建表间关联。
 *
 * 【关键概念】
 * - Node（节点）：@xyflow/react 中的基本元素，代表画布上的一个可拖拽实体
 * - Handle（连接点）：节点上的连接端口，用户可以从 Handle 拖拽出连线
 * - NodeResizeControl：让用户可以调整节点宽度的控件
 * - source/target：在 @xyflow/react 中，连线从 source Handle 出发，到 target Handle 结束
 */

import { Fragment, useState } from 'react';
import { Handle, Position, NodeResizeControl } from '@xyflow/react';
import { HolderOutlined } from '@ant-design/icons';
import { useWorkspace } from './WorkspaceContext';
import { Hash, CircleDot, KeyRound } from 'lucide-react';

// 表头高度（像素），用于计算每个字段的 Handle 垂直位置
const HEADER_HEIGHT = 40;
// 每行字段的高度（像素）
const ROW_HEIGHT = 32;

// Handle（连接点）的样式：蓝色圆点，鼠标悬停时显示
const handleStyle = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: '#2b80ff',
  transition: 'transform 0.15s ease',
  cursor: 'crosshair',
};

// 工具函数：从 Handle ID 中提取字段名（去掉 -left 或 -right 后缀）
const getFieldName = (handleId) => handleId?.replace(/-left$|-right$/, '');

/**
 * FieldBadge - 字段标识组件（可叠加显示多个标识）
 *
 * 在字段名旁边显示小图标，标识该字段的特殊属性：
 * - 主键（金色钥匙图标）
 * - 索引（蓝色 # 图标）
 * - 可为空（灰色 ? 标记）
 */
const FieldBadge = ({ isPrimary, isNullable, isIndexed }) => (
  <div className="flex items-center gap-0.5">
    {isPrimary && (
      <span className="flex items-center justify-center" title="主键">
        <KeyRound size={10} className="text-yellow-500" />
      </span>
    )}
    {isIndexed && (
      <span className="flex items-center justify-center" title="索引">
        <Hash size={10} className="text-blue-400" />
      </span>
    )}
    {isNullable && (
      <span className="flex items-center justify-center" title="可为空">
        <span className="text-[10px] text-gray-500">?</span>
      </span>
    )}
  </div>
);

/**
 * TableNode - 表节点主组件
 *
 * @param {string} id   - 节点 ID（即表的 ID）
 * @param {object} data - 节点数据，包含 label（表名）、color（颜色）、fields（字段列表）
 *
 * 功能：
 * 1. 显示表头（表名 + 颜色标识）
 * 2. 显示所有字段（字段名 + 类型 + 标识图标）
 * 3. 每个字段左右各有一个 Handle，支持拖拽连线
 * 4. 支持左右拖拽调整节点宽度
 * 5. 当某条连线被选中时，高亮相关字段
 */
const TableNode = ({ id, data }) => {
  // hovered 状态：鼠标是否悬停在节点上（控制 Handle 的显隐）
  const [hovered, setHovered] = useState(false);
  // 从工作区上下文获取当前选中的边，用于高亮相关字段
  const { selectedEdge } = useWorkspace() ?? {};

  // 计算需要高亮的字段集合（当某条边被选中时，该边关联的字段需要高亮）
  const highlightedFields = new Set();
  if (selectedEdge) {
    // 如果当前表是选中边的源表，高亮源字段
    if (selectedEdge.source === id) {
      highlightedFields.add(getFieldName(selectedEdge.sourceHandle));
    }
    // 如果当前表是选中边的目标表，高亮目标字段
    if (selectedEdge.target === id) {
      highlightedFields.add(getFieldName(selectedEdge.targetHandle));
    }
  }

  return (
    <div
      className="h-full min-w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 左侧拖拽调整宽度的控件 */}
      <NodeResizeControl
        variant="line"
        position={Position.Left}
        minWidth={192}
        style={{ borderColor: 'transparent', width: 6, left: -3, cursor: 'ew-resize' }}
      />
      {/* 右侧拖拽调整宽度的控件 */}
      <NodeResizeControl
        variant="line"
        position={Position.Right}
        minWidth={192}
        style={{ borderColor: 'transparent', width: 6, right: -3, cursor: 'ew-resize' }}
      />

      {/* 每个字段的连接点（Handle）：左边是 target（接收连线），右边是 source（发出连线） */}
      {data.fields.map((field, index) => {
        // 计算 Handle 的垂直位置：表头高度 + 行索引 × 行高 + 行高的一半（居中）
        const top = HEADER_HEIGHT + ROW_HEIGHT * index + ROW_HEIGHT / 2 - 5;
        return (
          <Fragment key={field.id}>
            {/* 左侧 Handle：作为 target（连线的终点） */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${field.id}-left`}
              style={{
                ...handleStyle,
                top,
                opacity: hovered ? 1 : 0, // 只在悬停时显示
                transition: 'opacity 0.15s ease',
              }}
            />
            {/* 右侧 Handle：作为 source（连线的起点） */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${field.id}-right`}
              style={{
                ...handleStyle,
                top,
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}
            />
          </Fragment>
        );
      })}

      {/* 表头区域：显示颜色标识 + 表名 + 拖拽手柄图标 */}
      <div className="flex flex-row items-center justify-between bg-gray-200 px-2 py-2">
        <div className="flex flex-row items-center gap-1">
          {/* 左侧颜色条，标识该表的颜色 */}
          <div
            className="h-4 w-1 rounded-xl"
            style={{ backgroundColor: data.color || '#2b80ff' }}
          ></div>
          <span className="text-xs font-bold text-black">{data.label}</span>
        </div>
        {/* 拖拽手柄图标，暗示用户可以拖拽移动节点 */}
        <HolderOutlined />
      </div>

      {/* 字段列表区域：nodrag 类名阻止在字段区域拖拽节点（避免误操作） */}
      <div className="nodrag divide-y divide-slate-100">
        {data.fields.map((field) => {
          const isHighlighted = highlightedFields.has(field.id);
          return (
            <div
              key={field.id}
              className={`flex h-8 items-center justify-between px-3 transition-colors duration-150 ${isHighlighted ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center gap-1">
                {/* 字段名，被选中时变蓝色 */}
                <span
                  className={`text-xs font-medium transition-colors duration-150 ${isHighlighted ? 'text-blue-600' : 'text-slate-700'}`}
                >
                  {field.name}
                </span>
                {/* 字段标识图标（主键/索引/可为空） */}
                <FieldBadge
                  isPrimary={field.isPrimary}
                  isNullable={field.isNullable}
                  isIndexed={field.isIndexed}
                />
              </div>
              {/* 字段类型，如 varchar、int 等 */}
              <span
                className={`text-[10px] font-medium transition-colors duration-150 ${isHighlighted ? 'text-blue-400' : 'text-slate-400'}`}
              >
                {field.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableNode;

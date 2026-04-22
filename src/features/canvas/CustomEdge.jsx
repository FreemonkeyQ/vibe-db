/**
 * CustomEdge.jsx - 自定义边/连线组件
 *
 * 【文件用途】
 * 自定义画布上两个表之间的连线外观。在 @xyflow/react 中，Edge（边）代表两个节点
 * 之间的连接关系。这个组件自定义了边的样式，并在连线两端显示基数标签（1、N）。
 *
 * 【在项目中的角色】
 * 画布模块的核心组件之一。每条连线代表一个数据库表间的关联关系（如外键），
 * 通过显示 "1" 和 "N" 标签来表示关系类型（一对一、一对多、多对多）。
 *
 * 【关键概念】
 * - Edge（边）：@xyflow/react 中连接两个节点的线条
 * - BaseEdge：@xyflow/react 提供的基础边组件，负责渲染 SVG path
 * - getSmoothStepPath：计算折线路径（带圆角的阶梯形路径）
 * - Cardinality（基数）：描述关系中实体数量关系（1:1, 1:N, N:N）
 */

import { BaseEdge, getSmoothStepPath } from '@xyflow/react';

// 基数映射：将枚举值转换为显示标签 [源端标签, 目标端标签]
const CARDINALITY_LABELS = {
  ONE_TO_ONE: ['1', '1'],     // 一对一：两端都显示 "1"
  ONE_TO_MANY: ['1', 'N'],    // 一对多：源端 "1"，目标端 "N"
  MANY_TO_MANY: ['N', 'N'],   // 多对多：两端都显示 "N"
};

// 标签相对于连接点的偏移距离（像素）
const LABEL_OFFSET = 16;
// 标签圆形徽章的半径
const BADGE_R = 8;
// 主题色（使用 CSS 变量）
const PRIMARY = 'var(--mantine-primary-color-filled)';

/**
 * Badge - 基数标签组件（圆形徽章 + 文字）
 *
 * 在连线的端点附近显示一个蓝色圆形，里面有白色文字（"1" 或 "N"）
 */
const Badge = ({ x, y, text }) => (
  <g>
    {/* 蓝色圆形背景 */}
    <circle cx={x} cy={y} r={BADGE_R} style={{ fill: PRIMARY }} />
    {/* 白色文字标签 */}
    <text
      x={x}
      y={y}
      style={{
        fontSize: 10,
        fontWeight: 700,
        fill: '#fff',
        textAnchor: 'middle',           // 水平居中
        dominantBaseline: 'central',     // 垂直居中
        pointerEvents: 'none',           // 不响应鼠标事件
        userSelect: 'none',              // 不可选中
      }}
    >
      {text}
    </text>
  </g>
);

/**
 * CustomEdge - 自定义边组件
 *
 * @param {string} id              - 边的唯一 ID
 * @param {number} sourceX/sourceY - 源端连接点坐标
 * @param {number} targetX/targetY - 目标端连接点坐标
 * @param {string} sourcePosition  - 源端方向（left/right/top/bottom）
 * @param {string} targetPosition  - 目标端方向
 * @param {string} markerEnd       - 箭头标记
 * @param {boolean} selected       - 是否被选中
 * @param {object} data            - 附加数据，包含 cardinality（基数类型）
 */
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}) => {
  // 使用 getSmoothStepPath 计算折线路径（带 8px 圆角的阶梯形路径）
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // 获取基数标签（如果有 cardinality 数据的话）
  const cardinality = data?.cardinality;
  const labels = cardinality ? CARDINALITY_LABELS[cardinality] : null;

  // 计算标签位置：根据连接点方向，在连接点外侧偏移 LABEL_OFFSET 距离
  const srcLabelX = sourcePosition === 'right' ? sourceX + LABEL_OFFSET : sourceX - LABEL_OFFSET;
  const tgtLabelX = targetPosition === 'left' ? targetX - LABEL_OFFSET : targetX + LABEL_OFFSET;

  return (
    <>
      {/* 基础边线：选中时变蓝色虚线，未选中时为灰色实线 */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={selected ? 'edge-selected' : ''}
        style={{
          stroke: selected ? 'var(--mantine-primary-color-filled)' : '#cbd5e1',
          strokeWidth: 1.5,
          strokeDasharray: selected ? '5 4' : 'none', // 选中时显示虚线
        }}
      />
      {/* 如果有基数信息，在两端显示标签徽章 */}
      {labels && (
        <>
          <Badge x={srcLabelX} y={sourceY} text={labels[0]} />
          <Badge x={tgtLabelX} y={targetY} text={labels[1]} />
        </>
      )}
    </>
  );
};

export default CustomEdge;

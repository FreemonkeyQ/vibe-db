/**
 * ConnectionLine.jsx - 连接线组件
 *
 * 【文件用途】
 * 当用户从一个表节点的连接点（Handle）拖拽出一条线、还未松开鼠标时，
 * 显示的"正在拖拽中"的临时连接线。这是 @xyflow/react 的 connectionLineComponent。
 *
 * 【在项目中的角色】
 * 提供拖拽创建关联时的视觉反馈。用户可以从表 A 的字段拖拽到表 B 的字段，
 * 在拖拽过程中会看到这条虚线，松开后会创建真正的关联关系（Edge）。
 *
 * 【关键概念】
 * - @xyflow/react 的 connectionLineComponent：自定义拖拽时临时线条的外观
 * - SVG path：使用 SVG 的 path 元素绘制曲线
 * - M/L/Q 指令：M=移动到, L=直线到, Q=二次贝塞尔曲线（用于圆角转弯效果）
 */

/**
 * ConnectionLine 组件
 *
 * @param {number} fromX - 起点 X 坐标（拖拽开始的 Handle 位置）
 * @param {number} fromY - 起点 Y 坐标
 * @param {number} toX   - 终点 X 坐标（当前鼠标位置）
 * @param {number} toY   - 终点 Y 坐标
 *
 * 绘制逻辑：从起点水平走到中点，再垂直走到终点的 Y 轴高度，最后水平走到终点。
 * 转弯处使用二次贝塞尔曲线（Q 指令）实现圆角效果，半径为 r=8 像素。
 */
const ConnectionLine = ({ fromX, fromY, toX, toY }) => {
  // 计算水平中点（连线的转折 X 位置）
  const midX = (fromX + toX) / 2;
  // 圆角半径
  const r = 8;
  // 根据终点在起点的上方还是下方，决定圆角的方向
  const dy = toY > fromY ? r : -r;

  // 构建 SVG path：
  // M 起点 → L 水平走到中点前 → Q 圆角转弯 → L 垂直走到终点附近 → Q 圆角转弯 → L 走到终点
  const path = `M${fromX},${fromY} L${midX - r},${fromY} Q${midX},${fromY} ${midX},${fromY + dy} L${midX},${toY - dy} Q${midX},${toY} ${midX + r},${toY} L${toX},${toY}`;

  return (
    <g>
      {/* 虚线样式的临时连接线，strokeDasharray 实现虚线效果 */}
      <path d={path} fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="5 4" />
    </g>
  );
};

export default ConnectionLine;

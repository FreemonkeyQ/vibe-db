/**
 * useSortableList.js - 拖拽排序 Hook
 *
 * 用途：封装 @dnd-kit 库的拖拽排序逻辑，提供开箱即用的拖拽排序功能。
 * 在项目中的角色：用于实现侧边栏中数据库表的拖拽排序、表字段的拖拽排序等场景。
 *
 * 技术要点：
 * - @dnd-kit 是 React 生态中流行的拖拽库，比 react-dnd 更轻量和现代
 * - PointerSensor: 使用指针（鼠标/触摸）事件来检测拖拽操作
 * - activationConstraint: 设置拖拽激活的约束条件，避免误触
 * - arrayMove: @dnd-kit 提供的工具函数，用于在数组中移动元素位置
 *
 * 使用方式：
 *   const { sensors, handleDragEnd } = useSortableList(items, onReorder);
 *   // 将 sensors 传给 DndContext，handleDragEnd 作为 onDragEnd 回调
 */

import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * 拖拽排序 Hook
 * @param {Array} items - 当前列表数据（由外部状态管理，如 useState 或 store）
 * @param {Function} onReorder - 排序完成后的回调函数，接收重新排序后的新数组
 * @param {string} idKey - 列表项中用作唯一标识的字段名，默认为 'id'
 * @returns {object} 返回 { sensors, handleDragEnd }
 *   - sensors: 传递给 DndContext 的 sensors 属性，定义如何检测拖拽
 *   - handleDragEnd: 传递给 DndContext 的 onDragEnd 属性，处理拖拽结束逻辑
 */
export const useSortableList = (items, onReorder, idKey = 'id') => {
  /**
   * 配置拖拽传感器
   * useSensors/useSensor 是 @dnd-kit 的 Hook，用于注册和配置传感器
   * PointerSensor: 基于指针事件（mousedown/mousemove）的传感器
   * activationConstraint.distance: 5 表示鼠标移动 5px 后才开始拖拽
   *   → 这样可以区分"点击"和"拖拽"操作，避免用户想点击时意外触发拖拽
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /**
   * 拖拽结束的处理函数
   * @param {object} param - DnD Kit 提供的事件对象
   * @param {object} param.active - 被拖拽的元素信息（active.id 是其唯一标识）
   * @param {object} param.over - 拖拽释放时鼠标下方的目标元素信息（over.id 是其唯一标识）
   *
   * 逻辑：
   * 1. 如果没有目标（over 为 null）或拖到原位置，则不做任何处理
   * 2. 根据 active.id 和 over.id 找到它们在数组中的索引
   * 3. 使用 arrayMove 交换位置，生成新数组
   * 4. 调用 onReorder 将新数组传给外部，由外部更新状态
   */
  const handleDragEnd = ({ active, over }) => {
    // 如果没有放置目标，或者放回了原位置，则忽略
    if (!over || active.id === over.id) return;

    // 找到被拖拽元素和目标元素在数组中的索引位置
    const oldIndex = items.findIndex((item) => item[idKey] === active.id);
    const newIndex = items.findIndex((item) => item[idKey] === over.id);

    // 确保两个索引都有效，然后执行排序
    if (oldIndex !== -1 && newIndex !== -1) {
      // arrayMove 会返回一个新数组，将 oldIndex 位置的元素移动到 newIndex 位置
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  // 返回 sensors 和 handleDragEnd，供外部组件传递给 DndContext
  return { sensors, handleDragEnd };
};

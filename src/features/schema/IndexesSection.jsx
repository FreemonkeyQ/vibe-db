/**
 * IndexesSection.jsx - 索引区域组件
 *
 * 【文件用途】
 * 在表结构编辑面板中显示和管理某个表的所有索引。支持新增、编辑（名称/类型/唯一性）、
 * 删除索引，以及通过拖拽重新排序。
 *
 * 【在项目中的角色】
 * 属于 schema 模块的 UI 层，是 TableSchema 组件的子组件。每个表的编辑面板中
 * 都包含一个 IndexesSection，用于管理该表的索引列表。
 *
 * 【关键概念】
 * - 数据库索引（Index）：加速查询的数据结构，可以是唯一索引或普通索引
 * - BTREE / HASH / GIN / GIST：PostgreSQL 支持的索引类型
 * - @dnd-kit：React 拖拽排序库，用于实现索引列表的拖拽重排
 * - 防抖（Debounce）：延迟执行某操作，避免频繁的网络请求（如用户连续输入时）
 * - 乐观更新：先更新本地 UI，再异步保存到后端
 */

'use client';

import { memo, useEffect, useState, useRef } from 'react';
import { GripVertical, ListFilter, KeyRound, Plus, X } from 'lucide-react';
import { Input, Select, ActionIcon, Tooltip, Button } from '@mantine/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PG_INDEX_TYPE_OPTIONS } from '@/lib/enums';
import { useSortableList } from '@/hooks/useSortableList';
import AccordionItem from '@/components/AccordionItem';
import { useSchema } from './SchemaContext';

// 防抖延迟（毫秒）：用户停止输入 1 秒后才触发保存
const DEBOUNCE_DELAY = 1000;

// ─── IndexRow ─────────────────────────────────────────────────────────────────

/**
 * IndexRow - 单个索引行组件
 *
 * @param {object} index   - 索引数据对象 { id, name, type, isUnique }
 * @param {string} tableId - 所属表的 ID
 *
 * 功能：
 * 1. 拖拽手柄（GripVertical 图标）：用于排序
 * 2. 名称输入框：编辑索引名称（带防抖保存）
 * 3. 类型选择器：选择索引类型（BTREE/HASH 等）
 * 4. 唯一性切换按钮：标记是否为唯一索引
 * 5. 删除按钮
 *
 * 【性能优化】
 * - 使用 memo 包裹，避免无关的父组件重渲染导致此组件重新渲染
 * - 名称使用本地 state + 防抖，避免每次按键都触发全局状态更新和网络请求
 */
const IndexRow = memo(({ index, tableId }) => {
  const { updateIndex, deleteIndex } = useSchema();
  // 本地状态：索引名称（用于即时显示输入内容，不等待全局状态更新）
  const [name, setName] = useState(index.name);
  // 防抖定时器引用
  const debounceRef = useRef(null);

  // 同步外部状态到本地（当后端数据变化时，如其他用户修改了同一索引）
  useEffect(() => {
    setName(index.name);
  }, [index.name]);

  // 组件卸载时清理定时器，防止内存泄漏
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // useSortable：@dnd-kit 提供的 Hook，使该行可以被拖拽排序
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index.id,
  });

  /**
   * handleNameChange - 名称输入处理
   *
   * 策略：本地状态立即更新（保证输入流畅），全局更新和保存通过防抖延迟触发。
   * 这样即使用户快速打字，也不会每个字符都发送网络请求。
   */
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName); // 立即更新本地状态

    // 清除已有定时器（重置防抖倒计时）
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // 设置新的防抖定时器
    debounceRef.current = setTimeout(() => {
      updateIndex(tableId, index.id, { name: newName }, { immediate: true });
    }, DEBOUNCE_DELAY);
  };

  // 判断是否为主键索引（名为 'id' 的索引视为主键）
  const isPrimaryIndex = index.name === 'id';

  return (
    <div
      ref={setNodeRef} // @dnd-kit 需要的 ref，用于追踪元素位置
      style={{
        transform: CSS.Translate.toString(transform), // 拖拽时的位移动画
        transition,                                   // 过渡动画
        opacity: isDragging ? 0.5 : 1,               // 拖拽时半透明
      }}
      className="flex items-center gap-1 py-1"
    >
      {/* 拖拽手柄：通过 listeners 和 attributes 赋予拖拽能力 */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-300 active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </span>
      {/* 索引名称输入框 */}
      <Input
        value={name}
        onChange={handleNameChange}
        size="xs"
        className="flex-1"
        styles={{ input: { minWidth: 0 } }}
      />
      {/* 索引类型选择器（BTREE / HASH / GIN / GIST） */}
      <Select
        value={index.type}
        onChange={(val) => updateIndex(tableId, index.id, { type: val }, { immediate: true })}
        data={PG_INDEX_TYPE_OPTIONS}
        size="xs"
        w={100}
        allowDeselect={false}
        styles={{ input: { minWidth: 0 } }}
      />
      {/* 唯一性切换按钮：主键显示钥匙图标，其他显示 U 标记 */}
      <Tooltip
        label={isPrimaryIndex ? '主键索引' : index.isUnique ? '唯一索引' : '非唯一'}
        withArrow
      >
        <ActionIcon
          variant="filled"
          color="gray.2"
          onClick={() =>
            updateIndex(tableId, index.id, { isUnique: !index.isUnique }, { immediate: true })
          }
        >
          {isPrimaryIndex ? (
            <KeyRound size={14} className="text-yellow-500" />
          ) : (
            <span
              className={`text-xs font-bold ${index.isUnique ? 'text-blue-500' : 'text-gray-400'}`}
            >
              U
            </span>
          )}
        </ActionIcon>
      </Tooltip>
      {/* 删除索引按钮 */}
      <Tooltip label="删除索引" withArrow>
        <ActionIcon variant="filled" color="gray.2" onClick={() => deleteIndex(tableId, index.id)}>
          <X size={14} className="text-gray-500 hover:text-red-500" />
        </ActionIcon>
      </Tooltip>
    </div>
  );
});

IndexRow.displayName = 'IndexRow';

// ─── IndexesSection ───────────────────────────────────────────────────────────

/**
 * IndexesSection - 索引管理区域组件
 *
 * @param {string} tableId - 所属表的 ID
 *
 * 功能：
 * 1. 显示该表的所有索引列表
 * 2. 提供"新增索引"按钮
 * 3. 支持拖拽排序索引顺序
 *
 * 使用 @dnd-kit 的 DndContext + SortableContext 实现拖拽排序。
 * useSortableList 是项目自定义 Hook，封装了拖拽排序的通用逻辑。
 */
const IndexesSection = ({ tableId }) => {
  const { tables, reorderIndexes, addIndex } = useSchema();
  // 从 tables 中找到当前表的索引数据
  const table = tables.find((t) => t.id === tableId);
  const indexes = table?.indexes ?? [];

  // useSortableList：自定义 Hook，提供 sensors（传感器配置）和 handleDragEnd（拖拽结束回调）
  const { sensors, handleDragEnd } = useSortableList(indexes, (newIndexes) =>
    reorderIndexes(tableId, newIndexes)
  );

  // 标题插槽：图标 + "索引" 文字
  const titleSlot = (
    <div className="flex items-center gap-1.5">
      <ListFilter size={13} className="text-slate-700" />
      <span className="text-xs text-slate-700">索引</span>
    </div>
  );

  // 操作按钮插槽："新增索引" 按钮
  const actionsSlot = (
    <Button
      size="compact-xs"
      variant="subtle"
      color="gray"
      leftSection={<Plus size={14} />}
      onClick={(e) => {
        e.stopPropagation(); // 阻止事件冒泡，防止触发 AccordionItem 的折叠
        addIndex(tableId);
      }}
    >
      新增索引
    </Button>
  );

  return (
    <AccordionItem
      title={titleSlot}
      actions={actionsSlot}
      defaultOpen        // 默认展开
      shadow={false}     // 无阴影（作为子区域使用）
      draggable={false}  // 本身不可拖拽
    >
      <div className="flex flex-col px-2 pb-2">
        {indexes.length === 0 ? (
          <span className="py-1 text-xs text-slate-400">暂无索引</span>
        ) : (
          // DndContext：@dnd-kit 的拖拽上下文容器
          <DndContext
            sensors={sensors}                    // 拖拽传感器（定义拖拽触发条件）
            collisionDetection={closestCenter}   // 碰撞检测算法
            onDragEnd={handleDragEnd}            // 拖拽结束回调（更新排序）
          >
            {/* SortableContext：告诉 @dnd-kit 哪些元素参与排序 */}
            <SortableContext
              items={indexes.map((i) => i.id)}
              strategy={verticalListSortingStrategy} // 垂直列表排序策略
            >
              {indexes.map((index) => (
                <IndexRow key={index.id} index={index} tableId={tableId} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </AccordionItem>
  );
};

export default IndexesSection;

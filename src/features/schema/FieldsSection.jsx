/**
 * FieldsSection.jsx - 字段区域组件
 *
 * 【文件用途】
 * 在表结构编辑面板中显示和管理某个表的所有字段。支持新增、编辑（名称/类型/可空性/主键）、
 * 删除字段，以及通过拖拽重新排序。
 *
 * 【在项目中的角色】
 * 属于 schema 模块的 UI 层，是 TableSchema 组件的子组件。每个表的编辑面板中
 * 都包含一个 FieldsSection，用于管理该表的字段列表。
 *
 * 【关键概念】
 * - Field（字段）：数据库表的列，包含名称、类型、是否主键、是否可为空等属性
 * - @dnd-kit：React 拖拽排序库，用于实现字段列表的拖拽重排
 * - 防抖（Debounce）：名称输入使用防抖策略，避免每次按键都发送网络请求
 * - 本地状态 + 全局状态分离：输入框使用本地 state 保证流畅，延迟同步到全局
 */

'use client';

import { memo, useEffect, useState, useRef } from 'react';
import { FileTypeCorner, GripVertical, KeyRound, MoreHorizontal, Plus, Trash } from 'lucide-react';
import { Input, Select, ActionIcon, Tooltip, Button, Menu } from '@mantine/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PG_FIELD_TYPE_GROUPS } from '@/lib/enums';
import { useSortableList } from '@/hooks/useSortableList';
import AccordionItem from '@/components/AccordionItem';
import { useSchema } from './SchemaContext';

// 防抖延迟（毫秒）：用户停止输入 1 秒后才触发保存
const DEBOUNCE_DELAY = 1000;

// ─── FieldRow ─────────────────────────────────────────────────────────────────

/**
 * FieldRow - 单个字段行组件
 *
 * @param {object} field   - 字段数据对象 { id, name, type, isPrimary, isNullable }
 * @param {string} tableId - 所属表的 ID
 *
 * 功能：
 * 1. 拖拽手柄：用于排序
 * 2. 名称输入框：编辑字段名称（带防抖保存）
 * 3. 类型选择器：选择字段类型（varchar/integer/boolean 等）
 * 4. N 按钮：切换是否可为 NULL
 * 5. 钥匙按钮：切换是否为主键
 * 6. 更多菜单：包含删除选项
 *
 * 【性能优化】
 * - 使用 memo 包裹，减少不必要的重渲染
 * - 名称和类型使用本地 state，防止全局状态更新导致输入卡顿
 */
const FieldRow = memo(({ field, tableId }) => {
  const { updateField, deleteField } = useSchema();
  // 本地状态：字段名称和类型（用于即时显示，不依赖全局状态的更新周期）
  const [name, setName] = useState(field.name);
  const [type, setType] = useState(field.type);
  // 防抖定时器引用
  const debounceRef = useRef(null);

  // 同步外部状态到本地（当后端数据变化时）
  useEffect(() => {
    setName(field.name);
  }, [field.name]);
  useEffect(() => {
    setType(field.type);
  }, [field.type]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // useSortable：使该行可以被拖拽排序
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  /**
   * handleNameChange - 名称输入处理（防抖策略）
   *
   * 即时更新本地状态（输入流畅），防抖 1 秒后才同步到全局状态并保存到后端。
   */
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName); // 本地状态立即更新，保证输入流畅

    // 清除已有定时器（重置倒计时）
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // 防抖后触发全局状态更新 + 立即保存（防抖已在组件内完成）
    debounceRef.current = setTimeout(() => {
      updateField(tableId, field.id, { name: newName }, { immediate: true });
    }, DEBOUNCE_DELAY);
  };

  /**
   * handleTypeChange - 类型选择处理
   *
   * 类型变更不需要防抖（用户通过下拉框选择，不存在连续输入场景），
   * 直接更新本地状态和全局状态。
   */
  const handleTypeChange = (val) => {
    if (!val) return;
    setType(val);
    updateField(tableId, field.id, { type: val }, { immediate: true });
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform), // 拖拽位移
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-1 py-1"
    >
      {/* 拖拽手柄 */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-300 active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </span>
      {/* 字段名称输入框 */}
      <Input
        value={name}
        onChange={handleNameChange}
        size="xs"
        className="flex-1"
        styles={{ input: { minWidth: 0 } }}
      />
      {/* 字段类型选择器：支持搜索（searchable），分组显示（PG_FIELD_TYPE_GROUPS） */}
      <Select
        value={type}
        onChange={handleTypeChange}
        data={PG_FIELD_TYPE_GROUPS}
        size="xs"
        w={130}
        allowDeselect={false}
        searchable            // 支持输入搜索类型
        styles={{ input: { minWidth: 0 } }}
      />
      {/* 可空性切换按钮：N = Nullable */}
      <Tooltip label={field.isNullable ? '可为 NULL' : '非 NULL'} withArrow>
        <ActionIcon
          variant="filled"
          color="gray.0.5"
          onClick={() =>
            updateField(tableId, field.id, { isNullable: !field.isNullable }, { immediate: true })
          }
        >
          <span
            className={`text-sm font-medium ${field.isNullable ? 'text-blue-500' : 'text-gray-400'}`}
          >
            N
          </span>
        </ActionIcon>
      </Tooltip>
      {/* 主键切换按钮：金色钥匙 = 是主键，灰色 = 非主键 */}
      <Tooltip label={field.isPrimary ? '主键' : '非主键'} withArrow>
        <ActionIcon
          variant="filled"
          color="gray.0.5"
          onClick={() =>
            updateField(tableId, field.id, { isPrimary: !field.isPrimary }, { immediate: true })
          }
        >
          <KeyRound size={14} className={field.isPrimary ? 'text-yellow-500' : 'text-gray-400'} />
        </ActionIcon>
      </Tooltip>
      {/* 更多操作菜单（包含删除） */}
      <Menu position="bottom-end" shadow="xs" width={100}>
        <Menu.Target>
          <ActionIcon variant="filled" color="gray.0.5">
            <MoreHorizontal size={16} className="text-gray-600" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown py={4}>
          <Menu.Item
            color="red"
            fz="xs"
            py={6}
            leftSection={<Trash size={12} />}
            onClick={() => deleteField(tableId, field.id)}
          >
            删除
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
});

FieldRow.displayName = 'FieldRow';

// ─── FieldsSection ────────────────────────────────────────────────────────────

/**
 * FieldsSection - 字段管理区域组件
 *
 * @param {string} tableId - 所属表的 ID
 *
 * 功能：
 * 1. 显示该表的所有字段列表
 * 2. 提供"新增字段"按钮（顶部和底部各一个）
 * 3. 支持拖拽排序字段顺序
 *
 * 拖拽排序使用 @dnd-kit 实现，useSortableList 封装了通用排序逻辑。
 */
const FieldsSection = ({ tableId }) => {
  const { tables, reorderFields, addField } = useSchema();
  // 从 tables 中找到当前表的字段数据
  const table = tables.find((t) => t.id === tableId);
  const fields = table?.fields ?? [];

  // useSortableList：自定义 Hook，返回拖拽传感器和拖拽结束处理函数
  const { sensors, handleDragEnd } = useSortableList(fields, (newFields) =>
    reorderFields(tableId, newFields)
  );

  // 标题插槽
  const titleSlot = (
    <div className="flex items-center gap-1.5">
      <FileTypeCorner size={13} className="text-slate-700" />
      <span className="text-xs text-slate-700">字段</span>
    </div>
  );

  // 操作按钮插槽
  const actionsSlot = (
    <Button
      size="compact-xs"
      variant="subtle"
      color="gray"
      leftSection={<Plus size={14} />}
      onClick={(e) => {
        e.stopPropagation(); // 阻止冒泡，防止触发折叠
        addField(tableId);
      }}
    >
      新增字段
    </Button>
  );

  return (
    <AccordionItem
      title={titleSlot}
      actions={actionsSlot}
      defaultOpen
      shadow={false}
      draggable={false}
    >
      <div className="flex flex-col px-2 pb-2">
        {/* 拖拽排序容器 */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((field) => (
              <FieldRow key={field.id} field={field} tableId={tableId} />
            ))}
          </SortableContext>
        </DndContext>
        {/* 底部也放一个"新增字段"按钮，方便快速添加 */}
        <div className="mt-1">{actionsSlot}</div>
      </div>
    </AccordionItem>
  );
};

export default FieldsSection;

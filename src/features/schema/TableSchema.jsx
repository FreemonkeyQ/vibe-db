/**
 * TableSchema.jsx - 表结构编辑组件
 *
 * 【文件用途】
 * 单个数据库表的编辑面板。包含表名编辑、颜色选择、备注、字段列表和索引列表
 * 的完整编辑功能。
 *
 * 【在项目中的角色】
 * 属于 schema 模块的 UI 层，是 TablesPanel 中每个表卡片的渲染组件。
 * 它聚合了 FieldsSection 和 IndexesSection，同时提供表级别的编辑功能（名称/颜色/备注）。
 *
 * 【关键概念】
 * - 表名编辑：双击进入编辑模式，Enter 确认，Escape 取消
 * - 实时预览：颜色选择时立即在 UI 上更新，选择完成后才保存到后端
 * - 备注防抖：输入 1.5 秒后自动保存
 * - AccordionItem：可折叠面板，展开后显示字段/索引/备注区域
 */

'use client';

import { memo, useRef, useState, useEffect } from 'react';
import { MoreVertical, Edit, Check, MessageSquareText } from 'lucide-react';
import { ActionIcon, Input, Divider, Textarea } from '@mantine/core';
import ColorPickerInput from '@/components/ColorPickerInput';
import AccordionItem from '@/components/AccordionItem';
import FieldsSection from './FieldsSection';
import IndexesSection from './IndexesSection';
import { useSchema } from './SchemaContext';

/**
 * TableSchema - 表结构编辑组件
 *
 * @param {object} table         - 表数据对象 { id, name, color, remark }
 * @param {object} dragHandleProps - 拖拽属性（用于父组件的拖拽排序）
 * @param {number} collapseKey   - 折叠 key（用于控制折叠面板的展开/收起）
 * @param {number} openKey       - 展开 key（用于控制特定面板展开）
 *
 * 功能分区：
 * 1. 表头区域：表名（可双击编辑）+ 颜色标识 + 操作按钮（编辑/更多）
 * 2. 展开后：FieldsSection（字段）+ IndexesSection（索引）+ 备注 + 颜色选择器
 */
const TableSchema = memo(({ table, dragHandleProps = {}, collapseKey, openKey }) => {
  const { updateTable } = useSchema();

  // --- 本地状态管理 ---
  // 编辑模式开关：是否处于表名编辑状态
  const [editing, setEditing] = useState(false);
  // 表名本地值（编辑时使用）
  const [nameValue, setNameValue] = useState(table.name);
  // 颜色本地值（用于实时预览）
  const [colorValue, setColorValue] = useState(table.color);
  // 备注本地值
  const [remarkValue, setRemarkValue] = useState(table.remark || '');
  // 表名输入框引用
  const inputRef = useRef(null);
  // 备注防抖定时器引用
  const remarkDebounceRef = useRef(null);

  // 同步 table.color 外部变化到本地状态（如其他组件修改了颜色）
  useEffect(() => {
    setColorValue(table.color);
  }, [table.color]);

  // 同步 table.remark 外部变化到本地状态
  useEffect(() => {
    setRemarkValue(table.remark || '');
  }, [table.remark]);

  // 组件卸载时清理防抖定时器
  useEffect(() => {
    return () => {
      if (remarkDebounceRef.current) clearTimeout(remarkDebounceRef.current);
    };
  }, []);

  /**
   * handleEditStart - 开始编辑表名
   *
   * 1. 阻止事件冒泡（防止触发 AccordionItem 的折叠）
   * 2. 重置本地值为当前表名
   * 3. 切换到编辑模式
   * 4. 延迟自动选中输入框内容（setTimeout 0 等待 DOM 更新后 focus）
   */
  const handleEditStart = (e) => {
    e.stopPropagation();
    setNameValue(table.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  /**
   * handleEditCommit - 确认修改表名
   *
   * 1. 去除前后空格
   * 2. 如果新表名不为空且与旧表名不同，触发更新
   * 3. 退出编辑模式
   */
  const handleEditCommit = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== table.name) updateTable(table.id, { name: trimmed });
    setEditing(false);
  };

  /**
   * handleColorChange - 颜色选择时实时预览（仅更新本地状态）
   *
   * 颜色选择器会频繁触发 onChange（每次微调颜色都触发），
   * 所以这里只更新本地 state，不触发网络请求。
   */
  const handleColorChange = (color) => {
    setColorValue(color);
  };

  /**
   * handleColorChangeEnd - 颜色选择完成后保存到后端
   *
   * 用户松开颜色选择器时触发，此时发送一次 PUT 请求保存。
   */
  const handleColorChangeEnd = (color) => {
    updateTable(table.id, { color }, { immediate: true });
  };

  /**
   * handleRemarkChange - 备注输入（防抖保存）
   *
   * 类似字段名的防抖策略：本地立即更新显示，延迟 1.5 秒后保存。
   * 避免用户每打一个字就发送一次网络请求。
   */
  const handleRemarkChange = (e) => {
    const newRemark = e.target.value;
    setRemarkValue(newRemark);

    // 重置防抖倒计时
    if (remarkDebounceRef.current) clearTimeout(remarkDebounceRef.current);

    // 1.5 秒后保存
    remarkDebounceRef.current = setTimeout(() => {
      updateTable(table.id, { remark: newRemark }, { immediate: true });
    }, 1500);
  };

  // --- 渲染 ---

  // 标题区域：编辑模式显示输入框，普通模式显示表名（双击进入编辑）
  const title = editing ? (
    <Input
      ref={inputRef}
      value={nameValue}
      size="xs"
      className="flex-1"
      onChange={(e) => setNameValue(e.target.value)}
      onBlur={handleEditCommit}  // 失焦时确认修改
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleEditCommit();    // Enter 确认
        if (e.key === 'Escape') setEditing(false);    // Escape 取消
      }}
      onClick={(e) => e.stopPropagation()}  // 阻止冒泡
    />
  ) : (
    <span className="text-sm font-bold text-slate-700" onDoubleClick={handleEditStart}>
      {table.name}
    </span>
  );

  // 左侧颜色条：编辑模式下不显示（避免 UI 过于拥挤）
  const leftElement = !editing && (
    <div className="h-4 w-1 shrink-0 rounded-full" style={{ backgroundColor: colorValue }} />
  );

  // 右侧操作按钮：编辑模式显示确认按钮，普通模式显示编辑和更多按钮
  const actions = editing ? (
    <ActionIcon variant="subtle" color="gray" onClick={handleEditCommit} className="rounded-sm">
      <Check size={16} />
    </ActionIcon>
  ) : (
    <>
      <ActionIcon variant="subtle" color="gray" onClick={handleEditStart}>
        <Edit size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="gray">
        <MoreVertical size={16} />
      </ActionIcon>
    </>
  );

  return (
    <AccordionItem
      title={title}
      actions={actions}
      collapseKey={collapseKey}
      openKey={openKey}
      // 编辑模式下禁用拖拽手柄（防止拖拽时误触发编辑）
      dragHandleProps={editing ? {} : dragHandleProps}
      leftElement={leftElement}
    >
      {/* 字段管理区域 */}
      <FieldsSection tableId={table.id} />
      {/* 索引管理区域 */}
      <IndexesSection tableId={table.id} />
      {/* 表备注区域（嵌套的 AccordionItem） */}
      <AccordionItem
        title={
          <div className="flex h-5 items-center gap-1.5">
            <MessageSquareText size={13} className="text-slate-700" />
            <span className="text-xs text-slate-700">备注</span>
          </div>
        }
        shadow={false}
        draggable={false}
      >
        <div className="px-2 pb-2">
          {/* 多行文本输入框，支持自适应高度 */}
          <Textarea
            value={remarkValue}
            onChange={handleRemarkChange}
            placeholder="请输入备注"
            className="mt-1"
            size="xs"
            autosize            // 自动调整高度
            minRows={3}         // 最小 3 行
            maxRows={6}         // 最大 6 行
          />
        </div>
      </AccordionItem>
      {/* 分割线 */}
      <Divider className="mx-2 my-1" />
      {/* 颜色选择器 */}
      <div className="flex items-center gap-2 px-2 py-2">
        <ColorPickerInput
          value={colorValue}
          onChange={handleColorChange}       // 实时预览
          onChangeEnd={handleColorChangeEnd} // 选择完成后保存
          swatchSize={20}
        />
      </div>
    </AccordionItem>
  );
});

TableSchema.displayName = 'TableSchema';

export default TableSchema;

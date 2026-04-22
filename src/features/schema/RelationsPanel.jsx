/**
 * RelationsPanel.jsx - 关系面板
 *
 * 【文件用途】
 * 展示和管理所有数据库表之间的关联关系。用户可以在这里查看每个关联的
 * 源表/目标表信息，修改关系类型（一对一/一对多/多对多），或删除关联。
 *
 * 【在项目中的角色】
 * 属于 schema 模块的 UI 层。它从 SchemaContext 获取关联数据并以可折叠列表展示，
 * 提供关系类型的下拉修改和删除操作。与画布上的连线是同一份数据的不同视图。
 *
 * 【关键概念】
 * - Relation（关联）：描述两个表之间的关系（类似外键约束）
 * - Cardinality（基数）：ONE_TO_ONE / ONE_TO_MANY / MANY_TO_MANY
 * - AccordionItem：自定义的可折叠面板组件，用于展开/收起关联详情
 */

'use client';

import { Select, ActionIcon, ScrollArea } from '@mantine/core';
import { Trash } from 'lucide-react';
import AccordionItem from '@/components/AccordionItem';
import { useSchema } from './SchemaContext';
import { CARDINALITY_OPTIONS } from '@/lib/enums';

/**
 * RelationsPanel - 关联关系管理面板
 *
 * 功能：
 * 1. 列出所有关联关系，以可折叠卡片形式展示
 * 2. 显示每个关联的源表/字段和目标表/字段
 * 3. 提供关系类型（Cardinality）的下拉选择器
 * 4. 提供删除关联的按钮
 */
const RelationsPanel = () => {
  const { tables, relations, updateRelation, deleteRelation } = useSchema();

  // 辅助函数：通过表 ID 查找表名
  const getTableName = (tableId) => tables.find((t) => t.id === tableId)?.name || tableId;
  // 辅助函数：通过表 ID 和字段 ID 查找字段名
  const getFieldName = (tableId, fieldId) => {
    const table = tables.find((t) => t.id === tableId);
    const field = table?.fields.find((f) => f.id === fieldId);
    return field?.name || null; // 返回 null 表示找不到
  };

  // 无关联时显示空状态提示
  if (relations.length === 0) {
    return <div className="px-3 pt-2 text-sm text-slate-400">暂无关联关系</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* ScrollArea：Mantine 的滚动容器，type="never" 隐藏滚动条 */}
      <ScrollArea className="min-h-0 flex-1 px-3" type="never">
        <div className="flex flex-col gap-2 pb-2">
          {relations.map((relation) => (
            <AccordionItem
              key={relation.id}
              draggable={false}
              title={<span className="text-sm font-bold text-slate-700">{relation.name}</span>}
              actions={
                // 删除按钮：红色垃圾桶图标
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => deleteRelation(relation.id)}
                >
                  <Trash size={14} />
                </ActionIcon>
              }
            >
              <div className="flex flex-col gap-2 px-3 py-2">
                {/* 主表 / 关联表 左右并排展示 */}
                <div className="flex gap-4">
                  {/* 左侧：源表（主表）信息 */}
                  <div className="flex-1">
                    <div className="mb-1 text-xs text-slate-400">主表</div>
                    <div className="text-sm text-slate-700">
                      {getTableName(relation.sourceTableId)}
                      <span className="text-slate-400">
                        (
                        {getFieldName(relation.sourceTableId, relation.sourceFieldId) || '未知字段'}
                        )
                      </span>
                    </div>
                  </div>
                  {/* 右侧：目标表（关联表）信息 */}
                  <div className="flex-1">
                    <div className="mb-1 text-xs text-slate-400">关联表</div>
                    <div className="text-sm text-slate-700">
                      {getTableName(relation.targetTableId)}
                      <span className="text-slate-400">
                        (
                        {getFieldName(relation.targetTableId, relation.targetFieldId) || '未知字段'}
                        )
                      </span>
                    </div>
                  </div>
                </div>

                {/* 关系类型选择器 */}
                <div>
                  <div className="mb-1 text-xs text-slate-400">关系类型</div>
                  {/* Select 下拉框：选择 ONE_TO_ONE / ONE_TO_MANY / MANY_TO_MANY */}
                  <Select
                    size="xs"
                    data={CARDINALITY_OPTIONS}       // 选项列表来自枚举配置
                    value={relation.cardinality}     // 当前值
                    onChange={(value) => updateRelation(relation.id, { cardinality: value })}
                    allowDeselect={false}            // 不允许取消选择（必须有值）
                  />
                </div>
              </div>
            </AccordionItem>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RelationsPanel;

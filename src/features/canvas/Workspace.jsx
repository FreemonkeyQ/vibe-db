/**
 * Workspace.jsx - 工作区主组件
 *
 * 【文件用途】
 * 这是画布模块的顶层组件，负责初始化和管理整个可视化画布。它将数据库表和关联关系
 * 渲染为可交互的节点图（Node Graph），支持拖拽、连线、选中、删除等操作。
 *
 * 【在项目中的角色】
 * 画布模块的入口组件。它：
 * 1. 从 SchemaContext 获取表和关联数据
 * 2. 将数据转换为 @xyflow/react 需要的 nodes 和 edges 格式
 * 3. 处理用户交互（拖拽节点、创建连线、选中/删除边）
 * 4. 通过 WorkspaceContext 向子组件共享工作区状态
 *
 * 【关键概念】
 * - ReactFlow：@xyflow/react 的核心组件，渲染整个节点图
 * - nodes（节点数组）：画布上的所有表节点
 * - edges（边数组）：画布上的所有连线
 * - useNodesState/useEdgesState：@xyflow/react 提供的状态管理 Hook
 * - fitView：自动缩放画布以显示所有节点
 */

'use client';

import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import { useCallback, useEffect, memo, useRef } from 'react';
import '@xyflow/react/dist/style.css';
import TableNode from './TableNode';
import CustomEdge from './CustomEdge';
import ConnectionLine from './ConnectionLine';
import { WorkspaceContext } from './WorkspaceContext';
import { useSchema } from '@/features/schema/SchemaContext';
import { useState, useMemo } from 'react';
import { Loader } from '@mantine/core';
import { post, put } from '@/lib/request';
import { TABLE_API } from '@/lib/api';
import { toast } from 'sonner';

// 注册自定义节点类型：告诉 ReactFlow 遇到 type="tableNode" 时使用 TableNode 组件渲染
const nodeTypes = { tableNode: TableNode };
// 注册自定义边类型：告诉 ReactFlow 遇到 type="custom" 时使用 CustomEdge 组件渲染
const edgeTypes = { custom: CustomEdge };

// fitView 配置：自动缩放视图时的参数
const FIT_VIEW_OPTIONS = {
  padding: 0.3,    // 四周留白 30%
  maxZoom: 0.9,    // 最大缩放比例，防止节点过大
};

// 防止重复保存的标记（对象引用，不触发重渲染）
const savingPositionRef = {};

/**
 * tablesToNodes - 将表数据转换为 @xyflow/react 的节点格式
 *
 * @param {Array} tables - 数据库表数组
 * @returns {Array} ReactFlow 节点数组
 *
 * 每个表变成一个节点，包含：
 * - id: 表 ID
 * - type: 'tableNode'（使用 TableNode 组件渲染）
 * - position: 画布上的坐标
 * - data: 传递给 TableNode 的数据（表名、颜色、字段列表）
 */
const tablesToNodes = (tables) =>
  tables.map((table) => {
    // 计算哪些字段有索引（用于在节点中显示索引图标）
    const indexedFieldNames = new Set(
      (table.indexes || []).flatMap((idx) => idx.fields || [idx.fieldName]).filter(Boolean)
    );

    return {
      id: table.id,
      type: 'tableNode',
      position: table.position,
      style: { width: 192 },
      data: {
        label: table.name,
        color: table.color,
        fields: (table.fields || []).map((field) => ({
          ...field,
          isIndexed: indexedFieldNames.has(field.name),
        })),
      },
    };
  });

/**
 * Workspace - 工作区主组件
 *
 * 负责：
 * 1. 管理 nodes 和 edges 状态
 * 2. 同步 SchemaContext 数据变化到画布
 * 3. 处理拖拽结束后保存位置
 * 4. 处理连线创建和边的选中/删除
 */
const Workspace = () => {
  // 从 Schema 上下文获取数据和操作方法
  const { tables, relations, loading, addRelation, deleteRelation } = useSchema();

  // useNodesState：@xyflow/react 的节点状态 Hook，返回 [nodes, setNodes, onNodesChange]
  const [nodes, setNodes, onNodesChange] = useNodesState(() => tablesToNodes(tables));

  // 将 relations（关联关系）转换为 @xyflow/react 的 edges 格式
  const relationEdges = useMemo(
    () =>
      relations.map((r) => ({
        id: r.id,
        source: r.sourceTableId,                    // 源节点 ID
        sourceHandle: `${r.sourceFieldId}-right`,   // 源 Handle ID（右侧出发）
        target: r.targetTableId,                    // 目标节点 ID
        targetHandle: `${r.targetFieldId}-left`,    // 目标 Handle ID（左侧接收）
        type: 'custom',                             // 使用自定义边组件
        data: { cardinality: r.cardinality },       // 传递基数信息
      })),
    [relations]
  );

  // useEdgesState：@xyflow/react 的边状态 Hook
  const [edges, setEdges, onEdgesChange] = useEdgesState(relationEdges);
  // 当前选中的边（用于高亮和删除）
  const [selectedEdge, setSelectedEdge] = useState(null);

  // 当 relations 数据变化时（如新增/删除关联），同步更新画布上的 edges
  useEffect(() => {
    setEdges(
      relations.map((r) => ({
        id: r.id,
        source: r.sourceTableId,
        sourceHandle: `${r.sourceFieldId}-right`,
        target: r.targetTableId,
        targetHandle: `${r.targetFieldId}-left`,
        type: 'custom',
        data: { cardinality: r.cardinality },
      }))
    );
  }, [relations, setEdges]);

  // 当 tables 数据变化时（如新增表、修改字段），同步更新画布上的 nodes
  useEffect(() => {
    setNodes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));

      // 为新增的表创建对应的节点
      const newNodes = tables
        .filter((t) => !existingIds.has(t.id))
        .map((table) => {
          const indexedFieldNames = new Set(
            (table.indexes || []).flatMap((idx) => idx.fields || [idx.fieldName]).filter(Boolean)
          );
          return {
            id: table.id,
            type: 'tableNode',
            position: table.position,
            style: { width: 192 },
            data: {
              label: table.name,
              color: table.color,
              fields: (table.fields || []).map((field) => ({
                ...field,
                isIndexed: indexedFieldNames.has(field.name),
              })),
            },
          };
        });

      // 更新已有节点的 data（如表名变更、字段变更等）
      const updatedNodes = prev.map((node) => {
        const table = tables.find((t) => t.id === node.id);
        if (!table) return node;
        const indexedFieldNames = new Set(
          (table.indexes || []).flatMap((idx) => idx.fields || [idx.fieldName]).filter(Boolean)
        );
        return {
          ...node,
          data: {
            label: table.name,
            color: table.color,
            fields: (table.fields || []).map((field) => ({
              ...field,
              isIndexed: indexedFieldNames.has(field.name),
            })),
          },
        };
      });

      return [...updatedNodes, ...newNodes];
    });
  }, [tables, setNodes]);

  /**
   * handleNodesChange - 处理节点变化事件
   *
   * ReactFlow 会在节点移动、选中等操作时触发此回调。
   * 特别处理：当拖拽结束（dragging === false）时，将新位置保存到后端。
   */
  const handleNodesChange = useCallback(
    (changes) => {
      // 先让 ReactFlow 应用变化（更新节点位置等）
      onNodesChange(changes);

      // 遍历所有变化，检测拖拽结束事件
      changes.forEach(async (change) => {
        // change.dragging === false 表示拖拽刚刚结束（松开鼠标）
        if (change.type === 'position' && change.position && change.dragging === false) {
          const { id, position } = change;

          // 使用标记防止重复保存（快速拖拽可能产生多个事件）
          if (savingPositionRef[id]) return;
          savingPositionRef[id] = true;

          try {
            // PUT /api/table - 保存节点新位置到后端
            await put(TABLE_API.BASE, {
              id,
              positionX: position.x,
              positionY: position.y,
            });
            toast.success('保存成功');
          } catch (error) {
            toast.error('保存失败: ' + error.message);
          } finally {
            savingPositionRef[id] = false;
          }
        }
      });
    },
    [onNodesChange]
  );

  /**
   * onConnect - 当用户完成拖拽连线时触发
   *
   * connection 包含 source、sourceHandle、target、targetHandle 信息，
   * 调用 addRelation 在后端创建关联关系。
   */
  const onConnect = useCallback(
    async (connection) => {
      try {
        await addRelation(connection);
      } catch {
        // addRelation 内部已 toast 错误提示
      }
    },
    [addRelation]
  );

  // 点击边时设为选中状态
  const onEdgeClick = useCallback((_, edge) => setSelectedEdge(edge), []);

  // 点击画布空白区域时取消选中
  const onPaneClick = useCallback(() => setSelectedEdge(null), []);

  // 键盘事件：按 Backspace 删除选中的边
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Backspace' && selectedEdge) {
        deleteRelation(selectedEdge.id);
        setSelectedEdge(null);
      }
    },
    [selectedEdge, deleteRelation]
  );

  return (
    // 通过 WorkspaceContext 向子组件（TableNode 等）共享 selectedEdge 状态
    <WorkspaceContext.Provider value={{ selectedEdge }}>
      <div
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onKeyDown={onKeyDown}
        tabIndex={0} // 让 div 可以接收键盘事件
      >
        {loading ? (
          // 数据加载中显示 Loading 动画
          <div className="flex h-full items-center justify-center">
            <Loader size="sm" color="blue" />
          </div>
        ) : (
          // ReactFlow 主画布
          <ReactFlow
            nodeTypes={nodeTypes}             // 注册自定义节点类型
            edgeTypes={edgeTypes}             // 注册自定义边类型
            nodes={nodes}                     // 节点数据
            edges={edges}                     // 边数据
            onNodesChange={handleNodesChange} // 节点变化回调
            onEdgesChange={onEdgesChange}     // 边变化回调
            onConnect={onConnect}             // 连线完成回调
            onEdgeClick={onEdgeClick}         // 点击边回调
            onPaneClick={onPaneClick}         // 点击空白区域回调
            defaultEdgeOptions={{ type: 'custom' }}  // 新建边默认使用自定义类型
            connectionLineComponent={ConnectionLine} // 拖拽中的临时连线组件
            proOptions={{ hideAttribution: true }}    // 隐藏 ReactFlow 水印
            fitView                           // 初始化时自动缩放到合适视图
            fitViewOptions={FIT_VIEW_OPTIONS}  // 缩放配置
          >
            {/* Background：画布背景网格 */}
            <Background />
            {/* Controls：左下角的缩放/居中控制按钮 */}
            <Controls />
          </ReactFlow>
        )}
      </div>
    </WorkspaceContext.Provider>
  );
};

// 使用 memo 包裹，避免父组件重渲染时不必要地重新渲染整个画布
export default memo(Workspace);

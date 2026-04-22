/**
 * SchemaContext.js - Schema 上下文（状态管理）
 *
 * 【文件用途】
 * 为整个应用提供数据库 Schema 的全局状态管理。包括表、字段、索引、关联关系
 * 的 CRUD 操作，以及与服务端的同步。
 *
 * 【在项目中的角色】
 * 这是整个项目的核心状态管理层。SchemaProvider 包裹应用后，所有子组件都可以
 * 通过 useSchema() 访问和操作 Schema 数据。它连接了 UI 层（编辑面板）和
 * 可视化层（画布组件），是数据流动的枢纽。
 *
 * 【关键概念】
 *
 * 1. 状态管理架构：
 *    - 使用 React Context + useState 作为全局状态容器
 *    - 使用 ref（tablesRef）追踪最新状态，避免闭包问题
 *    - 乐观更新：先更新本地 UI，再异步同步到后端
 *
 * 2. 防抖策略（Debounce）：
 *    - 字段名/表名输入：延迟 1.5 秒保存，避免频繁请求
 *    - 开关/选择操作：立即保存（immediate: true）
 *
 * 3. 临时 ID 机制：
 *    - 新增字段/索引时，先在本地生成 temp-id 用于 UI 显示
 *    - 后端创建成功后，用真实 ID 替换临时 ID
 *    - 如果后端创建失败，回滚本地状态
 *
 * 4. 序列化/反序列化：
 *    - serializeTable：将前端表对象转换为 API 请求格式（position -> positionX/Y）
 *    - deserializeTable：将 API 响应转换为前端表对象
 *
 * 【对外暴露的操作方法】
 * - addTable / updateTable / reorderTables
 * - addField / updateField / deleteField / reorderFields
 * - addIndex / updateIndex / deleteIndex / reorderIndexes
 * - addRelation / updateRelation / deleteRelation
 */

'use client';

import { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { post, get, put, del } from '@/lib/request';
import { TABLE_API, FIELD_API, INDEX_API, RELATION_API } from '@/lib/api';

// 创建 Schema 上下文，初始值为 null
const SchemaContext = createContext(null);

// 防抖保存延迟（毫秒）
const DEBOUNCE_DELAY = 1500;

/**
 * serializeTable - 序列化表对象为 API 格式
 *
 * 将前端的表对象（position 是 {x, y} 对象）转换为后端期望的格式
 * （positionX 和 positionY 分开传递）。
 */
const serializeTable = (table) => ({
  id: table.id,
  name: table.name,
  color: table.color,
  remark: table.remark,
  positionX: table.position.x,
  positionY: table.position.y,
});

/**
 * deserializeTable - 反序列化 API 响应为前端表对象
 *
 * 将后端返回的数据（positionX/Y 分开）转换为前端的表对象
 * （position 是 {x, y} 对象）。
 */
const deserializeTable = (data) => ({
  id: data.id,
  name: data.name,
  color: data.color,
  remark: data.remark,
  position: { x: data.positionX, y: data.positionY },
  fields: data.fields || [],
  indexes: data.indexes || [],
});

/**
 * SchemaProvider - Schema 上下文提供者组件
 *
 * @param {ReactNode} children - 子组件
 * @param {string} schemaId    - 当前操作的 Schema ID
 *
 * 这是整个状态管理的核心。负责：
 * 1. 维护 tables（表）、relations（关联）状态
 * 2. 加载初始数据（从后端 API）
 * 3. 提供所有 CRUD 操作方法
 * 4. 处理防抖、乐观更新、错误回滚等
 */
export const SchemaProvider = ({ children, schemaId }) => {
  // --- 全局状态 ---
  const [tables, setTables] = useState([]);          // 表列表
  const [relations, setRelations] = useState([]);    // 关联关系列表
  const [loading, setLoading] = useState(true);      // 加载状态

  // --- 防抖定时器引用（每个实体一个定时器，避免冲突） ---
  const tableTimersRef = useRef({});   // 表属性防抖定时器
  const fieldTimersRef = useRef({});   // 字段更新防抖定时器
  const indexTimersRef = useRef({});   // 索引更新防抖定时器
  const tablesRef = useRef([]);        // 追踪最新的 tables 状态（解决闭包问题）

  // 同步 tables 到 ref，确保回调函数中总能获取最新状态
  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);

  // ─── 数据加载 ────────────────────────────────────────────────────────────────

  // 组件挂载时，从后端加载表和关联数据
  useEffect(() => {
    if (!schemaId) return;

    const fetchTables = async () => {
      try {
        // GET /api/table?schemaId=xxx
        const data = await get(TABLE_API.BASE, { schemaId });
        setTables((data.data || []).map(deserializeTable));
      } catch (error) {
        console.error('加载表数据失败:', error);
      }
    };

    const fetchRelations = async () => {
      try {
        // GET /api/relation?schemaId=xxx
        const data = await get(RELATION_API.BASE, { schemaId });
        setRelations(data.data || []);
      } catch (error) {
        console.error('加载关联数据失败:', error);
      }
    };

    // 并发加载两个接口，完成后设置 loading = false
    Promise.all([fetchTables(), fetchRelations()]).finally(() => setLoading(false));
  }, [schemaId]);

  // ─── 生成临时 ID（保存后会被后端 CUID 替换） ─────────────────────────────────

  // 生成格式为 "temp-时间戳-随机字符串" 的临时 ID
  // 用途：新增字段/索引时，在等待后端响应前用于 UI 展示
  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Table 操作 ──────────────────────────────────────────────────────────────

  /**
   * addTable - 创建新表
   *
   * @param {string} name     - 表名（可选，默认"未命名表"）
   * @param {object} position - 画布上的初始位置
   * @returns {string} 新表 ID
   *
   * 流程：POST 创建表 → 拿到后端返回的完整数据 → 添加到本地列表
   */
  const addTable = useCallback(
    async (name, position = { x: 100, y: 100 }) => {
      try {
        // POST /api/table
        const res = await post(TABLE_API.BASE, {
          schemaId,
          name: name || '未命名表',
          color: '#2b80ff',
          positionX: position.x,
          positionY: position.y,
        });

        const tableWithId = deserializeTable(res.data);
        setTables((prev) => [...prev, tableWithId]);
        return res.data.id;
      } catch (error) {
        console.error('创建表失败:', error);
        throw error;
      }
    },
    [schemaId]
  );

  /**
   * reorderTables - 重新排序表列表（拖拽排序后调用）
   *
   * @param {Array} newTables - 排序后的表列表
   *
   * 流程：本地立即更新 → 异步发送排序后的表 ID 列表到后端
   */
  const reorderTables = useCallback(
    (newTables) => {
      setTables(newTables);

      // POST /api/table/reorder
      const tableIds = newTables.map((t) => t.id);
      post(TABLE_API.REORDER, { schemaId, tableIds });
    },
    [schemaId]
  );

  /**
   * updateTable - 更新表属性（名称、颜色等）
   *
   * @param {string} tableId   - 表 ID
   * @param {object} changes   - 要更新的字段（如 { name: '新表名' }）
   * @param {object} options   - 选项，immediate=true 时立即保存，否则防抖
   *
   * 策略：
   * 1. 先同步更新本地 UI（用户立即看到变化）
   * 2. 根据 options.immediate 决定是否防抖：
   *    - immediate=true：立即发送 PUT 请求（用于颜色、位置等）
   *    - immediate=false：延迟 1.5 秒发送（用于表名输入）
   */
  const updateTable = useCallback((tableId, changes, { immediate = false } = {}) => {
    // 清除已有的防抖定时器
    if (tableTimersRef.current[tableId]) {
      clearTimeout(tableTimersRef.current[tableId]);
      delete tableTimersRef.current[tableId];
    }

    // 同步更新本地状态（UI 立即响应）
    const newTables = tablesRef.current.map((t) => (t.id === tableId ? { ...t, ...changes } : t));
    tablesRef.current = newTables;
    setTables(newTables);

    // 实际保存到后端的函数
    const doSave = () => {
      const latest = tablesRef.current.find((t) => t.id === tableId);
      if (!latest) return;
      // PUT /api/table
      put(TABLE_API.BASE, serializeTable(latest));
    };

    if (immediate) {
      doSave();
    } else {
      tableTimersRef.current[tableId] = setTimeout(() => {
        doSave();
        delete tableTimersRef.current[tableId];
      }, DEBOUNCE_DELAY);
    }
  }, []);

  // ─── Field 操作 ──────────────────────────────────────────────────────────────

  /**
   * addField - 为指定表新增字段
   *
   * @param {string} tableId - 表 ID
   *
   * 【乐观更新流程】
   * 1. 生成本地临时 ID
   * 2. 立即将新字段添加到本地状态（UI 立即显示）
   * 3. 异步 POST 到后端创建
   * 4. 成功：用后端返回的真实 ID 替换临时 ID
   * 5. 失败：从本地列表中移除临时字段（回滚）
   */
  const addField = useCallback((tableId) => {
    const tempId = generateTempId();
    const newField = {
      id: tempId,
      name: '',
      type: 'text',
      isPrimary: false,
      isNullable: true,
    };

    // 先乐观更新本地状态
    const newTables = tablesRef.current.map((t) =>
      t.id === tableId ? { ...t, fields: [...t.fields, newField] } : t
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // POST /api/field
    post(FIELD_API.BASE, { tableId, name: '', type: 'text', isPrimary: false, isNullable: true })
      .then((res) => {
        // 用后端返回的真实 ID 替换临时 ID
        const realField = res.data;
        const updated = tablesRef.current.map((t) => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            fields: t.fields.map((f) => (f.id === tempId ? { ...f, ...realField } : f)),
          };
        });
        tablesRef.current = updated;
        setTables(updated);
      })
      .catch(() => {
        // 创建失败：回滚本地状态
        const rolled = tablesRef.current.map((t) =>
          t.id !== tableId ? t : { ...t, fields: t.fields.filter((f) => f.id !== tempId) }
        );
        tablesRef.current = rolled;
        setTables(rolled);
      });
  }, []);

  /**
   * reorderFields - 重新排序字段列表
   *
   * 过滤掉临时 ID（未保存的字段），只将已保存的字段 ID 发送到后端。
   */
  const reorderFields = useCallback((tableId, newFields) => {
    // 本地立即更新
    const newTables = tablesRef.current.map((t) =>
      t.id === tableId ? { ...t, fields: newFields } : t
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // POST /api/field/reorder（只发送已保存的字段 ID）
    const fieldIds = newFields.map((f) => f.id).filter((id) => !id.startsWith('temp-'));
    if (fieldIds.length > 0) {
      post(FIELD_API.REORDER, { tableId, fieldIds });
    }
  }, []);

  /**
   * updateField - 更新字段属性
   *
   * 与 updateTable 策略相同：本地立即更新，根据 options.immediate 决定是否防抖保存。
   * 临时 ID 的字段跳过保存（等 addField 的 Promise 完成后再处理）。
   */
  const updateField = useCallback((tableId, fieldId, changes, { immediate = false } = {}) => {
    const timerKey = `${tableId}-${fieldId}`;

    // 清除已有的防抖定时器
    if (fieldTimersRef.current[timerKey]) {
      clearTimeout(fieldTimersRef.current[timerKey]);
      delete fieldTimersRef.current[timerKey];
    }

    // 同步更新本地状态
    const newTables = tablesRef.current.map((t) =>
      t.id !== tableId
        ? t
        : { ...t, fields: t.fields.map((f) => (f.id === fieldId ? { ...f, ...changes } : f)) }
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // 跳过临时字段（还没有后端 ID，不需要保存）
    if (String(fieldId).startsWith('temp-')) return;

    const doSave = () => {
      // PUT /api/field
      put(FIELD_API.BASE, { id: fieldId, ...changes });
    };

    if (immediate) {
      doSave();
    } else {
      fieldTimersRef.current[timerKey] = setTimeout(() => {
        doSave();
        delete fieldTimersRef.current[timerKey];
      }, DEBOUNCE_DELAY);
    }
  }, []);

  /**
   * deleteField - 删除字段
   *
   * 策略：乐观删除（本地立即移除）+ 异步通知后端删除。
   * 临时 ID 的字段不发送删除请求（因为还没保存到后端）。
   */
  const deleteField = useCallback((tableId, fieldId) => {
    // 乐观删除本地状态
    const newTables = tablesRef.current.map((t) =>
      t.id !== tableId ? t : { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // 跳过临时字段
    if (String(fieldId).startsWith('temp-')) return;

    // DELETE /api/field?id=xxx
    del(FIELD_API.BASE, { id: fieldId });
  }, []);

  // ─── Index 操作 ──────────────────────────────────────────────────────────────

  /**
   * addIndex - 为指定表新增索引
   *
   * 与 addField 策略完全相同：乐观更新 + 成功替换 ID + 失败回滚。
   */
  const addIndex = useCallback((tableId) => {
    const tempId = generateTempId();
    const newIndex = {
      id: tempId,
      name: '',
      type: 'BTREE',
      isUnique: false,
    };

    // 先乐观更新本地状态
    const newTables = tablesRef.current.map((t) =>
      t.id === tableId ? { ...t, indexes: [...t.indexes, newIndex] } : t
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // POST /api/index
    post(INDEX_API.BASE, { tableId, name: '', type: 'BTREE', isUnique: false })
      .then((res) => {
        // 用后端返回的真实 ID 替换临时 ID
        const realIndex = res.data;
        const updated = tablesRef.current.map((t) => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            indexes: t.indexes.map((i) => (i.id === tempId ? { ...i, ...realIndex } : i)),
          };
        });
        tablesRef.current = updated;
        setTables(updated);
      })
      .catch(() => {
        // 创建失败：回滚本地状态
        const rolled = tablesRef.current.map((t) =>
          t.id !== tableId ? t : { ...t, indexes: t.indexes.filter((i) => i.id !== tempId) }
        );
        tablesRef.current = rolled;
        setTables(rolled);
      });
  }, []);

  /**
   * reorderIndexes - 重新排序索引列表
   */
  const reorderIndexes = useCallback((tableId, newIndexes) => {
    // 本地立即更新
    const newTables = tablesRef.current.map((t) =>
      t.id === tableId ? { ...t, indexes: newIndexes } : t
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // POST /api/index/reorder
    const indexIds = newIndexes.map((i) => i.id).filter((id) => !id.startsWith('temp-'));
    if (indexIds.length > 0) {
      post(INDEX_API.REORDER, { tableId, indexIds });
    }
  }, []);

  /**
   * updateIndex - 更新索引属性
   *
   * 与 updateField 策略相同：本地立即更新 + 可选防抖保存。
   */
  const updateIndex = useCallback((tableId, indexId, changes, { immediate = false } = {}) => {
    const timerKey = `${tableId}-${indexId}`;

    // 清除已有的防抖定时器
    if (indexTimersRef.current[timerKey]) {
      clearTimeout(indexTimersRef.current[timerKey]);
      delete indexTimersRef.current[timerKey];
    }

    // 同步更新本地状态
    const newTables = tablesRef.current.map((t) =>
      t.id !== tableId
        ? t
        : { ...t, indexes: t.indexes.map((i) => (i.id === indexId ? { ...i, ...changes } : i)) }
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // 跳过临时索引
    if (String(indexId).startsWith('temp-')) return;

    const doSave = () => {
      // PUT /api/index
      put(INDEX_API.BASE, { id: indexId, ...changes });
    };

    if (immediate) {
      doSave();
    } else {
      indexTimersRef.current[timerKey] = setTimeout(() => {
        doSave();
        delete indexTimersRef.current[timerKey];
      }, DEBOUNCE_DELAY);
    }
  }, []);

  /**
   * deleteIndex - 删除索引
   */
  const deleteIndex = useCallback((tableId, indexId) => {
    // 乐观删除本地状态
    const newTables = tablesRef.current.map((t) =>
      t.id !== tableId ? t : { ...t, indexes: t.indexes.filter((i) => i.id !== indexId) }
    );
    tablesRef.current = newTables;
    setTables(newTables);

    // 跳过临时索引
    if (String(indexId).startsWith('temp-')) return;

    // DELETE /api/index?id=xxx
    del(INDEX_API.BASE, { id: indexId });
  }, []);

  // ─── Relation 操作 ────────────────────────────────────────────────────────────

  /**
   * addRelation - 从 ReactFlow connection 创建表间关联
   *
   * @param {object} connection - ReactFlow 的连接对象
   *   - source: 源表 ID
   *   - sourceHandle: 源 Handle ID（格式：{fieldId}-left 或 {fieldId}-right）
   *   - target: 目标表 ID
   *   - targetHandle: 目标 Handle ID
   *
   * Handle ID 处理：通过正则去掉 -left/-right 后缀，提取纯字段 ID。
   * 关联名称自动生成为 "{表名}_{字段名}_fk"（fk = foreign key）。
   */
  const addRelation = useCallback(
    async (connection) => {
      // Handle ID 格式: {fieldId}-left / {fieldId}-right
      const sourceFieldId = connection.sourceHandle?.replace(/-(?:left|right)$/, '');
      const targetFieldId = connection.targetHandle?.replace(/-(?:left|right)$/, '');

      // 查找源表和字段名称，生成关联名称
      const sourceTable = tablesRef.current.find((t) => t.id === connection.source);
      const sourceField = sourceTable?.fields.find((f) => f.id === sourceFieldId);
      const name = `${sourceTable?.name || 'table'}_${sourceField?.name || 'field'}_fk`;

      try {
        const res = await post(RELATION_API.BASE, {
          schemaId,
          name,
          cardinality: 'ONE_TO_MANY',     // 默认一对多
          sourceTableId: connection.source,
          sourceFieldId,
          targetTableId: connection.target,
          targetFieldId,
        });
        setRelations((prev) => [...prev, res.data]);
        return res.data;
      } catch (error) {
        throw error;
      }
    },
    [schemaId]
  );

  /**
   * updateRelation - 更新关联属性（如 cardinality / name）
   *
   * 策略：乐观更新 + 异步保存。
   */
  const updateRelation = useCallback(async (id, changes) => {
    // 先乐观更新本地状态
    setRelations((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
    try {
      await put(RELATION_API.BASE, { id, ...changes });
    } catch (error) {}
  }, []);

  /**
   * deleteRelation - 删除关联
   *
   * 策略：乐观删除 + 异步通知后端。
   */
  const deleteRelation = useCallback(async (id) => {
    setRelations((prev) => prev.filter((r) => r.id !== id));
    try {
      await del(RELATION_API.BASE, { id });
    } catch (error) {}
  }, []);

  // ─── 暴露给所有子组件的方法 ─────────────────────────────────────────────────────

  return (
    <SchemaContext.Provider
      value={{
        // 状态数据
        tables,        // 表列表
        loading,       // 加载状态
        relations,     // 关联列表

        // Table 操作
        addTable,
        reorderTables,
        updateTable,

        // Field 操作
        addField,
        reorderFields,
        updateField,
        deleteField,

        // Index 操作
        addIndex,
        reorderIndexes,
        updateIndex,
        deleteIndex,

        // Relation 操作
        addRelation,
        updateRelation,
        deleteRelation,
      }}
    >
      {children}
    </SchemaContext.Provider>
  );
};

/**
 * useSchema - 自定义 Hook，用于消费 Schema 上下文
 *
 * 使用示例：
 * const { tables, relations, addTable, updateField } = useSchema();
 */
export const useSchema = () => useContext(SchemaContext);

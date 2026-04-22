/**
 * SchemaSelectModal.jsx - Schema 选择弹窗组件
 *
 * 用途：在用户进入应用时弹出，展示所有已有的 Schema（工作空间）列表，
 *       用户可以选择一个已有的 Schema 打开，或者新建一个 Schema。
 * 在项目中的角色：作为应用的入口选择器，类似于 IDE 的"打开项目"对话框。
 *
 * 技术要点：
 * - 使用 Mantine Modal 组件作为弹窗容器
 * - 使用 mantine-datatable 第三方库渲染数据表格（支持行点击选中、自定义渲染等）
 * - 通过 API 请求获取 Schema 列表和创建新 Schema
 * - 状态管理：选中 ID、创建表单显示/隐藏、加载状态等
 */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Modal, Button, TextInput, Group, Stack, Text, Box } from '@mantine/core';
import { Grid2x2Plus, ArrowRight } from 'lucide-react';
import { DataTable } from 'mantine-datatable';
import { get, post } from '@/lib/request';
import { SCHEMA_API } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import 'mantine-datatable/styles.css';

/**
 * Schema 选择弹窗组件
 * @param {boolean} opened - 控制弹窗是否打开（由父组件控制）
 * @param {function} onClose - 关闭弹窗时的回调
 * @param {function} onSelect - 用户选择并确认 Schema 后的回调，参数为选中的 Schema ID
 */
export function SchemaSelectModal({ opened, onClose, onSelect }) {
  // schemas: 从后端加载的 Schema 列表数据
  const [schemas, setSchemas] = useState([]);
  // selectedId: 当前用户选中的 Schema ID（点击行选中）
  const [selectedId, setSelectedId] = useState(null);
  // showCreateForm: 是否显示新建 Schema 的输入表单
  const [showCreateForm, setShowCreateForm] = useState(false);
  // newSchemaName: 新建 Schema 时用户输入的名称
const [newSchemaName, setNewSchemaName] = useState('');
  // creating: 创建请求是否正在进行中（用于 loading 状态）
  const [creating, setCreating] = useState(false);

  /**
   * useEffect: 当弹窗打开时，重新加载 Schema 列表并重置选中状态
   * 依赖 opened 变化触发，确保每次打开弹窗都能看到最新数据
   */
  useEffect(() => {
    if (opened) {
      fetchSchemas();
      setSelectedId(null);
      setShowCreateForm(false);
    }
  }, [opened]);

  /**
   * 从后端 API 获取 Schema 列表
   * 使用封装好的 get 请求方法，请求 SCHEMA_API.LIST 接口
   */
  const fetchSchemas = async () => {
    try {
      const data = await get(SCHEMA_API.LIST);
      setSchemas(data.data || []);
    } catch (error) {
      console.error('加载 Schema 列表失败:', error);
    }
  };

  /**
   * 创建新的 Schema
   * 1. 验证名称非空
   * 2. 发送 POST 请求创建
   * 3. 将新创建的 Schema 添加到列表头部
   * 4. 自动选中新创建的 Schema
   */
  const handleCreateSchema = async () => {
    if (!newSchemaName.trim()) return;

    setCreating(true);
    try {
      const data = await post(SCHEMA_API.LIST, {
        name: newSchemaName.trim(),
      });
      const newSchema = data.data;
      // 将新 Schema 插入到列表最前面，这样用户能立即看到
      setSchemas((prev) => [newSchema, ...prev]);
      setNewSchemaName('');
      setShowCreateForm(false);
      // 自动选中新建的 Schema，方便用户直接点"打开"
      setSelectedId(newSchema.id);
    } catch (error) {
      console.error('创建 Schema 失败:', error);
    } finally {
      // 无论成功失败都取消 loading 状态
      setCreating(false);
    }
  };

  /**
   * 确认选择：将选中的 Schema ID 传递给父组件，然后关闭弹窗
   */
  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      onClose();
    }
  };

  return (
    // Modal 是 Mantine 的弹窗组件
    // closeOnClickOutside={false} 和 closeOnEscape={false}: 禁止点击外部或按 ESC 关闭，强制用户必须选择
    // withCloseButton={false}: 不显示右上角关闭按钮
    // centered: 弹窗垂直居中显示
    <Modal
      opened={opened}
      onClose={onClose}
      title="选择工作空间"
      size="80%"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
    >
      {/* Stack 是 Mantine 的垂直堆叠布局组件，gap="md" 设置子元素间距 */}
      <Stack gap="md">
        {/* 新建 Schema 的输入表单，只在 showCreateForm 为 true 时显示 */}
        {showCreateForm && (
          <Box p="md" className="border-b border-gray-200 bg-gray-50">
            {/* Group 是 Mantine 的水平排列布局组件 */}
            <Group gap="sm">
              <TextInput
                placeholder="输入工作空间名称"
                value={newSchemaName}
                onChange={(e) => setNewSchemaName(e.target.value)}
                autoFocus
                style={{ flex: 1 }}
              />
              <Button
                variant="subtle"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSchemaName('');
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleCreateSchema}
                loading={creating} // loading 属性会显示加载动画并禁用按钮
                disabled={!newSchemaName.trim()} // 名称为空时禁用按钮
              >
                创建
              </Button>
            </Group>
          </Box>
        )}

        {/* DataTable: mantine-datatable 库提供的数据表格组件 */}
        <DataTable
          withTableBorder={false} // 不显示表格外边框
          withColumnBorders={false} // 不显示列之间的边框
          highlightOnHover // 鼠标悬停时高亮行
          idAccessor="id" // 告诉 DataTable 用 record 的哪个字段作为唯一标识
          // 点击行时切换选中状态（再次点击同一行取消选中）
          onRowClick={({ record }) =>
            setSelectedId((prev) => (prev === record.id ? null : record.id))
          }
          // 自定义行样式：选中的行显示蓝色背景
          rowStyle={(record) => ({
            cursor: 'pointer',
            backgroundColor: record.id === selectedId ? 'var(--mantine-color-blue-1)' : undefined,
          })}
          records={schemas} // 表格数据源
          columns={[
            {
              accessor: 'name', // 对应数据对象的 name 字段
              title: '名称',
              // 自定义渲染：显示 PostgreSQL 图标 + Schema 名称
              render: (record) => (
                <Group gap="sm">
                  <Image src="/postgres.png" alt="schema" width={20} height={20} />
                  <span>{record.name}</span>
                </Group>
              ),
            },
            {
              accessor: 'createdAt',
              title: '创建时间',
              render: (record) => formatDateTime(record.createdAt), // 格式化时间显示
            },
            {
              accessor: 'updatedAt',
              title: '更新时间',
              render: (record) => formatDateTime(record.updatedAt),
            },
            {
              accessor: 'tables',
              title: '表数量',
              textAlign: 'center',
              // _count 是 Prisma 的关联计数功能返回的字段
              render: (record) => record._count?.tables || 0,
            },
          ]}
          // 列表为空时显示的占位内容
          emptyState={
            <Text c="dimmed" ta="center" py="xl">
              暂无工作空间，请新建一个工作空间
            </Text>
          }
        />

        {/* 底部操作按钮区域 */}
        <Group justify="flex-end" mt="md">
          {/* 新建按钮：点击后显示创建表单 */}
          <Button
            size={'xs'}
            variant="light"
            color={'gray'}
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm} // 表单已显示时禁用此按钮
            leftSection={<Grid2x2Plus size={16} />} // 按钮左侧图标
          >
            新建
          </Button>
          {/* 打开按钮：确认选择并打开选中的 Schema */}
          <Button
            onClick={handleConfirm}
            disabled={!selectedId} // 未选中任何 Schema 时禁用
            size={'xs'}
            leftSection={<ArrowRight size={16} />}
          >
            打开
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

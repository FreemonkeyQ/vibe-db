/**
 * 文件: src/app/workspace/page.jsx
 * 用途: 工作区入口页面（路由 "/workspace"）
 *
 * 在 Next.js App Router 中，src/app/workspace/page.jsx 对应 URL "/workspace"。
 *
 * 本页面的职责：
 * - 显示一个 Schema 选择弹窗，让用户选择要编辑的数据库 Schema
 * - 用户选择后，跳转到对应的工作区详情页 /workspace/[schemaId]
 *
 * 'use client' 指令表示这是一个客户端组件（Client Component），
 * 因为它需要使用 React Hooks（useState）和浏览器端的路由导航。
 */
'use client';

// useState: React 状态钩子，用于管理弹窗的开关状态
// useEffect: React 副作用钩子（虽然这里导入了但未使用）
import { useState, useEffect } from 'react';

// useRouter: Next.js 客户端路由钩子，用于编程式导航（页面跳转）
import { useRouter } from 'next/navigation';

// SchemaSelectModal: 自定义的 Schema 选择弹窗组件
// 用于展示所有可用的 Schema 列表，让用户选择一个进行编辑
import { SchemaSelectModal } from '@/components/SchemaSelectModal';

/**
 * WorkspaceEntry - 工作区入口组件
 *
 * 这个组件本身不渲染复杂的 UI，它的核心逻辑是：
 * 1. 打开 Schema 选择弹窗
 * 2. 用户选择一个 Schema 后，跳转到该 Schema 的工作区页面
 */
export default function WorkspaceEntry() {
  // 获取 Next.js 路由实例，用于编程式页面跳转
  const router = useRouter();

  // 控制弹窗是否显示，默认为 true（页面加载时立即显示弹窗）
  const [modalOpened, setModalOpened] = useState(true);

  /**
   * 处理用户选择 Schema 的回调函数
   * @param {string} schemaId - 用户选择的 Schema ID
   *
   * 当用户在弹窗中点击某个 Schema 时，跳转到该 Schema 的工作区详情页
   */
  const handleSelectSchema = (schemaId) => {
    router.push(`/workspace/${schemaId}`);
  };

  return (
    <SchemaSelectModal
      opened={modalOpened}
      onClose={() => setModalOpened(false)}
      onSelect={handleSelectSchema}
    />
  );
}

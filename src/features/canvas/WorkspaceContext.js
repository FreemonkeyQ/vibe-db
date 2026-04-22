/**
 * WorkspaceContext.js - 工作区上下文
 *
 * 【文件用途】
 * 这个文件为画布（Canvas）模块创建了一个 React Context，用于在工作区内的各个组件之间
 * 共享状态（例如当前选中的边/连线）。
 *
 * 【在项目中的角色】
 * 属于 canvas 模块的状态管理层。通过 Context 机制，子组件（如 TableNode、CustomEdge）
 * 可以访问工作区级别的共享状态，而无需通过 props 层层传递（避免 "prop drilling"）。
 *
 * 【关键概念】
 * - React Context：React 提供的跨组件层级传递数据的机制
 * - createContext：创建一个 Context 对象，初始值为 null
 * - useContext：在子组件中消费（读取）Context 的值
 * - 自定义 Hook（useWorkspace）：封装 useContext 调用，让使用更简洁
 */

import { createContext, useContext } from 'react';

// 创建工作区 Context，初始值为 null（在 Provider 包裹前使用会得到 null）
export const WorkspaceContext = createContext(null);

// 自定义 Hook：方便子组件获取工作区上下文数据
// 使用时只需 const { selectedEdge } = useWorkspace() 即可
export const useWorkspace = () => useContext(WorkspaceContext);

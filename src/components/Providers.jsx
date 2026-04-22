/**
 * Providers.jsx - 全局 Provider 包裹组件
 *
 * 用途：将所有全局性的 Context Provider 集中在一个组件中，包裹整个应用。
 * 在项目中的角色：在 Next.js 的根布局（layout）中使用，为所有页面提供：
 *   1. Mantine UI 的主题配置和样式系统
 *   2. Sonner 的 Toast 通知功能
 *
 * 技术要点：
 * - 'use client' 标记：因为 Provider 组件通常需要在客户端运行（涉及 Context、状态管理等）
 * - 集中管理所有 Provider 避免在 layout.jsx 中出现多层嵌套（"Provider 地狱"）
 * - Mantine 的主题自定义通过 createTheme 实现
 */
'use client';

// MantineProvider: Mantine UI 库的根 Provider，提供主题、样式等
// createTheme: 创建自定义主题配置的工具函数
import { MantineProvider, createTheme } from '@mantine/core';
// Toaster: sonner 库的 Toast 通知容器组件，负责渲染所有 toast 通知
import { Toaster } from 'sonner';
// 引入 Mantine 的全局基础样式（必须引入，否则 Mantine 组件无法正常显示）
import '@mantine/core/styles.css';

/**
 * 自定义 Mantine 主题配置
 * createTheme 可以覆盖 Mantine 组件的默认属性和样式
 */
const theme = createTheme({
  components: {
    // 自定义 ActionIcon 组件的默认属性
    ActionIcon: {
      defaultProps: {
        // 设置 overflow: visible，防止图标被裁剪
        // 某些情况下 ActionIcon 内部的元素（如 tooltip）可能溢出，需要可见
        styles: { root: { overflow: 'visible' } },
      },
    },
    // 自定义 Divider（分割线）组件的默认属性
    Divider: {
      defaultProps: {
        // 设置分割线颜色为 Tailwind 的 slate-200，与整体设计风格统一
        styles: { root: { '--divider-color': '#e2e8f0' } },
      },
    },
  },
});

/**
 * 全局 Provider 组件
 * @param {React.ReactNode} children - 被包裹的子组件（通常是整个应用的页面内容）
 */
export function Providers({ children }) {
  return (
    // MantineProvider: 注入自定义主题，所有子组件中的 Mantine 组件都会使用这个主题
    <MantineProvider theme={theme}>
      {/* Toaster: sonner 的通知容器，配置全局 Toast 的位置和样式 */}
      <Toaster
        position="bottom-right" // Toast 出现在右下角
        duration={2000} // 默认显示 2 秒后自动消失
        richColors // 启用丰富颜色模式（success 绿色、error 红色等）
        toastOptions={{
          // 全局 Toast 样式：毛玻璃效果（glassmorphism 设计风格）
          style: {
            background: 'rgba(255, 255, 255, 0.72)', // 半透明白色背景
            backdropFilter: 'blur(20px) saturate(180%)', // 背景模糊 + 饱和度增强
            WebkitBackdropFilter: 'blur(20px) saturate(180%)', // Safari 兼容
            borderRadius: '12px', // 圆角
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', // 柔和阴影
            border: '1px solid rgba(255, 255, 255, 0.5)', // 半透明边框
          },
          // 不同类型 Toast 的背景渐变色（使用 Tailwind 的 ! 前缀强制覆盖默认样式）
          classNames: {
            success: '!bg-gradient-to-br !from-green-50 !via-white !to-white', // 成功：绿色渐变
            warning: '!bg-gradient-to-br !from-amber-50 !via-white !to-white', // 警告：琥珀色渐变
            error: '!bg-gradient-to-br !from-red-50 !via-white !to-white', // 错误：红色渐变
          },
        }}
      />
      {/* 渲染子组件（即整个应用的页面内容） */}
      {children}
    </MantineProvider>
  );
}

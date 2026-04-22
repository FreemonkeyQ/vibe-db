/**
 * 文件: src/app/layout.jsx
 * 用途: 应用的根布局组件（Root Layout）
 *
 * 在 Next.js App Router 中，layout.jsx 定义了页面的共享布局结构。
 * 根目录下的 layout.jsx 是必需的，它包裹整个应用的所有页面。
 * 每次页面导航时，layout 不会重新渲染，只有 children（页面内容）会变化。
 *
 * 根布局必须包含 <html> 和 <body> 标签，因为 Next.js 不会自动生成它们。
 *
 * 本文件的职责：
 * 1. 定义 HTML 文档结构（html + body）
 * 2. 导入全局样式（globals.css 和 mantine-datatable 样式）
 * 3. 包裹全局 Provider（如 Mantine UI 库的 Provider）
 * 4. 导出页面元数据（title、description，用于 SEO）
 */

// Providers 组件封装了应用所需的各种 Context Provider（如 Mantine、主题等）
// 将所有 Provider 抽取到单独组件中是为了保持 layout 文件简洁
import { Providers } from '@/components/Providers';

// 导入 mantine-datatable 的样式，这是一个数据表格组件库的 CSS
import 'mantine-datatable/styles.css';

// 导入全局 CSS 样式文件（包含 Tailwind CSS 和自定义全局样式）
import './globals.css';

/**
 * metadata 对象 - 页面元数据配置
 * Next.js 会自动读取这个导出，生成 <head> 中的 <title> 和 <meta> 标签。
 * 这是 Next.js App Router 的元数据 API，替代了传统的 <Head> 组件。
 */
export const metadata = {
  title: 'Vibe DB',
  description: 'A database management tool for developers',
};

/**
 * RootLayout - 根布局组件
 * @param {object} props
 * @param {React.ReactNode} props.children - 当前路由对应的页面内容
 *
 * 这是一个服务端组件，负责渲染整个 HTML 文档的外壳。
 * children 会根据当前 URL 自动填充为对应的 page.jsx 内容。
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Providers 包裹 children，确保所有页面都能访问到全局状态和 UI 库功能 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

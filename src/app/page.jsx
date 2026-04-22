/**
 * 文件: src/app/page.jsx
 * 用途: 应用首页（根路由 "/" 对应的页面）
 *
 * 在 Next.js App Router 中，page.jsx 是路由的页面组件。
 * 放在 src/app/ 目录下的 page.jsx 对应网站根路径 "/"。
 *
 * 本页面的作用很简单：当用户访问首页时，自动重定向到工作区列表页 /workspace。
 * 这是一个常见的模式——首页本身没有内容，只是一个入口跳转。
 */

// redirect 是 Next.js 提供的服务端重定向函数
// 它会在服务端直接返回 HTTP 重定向响应（307），浏览器会自动跳转到目标 URL
import { redirect } from 'next/navigation';

/**
 * Home 组件 - 首页
 * 这是一个服务端组件（Server Component），因为没有 'use client' 指令。
 * 服务端组件可以直接调用 redirect() 实现重定向，无需客户端 JavaScript。
 */
export default function Home() {
  // 调用 redirect 会立即中断渲染并返回重定向响应
  // 用户永远不会看到这个页面的内容，会直接被带到 /workspace
  redirect('/workspace');
}

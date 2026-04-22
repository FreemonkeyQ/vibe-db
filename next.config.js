/**
 * ========================================================================
 * next.config.js — Next.js 项目配置文件
 * ========================================================================
 *
 * 【文件用途】
 * 这是 Next.js 框架的核心配置文件。Next.js 在启动时会自动读取项目根目录下的
 * next.config.js，用来自定义框架的各种行为，比如开启严格模式、配置构建选项、
 * 声明服务端外部依赖包等。
 *
 * 【在项目中的角色】
 * vibe-db 项目基于 Next.js 16 构建，这个文件控制了 Next.js 的运行时行为。
 * 目前主要做了两件事：开启 React 严格模式 和 声明 Prisma 为服务端外部包。
 * ========================================================================
 */

const nextConfig = {
  /**
   * reactStrictMode（React 严格模式）
   *
   * 设置为 true 后，React 会在开发环境下启用额外的检查和警告：
   * - 组件会被渲染两次，帮助你发现副作用（side effect）相关的 bug
   * - 检测过时的 API 使用（如旧版生命周期方法）
   * - 帮助你编写更健壮的 React 代码
   *
   * 注意：严格模式只在开发环境生效，不会影响生产环境的性能。
   */
  reactStrictMode: true,

  /**
   * serverExternalPackages（服务端外部包）
   *
   * 这个配置告诉 Next.js：在服务端打包时，不要把这些包打包进 bundle，
   * 而是保持它们作为外部依赖（类似 Node.js 的 require）。
   *
   * 为什么 @prisma/client 需要放在这里？
   * - Prisma Client 包含原生二进制文件（query engine），无法被 Webpack/Turbopack 正确打包
   * - 如果打包进去会导致运行时错误或体积过大
   * - 将其声明为外部包，让 Node.js 在运行时直接从 node_modules 加载
   */
  serverExternalPackages: ['@prisma/client'],
};

// 使用 CommonJS 导出（module.exports），因为 next.config.js 默认使用 CommonJS 模块系统
module.exports = nextConfig;

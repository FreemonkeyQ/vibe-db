/**
 * ========================================================================
 * postcss.config.js — PostCSS 配置文件
 * ========================================================================
 *
 * 【文件用途】
 * PostCSS 是一个用 JavaScript 插件来转换 CSS 的工具。
 * 这个配置文件告诉 PostCSS 在处理 CSS 时需要使用哪些插件。
 * Next.js 会自动检测并使用这个配置文件。
 *
 * 【在项目中的角色】
 * vibe-db 项目同时使用了 Tailwind CSS 和 Mantine UI 两套样式方案：
 * - Tailwind CSS：实用优先的 CSS 框架，通过 class 名来写样式
 * - Mantine：功能丰富的 React 组件库，自带一套样式系统
 * 这个文件配置了让两者协同工作所需的 PostCSS 插件。
 * ========================================================================
 */
module.exports = {
  plugins: {
    /**
     * @tailwindcss/postcss — Tailwind CSS 的 PostCSS 插件
     *
     * 这个插件负责：
     * - 扫描项目代码中使用的 Tailwind class（如 "flex", "bg-blue-500"）
     * - 将这些 class 编译成实际的 CSS 样式
     * - 在生产环境自动移除未使用的样式（Tree Shaking），减小 CSS 体积
     *
     * 空对象 {} 表示使用默认配置。
     */
    '@tailwindcss/postcss': {},

    /**
     * postcss-preset-mantine — Mantine UI 的 PostCSS 预设插件
     *
     * 这个插件为 Mantine 组件库提供必要的 CSS 转换支持，包括：
     * - 处理 Mantine 特有的 CSS 函数（如 light-dark() 用于明暗主题切换）
     * - 处理 rem/em 单位转换
     * - 支持 Mantine 的 CSS 模块语法
     *
     * Mantine 官方文档要求必须配置此插件才能正常使用。
     */
    'postcss-preset-mantine': {},

    /**
     * postcss-simple-vars — CSS 变量插件
     *
     * 这个插件让你可以在 CSS 中使用类似 Sass 的 $变量 语法。
     * 这里定义了 Mantine 响应式断点变量，用于在 CSS 中实现响应式布局。
     *
     * 为什么要在这里定义这些断点变量？
     * - Mantine 的样式系统内部会引用这些 CSS 变量来处理响应式布局
     * - 这些值需要与 Mantine 的 JavaScript 端断点配置保持一致
     * - 如果不定义，Mantine 的响应式样式（如 hiddenFrom、visibleFrom）将无法正常工作
     *
     * 各断点对应的屏幕宽度：
     * - xs: 36em = 576px  （超小屏，如手机竖屏）
     * - sm: 48em = 768px  （小屏，如平板竖屏）
     * - md: 62em = 992px  （中屏，如平板横屏）
     * - lg: 75em = 1200px （大屏，如普通笔记本）
     * - xl: 88em = 1408px （超大屏，如桌面显示器）
     */
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};

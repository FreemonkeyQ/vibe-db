/**
 * Header.jsx - 页面头部组件
 *
 * 用途：作为应用的顶部导航栏，显示品牌名称 "VibeDB"。
 * 在项目中的角色：这是一个纯展示组件，出现在页面最顶部，提供品牌标识。
 *
 * 技术要点：
 * - 使用 Tailwind CSS 工具类来实现样式（flex 布局、固定高度、底部边框等）
 * - 这是一个无状态的函数组件（没有 props、没有 state），是最简单的 React 组件形式
 */

const Header = () => {
  return (
    // 外层容器：flex 水平布局，高度 48px（h-12），宽度撑满，底部有灰色边框，白色背景，水平内边距 16px
    <div className="flex h-12 w-full items-center border-b border-slate-200 bg-white px-4">
      {/* 品牌名称文字：无衬线字体、xl 大小、加粗 */}
      <span className="font-sans text-xl font-bold">VibeDB</span>
    </div>
  );
};

export default Header;

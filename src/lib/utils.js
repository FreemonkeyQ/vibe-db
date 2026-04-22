/**
 * 通用工具函数模块
 *
 * 【文件用途】
 * 本文件提供项目中常用的工具函数，主要是日期/时间相关的格式化功能。
 * 在项目中，这些工具函数被各个组件复用，比如展示 Schema 的创建时间、更新时间等。
 *
 * 【在项目中的角色】
 * 作为 "纯函数工具库"，不依赖任何全局状态或框架，可以在客户端和服务端通用。
 * 其他组件通过 `import { formatDateTime } from '@/lib/utils'` 来使用。
 */

/**
 * 格式化日期时间为中文本地化字符串
 *
 * @param {string|Date} date - 需要格式化的日期，可以是 Date 对象或可被 Date 构造函数解析的字符串
 * @returns {string} 格式化后的日期时间字符串，如 "2026/04/09 15:30"；如果输入为空则返回 '-'
 *
 * 【为什么这样写】
 * - 使用 toLocaleString('zh-CN', ...) 可以自动按照中文习惯格式化日期
 * - 指定 year/month/day/hour/minute 选项可以精确控制输出格式，避免显示秒数等不必要信息
 * - 先判断 !date 可以防止传入 null/undefined 时报错，提供友好的兜底显示
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化相对时间（如 "3天前"、"刚刚"）
 *
 * @param {string|Date} date - 需要格式化的日期
 * @returns {string} 相对时间字符串，如 "3天前"、"刚刚"、"2 小时前" 等
 *
 * 【为什么这样写】
 * - 相对时间比绝对时间更直观，用户一眼就能感知"多久之前"
 * - 计算逻辑从小到大判断：先看分钟 → 小时 → 天 → 周，超过4周就回退到绝对日期
 * - 使用毫秒差值除以对应的毫秒数（60000=1分钟, 3600000=1小时, 86400000=1天）来获取各级别的差值
 */
export function formatRelativeTime(date) {
  if (!date) return '-';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d; // 当前时间与目标时间的毫秒差
  const diffMins = Math.floor(diffMs / 60000); // 转换为分钟差
  const diffHours = Math.floor(diffMs / 3600000); // 转换为小时差
  const diffDays = Math.floor(diffMs / 86400000); // 转换为天数差
  const diffWeeks = Math.floor(diffDays / 7); // 转换为周数差

  // 按时间跨度从小到大判断，返回最合适的相对时间描述
  if (diffMins < 1) return '刚刚';
if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffWeeks < 4) return `${diffWeeks} 周前`;
  // 超过4周，直接显示具体日期
  return d.toLocaleDateString('zh-CN');
}

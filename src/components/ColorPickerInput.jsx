/**
 * ColorPickerInput.jsx - 颜色选择器输入组件
 *
 * 用途：提供一个点击即弹出颜色选择面板的交互组件。
 * 在项目中的角色：用于让用户为数据库表/字段选择颜色标记，比如表的颜色条。
 *
 * 技术要点：
 * - 使用 Mantine UI 的 Popover（弹出层）、ColorSwatch（颜色色块）、ColorPicker（颜色选择器）组件
 * - Popover 模式：点击色块 → 弹出颜色选择面板 → 选择颜色 → 关闭
 * - 区分 onChange（拖动时实时触发）和 onChangeEnd（松手时触发，适合保存到后端）
 */
'use client';

import { ColorPicker, ColorSwatch, Popover } from '@mantine/core';

/**
 * 颜色选择器组件
 * @param {string} value - 当前颜色值（十六进制格式，如 '#6366f1'）
 * @param {function} onChange - 颜色变化时实时触发（用于即时预览）
 * @param {function} onChangeEnd - 颜色选择完成后触发（用于保存到数据库等 API 调用）
 * @param {number} swatchSize - 触发按钮（色块）的大小，单位 px
 * @param {boolean} withArrow - Popover 弹出层是否显示指向触发元素的小箭头
 */
const ColorPickerInput = ({
  value = '#6366f1',
  onChange,
  onChangeEnd,
  swatchSize = 20,
  withArrow = true,
}) => {
  return (
    // Popover 是 Mantine 的弹出层组件，包含 Target（触发元素）和 Dropdown（弹出内容）
    // withArrow: 弹出层带小箭头指向触发元素
    // shadow="md": 中等阴影效果
    // position="bottom-start": 弹出层出现在触发元素的下方左对齐位置
    <Popover withArrow={withArrow} shadow="md" position="bottom-start">
      {/* Popover.Target 包裹触发弹出的元素，点击这个色块就会打开颜色选择器 */}
      <Popover.Target>
        {/* ColorSwatch 是 Mantine 的颜色色块展示组件，这里作为点击触发器 */}
        <ColorSwatch color={value} size={swatchSize} style={{ cursor: 'pointer', flexShrink: 0 }} />
      </Popover.Target>

      {/* Popover.Dropdown 是弹出的内容区域，p="xs" 设置小内边距 */}
      <Popover.Dropdown p="xs">
        {/* ColorPicker 是 Mantine 的完整颜色选择器，支持色相/饱和度/亮度调节 */}
        <ColorPicker
          value={value}
          onChange={onChange} // 拖动时实时回调，用于即时更新 UI 预览
          onChangeEnd={onChangeEnd} // 松手时回调，适合触发 API 请求保存颜色
          format="hex" // 颜色格式为十六进制（如 #ff0000）
          swatches={[
            // 预设的快捷颜色色板，用户可以直接点击选择这些常用颜色
            '#6366f1', // 靛蓝色
            '#3b82f6', // 蓝色
            '#06b6d4', // 青色
            '#10b981', // 绿色
            '#84cc16', // 黄绿色
            '#eab308', // 黄色
            '#f97316', // 橙色
            '#ef4444', // 红色
            '#ec4899', // 粉色
            '#8b5cf6', // 紫色
            '#64748b', // 灰色
            '#1e293b', // 深色
          ]}
        />
      </Popover.Dropdown>
    </Popover>
  );
};

export default ColorPickerInput;

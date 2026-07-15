// Tooltip gọn khi hover nút hành động (danh sách, bảng)
export default function ActionTooltip({
  text,
  position = 'bottom',
  className = '',
  onClick,
  children,
}) {
  if (!text) return children;

  return (
    <span
      className={`np-action-tip np-action-tip--${position} ${className}`.trim()}
      data-tip={text}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

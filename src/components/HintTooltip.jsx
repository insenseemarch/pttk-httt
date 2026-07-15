// Icon gợi ý nhỏ cạnh label — hover/focus mới hiện tooltip (pattern app thật)
export default function HintTooltip({ text, position = 'top', className = '' }) {
  if (!text) return null;
  return (
    <span
      className={`np-hint np-hint--${position} ${className}`.trim()}
      tabIndex={0}
      aria-label={text}
    >
      <span className="material-symbols-outlined np-hint-icon" aria-hidden="true">help</span>
      <span className="np-hint-popup" role="tooltip">{text}</span>
    </span>
  );
}

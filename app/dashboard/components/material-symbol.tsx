type Props = {
  /** Material Symbols icon name (e.g. `delete`, `menu`). */
  name: string;
  className?: string;
  /** Filled variant (Material Symbols variable font). */
  fill?: boolean;
};

export function MaterialSymbol({
  name,
  className = "",
  fill = false,
}: Props) {
  return (
    <span
      className={`material-symbols-outlined inline-block whitespace-nowrap leading-none ${className}`.trim()}
      style={{
        fontFeatureSettings: '"liga"',
        fontVariationSettings: fill
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}

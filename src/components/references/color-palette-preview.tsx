"use client";

type ColorPalettePreviewProps = {
  colors: string[];
};

export function ColorPalettePreview({ colors }: ColorPalettePreviewProps) {
  if (!colors.length) {
    return <span className="text-sm text-slate-500">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <span
          key={color}
          title={color}
          className="size-6 rounded-[6px] border border-slate-200"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

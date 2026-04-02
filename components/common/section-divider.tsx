/**
 * SectionDivider — 섹션 간 구분을 위한 장식적 구분선
 * Sora 테마의 sunset gradient 활용
 */

interface SectionDividerProps {
  variant?: "gradient" | "ornament";
  className?: string;
}

export function SectionDivider({ variant = "gradient", className = "" }: SectionDividerProps) {
  if (variant === "ornament") {
    return (
      <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    );
  }

  return (
    <div className={`py-8 ${className}`}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 via-[oklch(0.65_0.12_195)/0.2] via-[oklch(0.70_0.10_185)/0.15] to-transparent" />
    </div>
  );
}

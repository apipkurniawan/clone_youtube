import { cn } from "@/lib/utils";

export function Avatar({ name, color = "#4f46e5", className }: { name: string; color?: string; className?: string }) {
  return (
    <span
      aria-label={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", className)}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

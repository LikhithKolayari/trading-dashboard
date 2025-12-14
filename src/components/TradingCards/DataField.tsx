export type Priority = 1 | 2 | 3;

export interface DataFieldProps {
  label: string;
  value: string | number | null | undefined;
  priority?: Priority; // 1 = highest emphasis
  title?: string;
  variant?: "default" | "positive" | "negative";
}

export default function DataField({
  label,
  value,
  priority = 2,
  title,
  variant = "default",
}: DataFieldProps) {
  const color =
    variant === "positive"
      ? "var(--color-positive)"
      : variant === "negative"
      ? "var(--color-negative)"
      : "var(--color-neutral-200)"; // neutral default

  const valueClass =
    priority === 1
      ? "text-sm md:text-base font-semibold"
      : priority === 2
      ? "text-xs md:text-sm font-medium"
      : "text-xs";

  const isInvalid =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (typeof value === "number" && !Number.isFinite(value)) ||
    (typeof value === "string" &&
      (value === "NaN" || value === "Infinity" || value === "-Infinity"));

  const display: string | number = isInvalid ? "--" : (value as string | number);

  return (
    <div className="flex flex-col gap-0.5" title={title}>
      <span className="text-xs" style={{ color: "var(--color-neutral-400)" }}>
        {label}
      </span>
      <span className={`${valueClass}`} style={{ color }}>
        {display}
      </span>
    </div>
  );
}

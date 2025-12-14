import React from "react";

type Props = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function Button({
  children,
  type = "button",
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  className = "",
}: Props) {
  // Base button visual + focus behavior. Sizing is handled separately so it can be responsive.
  const base =
    "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 transition-colors";

  const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  } as const;

  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500 disabled:bg-blue-900/50 disabled:opacity-70",
    secondary:
      "bg-gray-700 text-gray-100 hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-800/50 disabled:opacity-70",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

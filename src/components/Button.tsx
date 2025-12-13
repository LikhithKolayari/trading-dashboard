import React from "react";

type Props = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
};

export default function Button({
  children,
  type = "button",
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 transition-colors";
  const variants: Record<string, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500 disabled:bg-blue-900/50 disabled:opacity-70",
    secondary:
      "bg-gray-700 text-gray-100 hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-800/50 disabled:opacity-70",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

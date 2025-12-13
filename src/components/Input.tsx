import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

type Props = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  autoComplete?: string;
};

export default function Input({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  error,
  autoComplete,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-left text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>

      {isPassword ? (
        <div className="relative">
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            className={`w-full rounded-md border px-3 py-2 pr-10 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-700 ${
              error ? "ring-2 ring-red-500 border-red-500" : ""
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <FiEyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <FiEye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`w-full rounded-md border px-3 py-2 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-700 ${
            error ? "ring-2 ring-red-500 border-red-500" : ""
          }`}
        />
      )}

      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

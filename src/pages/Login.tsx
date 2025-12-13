import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import { LoginSchema } from "../schemas/auth.schema";

type Errors = Partial<{
  email: string;
  password: string;
  form: string;
}>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setIsValid(false);
      setErrors({
        email: touched.email ? fieldErrors.email?.[0] : undefined,
        password: touched.password ? fieldErrors.password?.[0] : undefined,
      });
    } else {
      setIsValid(true);
      setErrors({});
    }
  }, [email, password, touched]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold text-white mb-6">Login</h1>
        {errors.form ? (
          <div className="mb-4 rounded border border-red-800 bg-red-950 text-red-300 px-3 py-2 text-sm">
            {errors.form}
          </div>
        ) : null}
        <form onSubmit={onSubmit} noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setTouched((t) => ({ ...t, email: true }));
            }}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setTouched((t) => ({ ...t, password: true }));
            }}
            autoComplete="current-password"
            error={errors.password}
          />
          <Button type="submit" disabled={submitting || !isValid} className="w-full">
            {submitting ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-300">
          Don&apos;t have an account?{" "}
          <Link className="text-blue-400 hover:underline" to="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

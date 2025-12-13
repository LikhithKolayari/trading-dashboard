import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import { SignUpSchema, PASSWORD_MIN } from "../schemas/auth.schema";

type Errors = Partial<{
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  password: string;
  form: string;
}>;

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    dateOfBirth: false,
    email: false,
    password: false,
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const parsed = SignUpSchema.safeParse({ firstName, lastName, dateOfBirth, email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setIsValid(false);
      setErrors({
        firstName: touched.firstName ? fieldErrors.firstName?.[0] : undefined,
        lastName: touched.lastName ? fieldErrors.lastName?.[0] : undefined,
        dateOfBirth: touched.dateOfBirth ? fieldErrors.dateOfBirth?.[0] : undefined,
        email: touched.email ? fieldErrors.email?.[0] : undefined,
        password: touched.password ? fieldErrors.password?.[0] : undefined,
      });
    } else {
      setIsValid(true);
      setErrors({});
    }
  }, [firstName, lastName, dateOfBirth, email, password, touched]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = SignUpSchema.safeParse({ firstName, lastName, dateOfBirth, email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        firstName: fieldErrors.firstName?.[0],
        lastName: fieldErrors.lastName?.[0],
        dateOfBirth: fieldErrors.dateOfBirth?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    try {
      setSubmitting(true);
      const message = await signup({ firstName, lastName, dateOfBirth, email, password });
      setSuccess(message || "Signup successful. Please log in.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-6 shadow text-center">
          <h1 className="text-2xl font-semibold text-green-400 mb-2">Success</h1>
          <p className="text-gray-200 mb-6">{success}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/")}>Go to Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold text-white mb-6">Sign Up</h1>
        {errors.form ? (
          <div className="mb-4 rounded border border-red-800 bg-red-950 text-red-300 px-3 py-2 text-sm">
            {errors.form}
          </div>
        ) : null}
        <form onSubmit={onSubmit} noValidate>
          <Input
            id="firstName"
            label="First Name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setTouched((t) => ({ ...t, firstName: true }));
            }}
            placeholder="Jane"
            required
            error={errors.firstName}
            autoComplete="given-name"
          />
          <Input
            id="lastName"
            label="Last Name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setTouched((t) => ({ ...t, lastName: true }));
            }}
            placeholder="Doe"
            required
            error={errors.lastName}
            autoComplete="family-name"
          />
          <Input
            id="dob"
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setTouched((t) => ({ ...t, dateOfBirth: true }));
            }}
            required
            error={errors.dateOfBirth}
            autoComplete="bday"
          />
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
            required
            error={errors.email}
            autoComplete="email"
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
            required
            error={errors.password}
            autoComplete="new-password"
          />
          <p className="text-xs text-gray-400 mb-3">
            Password must be at least {PASSWORD_MIN} characters and include upper, lower, number,
            and special character.
          </p>
          <Button type="submit" disabled={submitting || !isValid} className="w-full">
            {submitting ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-gray-300">
          Already have an account?{" "}
          <Link className="text-blue-400 hover:underline" to="/">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

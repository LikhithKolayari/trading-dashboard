import { z } from "zod";

export const PASSWORD_MIN = 14;

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

const passwordComplexity = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .refine((val) => /[A-Z]/.test(val), {
    message: "Must include at least one uppercase letter",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "Must include at least one lowercase letter",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Must include at least one number",
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: "Must include at least one special character",
  });

export const SignUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), {
      message: "Name can only contain letters, spaces, hyphens, and apostrophes",
    }),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), {
      message: "Name can only contain letters, spaces, hyphens, and apostrophes",
    }),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD")
    .refine(
      (val) => {
        const [y, m, d] = val.split("-").map((n) => parseInt(n, 10));
        if (!y || !m || !d) return false;
        const dob = new Date(Date.UTC(y, m - 1, d));
        const now = new Date();
        const age =
          now.getUTCFullYear() -
          dob.getUTCFullYear() -
          (now.getUTCMonth() < dob.getUTCMonth() ||
          (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())
            ? 1
            : 0);
        return age >= 18;
      },
      { message: "You must be at least 18 years old" }
    ),
  email: z.string().email("Enter a valid email"),
  password: passwordComplexity,
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

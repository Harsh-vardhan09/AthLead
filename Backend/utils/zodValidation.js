import * as z from "zod";
import {
  PASSWORD_ERROR_MESSAGE,
  isValidPassword,
} from "./passwordValidation.js";

export const signupVal = z.object({
  email: z.string().email("Invalid email address"),
  fullname: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(20, "Full name must be at max 20 characters"),
  gender: z.enum(["male", "female", "others"], {
    errorMap: () => ({ message: "Gender must be male, female, or other" }),
  }),
  password: z.string().refine(isValidPassword, PASSWORD_ERROR_MESSAGE),
  phone: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: "Phone must be exactly 10 digits",
    }),
  DOB: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date provided must be in YYYY-MM-DD format",
  }),
});

export const LoginVal = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

export const scoreInputVal = z.strictObject({
  sport: z.string().trim().min(1, "Sport is required"),
  training_years: z
    .number()
    .min(0, "Training years must be at least 0")
    .max(40, "Training years cannot exceed 40"),
  vo2_max: z
    .number()
    .min(10, "VO2 Max must be at least 10")
    .max(90, "VO2 Max cannot exceed 90")
    .optional(),
  hrv: z
    .number()
    .min(0, "HRV must be at least 0")
    .max(200, "HRV cannot exceed 200")
    .optional(),
  lactate_threshold: z
    .number()
    .min(1, "Lactate threshold must be at least 1")
    .max(30, "Lactate threshold cannot exceed 30")
    .optional(),
  stride_length: z
    .number()
    .min(0.5, "Stride length must be at least 0.5")
    .max(3.5, "Stride length cannot exceed 3.5")
    .optional(),
  cadence: z
    .number()
    .min(50, "Cadence must be at least 50")
    .max(220, "Cadence cannot exceed 220")
    .optional(),
  force_application: z
    .number()
    .min(1, "Force application must be at least 1")
    .max(500, "Force application cannot exceed 500")
    .optional(),
  performance_score: z
    .number()
    .min(0, "Performance score must be at least 0")
    .max(100, "Performance score cannot exceed 100")
    .optional(),
  adaptability_score: z
    .number()
    .min(0, "Adaptability score must be at least 0")
    .max(100, "Adaptability score cannot exceed 100")
    .optional(),
});

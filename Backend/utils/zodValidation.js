import * as z from "zod";
import {
  PASSWORD_ERROR_MESSAGE,
  isValidPassword,
} from "./passwordValidation.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getIstTodayDateString = (now = new Date()) =>
  new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export const createSignupSchema = (getNow = () => new Date()) =>
  z.object({
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
    DOB: z.string().superRefine((val, ctx) => {
      if (!DATE_ONLY_PATTERN.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date provided must be in YYYY-MM-DD format",
        });
        return;
      }

      const date = new Date(`${val}T00:00:00.000Z`);
      const isValidCalendar =
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === val;

      if (!isValidCalendar) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date provided must be a valid calendar date",
        });
        return;
      }

      if (val >= getIstTodayDateString(getNow())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Birth should not be today or later",
        });
      }
    }),
  });

export const signupVal = createSignupSchema();

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

export const createEventVal = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title is required"),
  sport: z
    .string({ required_error: "Sport is required" })
    .trim()
    .min(1, "Sport is required"),
  level: z
    .string({ required_error: "Level is required" })
    .trim()
    .min(1, "Level is required"),
  location: z
    .string({ required_error: "Location is required" })
    .trim()
    .min(1, "Location is required"),
  prize: z.coerce
    .number({ invalid_type_error: "Prize must be a number" })
    .min(0, "Prize must be at least 0"),
  date: z
    .union([z.string(), z.date()])
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid date is required",
    }),
  time: z
    .string({ required_error: "Time is required" })
    .trim()
    .min(1, "Time is required"),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(1, "Description is required"),
  capacity: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : val,
    z.coerce
      .number({ invalid_type_error: "Capacity must be a number" })
      .int("Capacity must be an integer")
      .min(1, "Capacity must be at least 1")
      .optional(),
  ),
  tags: z.array(z.string()).optional(),
});

export const updateEventVal = createEventVal.partial();

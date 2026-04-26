import * as z from "zod";

export const signupVal = z.object({
  email: z.string().email("Invalid email address"),
  fullname: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(20, "Full name must be at max 20 characters"),
  gender: z.enum(["male", "female", "others"], {
    errorMap: () => ({ message: "Gender must be male, female, or other" }),
  }),
  password: z.string().regex(/[a-zA-z0-9_\-\.\@\$]{7,16}/i),
  phone: z
  .string()
  .transform(val => val === "" ? undefined : val)
  .optional()
  .refine(val => !val || /^[0-9]{10}$/.test(val), {
    message: "Phone must be exactly 10 digits"
  })
});


export const LoginVal=z.object({
    email: z.string().email("Invalid email address"),
    password: z.string(),
})
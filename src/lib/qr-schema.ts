
import { z } from "zod";

export const qrLinkSchema = z.object({
  type: z.enum([
    "website",
    "linkedin",
    "github",
    "portfolio",
    "email",
    "phone",
    "custom",
  ]),

  label: z.string().trim().min(1, "Label is required"),

  value: z.string().trim().min(1, "Value is required"),
}).superRefine((data, ctx) => {

  if (data.type === "email") {
    if (!z.string().email().safeParse(data.value).success) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a valid email address",
      });
    }
  }

  if (
    ["website", "linkedin", "github", "portfolio", "custom"].includes(data.type)
  ) {
    if (!z.string().url().safeParse(data.value).success) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a valid URL",
      });
    }
  }

  if (data.type === "phone") {
    if (!/^\+?[0-9\s()-]{7,20}$/.test(data.value)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a valid phone number",
      });
    }
  }

});

export const qrLinksSchema = z.array(qrLinkSchema).min(1);
export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  links: qrLinksSchema,
});
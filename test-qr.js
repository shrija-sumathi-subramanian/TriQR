
const { z } = require("zod");

const qrLinkSchema = z.object({
  type: z.enum([
    "website",
    "linkedin",
    "github",
    "portfolio",
    "email",
    "phone",
    "custom",
  ]),
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
}).superRefine((data, ctx) => {
  if (data.type === "email" && !z.string().email().safeParse(data.value).success) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: "Enter a valid email address",
    });
  }

  if (
    ["website", "linkedin", "github", "portfolio", "custom"].includes(data.type) &&
    !z.string().url().safeParse(data.value).success
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: "Enter a valid URL",
    });
  }

  if (
    data.type === "phone" &&
    !/^\+?[0-9\s()-]{7,20}$/.test(data.value)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: "Enter a valid phone number",
    });
  }
});

const tests = [
  {
    name: "Valid email",
    data: { type: "email", label: "Email", value: "alex@gmail.com" },
  },
  {
    name: "Invalid email",
    data: { type: "email", label: "Email", value: "hello123" },
  },
  {
    name: "Invalid LinkedIn URL",
    data: { type: "linkedin", label: "LinkedIn", value: "myprofile" },
  },
];

tests.forEach((test) => {
  console.log(test.name + ":", qrLinkSchema.safeParse(test.data).success);
});

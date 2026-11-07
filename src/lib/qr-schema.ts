
import { z } from "zod";

export const qrLinkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .url("Enter a valid URL")
    .refine(
      (value) => {
        try {
          const parsedUrl = new URL(value);

          return (
            parsedUrl.protocol === "http:" ||
            parsedUrl.protocol === "https:"
          );
        } catch {
          return false;
        }
      },
      "Only HTTP and HTTPS URLs are supported"
    ),

  displayName: z
    .string()
    .trim()
    .max(50, "Display name must be under 50 characters")
    .default(""),
});

export const qrLinksSchema = z
  .array(qrLinkSchema)
  .min(1, "Add at least one link");

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Cube name is required")
    .max(100, "Cube name must be under 100 characters"),

  links: qrLinksSchema,
});

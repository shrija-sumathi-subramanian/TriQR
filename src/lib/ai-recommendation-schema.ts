import { z } from "zod";

export const aiRecommendationSchema = z.object({
  recommendedIndexes: z
    .array(z.number().int().nonnegative())
    .min(1)
    .max(3),
}).superRefine((data, ctx) => {

  const uniqueIndexes = new Set(data.recommendedIndexes);

  if (uniqueIndexes.size !== data.recommendedIndexes.length) {
    ctx.addIssue({
      code: "custom",
      path: ["recommendedIndexes"],
      message: "Duplicate recommendations are not allowed",
    });
  }

});
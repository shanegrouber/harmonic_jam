import { z } from "zod";

const CompanySchema = z.object({
  id: z.number(),
  company_name: z.string(),
  liked: z.boolean(),
});

const CollectionSchema = z.object({
  id: z.string(),
  collection_name: z.string(),
  companies: z.array(CompanySchema),
  total: z.number(),
});

const CompanyBatchResponseSchema = z.object({
  companies: z.array(CompanySchema),
});

export type Collection = z.infer<typeof CollectionSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type CompanyBatchResponse = z.infer<typeof CompanyBatchResponseSchema>;

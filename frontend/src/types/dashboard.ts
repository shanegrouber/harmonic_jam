import z from "zod";

export const CompanyTablePropsSchema = z.object({
  selectedCollectionId: z.string(),
  collections: z.array(z.any()),
  currentCollectionId: z.string(),
  currentCollection: z.any().optional(),
});
export type CompanyTableProps = z.infer<typeof CompanyTablePropsSchema>;

export const SidebarPropsSchema = z.object({
  collections: z.array(z.any()),
  selectedCollectionId: z.string().optional(),
  setSelectedCollectionId: z.function().args(z.string()).returns(z.void()),
});
export type SidebarProps = z.infer<typeof SidebarPropsSchema>;

const RowStatusSchema = z.enum(["idle", "pending", "success", "error"]);
const RowStatusesSchema = z.record(z.number(), RowStatusSchema);

export type RowStatus = z.infer<typeof RowStatusSchema>;
export type RowStatuses = z.infer<typeof RowStatusesSchema>;

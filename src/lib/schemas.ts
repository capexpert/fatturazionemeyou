import { z } from 'zod';

export const CompanySchema = z.object({
  company_name: z.string().min(1, "Company name is required."),
  vat_number: z.string().min(1, "VAT number is required."),
  tax_code: z.string().min(1, "Tax code is required."),
  address: z.string().min(1, "Address is required."),
  city: z.string().min(1, "City is required."),
  province: z.string().min(2, "Province is required.").max(2),
  zip: z.string().min(1, "ZIP code is required."),
  country: z.string().min(2, "Country is required.").max(2),
  pec_email: z.string().email("Invalid PEC email address."),
  iban: z.string().min(1, "IBAN is required."),
  regime_fiscale: z.string().min(1, "Fiscal regime is required."),
});

export const ClientSchema = z.object({
  name: z.string().min(1, "Client name is required."),
  vat_number: z.string().optional(),
  tax_code: z.string().optional(),
  address: z.string().min(1, "Address is required."),
  city: z.string().min(1, "City is required."),
  province: z.string().min(2, "Province is required.").max(2),
  zip: z.string().min(1, "ZIP code is required."),
  country: z.string().min(2, "Country is required.").max(2),
  pec: z.string().email("Invalid PEC email address.").optional().or(z.literal('')),
  sdi_code: z.string().length(7, "SDI code must be 7 characters.").optional().or(z.literal('')),
}).refine(data => data.vat_number || data.tax_code, {
  message: "Either VAT number or Tax code is required.",
  path: ["vat_number"],
}).refine(data => data.pec || data.sdi_code, {
  message: "Either PEC or SDI Code is required for electronic invoicing.",
  path: ["sdi_code"],
});

export const InvoiceItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  quantity: z.number().min(0.01, "Quantity must be greater than 0."),
  unit_price: z.number().min(0, "Unit price cannot be negative."),
  vat_rate: z.enum(['4', '5', '10', '22']).transform(v => Number(v)),
});

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  client_id: z.string().min(1, "Please select a client."),
  date: z.date({ required_error: "Invoice date is required." }),
  items: z.array(InvoiceItemSchema).min(1, "Invoice must have at least one item."),
});

export type InvoiceFormData = z.infer<typeof InvoiceSchema>;

import { z } from 'zod';

export const CompanySchema = z.object({
  company_name: z.string().min(1, "Il nome dell'azienda è obbligatorio."),
  vat_number: z.string().min(1, "La Partita IVA è obbligatoria."),
  tax_code: z.string().min(1, "Il Codice Fiscale è obbligatorio."),
  address: z.string().min(1, "L'indirizzo è obbligatorio."),
  city: z.string().min(1, "La città è obbligatoria."),
  province: z.string().min(2, "La provincia è obbligatoria.").max(2),
  zip: z.string().min(1, "Il CAP è obbligatorio."),
  country: z.string().min(2, "Il paese è obbligatorio.").max(2),
  pec_email: z.string().email("Indirizzo email PEC non valido."),
  iban: z.string().min(1, "L'IBAN è obbligatorio."),
  regime_fiscale: z.string().min(1, "Il regime fiscale è obbligatorio."),
});

export const ClientSchema = z.object({
  name: z.string().min(1, "Il nome del cliente è obbligatorio."),
  vat_number: z.string().optional(),
  tax_code: z.string().optional(),
  address: z.string().min(1, "L'indirizzo è obbligatorio."),
  city: z.string().min(1, "La città è obbligatoria."),
  province: z.string().min(2, "La provincia è obbligatoria.").max(2),
  zip: z.string().min(1, "Il CAP è obbligatorio."),
  country: z.string().min(2, "Il paese è obbligatorio.").max(2),
  pec: z.string().email("Indirizzo email PEC non valido.").optional().or(z.literal('')),
  sdi_code: z.string().length(7, "Il codice SDI deve essere di 7 caratteri.").optional().or(z.literal('')),
}).refine(data => data.vat_number || data.tax_code, {
  message: "È richiesta la Partita IVA o il Codice Fiscale.",
  path: ["vat_number"],
}).refine(data => data.pec || data.sdi_code, {
  message: "Per la fatturazione elettronica è richiesto il codice PEC o SDI.",
  path: ["sdi_code"],
});

export const InvoiceItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Il titolo è obbligatorio."),
  description: z.string().min(1, "La descrizione è obbligatoria."),
  quantity: z.number().min(0.01, "La quantità deve essere maggiore di 0."),
  unit_price: z.number().min(0, "Il prezzo unitario non può essere negativo."),
  vat_rate: z.preprocess(
    (val) => Number(val),
    z.union([
      z.literal(4),
      z.literal(5),
      z.literal(10),
      z.literal(22),
    ], { errorMap: () => ({ message: "L'aliquota IVA non è valida." }) })
  ),
});

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  client_id: z.string().min(1, "Seleziona un cliente."),
  date: z.date({ required_error: "La data della fattura è obbligatoria." }),
  items: z.array(InvoiceItemSchema).min(1, "La fattura deve contenere almeno un articolo."),
});

export type InvoiceFormData = z.infer<typeof InvoiceSchema>;

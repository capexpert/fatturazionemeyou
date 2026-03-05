export type Company = {
  id: string;
  company_name: string;
  vat_number: string;
  tax_code: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  pec_email: string;
  iban: string;
  regime_fiscale: string;
};

export type Client = {
  id: string;
  companyId: string;
  name: string;
  vat_number?: string;
  tax_code?: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  pec?: string;
  sdi_code?: string;
};

export type Invoice = {
  id: string;
  number: string;
  year: number;
  date: string; // YYYY-MM-DD
  client_id: string;
  companyId: string;
  subtotal: number;
  vat_total: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  xml_url?: string;
  pdf_url?: string;
  created_at: string; // ISO 8601
  client?: Client; // Populated for display
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  companyId: string;
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number; // as percentage, e.g., 22
};

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[];
};

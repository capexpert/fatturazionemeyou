'use server';
/**
 * @fileOverview A Genkit flow for generating FatturaPA XML documents.
 *
 * - generateFatturaPAXML - A function that generates a compliant FatturaPA XML document.
 * - GenerateFatturaPAXMLInput - The input type for the generateFatturaPAXML function.
 * - GenerateFatturaPAXMLOutput - The return type for the generateFatturaPAXML function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompanySchema = z.object({
  company_name: z.string().describe('The legal name of the company.'),
  vat_number: z.string().describe('The VAT number of the company.'),
  tax_code: z.string().describe('The fiscal code of the company.'),
  address: z.string().describe('The street address of the company.'),
  city: z.string().describe('The city of the company.'),
  province: z.string().describe('The province of the company (e.g., MI, RM).'),
  zip: z.string().describe('The postal code of the company.'),
  country: z.string().describe('The country of the company (e.g., IT).'),
  pec_email: z.string().email().describe('The PEC email address of the company.'),
  iban: z.string().describe('The IBAN of the company for payments.'),
  regime_fiscale: z.string().describe('The fiscal regime code (e.g., RF01).'),
});
export type Company = z.infer<typeof CompanySchema>;

const ClientSchema = z.object({
  name: z.string().describe('The legal name of the client.'),
  vat_number: z.string().optional().describe('The VAT number of the client, if applicable.'),
  tax_code: z.string().optional().describe('The fiscal code of the client, if applicable.'),
  address: z.string().describe('The street address of the client.'),
  city: z.string().describe('The city of the client.'),
  province: z.string().describe('The province of the client (e.g., MI, RM).'),
  zip: z.string().describe('The postal code of the client.'),
  country: z.string().describe('The country of the client (e.g., IT).'),
  pec: z.string().email().optional().describe('The PEC email address of the client, if applicable.'),
  sdi_code: z.string().optional().describe('The Codice Destinatario for the client (7 digits). Use "0000000" if using PEC.'),
});
export type Client = z.infer<typeof ClientSchema>;

const InvoiceItemSchema = z.object({
  description: z.string().describe('Description of the invoice item.'),
  quantity: z.number().describe('Quantity of the item.'),
  unit_price: z.number().describe('Unit price of the item.'),
  vat_rate: z.number().describe('VAT rate percentage for the item (e.g., 4, 5, 10, 22).'),
  line_total: z.number().describe('Total net price for this line item (quantity * unit_price).'),
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

const InvoiceDataSchema = z.object({
  number: z.string().describe('The invoice number (e.g., "1/2026").'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('The invoice date in YYYY-MM-DD format.'),
  subtotal: z.number().describe('The total taxable amount before VAT.'),
  vat_total: z.number().describe('The total VAT amount for the invoice.'),
  total: z.number().describe('The grand total of the invoice including VAT.'),
  currency: z.string().default('EUR').describe('The currency of the invoice.'),
});
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;

const GenerateFatturaPAXMLInputSchema = z.object({
  company: CompanySchema,
  client: ClientSchema,
  invoice: InvoiceDataSchema,
  invoice_items: z.array(InvoiceItemSchema),
}).describe('Input data for generating a FatturaPA XML document.');
export type GenerateFatturaPAXMLInput = z.infer<typeof GenerateFatturaPAXMLInputSchema>;

const GenerateFatturaPAXMLOutputSchema = z.object({
  xml: z.string().describe('The generated FatturaPA XML document.'),
}).describe('Output containing the generated FatturaPA XML string.');
export type GenerateFatturaPAXMLOutput = z.infer<typeof GenerateFatturaPAXMLOutputSchema>;

export async function generateFatturaPAXML(input: GenerateFatturaPAXMLInput): Promise<GenerateFatturaPAXMLOutput> {
  return generateFatturaPAXMLFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFatturaPAXMLPrompt',
  input: { schema: GenerateFatturaPAXMLInputSchema },
  output: { schema: GenerateFatturaPAXMLOutputSchema },
  prompt: `System: You are an expert in Italian fiscal regulations and the FatturaPA electronic invoicing standard. Your task is to generate a valid FatturaPA XML document (versione 1.2) based on the provided invoice, company, and client data. Ensure strict compliance with the XML schema and Italian fiscal rules.

User:
Generate a FatturaPA XML (versione 1.2) for the following invoice details. Fill in the data carefully, ensuring all fiscal rules and XML schema requirements are met.

Company Details:
{{{json company}}}

Client Details:
{{{json client}}}

Invoice Details:
{{{json invoice}}}

Invoice Items:
{{{json invoice_items}}}

Guidelines:
1. The root element must be <FatturaElettronica xmlns="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" versione="1.2">
2. FormatoTrasmissione must be FPR12.
3. CodiceDestinatario should be "{{client.sdi_code}}" if provided, otherwise '0000000' for PEC. If '0000000', also include PECDestinatario with "{{client.pec}}".
4. TipoDocumento must be TD01.
5. Divisa must be '{{invoice.currency}}'.
6. For each DettaglioLinee, provide a sequential NumeroLinea starting from 1.
7. For DatiRiepilogo, aggregate the invoice_items by their 'vat_rate'. For each unique 'vat_rate':
    - Calculate 'ImponibileImporto' (Taxable amount) as the sum of 'line_total' for items with this VAT rate.
    - Calculate 'Imposta' (VAT amount) as the sum of ('line_total' * 'vat_rate' / 100) for items with this VAT rate.
    - Ensure both 'ImponibileImporto' and 'Imposta' are correctly rounded to 2 decimal places.
8. Assume ModalitaPagamento MP05 (Bonifico bancario) for DatiPagamento, and include the company's IBAN. The DataScadenzaPagamento can be the same as the invoice date.
9. Ensure all numeric values are formatted correctly as decimals (e.g., 12.34).
10. If a client has neither vat_number nor tax_code, omit the corresponding XML fields in CessionarioCommittente/DatiAnagrafici.
11. Output only the XML document. No additional text, comments, or explanations.

Please generate the FatturaPA XML document now:`,
});

const generateFatturaPAXMLFlow = ai.defineFlow(
  {
    name: 'generateFatturaPAXMLFlow',
    inputSchema: GenerateFatturaPAXMLInputSchema,
    outputSchema: GenerateFatturaPAXMLOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

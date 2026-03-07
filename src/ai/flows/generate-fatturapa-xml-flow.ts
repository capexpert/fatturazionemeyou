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
  title: z.string().describe('Title of the invoice item.'),
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
  cup: z.string().optional().describe("The 'Codice Unico di Progetto' (CUP), if applicable."),
  subtotal: z.number().describe('The total taxable amount before VAT.'),
  vat_total: z.number().describe('The total VAT amount for the invoice.'),
  total: z.number().describe('The grand total of the invoice including VAT.'),
  currency: z.string().default('EUR').describe('The currency of the invoice.'),
});
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;

const DatiRiepilogoItemSchema = z.object({
  imponibile: z.number().describe('The taxable amount for this VAT rate.'),
  imposta: z.number().describe('The tax amount for this VAT rate.'),
  aliquota: z.number().describe('The VAT rate percentage.'),
});

const GenerateFatturaPAXMLInputSchema = z.object({
  company: CompanySchema,
  client: ClientSchema,
  invoice: InvoiceDataSchema,
  invoice_items: z.array(InvoiceItemSchema),
  dati_riepilogo: z.array(DatiRiepilogoItemSchema).describe('Pre-aggregated VAT summary data.'),
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
  prompt: `System: You are an expert in Italian fiscal regulations and the FatturaPA electronic invoicing standard. Your task is to generate a valid FatturaPA XML document (versione 1.2) based on the provided JSON data. The data has been pre-processed, so you only need to map the fields to the correct XML tags.

User:
Generate a FatturaPA XML (versione 1.2) using the following data.

Company:
{{{json company}}}

Client:
{{{json client}}}

Invoice:
{{{json invoice}}}

Invoice Items:
{{{json invoice_items}}}

VAT Summary:
{{{json dati_riepilogo}}}

Guidelines:
1.  Root element: <p:FatturaElettronica xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" versione="FPR12">
2.  FormatoTrasmissione: 'FPR12'.
3.  ProgressivoInvio: Extract the number from \`invoice.number\` (the part before the '/') and pad it with leading zeros to 5 digits. For example, if \`invoice.number\` is '1/2026', use '00001'.
4.  CodiceDestinatario: Use "{{client.sdi_code}}". If it is '0000000', also include <PECDestinatario>{{client.pec}}</PECDestinatario>.
5.  CUP: If a 'cup' code is provided in the 'invoice' object and it's not an empty string, you MUST include a <DatiOrdineAcquisto> block within <DatiGenerali>, after the <DatiGeneraliDocumento> block. Inside <DatiOrdineAcquisto>, you MUST include an <IdDocumento> tag (with a value like '1') before the <CodiceCUP> tag (with the value from 'invoice.cup').
6.  TipoDocumento: 'TD01'
7.  Divisa: '{{invoice.currency}}'
8.  For each item in 'invoice_items', create a <DettaglioLinee> block.
9.  Inside each <DettaglioLinee>, create the <Descrizione> tag by combining the 'title' and 'description' fields in the format: "title - description".
10. Use the pre-calculated VAT summary from 'dati_riepilogo' to create the <DatiRiepilogo> block. For each item in the summary, create a block with <AliquotaIVA>, <ImponibileImporto>, and <Imposta>.
11. For <DatiPagamento>, set <CondizioniPagamento> to 'TP02'. Then, inside a <DettaglioPagamento> block, set <ModalitaPagamento> to 'MP05' (Bonifico), <DataScadenzaPagamento> to the invoice date, <ImportoPagamento> to the invoice grand total ({{invoice.total}}), and include the company's <IBAN> ({{company.iban}}). Do not use <DatiRicezione>.
12. Ensure all numeric values are formatted to 2 decimal places with a period separator (e.g., 12.34).
13. Your final output MUST be a valid JSON object containing a single key "xml". The value must be the complete XML document as a string. Do not include any other text, comments, markdown backticks, or explanations. Example: {"xml": "<?xml version=..."}`,
});

const generateFatturaPAXMLFlow = ai.defineFlow(
  {
    name: 'generateFatturaPAXMLFlow',
    inputSchema: GenerateFatturaPAXMLInputSchema,
    outputSchema: GenerateFatturaPAXMLOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output?.xml) {
      // Log the failure and throw an error to be caught by the server action
      console.error("FatturaPA XML generation failed: Model did not return valid XML in the expected format.", output);
      throw new Error("Il modello AI non è riuscito a generare un output XML valido.");
    }
    return output;
  }
);

'use server';

import { generateFatturaPAXML, type GenerateFatturaPAXMLInput } from '@/ai/flows/generate-fatturapa-xml-flow';

/**
 * Server action dedicated to generating the FatturaPA XML content.
 * It does not perform any database operations.
 * @param input The data required to generate the XML.
 * @returns An object containing the generated XML string or an error message.
 */
export async function generateInvoiceXMLAction(input: GenerateFatturaPAXMLInput): Promise<{ xml?: string; message?: string }> {
  try {
    const { xml } = await generateFatturaPAXML(input);
    return { xml };
  } catch (error) {
    console.error('Error generating XML:', error);
    return { message: 'Errore durante la generazione del file XML.' };
  }
}

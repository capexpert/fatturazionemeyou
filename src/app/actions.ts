'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateFatturaPAXML } from '@/ai/flows/generate-fatturapa-xml-flow';
import { getClientById, getCompanyProfile, getNextInvoiceNumber, saveInvoice as saveInvoiceData } from '@/lib/data';
import { InvoiceSchema } from '@/lib/schemas';
import type { InvoiceItem } from '@/lib/types';
import { format } from 'date-fns';

export async function saveInvoiceAction(data: z.infer<typeof InvoiceSchema>) {
  const validatedFields = InvoiceSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { client_id, date, items, id } = validatedFields.data;

  try {
    const [company, client, invoiceNumber] = await Promise.all([
        getCompanyProfile(),
        getClientById(client_id),
        id ? '' : getNextInvoiceNumber(date.getFullYear()),
    ]);
    
    if (!client) {
        throw new Error("Client not found");
    }

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const vat_total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.vat_rate / 100), 0);
    const total = subtotal + vat_total;

    // Save invoice to our "DB"
    const savedInvoice = await saveInvoiceData({ id, client_id, date, items: items.map(({id: itemId, ...rest}) => rest) });

    // Prepare data for AI XML generation
    const xmlInput = {
        company,
        client,
        invoice: {
            number: id ? (await getInvoiceById(id))!.number : invoiceNumber,
            date: format(date, 'yyyy-MM-dd'),
            subtotal,
            vat_total,
            total,
            currency: 'EUR',
        },
        invoice_items: items.map((item: InvoiceItem & {vat_rate: number}) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            line_total: item.quantity * item.unit_price,
        })),
    };

    // Call the Genkit flow to generate XML
    const { xml } = await generateFatturaPAXML(xmlInput);

    // In a real app, you would save the XML to Firebase Storage and update the invoice record with the URL.
    console.log("Generated XML:", xml.substring(0, 200) + '...');
    
  } catch (error) {
    console.error(error);
    return { message: 'Database Error: Failed to process Invoice.' };
  }

  revalidatePath('/invoices');
  revalidatePath('/dashboard');
  redirect('/invoices');
}

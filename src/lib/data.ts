import type { Company, Client, Invoice, InvoiceWithItems } from '@/lib/types';

// This file previously contained mock data. It is now being replaced by
// real-time data fetching from Firestore in the components themselves.
// The functions are kept here to avoid breaking parts of the app
// that have not yet been migrated. They will be removed soon.


// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getCompanyProfile(): Promise<Company | null> {
  await delay(100);
  return null;
}

export async function getClients(): Promise<Client[]> {
  await delay(300);
  return [];
}

export async function getClientById(id: string): Promise<Client | undefined> {
  await delay(100);
  return undefined;
}

export async function getInvoices(): Promise<Invoice[]> {
  await delay(400);
  return [];
}

export async function getInvoiceById(id: string): Promise<InvoiceWithItems | undefined> {
  await delay(200);
  return undefined;
}

export async function getNextInvoiceNumber(year: number): Promise<string> {
    await delay(50);
    // This logic will be moved to a client-side hook
    return `1/${year}`;
}

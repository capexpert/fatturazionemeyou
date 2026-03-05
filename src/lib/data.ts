import type { Company, Client, Invoice, InvoiceWithItems } from '@/lib/types';
import { format } from 'date-fns';

let companyProfile: Company = {
  id: 'comp-1',
  company_name: 'FatturaNow SRL',
  vat_number: '12345678901',
  tax_code: '12345678901',
  address: 'Via Roma 10',
  city: 'Milano',
  province: 'MI',
  zip: '20121',
  country: 'IT',
  pec_email: 'fatturanow@pec.it',
  iban: 'IT60X0542811101000000123456',
  regime_fiscale: 'RF01',
};

let clients: Client[] = [
  {
    id: 'client-1',
    name: 'Cliente Demo 1 S.p.A.',
    vat_number: '09876543211',
    address: 'Corso Vittorio Emanuele 22',
    city: 'Roma',
    province: 'RM',
    zip: '00186',
    country: 'IT',
    sdi_code: 'SUBM70N',
  },
  {
    id: 'client-2',
    name: 'Studio Professionale Rossi',
    tax_code: 'RSSMRA80A01H501U',
    address: 'Piazza della Signoria 1',
    city: 'Firenze',
    province: 'FI',
    zip: '50122',
    country: 'IT',
    pec: 'studio.rossi@pec.it',
    sdi_code: '0000000',
  },
  {
    id: 'client-3',
    name: 'Tech Solutions GmbH',
    vat_number: 'DE123456789',
    address: 'Unter den Linden 77',
    city: 'Berlin',
    province: 'BE',
    zip: '10117',
    country: 'DE',
    sdi_code: 'XXXXXXX',
  }
];

let invoices: InvoiceWithItems[] = [
  {
    id: 'inv-1',
    number: '1/2024',
    year: 2024,
    date: '2024-07-15',
    client_id: 'client-1',
    subtotal: 1500,
    vat_total: 330,
    total: 1830,
    status: 'paid',
    created_at: '2024-07-15T10:00:00Z',
    items: [
      { id: 'item-1-1', description: 'Consulenza strategica', quantity: 1, unit_price: 1500, vat_rate: 22 },
    ],
  },
  {
    id: 'inv-2',
    number: '2/2024',
    year: 2024,
    date: '2024-07-20',
    client_id: 'client-2',
    subtotal: 250,
    vat_total: 55,
    total: 305,
    status: 'sent',
    created_at: '2024-07-20T14:30:00Z',
    items: [
      { id: 'item-2-1', description: 'Sviluppo sito web - Acconto', quantity: 5, unit_price: 50, vat_rate: 22 },
    ],
  },
  {
    id: 'inv-3',
    number: '3/2024',
    year: 2024,
    date: '2024-07-28',
    client_id: 'client-1',
    subtotal: 400,
    vat_total: 16,
    total: 416,
    status: 'draft',
    created_at: '2024-07-28T11:00:00Z',
    items: [
      { id: 'item-3-1', description: 'Licenza software', quantity: 2, unit_price: 200, vat_rate: 4 },
    ],
  },
];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getCompanyProfile(): Promise<Company> {
  await delay(100);
  return companyProfile;
}

export async function updateCompanyProfile(data: Company): Promise<Company> {
  await delay(500);
  companyProfile = { ...companyProfile, ...data };
  return companyProfile;
}

export async function getClients(): Promise<Client[]> {
  await delay(300);
  return clients;
}

export async function getClientById(id: string): Promise<Client | undefined> {
  await delay(100);
  return clients.find(c => c.id === id);
}

export async function saveClient(client: Omit<Client, 'id'> & { id?: string }): Promise<Client> {
    await delay(500);
    if (client.id) {
        const index = clients.findIndex(c => c.id === client.id);
        if (index > -1) {
            clients[index] = { ...clients[index], ...client } as Client;
            return clients[index];
        }
    }
    const newClient: Client = { ...client, id: `client-${Date.now()}` };
    clients.push(newClient);
    return newClient;
}

export async function getInvoices(): Promise<Invoice[]> {
  await delay(400);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return invoices.map(({ items, ...invoice }) => ({
    ...invoice,
    client: clients.find(c => c.id === invoice.client_id)
  }));
}

export async function getInvoiceById(id: string): Promise<InvoiceWithItems | undefined> {
  await delay(200);
  const invoice = invoices.find(inv => inv.id === id);
  if (invoice) {
    return {
      ...invoice,
      client: clients.find(c => c.id === invoice.client_id)
    }
  }
  return undefined;
}

export async function getNextInvoiceNumber(year: number): Promise<string> {
    await delay(50);
    const yearInvoices = invoices.filter(inv => inv.year === year);
    const nextNumber = yearInvoices.length + 1;
    return `${nextNumber}/${year}`;
}


export async function saveInvoice(invoiceData: {
  id?: string;
  client_id: string;
  date: Date;
  items: Omit<typeof invoices[0]['items'][0], 'id'>[];
}) {
    await delay(1000);

    const client = await getClientById(invoiceData.client_id);
    if (!client) throw new Error("Client not found");

    const year = invoiceData.date.getFullYear();

    const subtotal = invoiceData.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    const vat_total = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.unit_price * item.vat_rate / 100), 0);

    if (invoiceData.id) {
        // Update existing invoice
        const index = invoices.findIndex(i => i.id === invoiceData.id);
        if (index > -1) {
            const existingInvoice = invoices[index];
            const updatedInvoice: InvoiceWithItems = {
                ...existingInvoice,
                client_id: invoiceData.client_id,
                date: format(invoiceData.date, 'yyyy-MM-dd'),
                items: invoiceData.items.map(item => ({...item, id: `item-${Date.now()}-${Math.random()}`})),
                subtotal,
                vat_total,
                total: subtotal + vat_total,
            };
            invoices[index] = updatedInvoice;
            return updatedInvoice;
        }
    }

    // Create new invoice
    const nextNumber = await getNextInvoiceNumber(year);
    const newInvoice: InvoiceWithItems = {
        id: `inv-${Date.now()}`,
        number: nextNumber,
        year,
        date: format(invoiceData.date, 'yyyy-MM-dd'),
        client_id: invoiceData.client_id,
        subtotal,
        vat_total,
        total: subtotal + vat_total,
        status: 'draft',
        created_at: new Date().toISOString(),
        items: invoiceData.items.map(item => ({...item, id: `item-${Date.now()}-${Math.random()}`})),
    };

    invoices.push(newInvoice);
    invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return newInvoice;
}

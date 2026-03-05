import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { getClients, getNextInvoiceNumber } from "@/lib/data";

export default async function NewInvoicePage() {
  const [clients, nextInvoiceNumber] = await Promise.all([
    getClients(),
    getNextInvoiceNumber(new Date().getFullYear())
  ]);

  return (
    <>
      <PageHeader title="Create Invoice" />
      <InvoiceForm clients={clients} nextInvoiceNumber={nextInvoiceNumber} />
    </>
  );
}

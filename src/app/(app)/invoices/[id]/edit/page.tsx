import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { getClients, getInvoiceById } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, clients] = await Promise.all([
    getInvoiceById(params.id),
    getClients(),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <>
      <PageHeader title={`Edit Invoice ${invoice.number}`} />
      <InvoiceForm clients={clients} invoice={invoice} nextInvoiceNumber={invoice.number} />
    </>
  );
}

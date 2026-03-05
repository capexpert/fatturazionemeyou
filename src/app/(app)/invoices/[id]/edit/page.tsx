'use client';

import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Invoice } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, notFound } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();

  // Ensure id is a string, as it can be string | string[]
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const invoiceRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'invoices', id);
  }, [firestore, id]);

  const { data: invoice, isLoading, error } = useDoc<Invoice>(invoiceRef);

  if (isLoading || !id) {
    return (
      <>
        <PageHeader title="Modifica Fattura" />
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Errore" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore di Caricamento</AlertTitle>
          <AlertDescription>
            Impossibile caricare la fattura a causa di un errore: {error.message}. 
            Potrebbe trattarsi di un problema di permessi o di rete.
          </AlertDescription>
        </Alert>
      </>
    );
  }

  // Only call notFound if loading is complete, there's no error, and the document is confirmed to not exist.
  if (!isLoading && !error && !invoice) {
    notFound();
  }

  // Render a skeleton if the invoice is not yet available, even if loading is false,
  // to handle the brief moment before notFound is called.
  if (!invoice) {
    return (
      <>
        <PageHeader title="Modifica Fattura" />
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={`Modifica Fattura ${invoice.number}`} />
      <InvoiceForm invoice={invoice} nextInvoiceNumber={invoice.number} />
    </>
  );
}

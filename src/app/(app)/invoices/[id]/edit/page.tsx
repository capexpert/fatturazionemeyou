'use client';

import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Invoice } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound, useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();

  const id = params?.id;

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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Errore</AlertTitle>
        <AlertDescription>
          Impossibile caricare la fattura: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Only call notFound if loading is complete and the document is confirmed to not exist.
  if (!isLoading && !invoice) {
      notFound();
  }
  
  // While loading is false, invoice could still be null for a brief moment before notFound is called.
  // So we render a skeleton if invoice is not yet available.
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

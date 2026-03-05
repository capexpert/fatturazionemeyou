'use client';

import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Invoice } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound, useParams } from "next/navigation";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();

  const id = params?.id;

  // Fetch invoice (which now includes items)
  const invoiceRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'invoices', id);
  }, [firestore, id]);
  const { data: invoice, isLoading } = useDoc<Invoice>(invoiceRef);

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
  
  if (!invoice) {
      notFound();
  }

  return (
    <>
      <PageHeader title={`Modifica Fattura ${invoice.number}`} />
      <InvoiceForm invoice={invoice} nextInvoiceNumber={invoice.number} />
    </>
  );
}

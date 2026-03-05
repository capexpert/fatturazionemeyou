'use client';

import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { Invoice, InvoiceItem, InvoiceWithItems } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { notFound } from "next/navigation";

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  // Fetch invoice
  const invoiceRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'invoices', params.id);
  }, [firestore, params.id]);
  const { data: invoice, isLoading: isLoadingInvoice } = useDoc<Invoice>(invoiceRef);

  // Fetch invoice items
  const itemsQuery = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return query(collection(firestore, 'invoiceItems'), where('invoiceId', '==', params.id));
  }, [firestore, params.id]);
  const { data: items, isLoading: isLoadingItems } = useCollection<InvoiceItem>(itemsQuery);

  const invoiceWithItems = useMemo<InvoiceWithItems | null>(() => {
    if (!invoice || !items) return null;
    return { ...invoice, items };
  }, [invoice, items]);

  const isLoading = isLoadingInvoice || isLoadingItems;

  if (isLoading) {
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
  
  if (!invoiceWithItems) {
      notFound();
  }

  return (
    <>
      <PageHeader title={`Modifica Fattura ${invoiceWithItems.number}`} />
      <InvoiceForm invoice={invoiceWithItems} nextInvoiceNumber={invoiceWithItems.number} />
    </>
  );
}

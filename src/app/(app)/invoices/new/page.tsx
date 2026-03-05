'use client';

import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Invoice } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewInvoicePage() {
  const firestore = useFirestore();
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNextInvoiceNumber() {
      if (!firestore) return;

      const currentYear = new Date().getFullYear();
      const invoicesRef = collection(firestore, 'invoices');
      const q = query(
        invoicesRef,
        where('companyId', '==', 'main-company'),
        where('year', '==', currentYear)
      );

      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setNextInvoiceNumber(`1/${currentYear}`);
        } else {
          let maxNumber = 0;
          querySnapshot.forEach(doc => {
            const invoice = doc.data() as Invoice;
            const num = parseInt(invoice.number.split('/')[0]);
            if (num > maxNumber) {
              maxNumber = num;
            }
          });
          setNextInvoiceNumber(`${maxNumber + 1}/${currentYear}`);
        }
      } catch (e) {
        console.error("Error fetching next invoice number: ", e);
        setNextInvoiceNumber(`1/${currentYear}`); // fallback
      } finally {
        setIsLoading(false);
      }
    }

    fetchNextInvoiceNumber();
  }, [firestore]);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Crea Fattura" />
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Crea Fattura" />
      <InvoiceForm nextInvoiceNumber={nextInvoiceNumber} />
    </>
  );
}

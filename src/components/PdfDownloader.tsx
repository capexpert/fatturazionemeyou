'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Invoice, Company, Client } from '@/lib/types';
import { InvoiceDocument } from '@/components/pdf/InvoiceDocument';
import { Download, Loader2 } from 'lucide-react';

interface PdfDownloaderProps {
  invoice: Invoice;
}

export function PdfDownloader({ invoice }: PdfDownloaderProps) {
  const firestore = useFirestore();

  const companyRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'company', 'main-company');
  }, [firestore]);
  const { data: company, isLoading: isLoadingCompany } = useDoc<Company>(companyRef);

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !invoice.client_id) return null;
    return doc(firestore, 'clients', invoice.client_id);
  }, [firestore, invoice.client_id]);
  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  if (isLoadingCompany || isLoadingClient) {
    return (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            PDF...
        </>
    );
  }

  if (!company || !client) {
    return (
        <>
            <Download className="mr-2 h-4 w-4" />
            Dati Mancanti
        </>
    );
  }

  return (
    <PDFDownloadLink
      document={<InvoiceDocument invoice={invoice} invoiceItems={invoice.items} company={company} client={client} />}
      fileName={`Fattura_${invoice.number.replace(/\//g, '-')}.pdf`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
    >
      {({ loading }) => (
        loading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
            </>
        ) : (
            <>
                <Download className="mr-2 h-4 w-4" />
                Scarica PDF
            </>
        )
      )}
    </PDFDownloadLink>
  );
}

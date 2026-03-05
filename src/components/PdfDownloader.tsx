'use client';
import React, { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { InvoiceDocument } from './pdf/InvoiceDocument';
import type { Invoice, Company, Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface PdfDownloaderProps {
    invoice: Invoice;
    company: Company | null;
    client: Client | null;
}

export function PdfDownloader({ invoice, company, client }: PdfDownloaderProps) {
    const { toast } = useToast();
    
    // The PDF generation is triggered by the usePDF hook.
    // It will re-render when the document changes, but we will pass stable props.
    const [instance, updateInstance] = usePDF({
        document: company && client ? <InvoiceDocument invoice={invoice} company={company} client={client} /> : null,
    });

    useEffect(() => {
        if(company && client) {
            updateInstance();
        }
    }, [invoice, company, client, updateInstance]);

    useEffect(() => {
        if (instance.error) {
            toast({
                variant: 'destructive',
                title: 'Errore PDF',
                description: `Impossibile generare il PDF: ${instance.error}`,
            });
            console.error(instance.error);
        }
    }, [instance.error, toast]);

    if (!company || !client) {
         return (
            <DropdownMenuItem disabled>
                <Download className="mr-2 h-4 w-4" />
                Scarica PDF (Dati mancanti)
            </DropdownMenuItem>
        );
    }
    
    const handleDownload = () => {
        if (instance.url && !instance.loading) {
            const link = document.createElement('a');
            link.href = instance.url;
            const fileName = `Fattura_${invoice.number.replace(/\//g, '-')}.pdf`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <DropdownMenuItem onClick={handleDownload} disabled={instance.loading || !instance.url}>
            <Download className="mr-2 h-4 w-4" />
            {instance.loading ? 'Generazione PDF...' : 'Scarica PDF'}
        </DropdownMenuItem>
    );
}

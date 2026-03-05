'use client';
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Edit, Copy } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Client, Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { format } from 'date-fns';
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";

const statusVariant = {
    paid: 'default',
    sent: 'secondary',
    draft: 'outline',
} as const;

function downloadXml(xmlContent: string, fileName: string) {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function InvoicesTable() {
    const firestore = useFirestore();

    const invoicesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
          collection(firestore, 'invoices'), 
          where('companyId', '==', 'main-company'), 
          orderBy('date', 'desc')
        );
    }, [firestore]);
    const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

    const clientsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'clients'), where('companyId', '==', 'main-company'));
    }, [firestore]);
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
    
    const invoicesWithClients = useMemo(() => {
      if (!invoices || !clients) return [];
      const clientMap = new Map(clients.map(c => [c.id, c.name]));
      return invoices.map(inv => ({
        ...inv,
        client: { name: clientMap.get(inv.client_id) || 'Cliente non trovato' }
      }));
    }, [invoices, clients]);

    const isLoading = isLoadingInvoices || isLoadingClients;

    if (isLoading) {
      return (
          <Card>
              <CardContent className="p-0">
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </CardContent>
          </Card>
      );
    }

    return (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesWithClients.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.client?.name}</TableCell>
                    <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status ? statusVariant[invoice.status] : 'outline'}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            disabled={!invoice.xml_content}
                            onClick={() => downloadXml(invoice.xml_content!, `Fattura_${invoice.number.replace('/', '-')}.xml`)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Scarica XML
                          </DropdownMenuItem>
                           <DropdownMenuItem disabled>
                            <Download className="mr-2 h-4 w-4" />
                            Scarica PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifica
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem disabled>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplica
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    )
}

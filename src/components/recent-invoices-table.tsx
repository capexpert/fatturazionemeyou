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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Edit, Copy, Trash2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import type { Client, Invoice } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { format } from 'date-fns';
import { useMemo, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


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

export function RecentInvoicesTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

    const invoicesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
          collection(firestore, 'invoices'), 
          orderBy('date', 'desc'),
          limit(5)
        );
    }, [firestore]);
    const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

    const clientsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'clients'));
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

    function handleDeleteInvoice() {
        if (!invoiceToDelete || !firestore) return;
        const invoiceRef = doc(firestore, 'invoices', invoiceToDelete.id);
        deleteDocumentNonBlocking(invoiceRef);
        toast({ title: "Successo!", description: "Eliminazione fattura avviata." });
        setDialogOpen(false);
        setInvoiceToDelete(null);
    }

    if (isLoading) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Fatture Recenti</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                </div>
            </CardContent>
        </Card>
      );
    }

    return (
        <>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Questa azione non può essere annullata. Questo eliminerà permanentemente la fattura e tutti i suoi dati correlati.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteInvoice}>Elimina</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Card>
            <CardHeader>
                <CardTitle>Fatture Recenti</CardTitle>
            </CardHeader>
            <CardContent>
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
                                onClick={() => downloadXml(invoice.xml_content!, `Fattura_${invoice.number.replace(/\//g, '-')}.xml`)}
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
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                    setInvoiceToDelete(invoice);
                                    setDialogOpen(true);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Elimina
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
        </>
    )
}

'use client';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "./forms/client-form";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Client } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

export function ClientsTable({ companyId }: { companyId: string }) {
    const firestore = useFirestore();

    const clientsQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
        return query(collection(firestore, 'clients'), where('companyId', '==', companyId));
    }, [firestore, companyId]);

    const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-0">
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-8" />
                    <Skeleton className="h-8" />
                    <Skeleton className="h-8" />
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
                  <TableHead>Name</TableHead>
                  <TableHead>VAT Number</TableHead>
                  <TableHead>Tax Code</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients && clients.length > 0 ? clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.vat_number || 'N/A'}</TableCell>
                    <TableCell>{client.tax_code || 'N/A'}</TableCell>
                    <TableCell>{client.city}</TableCell>
                    <TableCell className="text-right">
                      <ClientForm client={client} companyId={companyId} />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No clients found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    )
}

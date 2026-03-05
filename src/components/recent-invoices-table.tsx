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
import { MoreHorizontal, Download, Edit, Copy } from "lucide-react";
import { getInvoices } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { format } from 'date-fns';

const statusVariant = {
    paid: 'default',
    sent: 'secondary',
    draft: 'outline',
} as const;

export async function RecentInvoicesTable() {
    const allInvoices = await getInvoices();
    const recentInvoices = allInvoices.slice(0, 5);

    return (
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
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.client?.name}</TableCell>
                    <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Scarica XML
                          </DropdownMenuItem>
                           <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Scarica PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                             <Link href={`/invoices/${invoice.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifica
                             </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem>
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

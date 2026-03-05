import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { getClients } from "@/lib/data";
import { ClientForm } from "./forms/client-form";

export async function ClientsTable() {
    const clients = await getClients();

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
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.vat_number || 'N/A'}</TableCell>
                    <TableCell>{client.tax_code || 'N/A'}</TableCell>
                    <TableCell>{client.city}</TableCell>
                    <TableCell className="text-right">
                      <ClientForm client={client} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    )
}

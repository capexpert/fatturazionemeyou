import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Euro } from "lucide-react";
import { getInvoices } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export async function DashboardStats() {
    const invoices = await getInvoices();
    const currentYear = new Date().getFullYear();
    const invoicesThisYear = invoices.filter(inv => new Date(inv.date).getFullYear() === currentYear);
    
    const totalRevenueThisYear = invoicesThisYear
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fatture Totali (Anno)</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{invoicesThisYear.length}</div>
                    <p className="text-xs text-muted-foreground">nel {currentYear}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Entrate (Anno)</CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalRevenueThisYear)}</div>
                    <p className="text-xs text-muted-foreground">Fatture pagate nel {currentYear}</p>
                </CardContent>
            </Card>
        </div>
    )
}

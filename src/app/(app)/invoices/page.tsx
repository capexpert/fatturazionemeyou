import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from "@/components/page-header";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoicesTable } from '@/components/invoices-table';
import { PlusCircle } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <>
      <PageHeader title="Invoices">
        <Button asChild>
          <Link href="/invoices/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <InvoicesTable />
      </Suspense>
    </>
  );
}

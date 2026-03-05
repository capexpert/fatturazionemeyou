import { Suspense } from 'react';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { DashboardStats } from '@/components/dashboard-stats';
import { RecentInvoicesTable } from '@/components/recent-invoices-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard">
        <Button asChild>
            <Link href="/invoices/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Invoice
            </Link>
        </Button>
      </PageHeader>
      <div className="space-y-8">
        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        }>
          <DashboardStats />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-96" />}>
            <RecentInvoicesTable />
        </Suspense>
      </div>
    </>
  );
}

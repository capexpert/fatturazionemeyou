'use client';
import { Suspense } from 'react';
import { PageHeader } from "@/components/page-header";
import { Skeleton } from '@/components/ui/skeleton';
import { ClientsTable } from '@/components/clients-table';
import { ClientForm } from '@/components/forms/client-form';

export default function ClientsPage() {
  // In a single-tenant app, the companyId is fixed.
  const companyId = "main-company";

  return (
    <>
      <PageHeader title="Clients">
        <ClientForm companyId={companyId} />
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ClientsTable companyId={companyId} />
      </Suspense>
    </>
  );
}

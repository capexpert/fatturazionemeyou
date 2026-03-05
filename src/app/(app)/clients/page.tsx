import { Suspense } from 'react';
import { PageHeader } from "@/components/page-header";
import { Skeleton } from '@/components/ui/skeleton';
import { ClientsTable } from '@/components/clients-table';
import { ClientForm } from '@/components/forms/client-form';

export default function ClientsPage() {
  return (
    <>
      <PageHeader title="Clients">
        <ClientForm />
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ClientsTable />
      </Suspense>
    </>
  );
}

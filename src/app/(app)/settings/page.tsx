'use client';
import { PageHeader } from "@/components/page-header";
import { CompanyForm } from "@/components/forms/company-form";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Company } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const firestore = useFirestore();

  const companyRef = useMemoFirebase(() => {
    if (!firestore) return null;
    // For this single-tenant app, we use a fixed document ID.
    return doc(firestore, 'company', 'main-company');
  }, [firestore]);

  const { data: company, isLoading } = useDoc<Company>(companyRef);

  if (isLoading) {
    return (
        <>
            <PageHeader title="Impostazioni" />
            <div className="space-y-4">
                <Skeleton className="h-[450px] w-full" />
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </>
    );
  }

  return (
    <>
      <PageHeader title="Impostazioni" />
      <CompanyForm company={company} />
    </>
  );
}

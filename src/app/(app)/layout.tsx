'use client';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/(app)/app-sidebar';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4 p-4">
                <Logo className="w-24" />
                <p className="text-muted-foreground">Connessione ai servizi...</p>
                <Skeleton className="h-4 w-48" />
            </div>
        </div>
    );
  }


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isUserLoading, user, router]);

  // Mostra uno stato di caricamento mentre determiniamo dove reindirizzare.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 p-4">
            <Logo className="w-24" />
            <p className="text-muted-foreground">Caricamento...</p>
        </div>
    </div>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Logo } from '@/components/logo';
import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const LoginSchema = z.object({
  email: z.string().email('Indirizzo email non valido.'),
  password: z.string().min(1, 'La password è obbligatoria.'),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isUserLoading || !firestore || !auth) {
      return;
    }

    const verifyUser = async () => {
      if (user) {
        const adminDocRef = doc(firestore, 'roles_admin', user.uid);
        try {
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists()) {
            router.replace('/dashboard');
          } else {
            await auth.signOut();
            toast({
              variant: 'destructive',
              title: 'Accesso Negato',
              description: `Il tuo account non ha i permessi di amministratore. Controlla che il documento con questo UID esista nella collezione 'roles_admin': ${user.uid}`,
              duration: 9000,
            });
            setIsVerifying(false);
          }
        } catch (error) {
           await auth.signOut();
           toast({
              variant: 'destructive',
              title: 'Errore di Permessi',
              description: 'Impossibile verificare il ruolo di amministratore. Controlla le regole di sicurezza o contatta il supporto.',
           });
           setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    };

    verifyUser();
  }, [user, isUserLoading, firestore, auth, router, toast]);

  async function onSubmit(data: LoginFormData) {
    setIsSubmitting(true);
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Servizi di autenticazione o database non disponibili.",
      });
      setIsSubmitting(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const loggedInUser = userCredential.user;

      const adminDocRef = doc(firestore, 'roles_admin', loggedInUser.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        setIsVerifying(true); // This will trigger the useEffect to redirect
      } else {
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Accesso Negato',
          description: `Il tuo account non ha i permessi di amministratore. Controlla che il documento con questo UID esista nella collezione 'roles_admin': ${loggedInUser.uid}`,
          duration: 9000,
        });
      }

    } catch (error: any) {
      let description = "Si è verificato un errore inaspettato.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Credenziali non valide. Riprova.";
      }
      toast({
        variant: 'destructive',
        title: 'Errore di accesso',
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-4">
            <Logo className="w-24" />
            <p className="text-muted-foreground">Verifica in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#2E4BF2] p-4">
      <div className="flex flex-col items-center gap-8">
        <Logo className="w-48 text-white" />
        <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
          <div className="grid gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Accedi</h1>
              <p className="text-balance text-muted-foreground">
                Inserisci le tue credenziali per entrare.
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tua@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Accesso...' : 'Accedi'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

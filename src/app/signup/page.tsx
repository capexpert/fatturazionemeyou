'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';


const SignupSchema = z.object({
  email: z.string().email('Indirizzo email non valido.'),
  password: z.string().min(6, 'La password deve contenere almeno 6 caratteri.'),
});

type SignupFormData = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);


  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(data: SignupFormData) {
    setIsSubmitting(true);
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Servizio di autenticazione non disponibile.",
      });
      setIsSubmitting(false);
      return;
    }
    try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        // The useEffect will handle redirection
    } catch (error: any) {
        let description = "Si è verificato un errore inaspettato.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Questo indirizzo email è già in uso.";
        }
        toast({
            variant: 'destructive',
            title: 'Errore di registrazione',
            description,
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (isUserLoading || (!isUserLoading && user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-4">
            <Logo className="w-24" />
            <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-4 text-center">
            <Logo className="mx-auto w-32" />
            <h1 className="text-3xl font-bold">Crea un Account</h1>
            <p className="text-balance text-muted-foreground">
              Inserisci i tuoi dati per registrarti.
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
                {isSubmitting ? 'Registrazione...' : 'Registrati'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Hai già un account?{' '}
            <Link href="/login" className="underline">
              Accedi
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block" />
    </div>
  );
}
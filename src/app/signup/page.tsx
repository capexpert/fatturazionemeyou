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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#2E4BF2] p-4">
      <div className="flex flex-col items-center gap-8">
        <Logo className="w-48 text-white" />
        <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
            <div className="grid gap-6">
                <div className="grid gap-2 text-center">
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
      </div>
    </div>
  );
}

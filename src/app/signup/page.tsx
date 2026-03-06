'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="mx-auto mb-4 w-24" />
          <CardTitle>Crea un Account</CardTitle>
          <CardDescription>Inserisci i tuoi dati per registrarti.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Hai già un account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Accedi
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CompanySchema } from '@/lib/schemas';
import type { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';

export function CompanyForm({ company }: { company: Company | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<Omit<Company, 'id'>>({
    resolver: zodResolver(CompanySchema),
    defaultValues: company || {
      company_name: '',
      vat_number: '',
      tax_code: '',
      address: '',
      city: '',
      province: '',
      zip: '',
      country: 'IT',
      pec_email: '',
      iban: '',
      regime_fiscale: '',
    },
  });

  useEffect(() => {
    if (company) {
      form.reset(company);
    }
  }, [company, form]);

  async function onSubmit(data: Omit<Company, 'id'>) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available or user not logged in.' });
        return;
    }
    
    const companyRef = doc(firestore, 'company', 'main-company');
    
    // The security rules need the 'companyId' field for authorization.
    const dataToSave = { ...data, id: 'main-company' };

    setDocumentNonBlocking(companyRef, dataToSave, { merge: true });
    
    toast({
      title: 'Successo',
      description: 'Aggiornamento profilo aziendale avviato.',
    });
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Azienda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Azienda</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company SRL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vat_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partita IVA</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678901" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tax_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Fiscale</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678901" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Via Roma, 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Città</FormLabel>
                    <FormControl>
                      <Input placeholder="Milano" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input placeholder="MI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>CAP</FormLabel>
                    <FormControl>
                        <Input placeholder="20121" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Paese</FormLabel>
                    <FormControl>
                        <Input placeholder="IT" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="pec_email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email PEC</FormLabel>
                    <FormControl>
                        <Input placeholder="your.company@pec.it" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>IBAN</FormLabel>
                    <FormControl>
                        <Input placeholder="IT39O0326811702052447879470" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="regime_fiscale"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Regime Fiscale</FormLabel>
                    <FormControl>
                        <Input placeholder="RF01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Es: RF01 (Ordinario), RF02 (Contribuenti minimi), RF19 (Forfettario). L'XML verrà generato di conseguenza.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
             <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

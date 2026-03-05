'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientSchema } from '@/lib/schemas';
import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlusCircle, Edit } from 'lucide-react';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

type ClientFormProps = {
  client?: Client;
  companyId: string;
  trigger?: React.ReactNode;
  onClientCreated?: (newClient: Client & { id: string }) => void;
};

// We omit 'id' and 'companyId' from the form values, as they are handled separately.
type ClientFormData = Omit<Client, 'id' | 'companyId'>;

export function ClientForm({ client, companyId, trigger, onClientCreated }: ClientFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: client ? {
      ...client
    } : {
      name: '',
      vat_number: '',
      tax_code: '',
      address: '',
      city: '',
      province: '',
      zip: '',
      country: 'IT',
      pec: '',
      sdi_code: '0000000',
    },
  });

  async function onSubmit(data: ClientFormData) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.' });
      return;
    }

    const dataToSave = { ...data, companyId };
    
    if (client?.id) {
      const clientRef = doc(firestore, 'clients', client.id);
      setDocumentNonBlocking(clientRef, dataToSave, { merge: true });
       toast({
        title: 'Success',
        description: 'Client update initiated.',
      });
    } else {
      const clientsCollection = collection(firestore, 'clients');
      addDocumentNonBlocking(clientsCollection, dataToSave).then(docRef => {
        if(docRef && onClientCreated) {
            onClientCreated({ ...dataToSave, id: docRef.id });
        }
      });
       toast({
        title: 'Success',
        description: 'Client creation initiated.',
      });
      form.reset();
    }

    router.refresh();
    setOpen(false);
  }

  const defaultTrigger = client ? (
    <Button variant="ghost" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
  ) : (
    <Button>
      <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            Enter the details for the client.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Client S.p.A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="vat_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Number</FormLabel>
                  <FormControl><Input placeholder="12345678901" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tax_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Code</FormLabel>
                  <FormControl><Input placeholder="RSSMRA80A01H501U" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input placeholder="Via Nuova, 10" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Roma" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="province" render={({ field }) => (
                  <FormItem><FormLabel>Province</FormLabel><FormControl><Input placeholder="RM" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="zip" render={({ field }) => (
                  <FormItem><FormLabel>ZIP</FormLabel><FormControl><Input placeholder="00100" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="IT" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="pec" render={({ field }) => (
                <FormItem>
                  <FormLabel>PEC Email</FormLabel>
                  <FormControl><Input placeholder="client@pec.it" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sdi_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>SDI Code</FormLabel>
                  <FormControl><Input placeholder="SUBM70N" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

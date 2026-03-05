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
import { saveClient } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlusCircle, Edit } from 'lucide-react';

type ClientFormProps = {
  client?: Client;
};

export function ClientForm({ client }: ClientFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<Client>({
    resolver: zodResolver(ClientSchema),
    defaultValues: client || {
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

  async function onSubmit(data: Client) {
    try {
      await saveClient({ ...client, ...data });
      toast({
        title: 'Success',
        description: `Client ${client ? 'updated' : 'created'} successfully.`,
      });
      router.refresh();
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${client ? 'update' : 'create'} client.`,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {client ? (
          <Button variant="ghost" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
          </Button>
        )}
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

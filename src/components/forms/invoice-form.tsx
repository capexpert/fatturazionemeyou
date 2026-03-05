'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceSchema, type InvoiceFormData } from '@/lib/schemas';
import type { Client, InvoiceWithItems } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { saveInvoiceAction } from '@/app/actions';
import { cn, formatCurrency } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { ClientForm } from './client-form';
import { Separator } from '../ui/separator';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

type InvoiceFormProps = {
  invoice?: InvoiceWithItems;
  nextInvoiceNumber: string;
};

export function InvoiceForm({ invoice, nextInvoiceNumber }: InvoiceFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'clients'), where('companyId', '==', 'main-company'));
  }, [firestore]);

  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: invoice
      ? {
          id: invoice.id,
          client_id: invoice.client_id,
          date: new Date(invoice.date),
          items: invoice.items.map(item => ({
            ...item,
            vat_rate: item.vat_rate as 4 | 5 | 10 | 22
          })),
        }
      : {
          client_id: '',
          date: new Date(),
          items: [
            { id: '1', title: '', description: '', quantity: 1, unit_price: 0, vat_rate: 22 },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({
    control: form.control,
    name: 'items',
  });

  const { subtotal, vatTotal, grandTotal } = watchedItems.reduce(
    (acc, item) => {
      const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
      const vatAmount = lineTotal * ((item.vat_rate || 0) / 100);
      acc.subtotal += lineTotal;
      acc.vatTotal += vatAmount;
      acc.grandTotal += lineTotal + vatAmount;
      return acc;
    },
    { subtotal: 0, vatTotal: 0, grandTotal: 0 }
  );
  
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'client_id' && clients) {
        const client = clients.find(c => c.id === value.client_id);
        if (client && client.sdi_code === '0000000' && !client.pec) {
           toast({
            variant: 'destructive',
            title: 'Attenzione Cliente',
            description: `Il cliente "${client.name}" ha codice SDI '0000000' ma nessun indirizzo PEC. La fattura elettronica potrebbe essere rifiutata.`,
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, clients, toast]);

  const handleClientCreated = (newClient: Client & { id: string }) => {
    form.setValue('client_id', newClient.id, { shouldValidate: true });
  };


  return (
    <Form {...form}>
      <form action={async (formData) => {
          const data = Object.fromEntries(formData.entries());
          const items = JSON.parse(data.items as string);
          const date = new Date(data.date as string);
          const client_id = data.client_id as string;
          const id = data.id as string | undefined;
          
          await form.handleSubmit(async () => {
             await saveInvoiceAction({id, client_id, date, items})
          })();
      }}>
       <input type="hidden" name="items" value={JSON.stringify(watchedItems)} />
       {invoice?.id && <input type="hidden" name="id" value={invoice.id} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                    <CardTitle>Dettagli Fattura</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
                        <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona un cliente" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <div onPointerDown={e => e.preventDefault()} >
                                    <ClientForm 
                                    companyId="main-company"
                                    onClientCreated={handleClientCreated}
                                    trigger={
                                        <div className="flex w-full cursor-pointer items-center gap-2 p-2 text-sm hover:bg-accent rounded-sm">
                                            <PlusCircle className="h-4 w-4" />
                                            Aggiungi nuovo cliente
                                        </div>
                                    }
                                    />
                                </div>
                                <Separator className="my-1" />
                                {isLoadingClients ? (
                                    <SelectItem value="loading" disabled>Caricamento clienti...</SelectItem>
                                ) : (
                                    clients && clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                    ))
                                )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Data Fattura</FormLabel>
                            <input type="hidden" name={field.name} value={field.value.toISOString()} />
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={'outline'}
                                    className={cn(
                                        'w-full pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, 'PPP')
                                    ) : (
                                        <span>Scegli una data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormItem>
                            <FormLabel>Numero Fattura</FormLabel>
                            <FormControl>
                                <Input disabled value={invoice ? invoice.number : nextInvoiceNumber} />
                            </FormControl>
                        </FormItem>
                    </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Articoli</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-4">
                        {fields.map((field, index) => {
                        const netTotal = (watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0);
                        const grossTotal = netTotal * (1 + (watchedItems[index]?.vat_rate || 0) / 100);
                        return (
                            <div key={field.id} className="rounded-lg border bg-card p-4 relative space-y-4">
                                {fields.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.title`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Titolo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Es. Sviluppo sito web" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrizione</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Descrizione dettagliata del servizio fornito" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Qtà</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.unit_price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Prezzo</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.vat_rate`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IVA</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {[22, 10, 5, 4].map(rate => <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormItem>
                                        <FormLabel>Totale Netto</FormLabel>
                                        <FormControl>
                                            <Input disabled value={formatCurrency(netTotal)} />
                                        </FormControl>
                                    </FormItem>
                                    <FormItem>
                                        <FormLabel>Totale Lordo</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={grossTotal > 0 ? (Math.round(grossTotal * 100) / 100) : ''}
                                                onChange={(e) => {
                                                    if (e.target.value === '') {
                                                        form.setValue(`items.${index}.unit_price`, 0, { shouldValidate: true, shouldDirty: true });
                                                        return;
                                                    }
                                                    // Handle comma as decimal separator
                                                    const grossTotalValue = parseFloat(e.target.value.replace(',', '.'));
                                                    const item = form.getValues(`items.${index}`);
                                                    const quantity = item.quantity || 1;
                                                    const vatRate = item.vat_rate || 0;

                                                    if (!isNaN(grossTotalValue) && quantity > 0) {
                                                        const newUnitPrice = (grossTotalValue / (1 + vatRate / 100)) / quantity;
                                                        const currentUnitPrice = item.unit_price || 0;
                                                        if (Math.abs(currentUnitPrice - newUnitPrice) > 0.0001) {
                                                          form.setValue(`items.${index}.unit_price`, newUnitPrice, { shouldValidate: true, shouldDirty: true });
                                                        }
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                    </FormItem>
                                </div>
                            </div>
                        )
                        })}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => append({ id: `${fields.length+1}`, title: '', description: '', quantity: 1, unit_price: 0, vat_rate: 22 })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Articolo
                    </Button>
                    </CardContent>
                </Card>
          </div>
          <div className="lg:col-span-1">
            <div className="p-6 bg-card rounded-lg border sticky top-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Imponibile</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">IVA</span>
                        <span className="font-medium">{formatCurrency(vatTotal)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2 text-lg font-bold">
                        <span>Totale</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Salvataggio...' : (invoice ? 'Aggiorna Fattura' : 'Salva Fattura')}
                </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

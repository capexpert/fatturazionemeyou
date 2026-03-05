'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceSchema, type InvoiceFormData } from '@/lib/schemas';
import type { Client, InvoiceWithItems, Company, Invoice, InvoiceItem } from '@/lib/types';
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
import { generateInvoiceXMLAction } from '@/app/actions';
import { cn, formatCurrency } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { ClientForm } from './client-form';
import { Separator } from '../ui/separator';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';

type InvoiceFormProps = {
  invoice?: InvoiceWithItems;
  nextInvoiceNumber: string;
};

export function InvoiceForm({ invoice, nextInvoiceNumber }: InvoiceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'clients'));
  }, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const companyRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'company', 'main-company');
  }, [firestore]);
  const { data: company, isLoading: isLoadingCompany } = useDoc<Company>(companyRef);

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
            { id: '', title: '', description: '', quantity: 1, unit_price: 0, vat_rate: 22 },
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
  
  const handleSaveInvoice = async (data: InvoiceFormData) => {
    if (!firestore || !company || !clients) {
      toast({ variant: 'destructive', title: 'Errore', description: 'I servizi non sono pronti. Riprova tra poco.' });
      return;
    }
    
    if (!company.company_name || !company.vat_number) {
        toast({
            variant: 'destructive',
            title: 'Profilo Aziendale Incompleto',
            description: 'Per favore, completa il tuo profilo aziendale nelle Impostazioni prima di generare una fattura.',
        });
        setIsSaving(false);
        return;
    }

    setIsSaving(true);
    
    const client = clients.find(c => c.id === data.client_id);
    if (!client) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Cliente non trovato.' });
      setIsSaving(false);
      return;
    }

    try {
      const batch = writeBatch(firestore);
      const isUpdate = !!invoice?.id;
      const invoiceId = invoice?.id || doc(collection(firestore, 'invoices')).id;
      const invoiceRef = doc(firestore, 'invoices', invoiceId);
      
      if (isUpdate && invoice) {
        const originalItemIds = invoice.items.map(i => i.id);
        const currentFormItemIds = new Set(data.items.map(item => item.id).filter(Boolean));

        for (const originalId of originalItemIds) {
          if (!currentFormItemIds.has(originalId)) {
            const itemToDeleteRef = doc(firestore, 'invoiceItems', originalId);
            batch.delete(itemToDeleteRef);
          }
        }
      }
      
      const invoiceData: Omit<Invoice, 'client' | 'xml_url' | 'pdf_url' | 'xml_content'> = {
        id: invoiceId,
        number: invoice?.number || nextInvoiceNumber,
        year: data.date.getFullYear(),
        date: data.date.toISOString(),
        client_id: data.client_id,
        companyId: 'main-company',
        subtotal,
        vat_total: vatTotal,
        total: grandTotal,
        status: invoice?.status || 'draft',
        created_at: invoice?.created_at || new Date().toISOString(),
      };
      
      batch.set(invoiceRef, invoiceData, { merge: true });
      
      data.items.forEach(item => {
        const itemId = item.id || doc(collection(firestore, 'invoiceItems')).id;
        const itemRef = doc(firestore, 'invoiceItems', itemId);
        const dbItem: InvoiceItem = {
          id: itemId,
          invoiceId: invoiceId,
          companyId: 'main-company',
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
        };
        batch.set(itemRef, dbItem);
      });

      await batch.commit();
      
      toast({ title: 'Successo!', description: 'Fattura salvata nel database.' });

      // Generate and save the XML
      const xmlInput = {
        company: {
          company_name: company.company_name,
          vat_number: company.vat_number,
          tax_code: company.tax_code,
          address: company.address,
          city: company.city,
          province: company.province,
          zip: company.zip,
          country: company.country,
          pec_email: company.pec_email,
          iban: company.iban,
          regime_fiscale: company.regime_fiscale,
        },
        client: {
            name: client.name,
            vat_number: client.vat_number,
            tax_code: client.tax_code,
            address: client.address,
            city: client.city,
            province: client.province,
            zip: client.zip,
            country: client.country,
            pec: client.pec,
            sdi_code: client.sdi_code,
        },
        invoice: {
            number: invoiceData.number,
            date: format(data.date, 'yyyy-MM-dd'),
            subtotal,
            vat_total: vatTotal,
            total: grandTotal,
            currency: 'EUR',
        },
        invoice_items: data.items.map((item) => ({
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            line_total: item.quantity * item.unit_price,
        })),
      };

      const xmlResult = await generateInvoiceXMLAction(xmlInput);

      if (xmlResult.xml) {
        await updateDoc(invoiceRef, { xml_content: xmlResult.xml, status: 'sent' });
        toast({ title: 'Successo!', description: 'File XML generato e salvato.' });
      } else {
        toast({
          variant: 'destructive',
          title: 'Errore Generazione XML',
          description: xmlResult.message || 'Non è stato possibile generare il file XML. La fattura è salvata come bozza.',
        });
      }
      
      router.push('/invoices');

    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({ variant: 'destructive', title: 'Errore nel salvataggio', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  }


  if (isLoadingClients || isLoadingCompany) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-48 w-full" />
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSaveInvoice)} className="space-y-8">
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
                    <FormItem className="flex flex-col pt-2">
                        <FormLabel>Data Fattura</FormLabel>
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
                                        <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
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
                                    <Input disabled value={formatCurrency(watchedItems[index].quantity * watchedItems[index].unit_price)} />
                                </FormControl>
                            </FormItem>
                            <FormItem>
                                <FormLabel>Totale Lordo</FormLabel>
                                <FormControl>
                                <Input
                                    type="text"
                                    placeholder="0,00"
                                    value={
                                        watchedItems[index]?.unit_price > 0
                                        ? (
                                            (watchedItems[index].quantity * watchedItems[index].unit_price) *
                                            (1 + watchedItems[index].vat_rate / 100)
                                            ).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : ''
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\./g, '').replace(',', '.');
                                        const grossTotalValue = parseFloat(value);
                                        
                                        if (isNaN(grossTotalValue)) {
                                            form.setValue(`items.${index}.unit_price`, 0, { shouldValidate: true, shouldDirty: true });
                                            return;
                                        }
                                        
                                        const item = form.getValues(`items.${index}`);
                                        const quantity = item.quantity || 1;
                                        const vatRate = item.vat_rate || 0;

                                        if (quantity > 0) {
                                            const newUnitPrice = (grossTotalValue / (1 + vatRate / 100)) / quantity;
                                            form.setValue(`items.${index}.unit_price`, parseFloat(newUnitPrice.toFixed(2)), { shouldValidate: true, shouldDirty: true });
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
                onClick={() => append({ id: '', title: '', description: '', quantity: 1, unit_price: 0, vat_rate: 22 })}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Articolo
            </Button>
            </CardContent>
        </Card>
      
        <Card>
            <CardHeader>
                <CardTitle>Riepilogo e Salvataggio</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Imponibile</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">IVA</span>
                        <span className="font-medium">{formatCurrency(vatTotal)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Totale</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? 'Salvataggio...' : (invoice ? 'Aggiorna Fattura' : 'Salva e Genera Documenti')}
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

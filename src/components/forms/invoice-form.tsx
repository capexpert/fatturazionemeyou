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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
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

type InvoiceFormProps = {
  clients: Client[];
  invoice?: InvoiceWithItems;
  nextInvoiceNumber: string;
};

export function InvoiceForm({ clients, invoice, nextInvoiceNumber }: InvoiceFormProps) {
  const { toast } = useToast();
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
  
  // When switching client, if SDI code is 0000000, check if PEC is available
   useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'client_id') {
        const client = clients.find(c => c.id === value.client_id);
        if (client && client.sdi_code === '0000000' && !client.pec) {
           toast({
            variant: 'destructive',
            title: 'Client Warning',
            description: `Client "${client.name}" has SDI code '0000000' but no PEC address. The electronic invoice may be rejected.`,
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, clients, toast]);

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

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <div onPointerDown={e => e.preventDefault()} >
                            <ClientForm 
                              companyId="main-company"
                              onClientCreated={(newClient) => {
                                  form.setValue('client_id', newClient.id, { shouldValidate: true });
                              }}
                              trigger={
                                  <div className="flex w-full cursor-pointer items-center gap-2 p-2 text-sm hover:bg-accent rounded-sm">
                                      <PlusCircle className="h-4 w-4" />
                                      Aggiungi nuovo cliente
                                  </div>
                              }
                            />
                          </div>
                          <Separator className="my-1" />
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Invoice Date</FormLabel>
                       <input type="hidden" name={field.name} value={field.value.toISOString()} />
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
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
                <div className="space-y-2">
                    <FormLabel>Invoice Number</FormLabel>
                    <Input disabled value={invoice ? invoice.number : nextInvoiceNumber} />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-2 font-medium">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Title</TableHead>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>VAT</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.title`}
                            render={({ field }) => <Input {...field} placeholder="e.g. Website development"/>}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => <Input {...field} placeholder="Detailed description"/>}
                          />
                        </TableCell>
                        <TableCell>
                           <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />}
                          />
                        </TableCell>
                         <TableCell>
                           <FormField
                            control={form.control}
                            name={`items.${index}.unit_price`}
                            render={({ field }) => <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.vat_rate`}
                            render={({ field }) => (
                               <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[22, 10, 5, 4].map(rate => <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>)}
                                </SelectContent>
                               </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0))}
                        </TableCell>
                        <TableCell>
                          {fields.length > 1 && <Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => append({ id: `${fields.length+1}`, title: '', description: '', quantity: 1, unit_price: 0, vat_rate: 22 })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          <aside className="top-8 w-full space-y-4 lg:sticky lg:w-80">
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>VAT</span>
                        <span className="font-medium">{formatCurrency(vatTotal)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-4 text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                     <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : (invoice ? 'Update Invoice' : 'Save Invoice')}
                    </Button>
                </CardFooter>
            </Card>
          </aside>
        </div>
      </form>
    </Form>
  );
}

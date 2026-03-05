import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { Company, Client, Invoice } from '@/lib/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '1px solid #eaeaea',
    paddingBottom: 10,
  },
  companyDetails: {
    flexDirection: 'column',
  },
  invoiceDetails: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  section: {
    marginBottom: 20,
  },
  clientDetails: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    marginBottom: 3,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    backgroundColor: '#f5f5f5',
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eaeaea',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  colDescription: {
    width: '45%',
  },
  colQty: {
    width: '10%',
    textAlign: 'right',
  },
  colPrice: {
    width: '15%',
    textAlign: 'right',
  },
  colVat: {
    width: '10%',
    textAlign: 'right',
  },
  colTotal: {
    width: '20%',
    textAlign: 'right',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryContainer: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingBottom: 5,
  },
  summaryTotal: {
    borderTop: '1px solid #333',
    marginTop: 5,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
  },
});

interface InvoiceDocumentProps {
    invoice: Invoice;
    company: Company;
    client: Client;
}

export function InvoiceDocument({ invoice, company, client }: InvoiceDocumentProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.companyDetails}>
                        <Text style={styles.title}>{company.company_name}</Text>
                        <Text style={styles.text}>{company.address}</Text>
                        <Text style={styles.text}>{company.zip}, {company.city} ({company.province})</Text>
                        <Text style={styles.text}>P.IVA: {company.vat_number}</Text>
                        <Text style={styles.text}>C.F: {company.tax_code}</Text>
                    </View>
                    <View style={styles.invoiceDetails}>
                        <Text style={styles.title}>Fattura</Text>
                        <Text style={styles.text}>Numero: {invoice.number}</Text>
                        <Text style={styles.text}>Data: {format(new Date(invoice.date), 'dd/MM/yyyy')}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.subtitle}>Cliente:</Text>
                    <View style={styles.clientDetails}>
                        <Text style={styles.text}>{client.name}</Text>
                        <Text style={styles.text}>{client.address}</Text>
                        <Text style={styles.text}>{client.zip}, {client.city} ({client.province})</Text>
                        {client.vat_number && <Text style={styles.text}>P.IVA: {client.vat_number}</Text>}
                        {client.tax_code && <Text style={styles.text}>C.F: {client.tax_code}</Text>}
                    </View>
                </View>
                
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableRow}>
                        <View style={[styles.tableColHeader, styles.colDescription]}><Text>Descrizione</Text></View>
                        <View style={[styles.tableColHeader, styles.colQty]}><Text>Qtà</Text></View>
                        <View style={[styles.tableColHeader, styles.colPrice]}><Text>Prezzo</Text></View>
                        <View style={[styles.tableColHeader, styles.colVat]}><Text>IVA</Text></View>
                        <View style={[styles.tableColHeader, styles.colTotal]}><Text>Totale</Text></View>
                    </View>
                    {/* Table Body */}
                    {invoice.items.map(item => (
                        <View key={item.id} style={styles.tableRow}>
                            <View style={[styles.tableCol, styles.colDescription]}><Text>{item.title}</Text></View>
                            <View style={[styles.tableCol, styles.colQty]}><Text>{item.quantity}</Text></View>
                            <View style={[styles.tableCol, styles.colPrice]}><Text>{formatCurrency(item.unit_price)}</Text></View>
                            <View style={[styles.tableCol, styles.colVat]}><Text>{item.vat_rate}%</Text></View>
                            <View style={[styles.tableCol, styles.colTotal]}><Text>{formatCurrency(item.quantity * item.unit_price * (1 + item.vat_rate / 100))}</Text></View>
                        </View>
                    ))}
                </View>

                <View style={styles.summary}>
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text>Imponibile</Text>
                            <Text>{formatCurrency(invoice.subtotal)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text>IVA</Text>
                            <Text>{formatCurrency(invoice.vat_total)}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.summaryTotal]}>
                            <Text>Totale</Text>
                            <Text>{formatCurrency(invoice.total)}</Text>
                        </View>
                    </View>
                </View>
                
                <Text style={styles.footer}>
                    Fattura generata con FatturaNow - Documento senza valore fiscale se non seguito da Fattura Elettronica.
                </Text>
            </Page>
        </Document>
    );
}

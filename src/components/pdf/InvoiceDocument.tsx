import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { Company, Client, Invoice, InvoiceItem } from '@/lib/types';

// Use standard Helvetica font
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        padding: 40,
        backgroundColor: '#fff',
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
        paddingBottom: 10,
    },
    companyDetails: {
        flexDirection: 'column',
    },
    clientDetails: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        textAlign: 'right',
    },
    addressText: {
        fontSize: 10,
        color: '#666'
    },
    bold: {
        fontWeight: 'bold',
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    invoiceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    detailText: {
        marginBottom: 4,
    },
    detailLabel: {
        fontWeight: 'bold'
    },
    table: {
        width: '100%',
        marginBottom: 20,
        border: '1px solid #eaeaea',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
    },
    tableHeaderCol: {
        padding: 8,
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 8,
    },
    colDescription: {
        width: '45%',
    },
    colQty: {
        width: '10%',
        textAlign: 'right',
    },
    colPrice: {
        width: '20%',
        textAlign: 'right',
    },
    colVat: {
        width: '10%',
        textAlign: 'right',
    },
    colTotal: {
        width: '15%',
        textAlign: 'right',
    },
    summary: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    summaryContainer: {
        width: '45%',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 4,
        paddingBottom: 4,
    },
    summaryTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#333',
        marginTop: 5,
        fontWeight: 'bold',
        fontSize: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#888',
        borderTopWidth: 1,
        borderTopColor: '#eaeaea',
        paddingTop: 5,
    },
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

interface InvoiceDocumentProps {
  invoice: Invoice;
  invoiceItems: InvoiceItem[];
  company: Company;
  client: Client;
}

export const InvoiceDocument = ({ invoice, invoiceItems, company, client }: InvoiceDocumentProps) => (
  <Document title={`Fattura ${invoice.number}`} author={company.company_name}>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.companyDetails}>
            <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5 }}>{company.company_name}</Text>
            <Text style={styles.addressText}>{company.address}</Text>
            <Text style={styles.addressText}>{company.zip} {company.city} ({company.province})</Text>
            <Text style={styles.addressText}>P.IVA: {company.vat_number}</Text>
            <Text style={styles.addressText}>CF: {company.tax_code}</Text>
        </View>
        <View style={styles.clientDetails}>
            <Text style={styles.bold}>Spett.le</Text>
            <Text>{client.name}</Text>
            <Text style={styles.addressText}>{client.address}</Text>
            <Text style={styles.addressText}>{client.zip} {client.city} ({client.province})</Text>
            {client.vat_number && <Text style={styles.addressText}>P.IVA: {client.vat_number}</Text>}
            {client.tax_code && <Text style={styles.addressText}>CF: {client.tax_code}</Text>}
        </View>
      </View>

      <Text style={styles.invoiceTitle}>Fattura</Text>

      <View style={styles.invoiceDetails}>
          <View>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Numero Fattura: </Text>{invoice.number}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Data Fattura: </Text>{new Date(invoice.date).toLocaleDateString('it-IT')}</Text>
          </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colDescription]}>Descrizione</Text>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>Qtà</Text>
            <Text style={[styles.tableHeaderCol, styles.colPrice]}>Prezzo Unit.</Text>
            <Text style={[styles.tableHeaderCol, styles.colVat]}>IVA</Text>
            <Text style={[styles.tableHeaderCol, styles.colTotal]}>Totale</Text>
        </View>
        {invoiceItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDescription]}>{item.title}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
                <Text style={[styles.tableCell, styles.colVat]}>{item.vat_rate}%</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.quantity * item.unit_price)}</Text>
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
            <View style={styles.summaryTotal}>
                <Text>Totale Fattura</Text>
                <Text>{formatCurrency(invoice.total)}</Text>
            </View>
        </View>
      </View>
      
       <View style={styles.footer}>
            <Text>Pagamento tramite bonifico bancario su IBAN: {company.iban}</Text>
            <Text>{company.company_name} - Regime Fiscale: {company.regime_fiscale}</Text>
        </View>
    </Page>
  </Document>
);

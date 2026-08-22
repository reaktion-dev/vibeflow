import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { WordDocModel, DocTableSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface InvoiceLayoutProps {
  model: WordDocModel;
}

export const InvoicePdfLayout: React.FC<InvoiceLayoutProps> = ({ model }) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['corporate-navy'];
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';
  const meta = model.invoiceMeta || {
    taxInvoiceNumber: 'INV-2026-8809',
    accountNumber: '800128031',
    pinCode: '506109',
    dueDate: '2026-03-20',
    remittanceBank: 'Standard Bank Corporate',
    remittanceAccount: '8001280315',
  };

  const styles = StyleSheet.create({
    page: {
      padding: 32,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 8,
      color: '#1E293B',
      justifyContent: 'space-between',
    },

    // Header Ribbon
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1.5,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 14,
      marginBottom: 12,
    },
    orgTitle: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      letterSpacing: 0.5,
    },
    orgTagline: {
      fontSize: 8,
      color: '#64748B',
      marginTop: 2,
    },
    invoiceBadge: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      textTransform: 'uppercase',
      textAlign: 'right',
    },
    invoiceMetaText: {
      fontSize: 7.5,
      color: '#64748B',
      textAlign: 'right',
      marginTop: 1,
    },

    // 2-Column Statement Info Grid
    statementGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
    },
    billToBox: {
      flex: 1,
      padding: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 4,
      backgroundColor: '#F8FAFC',
    },
    statementMetaBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    metaRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: '#E2E8F0',
    },
    metaLabel: {
      width: '45%',
      backgroundColor: '#F8FAFC',
      padding: 4,
      fontFamily: 'Helvetica-Bold',
      fontSize: 7,
      color: '#475569',
    },
    metaValue: {
      width: '55%',
      padding: 4,
      fontSize: 7,
      color: '#1E293B',
    },

    // Dark Account Banner Bar
    accountBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#1E293B',
      color: '#FFFFFF',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 3,
      marginVertical: 8,
    },
    accountBannerText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.5,
    },

    // Line Items Table
    tableContainer: {
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
      marginVertical: 8,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      paddingVertical: 5,
      paddingHorizontal: 6,
    },
    tableHeaderText: {
      color: '#FFFFFF',
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 0.5,
      borderTopColor: '#E2E8F0',
      paddingVertical: 4.5,
      paddingHorizontal: 6,
    },
    tableRowZebra: {
      backgroundColor: '#F8FAFC',
    },

    // Aging Summary 6-Column Matrix
    agingMatrix: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
      marginVertical: 8,
    },
    agingCol: {
      flex: 1,
      alignItems: 'center',
      borderRightWidth: 0.5,
      borderRightColor: '#E2E8F0',
    },
    agingHeader: {
      width: '100%',
      backgroundColor: '#F1F5F9',
      paddingVertical: 3,
      textAlign: 'center',
      fontSize: 6.5,
      fontFamily: 'Helvetica-Bold',
      color: '#475569',
      textTransform: 'uppercase',
    },
    agingValue: {
      paddingVertical: 4,
      fontSize: 7.5,
      fontFamily: 'Helvetica',
      color: '#1E293B',
    },
    totalDueCol: {
      width: '24%',
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 6,
    },
    totalDueLabel: {
      color: '#FFFFFF',
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },
    totalDueAmount: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginTop: 2,
    },

    // Perforated Remittance Tear-off Slip
    remittanceSlip: {
      borderTopWidth: 1,
      borderTopColor: '#94A3B8',
      borderStyle: 'dashed',
      paddingTop: 12,
      marginTop: 10,
      backgroundColor: '#FAFAFA',
      padding: 10,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: '#E2E8F0',
    },
    remittanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    barcodeSimulation: {
      height: 18,
      backgroundColor: '#1E293B',
      marginTop: 6,
      borderRadius: 1,
    },
  });

  const tableSections = model.sections.filter((s) => s.type === 'table') as DocTableSection[];

  return (
    <Page size={pageSize} wrap={false} style={styles.page}>
      <View>
        {/* ── 1. Header Ribbon ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgTitle}>{model.organization || 'Enterprise Billing'}</Text>
            <Text style={styles.orgTagline}>Official Tax Invoice & Account Statement</Text>
          </View>

          <View>
            <Text style={styles.invoiceBadge}>TAX INVOICE</Text>
            <Text style={styles.invoiceMetaText}>Invoice No: {meta.taxInvoiceNumber}</Text>
            <Text style={styles.invoiceMetaText}>
              Date: {model.date || new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* ── 2. Statement & Client Details Grid ────────────────────────────── */}
        <View style={styles.statementGrid}>
          {/* Bill To */}
          <View style={styles.billToBox}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748B', marginBottom: 2 }}>
              BILLED TO:
            </Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0F172A' }}>
              {model.title || 'Enterprise Client'}
            </Text>
            <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 2 }}>
              {meta.clientAddress || '100 Executive Boulevard, Suite 400'}
            </Text>
          </View>

          {/* Statement Meta Table */}
          <View style={styles.statementMetaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Statement Date</Text>
              <Text style={styles.metaValue}>{model.date || new Date().toLocaleDateString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Account Number</Text>
              <Text style={styles.metaValue}>{meta.accountNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Due Date</Text>
              <Text style={[styles.metaValue, { fontFamily: 'Helvetica-Bold', color: '#B91C1C' }]}>
                {meta.dueDate}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Account Banner Bar ─────────────────────────────────────────── */}
        <View style={styles.accountBanner}>
          <Text style={styles.accountBannerText}>ACCOUNT NO: {meta.accountNumber}</Text>
          <Text style={styles.accountBannerText}>PIN CODE: {meta.pinCode}</Text>
        </View>

        {/* ── 4. Itemized Charges Table ─────────────────────────────────────── */}
        {tableSections.map((table, tIdx) => (
          <View key={tIdx} style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              {table.headers.map((h, hIdx) => (
                <View key={hIdx} style={{ flex: 1 }}>
                  <Text style={styles.tableHeaderText}>{h}</Text>
                </View>
              ))}
            </View>

            {table.rows.map((row, rIdx) => (
              <View
                key={rIdx}
                style={[styles.tableRow, rIdx % 2 === 1 ? styles.tableRowZebra : undefined]}
              >
                {row.map((cell, cIdx) => (
                  <View key={cIdx} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 7.5, color: '#334155' }}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}

        {/* ── 5. Aging Summary 6-Column Matrix ──────────────────────────────── */}
        <View style={styles.agingMatrix}>
          <View style={styles.agingCol}>
            <Text style={styles.agingHeader}>90 Days+</Text>
            <Text style={styles.agingValue}>$0.00</Text>
          </View>
          <View style={styles.agingCol}>
            <Text style={styles.agingHeader}>60 Days</Text>
            <Text style={styles.agingValue}>$0.00</Text>
          </View>
          <View style={styles.agingCol}>
            <Text style={styles.agingHeader}>30 Days</Text>
            <Text style={styles.agingValue}>$0.00</Text>
          </View>
          <View style={styles.agingCol}>
            <Text style={styles.agingHeader}>Current</Text>
            <Text style={styles.agingValue}>$4,827.36</Text>
          </View>
          <View style={styles.agingCol}>
            <Text style={styles.agingHeader}>Total Due</Text>
            <Text style={[styles.agingValue, { fontFamily: 'Helvetica-Bold' }]}>$4,827.36</Text>
          </View>
          <View style={styles.totalDueCol}>
            <Text style={styles.totalDueLabel}>AMOUNT DUE</Text>
            <Text style={styles.totalDueAmount}>$4,827.36</Text>
          </View>
        </View>
      </View>

      {/* ── 6. Perforated Remittance Advice Tear-off Slip ───────────────────── */}
      <View style={styles.remittanceSlip}>
        <View style={styles.remittanceHeader}>
          <View>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0F172A' }}>
              REMITTANCE ADVICE
            </Text>
            <Text style={{ fontSize: 6.5, color: '#64748B' }}>
              Please include this stub with electronic or check payment.
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>
              Due: {meta.dueDate} • Total: $4,827.36
            </Text>
            <Text style={{ fontSize: 6.5, color: '#475569' }}>
              Bank: {meta.remittanceBank} | Acc: {meta.remittanceAccount}
            </Text>
          </View>
        </View>

        {/* Barcode Mock */}
        <View style={styles.barcodeSimulation} />
      </View>
    </Page>
  );
};

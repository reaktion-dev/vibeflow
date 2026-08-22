import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { WordDocModel, DocSignatureBlockSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface LegalContractLayoutProps {
  model: WordDocModel;
}

export const LegalContractPdfLayout: React.FC<LegalContractLayoutProps> = ({ model }) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['slate-minimal'];
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 8,
      color: '#0F172A',
      lineHeight: 1.45,
    },
    contractHeader: {
      textAlign: 'center',
      marginBottom: 16,
      borderBottomWidth: 1.5,
      borderBottomColor: '#0F172A',
      paddingBottom: 8,
    },
    contractTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    contractSubtitle: {
      fontSize: 8,
      color: '#475569',
      textTransform: 'uppercase',
    },
    preamble: {
      fontSize: 8,
      color: '#334155',
      marginBottom: 12,
      textAlign: 'justify',
    },
    sectionTitle: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      marginTop: 10,
      marginBottom: 4,
    },
    clauseText: {
      fontSize: 8,
      color: '#1E293B',
      marginBottom: 6,
      textAlign: 'justify',
    },
    calloutLegal: {
      borderWidth: 1,
      borderColor: '#94A3B8',
      backgroundColor: '#F8FAFC',
      padding: 8,
      borderRadius: 2,
      marginVertical: 8,
    },

    // Dual-Column Signature Block
    signatureGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#CBD5E1',
    },
    signatureParty: {
      width: '45%',
    },
    signatureRole: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      marginBottom: 20,
    },
    signLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#0F172A',
      marginBottom: 4,
    },
    signLabel: {
      fontSize: 7,
      color: '#64748B',
      marginBottom: 4,
    },
  });

  const signatureSections = model.sections.filter(
    (s) => s.type === 'signature-block'
  ) as DocSignatureBlockSection[];

  return (
    <Page size={pageSize} wrap={true} style={styles.page}>
      <View style={styles.contractHeader}>
        <Text style={styles.contractTitle}>{model.title || 'Master Services Agreement'}</Text>
        <Text style={styles.contractSubtitle}>
          {model.organization || 'Enterprise Professional Services'} • Standard Form
        </Text>
      </View>

      <Text style={styles.preamble}>
        THIS AGREEMENT is made effective as of {model.date || new Date().toLocaleDateString()}, by and between{' '}
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{model.organization || 'Vibeflow Enterprise'}</Text> ("Provider") and{' '}
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{model.subtitle || 'Client Organization'}</Text> ("Client").
      </Text>

      <Text style={styles.sectionTitle}>1. SCOPE OF SERVICES & DELIVERABLES</Text>
      <Text style={styles.clauseText}>
        1.1 Provider agrees to perform autonomous engineering, vector design synthesis, and multi-tenant pipeline orchestration in accordance with the specifications set forth in applicable Statements of Work.
      </Text>

      <Text style={styles.sectionTitle}>2. INTELLECTUAL PROPERTY & OWNERSHIP</Text>
      <Text style={styles.clauseText}>
        2.1 All deliverables, code artifacts, and design assets synthesized for Client shall become the sole and exclusive property of Client upon full payment of applicable service fees.
      </Text>

      <Text style={styles.sectionTitle}>3. CONFIDENTIALITY & DATA PROTECTION</Text>
      <Text style={styles.clauseText}>
        3.1 Each party shall hold in strict confidence all proprietary technical and commercial data disclosed by the other party and shall not disclose such data to any third party without prior written consent.
      </Text>

      <View style={styles.calloutLegal}>
        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
          LIMITATION OF LIABILITY & WARRANTY DISCLAIMER:
        </Text>
        <Text style={{ fontSize: 7, color: '#475569' }}>
          Except for willful misconduct or breach of confidentiality, neither party's aggregate liability under this agreement shall exceed the total fees paid during the preceding twelve (12) month period.
        </Text>
      </View>

      {/* ── Dual-Column Signature Execution Block ──────────────────────────── */}
      <View style={styles.signatureGrid} wrap={false}>
        <View style={styles.signatureParty}>
          <Text style={styles.signatureRole}>FOR PROVIDER ({model.organization || 'Vibeflow'}):</Text>
          <View style={styles.signLine} />
          <Text style={styles.signLabel}>Authorized Signatory</Text>
          <Text style={styles.signLabel}>Name: {model.author || 'Managing Director'}</Text>
          <Text style={styles.signLabel}>Date: {model.date || new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.signatureParty}>
          <Text style={styles.signatureRole}>FOR CLIENT ({model.subtitle || 'Client'}):</Text>
          <View style={styles.signLine} />
          <Text style={styles.signLabel}>Authorized Signatory</Text>
          <Text style={styles.signLabel}>Name: Executive Officer</Text>
          <Text style={styles.signLabel}>Date: ________________________</Text>
        </View>
      </View>
    </Page>
  );
};

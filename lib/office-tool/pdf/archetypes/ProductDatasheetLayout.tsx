import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { WordDocModel, DocTableSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface ProductDatasheetLayoutProps {
  model: WordDocModel;
}

export const ProductDatasheetPdfLayout: React.FC<ProductDatasheetLayoutProps> = ({ model }) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['cyberpunk-dark'];
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';

  const styles = StyleSheet.create({
    page: {
      padding: 36,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 8,
      color: '#1E293B',
      justifyContent: 'space-between',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1.5,
      borderBottomColor: theme.primary,
      paddingBottom: 10,
      marginBottom: 12,
    },
    productTitle: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    productSku: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: theme.secondary,
      marginTop: 2,
    },
    statusBadge: {
      backgroundColor: theme.primary,
      color: '#FFFFFF',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 3,
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },

    // 2-Column Specs Layout
    sectionTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      borderBottomWidth: 1,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 3,
      marginTop: 10,
      marginBottom: 6,
    },
    specGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    specRow: {
      flexDirection: 'row',
      width: '100%',
      borderBottomWidth: 0.5,
      borderBottomColor: '#E2E8F0',
    },
    specLabel: {
      width: '40%',
      backgroundColor: '#F8FAFC',
      padding: 5,
      fontFamily: 'Helvetica-Bold',
      fontSize: 7.5,
      color: '#475569',
    },
    specValue: {
      width: '60%',
      padding: 5,
      fontSize: 7.5,
      color: '#0F172A',
    },

    // Certifications Strip
    certStrip: {
      flexDirection: 'row',
      gap: 8,
      marginVertical: 10,
    },
    certBadge: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#CBD5E1',
      backgroundColor: '#F8FAFC',
      padding: 6,
      borderRadius: 4,
      alignItems: 'center',
    },
    certName: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
    },
    certStatus: {
      fontSize: 6,
      color: '#059669',
      marginTop: 1,
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 0.5,
      borderTopColor: '#E2E8F0',
      paddingTop: 6,
      fontSize: 7,
      color: '#94A3B8',
    },
  });

  const tableSections = model.sections.filter((s) => s.type === 'table') as DocTableSection[];

  return (
    <Page size={pageSize} wrap={false} style={styles.page}>
      <View>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.productTitle}>{model.title || 'Product Datasheet'}</Text>
            <Text style={styles.productSku}>MODEL: VF-CORE-2026 • REVISION 3.2</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={{ color: '#FFFFFF' }}>GA PRODUCTION READY</Text>
          </View>
        </View>

        <Text style={{ fontSize: 8, color: '#475569', lineHeight: 1.4, marginBottom: 8 }}>
          {model.subtitle || 'High-performance vector synthesis, multi-agent sandbox orchestration, and real-time print engine export.'}
        </Text>

        <Text style={styles.sectionTitle}>Technical Specifications</Text>
        <View style={styles.specGrid}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Architecture</Text>
            <Text style={styles.specValue}>Distributed Multi-Agent MicroVM Sandbox</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Vector Render Engine</Text>
            <Text style={styles.specValue}>React-PDF 4.6 + Resvg Native Rasterizer</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Spend Enforcement</Text>
            <Text style={styles.specValue}>Sub-millisecond Micro-Cent Ledger</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Compliance Protocols</Text>
            <Text style={styles.specValue}>SOC2 Type II, ISO 27001, HIPAA Compliant</Text>
          </View>
        </View>

        {/* Feature Matrix / Table */}
        {tableSections.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>{tableSections[0].caption || 'Feature Matrix'}</Text>
            <View style={styles.specGrid}>
              {tableSections[0].rows.map((row, rIdx) => (
                <View key={rIdx} style={styles.specRow}>
                  <Text style={styles.specLabel}>{row[0]}</Text>
                  <Text style={styles.specValue}>{row[1] || 'Included'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications Strip */}
        <Text style={styles.sectionTitle}>Compliance & Trust Certifications</Text>
        <View style={styles.certStrip}>
          <View style={styles.certBadge}>
            <Text style={styles.certName}>SOC 2 TYPE II</Text>
            <Text style={styles.certStatus}>✓ Verified</Text>
          </View>
          <View style={styles.certBadge}>
            <Text style={styles.certName}>ISO 27001</Text>
            <Text style={styles.certStatus}>✓ Certified</Text>
          </View>
          <View style={styles.certBadge}>
            <Text style={styles.certName}>HIPAA BAA</Text>
            <Text style={styles.certStatus}>✓ Enforced</Text>
          </View>
          <View style={styles.certBadge}>
            <Text style={styles.certName}>GDPR</Text>
            <Text style={styles.certStatus}>✓ Compliant</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>DATASHEET • {model.organization || 'Vibeflow Corporation'}</Text>
        <Text>STRICT 1-PAGE SPECIFICATION</Text>
      </View>
    </Page>
  );
};

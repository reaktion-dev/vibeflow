import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { WordDocModel, DocStatGridSection, DocCalloutSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface ExecutiveMemoLayoutProps {
  model: WordDocModel;
}

export const ExecutiveMemoPdfLayout: React.FC<ExecutiveMemoLayoutProps> = ({ model }) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['corporate-navy'];
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';

  const styles = StyleSheet.create({
    page: {
      padding: 36,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 8.5,
      color: '#1E293B',
      justifyContent: 'space-between',
    },
    // Top Distribution Memo Header
    memoHeader: {
      borderBottomWidth: 1.5,
      borderBottomColor: theme.primary,
      paddingBottom: 10,
      marginBottom: 12,
    },
    memoTag: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      color: theme.secondary,
      letterSpacing: 1,
      marginBottom: 2,
    },
    memoTitle: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      lineHeight: 1.15,
      marginBottom: 8,
    },
    metaGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#F8FAFC',
      padding: 6,
      borderRadius: 3,
      borderWidth: 0.5,
      borderColor: '#E2E8F0',
    },
    metaItem: {
      fontSize: 7.5,
      color: '#475569',
    },

    // KPI Stat Ribbon
    kpiRibbon: {
      flexDirection: 'row',
      gap: 8,
      marginVertical: 10,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: theme.bgLight,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      padding: 8,
      alignItems: 'center',
    },
    kpiValue: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
    },
    kpiLabel: {
      fontSize: 6.5,
      fontFamily: 'Helvetica-Bold',
      color: '#64748B',
      textTransform: 'uppercase',
      marginTop: 2,
    },

    // 2-Column Strategic Narrative
    sectionHeading: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      borderBottomWidth: 0.5,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 2,
      marginTop: 8,
      marginBottom: 4,
    },
    bodyText: {
      fontSize: 8,
      color: '#334155',
      lineHeight: 1.4,
      marginBottom: 6,
    },

    // Risk / Mitigation Box
    calloutBox: {
      backgroundColor: theme.bgLight,
      borderLeftWidth: 3,
      borderLeftColor: theme.secondary,
      padding: 8,
      borderRadius: 3,
      marginVertical: 6,
    },

    // Footer
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

  const statSections = model.sections.filter((s) => s.type === 'stat-grid') as DocStatGridSection[];
  const calloutSections = model.sections.filter((s) => s.type === 'callout') as DocCalloutSection[];

  return (
    <Page size={pageSize} wrap={false} style={styles.page}>
      <View>
        {/* Memo Header */}
        <View style={styles.memoHeader}>
          <Text style={styles.memoTag}>EXECUTIVE STRATEGY BRIEFING</Text>
          <Text style={styles.memoTitle}>{model.title || 'Strategic Initiative Memo'}</Text>

          <View style={styles.metaGrid}>
            <Text style={styles.metaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>FROM: </Text>
              {model.author || 'Autonomous Solutions Practice'}
            </Text>
            <Text style={styles.metaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>ORG: </Text>
              {model.organization || 'Vibeflow Enterprise'}
            </Text>
            <Text style={styles.metaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>DATE: </Text>
              {model.date || new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* KPI Stat Ribbon */}
        {statSections.length > 0 && (
          <View style={styles.kpiRibbon}>
            {statSections[0].stats.map((st, i) => (
              <View key={i} style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{st.value}</Text>
                <Text style={styles.kpiLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Narrative Sections */}
        {model.sections
          .filter((s) => s.type !== 'stat-grid' && s.type !== 'callout')
          .map((sec, idx) => (
            <View key={sec.id || idx}>
              {sec.type === 'heading' && (
                <Text style={styles.sectionHeading}>{sec.text}</Text>
              )}
              {sec.type === 'paragraph' && (
                <Text style={styles.bodyText}>{sec.text}</Text>
              )}
              {sec.type === 'bullet-list' && (
                <View style={{ marginBottom: 4 }}>
                  {sec.items.map((it, i) => (
                    <Text key={i} style={[styles.bodyText, { marginBottom: 2 }]}>
                      • {it}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

        {/* Risk / Value Callouts */}
        {calloutSections.map((c, i) => (
          <View key={c.id || i} style={styles.calloutBox}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: theme.primary, textTransform: 'uppercase', marginBottom: 2 }}>
              {c.title || 'Strategic Takeaway'}
            </Text>
            <Text style={{ fontSize: 7.5, color: '#334155' }}>{c.text}</Text>
          </View>
        ))}
      </View>

      {/* Memo Footer */}
      <View style={styles.footer}>
        <Text>EXECUTIVE MEMORANDUM • CONFIDENTIAL</Text>
        <Text>STRICT 1-PAGE SUMMARY</Text>
      </View>
    </Page>
  );
};

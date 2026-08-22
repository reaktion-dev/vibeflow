import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { WordDocModel, DocStatGridSection, DocQuoteHeroSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface CaseStudyLayoutProps {
  model: WordDocModel;
}

export const CaseStudyPdfLayout: React.FC<CaseStudyLayoutProps> = ({ model }) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['emerald-enterprise'];
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
    headerTag: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: theme.secondary,
      marginBottom: 4,
    },
    docTitle: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      lineHeight: 1.15,
      marginBottom: 6,
    },
    docSubtitle: {
      fontSize: 10,
      color: '#64748B',
      marginBottom: 14,
    },

    // Hero Quote Banner
    quoteBanner: {
      backgroundColor: theme.bgLight,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      padding: 14,
      borderRadius: 4,
      marginVertical: 10,
    },
    quoteText: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      lineHeight: 1.35,
      marginBottom: 6,
    },
    quoteAuthor: {
      fontSize: 7.5,
      fontFamily: 'Helvetica',
      color: '#475569',
    },

    // 3-Stage "Challenge -> Solution -> Results" Grid
    stageGrid: {
      flexDirection: 'row',
      gap: 10,
      marginVertical: 12,
    },
    stageCard: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      padding: 10,
      backgroundColor: '#FAFAFA',
    },
    stageBadge: {
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      color: theme.secondary,
      marginBottom: 4,
    },
    stageTitle: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      marginBottom: 4,
    },
    stageText: {
      fontSize: 7.5,
      color: '#334155',
      lineHeight: 1.35,
    },

    // KPI Stat Grid
    kpiContainer: {
      flexDirection: 'row',
      gap: 10,
      marginVertical: 10,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 4,
      padding: 10,
      alignItems: 'center',
    },
    kpiValue: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
    },
    kpiLabel: {
      fontSize: 6.5,
      fontFamily: 'Helvetica-Bold',
      color: '#94A3B8',
      textTransform: 'uppercase',
      marginTop: 2,
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

  const quoteSections = model.sections.filter((s) => s.type === 'quote-hero') as DocQuoteHeroSection[];
  const statSections = model.sections.filter((s) => s.type === 'stat-grid') as DocStatGridSection[];

  return (
    <Page size={pageSize} wrap={false} style={styles.page}>
      <View>
        <Text style={styles.headerTag}>CUSTOMER SUCCESS STORY</Text>
        <Text style={styles.docTitle}>{model.title || 'Enterprise Scale Case Study'}</Text>
        {model.subtitle && <Text style={styles.docSubtitle}>{model.subtitle}</Text>}

        {/* Hero Quote Banner */}
        <View style={styles.quoteBanner}>
          <Text style={styles.quoteText}>
            "{quoteSections[0]?.quote || 'Vibeflow transformed our software delivery pipeline, reducing deployment lead time by 74% within the first 60 days.'}"
          </Text>
          <Text style={styles.quoteAuthor}>
            — {quoteSections[0]?.authorName || 'EVP of Software Engineering'}, {quoteSections[0]?.companyName || model.organization || 'Fortune 500 Enterprise'}
          </Text>
        </View>

        {/* 3-Stage Progression */}
        <View style={styles.stageGrid}>
          <View style={styles.stageCard}>
            <Text style={styles.stageBadge}>STAGE 1</Text>
            <Text style={styles.stageTitle}>The Challenge</Text>
            <Text style={styles.stageText}>
              Engineering teams struggled with fragmented tools, manual compliance verification, and high cloud sandbox costs.
            </Text>
          </View>

          <View style={styles.stageCard}>
            <Text style={styles.stageBadge}>STAGE 2</Text>
            <Text style={styles.stageTitle}>The Solution</Text>
            <Text style={styles.stageText}>
              Deployed Vibeflow autonomous multi-agent pipelines inside hermetic microVMs with micro-cent spend controls.
            </Text>
          </View>

          <View style={styles.stageCard}>
            <Text style={styles.stageBadge}>STAGE 3</Text>
            <Text style={styles.stageTitle}>The Result</Text>
            <Text style={styles.stageText}>
              Achieved 4x faster product release cycles, 99.8% compliance adherence, and zero security policy violations.
            </Text>
          </View>
        </View>

        {/* Quantified Metrics */}
        {statSections.length > 0 && (
          <View style={styles.kpiContainer}>
            {statSections[0].stats.map((st, i) => (
              <View key={i} style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{st.value}</Text>
                <Text style={styles.kpiLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text>CASE STUDY • {model.organization || 'Vibeflow Enterprise'}</Text>
        <Text>STRICT 1-PAGE SUMMARY</Text>
      </View>
    </Page>
  );
};

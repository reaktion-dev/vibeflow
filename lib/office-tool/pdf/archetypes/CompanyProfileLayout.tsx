import React from 'react';
import { Page, Text, View, StyleSheet, Svg, Path, Rect, Polygon } from '@react-pdf/renderer';
import { WordDocModel, DocStatGridSection, DocCalloutSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface CompanyProfileLayoutProps {
  model: WordDocModel;
}

export const CompanyProfilePdfLayout: React.FC<CompanyProfileLayoutProps> = ({ model }) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['corporate-navy'];
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';
  const orientation = model.orientation || 'portrait';

  const styles = StyleSheet.create({
    coverPage: {
      backgroundColor: '#F8FAFC',
      fontFamily: 'Helvetica',
      padding: 0,
      position: 'relative',
    },
    // Top Vector Art Ribbon
    coverHeader: {
      padding: 36,
      paddingTop: 48,
      zIndex: 10,
    },
    companyTag: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 2,
      color: theme.secondary,
      marginBottom: 6,
    },
    coverTitle: {
      fontSize: 32,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      lineHeight: 1.1,
    },
    coverSubtitle: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 8,
      maxWidth: 320,
      lineHeight: 1.3,
    },

    // Diamond / Geometric Hero Illustration
    heroGeometricBox: {
      marginHorizontal: 36,
      marginVertical: 16,
      height: 220,
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 24,
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    },
    heroBadgeText: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    heroStatement: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
      lineHeight: 1.25,
      maxWidth: 340,
    },

    // Bottom Credentials Strip
    coverFooter: {
      position: 'absolute',
      bottom: 28,
      left: 36,
      right: 36,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: '#CBD5E1',
      paddingTop: 8,
      fontSize: 7.5,
      color: '#64748B',
    },

    // Page 2 Content Styles
    bodyPage: {
      padding: 36,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 8.5,
      color: '#1E293B',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.primary,
      paddingBottom: 4,
      marginBottom: 12,
      marginTop: 8,
    },
    capabilitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginVertical: 10,
    },
    capabilityCard: {
      width: '48%',
      backgroundColor: theme.bgLight,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      padding: 12,
    },
    capabilityTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      marginBottom: 4,
    },
    capabilityText: {
      fontSize: 7.5,
      color: '#475569',
      lineHeight: 1.35,
    },
  });

  const statSections = model.sections.filter((s) => s.type === 'stat-grid') as DocStatGridSection[];

  return (
    <>
      {/* ── Page 1: High-Impact Cover ───────────────────────────────────────── */}
      <Page size={pageSize} orientation={orientation} style={styles.coverPage}>
        {/* Decorative SVG Curves */}
        <Svg height="160" width="100%" style={{ position: 'absolute', top: 0, right: 0 }}>
          <Path
            d="M 200 0 Q 350 80 500 20 L 500 0 Z"
            fill={theme.secondary}
            opacity="0.15"
          />
          <Path
            d="M 300 0 Q 420 120 600 40 L 600 0 Z"
            fill={theme.primary}
            opacity="0.25"
          />
        </Svg>

        <View style={styles.coverHeader}>
          <Text style={styles.companyTag}>{model.organization || 'Corporate Company Profile'}</Text>
          <Text style={styles.coverTitle}>{model.title || 'Corporate Capabilities'}</Text>
          {model.subtitle && <Text style={styles.coverSubtitle}>{model.subtitle}</Text>}
        </View>

        {/* Hero Geometric Container */}
        <View style={styles.heroGeometricBox}>
          <Text style={styles.heroBadgeText}>Enterprise Innovation Practice</Text>
          <Text style={styles.heroStatement}>
            Architecting next-generation autonomous workflows, full-stack intelligence, and scalable cloud infrastructure.
          </Text>
          <Text style={{ fontSize: 7, color: '#94A3B8' }}>
            PREPARED BY: {model.author || 'Autonomous Practice Group'} • {model.date || new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Cover Footer */}
        <View style={styles.coverFooter}>
          <Text>CONFIDENTIAL COMPANY PROFILE</Text>
          <Text>WWW.VIBEFLOW.AI</Text>
        </View>
      </Page>

      {/* ── Page 2: Core Capabilities & Strategic Offerings ─────────────────── */}
      <Page size={pageSize} orientation={orientation} style={styles.bodyPage}>
        <View>
          <Text style={styles.sectionTitle}>Core Capabilities & Service Offerings</Text>

          <View style={styles.capabilitiesGrid}>
            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityTitle}>1. Autonomous Agent Pipelines</Text>
              <Text style={styles.capabilityText}>
                End-to-end multi-agent orchestration for continuous design, code generation, and automated compliance verification.
              </Text>
            </View>

            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityTitle}>2. High-Fidelity Vector Synthesis</Text>
              <Text style={styles.capabilityText}>
                Algorithmic SVG rendering, parametric corporate templates, and pixel-perfect print engine export.
              </Text>
            </View>

            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityTitle}>3. Cloud Sandbox Isolation</Text>
              <Text style={styles.capabilityText}>
                Hermetic per-tenant microVM execution with fine-grained CPU, memory, and spend budget controls.
              </Text>
            </View>

            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityTitle}>4. Enterprise Governance & Auditing</Text>
              <Text style={styles.capabilityText}>
                Cryptographic immutable audit trails for every agentic action, code commit, and asset deployment.
              </Text>
            </View>
          </View>

          {/* Stat Grid */}
          {statSections.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Track Record & Enterprise Scale</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {statSections[0].stats.map((st, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: theme.bgLight,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 4,
                      padding: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: theme.primary }}>
                      {st.value}
                    </Text>
                    <Text style={{ fontSize: 7, color: '#64748B', textTransform: 'uppercase', marginTop: 2 }}>
                      {st.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#E2E8F0', paddingTop: 6, fontSize: 7, color: '#94A3B8' }}>
          <Text>{model.organization || 'Corporate Profile'} • Capabilities Statement</Text>
          <Text>Page 2 of 2</Text>
        </View>
      </Page>
    </>
  );
};

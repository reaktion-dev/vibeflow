import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { WordDocModel, DocCodeBlockSection, DocCalloutSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface TechnicalWhitepaperLayoutProps {
  model: WordDocModel;
}

export const TechnicalWhitepaperPdfLayout: React.FC<TechnicalWhitepaperLayoutProps> = ({
  model,
}) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['slate-minimal'];
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';

  const styles = StyleSheet.create({
    page: {
      padding: 36,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 8,
      color: '#1E293B',
    },
    runningHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 0.5,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 4,
      marginBottom: 12,
      fontSize: 6.5,
      color: '#64748B',
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },
    docTitle: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      marginBottom: 2,
    },
    docSubtitle: {
      fontSize: 9,
      color: '#475569',
      marginBottom: 8,
    },
    authorMeta: {
      flexDirection: 'row',
      gap: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      marginBottom: 12,
      fontSize: 7,
      color: '#64748B',
    },
    abstractBox: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 10,
      borderRadius: 4,
      marginBottom: 14,
    },
    abstractTitle: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    abstractText: {
      fontSize: 7.5,
      color: '#334155',
      lineHeight: 1.4,
    },

    // 2-Column Content Layout
    twoColContainer: {
      flexDirection: 'row',
      gap: 16,
      flex: 1,
    },
    col: {
      flex: 1,
    },
    sectionHeading: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#0F172A',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      borderBottomWidth: 0.5,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 2,
      marginTop: 8,
      marginBottom: 4,
    },
    bodyParagraph: {
      fontSize: 7.5,
      color: '#334155',
      lineHeight: 1.38,
      marginBottom: 6,
    },

    // Code Block
    codeContainer: {
      backgroundColor: '#0F172A',
      padding: 8,
      borderRadius: 3,
      marginVertical: 6,
    },
    codeText: {
      fontFamily: 'Courier',
      fontSize: 6.5,
      color: '#38BDF8',
      lineHeight: 1.3,
    },

    runningFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 0.5,
      borderTopColor: '#CBD5E1',
      paddingTop: 4,
      marginTop: 12,
      fontSize: 6.5,
      color: '#94A3B8',
    },
  });

  const codeBlocks = model.sections.filter((s) => s.type === 'code-block') as DocCodeBlockSection[];

  return (
    <Page size={pageSize} wrap={true} style={styles.page}>
      {/* Running Header */}
      <View style={styles.runningHeader} fixed>
        <Text>{model.title || 'Engineering Architecture Specification'}</Text>
        <Text>RFC-2026-V8 • {model.organization || 'Architecture Board'}</Text>
      </View>

      {/* Title & Metadata */}
      <Text style={styles.docTitle}>{model.title || 'Distributed Sandbox Architecture'}</Text>
      {model.subtitle && <Text style={styles.docSubtitle}>{model.subtitle}</Text>}

      <View style={styles.authorMeta}>
        <Text>Author: {model.author || 'Principal Systems Architect'}</Text>
        <Text>Org: {model.organization || 'Vibeflow Core Eng'}</Text>
        <Text>Date: {model.date || new Date().toLocaleDateString()}</Text>
        <Text>Status: Standards Track (Draft)</Text>
      </View>

      {/* Abstract */}
      <View style={styles.abstractBox}>
        <Text style={styles.abstractTitle}>Abstract</Text>
        <Text style={styles.abstractText}>
          This specification defines the protocol, security boundaries, and execution pipeline for hermetic multi-agent workspaces operating under strict micro-cent budget constraints.
        </Text>
      </View>

      {/* 2-Column Academic Content Body */}
      <View style={styles.twoColContainer}>
        <View style={styles.col}>
          <Text style={styles.sectionHeading}>1. Architectural Topology</Text>
          <Text style={styles.bodyParagraph}>
            The system employs a decentralized supervisor topology where autonomous agents communicate across transactional message queues with deterministic state checkpoints.
          </Text>

          <Text style={styles.sectionHeading}>2. Sandboxed MicroVM Lifecycle</Text>
          <Text style={styles.bodyParagraph}>
            Each task executes inside an ephemeral microVM container isolated via Linux namespaces and cgroups v2, guaranteeing zero cross-tenant state leakage.
          </Text>

          {codeBlocks.length > 0 && (
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{codeBlocks[0].code}</Text>
            </View>
          )}
        </View>

        <View style={styles.col}>
          <Text style={styles.sectionHeading}>3. Budget Ledger Enforcement</Text>
          <Text style={styles.bodyParagraph}>
            Every token generation and tool invocation deducts micro-cents in real-time from the parent workspace balance, halting execution prior to ceiling breach.
          </Text>

          <Text style={styles.sectionHeading}>4. Security Guarantees</Text>
          <Text style={styles.bodyParagraph}>
            Network egress is restricted via eBPF filters. Egress policies strictly whitelist approved LLM gateways and block unauthorized lateral socket connections.
          </Text>
        </View>
      </View>

      {/* Running Footer */}
      <View style={styles.runningFooter} fixed>
        <Text>ENGINEERING SPECIFICATION • CONFIDENTIAL</Text>
        <Text
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  );
};

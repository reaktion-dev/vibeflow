import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { WordDocModel, DocSection } from '../types';
import { createPdfStyles } from './styles';
import { ResumePdfLayout } from './archetypes/ResumeLayout';
import { InvoicePdfLayout } from './archetypes/InvoiceLayout';
import { ExecutiveMemoPdfLayout } from './archetypes/ExecutiveMemoLayout';
import { CompanyProfilePdfLayout } from './archetypes/CompanyProfileLayout';
import { TechnicalWhitepaperPdfLayout } from './archetypes/TechnicalWhitepaperLayout';
import { LegalContractPdfLayout } from './archetypes/LegalContractLayout';
import { CaseStudyPdfLayout } from './archetypes/CaseStudyLayout';
import { ProductDatasheetPdfLayout } from './archetypes/ProductDatasheetLayout';

interface PdfDocumentTemplateProps {
  model: WordDocModel;
}

export const PdfDocumentTemplate: React.FC<PdfDocumentTemplateProps> = ({ model }) => {
  // ── 0. Composite Multi-Archetype Document Publications ────────────────────
  if (model.archetype === 'composite' || (model.pages && model.pages.length > 0)) {
    const pageModules = model.pages || [];

    return (
      <Document
        title={model.title}
        author={model.author || 'Vibeflow Executive Studio'}
        creator="Vibeflow Autonomous Studio"
        producer="React-PDF"
      >
        {pageModules.map((pageMod, pIdx) => {
          // Construct full WordDocModel slice for this specific page archetype
          const pageModel: WordDocModel = {
            id: pageMod.id || `page_${pIdx}`,
            title: pageMod.title || model.title,
            subtitle: pageMod.subtitle || model.subtitle,
            author: model.author,
            organization: model.organization,
            date: model.date,
            theme: model.theme,
            archetype: pageMod.archetype,
            hasCoverPage: false,
            pageSize: model.pageSize,
            pageFit: pageMod.pageFit || model.pageFit || 'strict-1-page',
            orientation: pageMod.orientation || model.orientation,
            headshotUrl: pageMod.headshotUrl,
            contactInfo: pageMod.contactInfo || model.contactInfo,
            sidebarBio: pageMod.sidebarBio,
            sidebarLinks: pageMod.sidebarLinks,
            sidebarReferences: pageMod.sidebarReferences,
            sidebarHobbies: pageMod.sidebarHobbies,
            invoiceMeta: pageMod.invoiceMeta,
            sections: pageMod.sections || [],
          };

          switch (pageMod.archetype) {
            case 'two-column-resume':
              return <ResumePdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'invoice-statement':
              return <InvoicePdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'executive-memo':
              return <ExecutiveMemoPdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'company-profile':
              return <CompanyProfilePdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'technical-whitepaper':
              return <TechnicalWhitepaperPdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'legal-contract':
              return <LegalContractPdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'case-study':
              return <CaseStudyPdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'product-datasheet':
              return <ProductDatasheetPdfLayout key={pageMod.id || pIdx} model={pageModel} />;
            case 'executive-proposal':
            default: {
              const styles = createPdfStyles(model.theme, true);
              const pSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';
              return (
                <Page
                  key={pageMod.id || pIdx}
                  size={pSize}
                  style={styles.page}
                >
                  <View style={styles.runningHeader} fixed>
                    <Text style={styles.runningHeaderTitle}>{pageModel.title}</Text>
                    <Text style={styles.runningHeaderOrg}>{pageModel.organization || 'Executive Report'}</Text>
                  </View>

                  <View style={styles.runningFooter} fixed>
                    <Text style={styles.runningFooterNotice}>Confidential & Proprietary</Text>
                    <Text
                      style={styles.runningFooterPageNum}
                      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                  </View>

                  {pageMod.sections.map((sec) => (
                    <PdfSectionRenderer key={sec.id} section={sec} styles={styles} />
                  ))}
                </Page>
              );
            }
          }
        })}
      </Document>
    );
  }

  // ── 1. Specialized Single-Archetype Document Routing ──────────────────────
  if (model.archetype === 'two-column-resume') {
    return (
      <Document
        title={model.title}
        author={model.author || model.title}
        creator="Vibeflow Executive Studio"
        producer="React-PDF"
      >
        <ResumePdfLayout model={model} />
      </Document>
    );
  }

  if (model.archetype === 'invoice-statement') {
    return (
      <Document
        title={model.title}
        author={model.organization || 'Enterprise Billing'}
        creator="Vibeflow Invoicing Engine"
        producer="React-PDF"
      >
        <InvoicePdfLayout model={model} />
      </Document>
    );
  }

  if (model.archetype === 'executive-memo') {
    return (
      <Document
        title={model.title}
        author={model.author || 'Executive Office'}
        creator="Vibeflow Executive Studio"
        producer="React-PDF"
      >
        <ExecutiveMemoPdfLayout model={model} />
      </Document>
    );
  }

  if (model.archetype === 'company-profile') {
    return (
      <Document
        title={model.title}
        author={model.organization || 'Corporate Practice'}
        creator="Vibeflow Design Studio"
        producer="React-PDF"
      >
        <CompanyProfilePdfLayout model={model} />
      </Document>
    );
  }

  if (model.archetype === 'technical-whitepaper') {
    return (
      <Document
        title={model.title}
        author={model.author || 'Architecture Board'}
        creator="Vibeflow Engineering Engine"
        producer="React-PDF"
      >
        <TechnicalWhitepaperPdfLayout model={model} />
      </Document>
    );
  }

  if (model.archetype === 'legal-contract') {
    return (
      <Document
        title={model.title}
        author={model.organization || 'Legal Counsel'}
        creator="Vibeflow Legal Engine"
        producer="React-PDF"
      >
        <LegalContractPdfLayout model={model} />
      </Document>
    );
  }

  if (model.archetype === 'case-study') {
    return (
      <Document
        title={model.title}
        author={model.organization || 'Enterprise Marketing'}
        creator="Vibeflow Marketing Studio"
        producer="React-PDF"
      >
        <CaseStudyPdfLayout model={model} />
      </Document>
    );
  }

  if (model.archetype === 'product-datasheet') {
    return (
      <Document
        title={model.title}
        author={model.organization || 'Product Team'}
        creator="Vibeflow Product Engine"
        producer="React-PDF"
      >
        <ProductDatasheetPdfLayout model={model} />
      </Document>
    );
  }

  // ── 2. Default: Executive Proposal / Strategic RFP ────────────────────────
  const isStrict1Page = model.pageFit === 'strict-1-page';
  const styles = createPdfStyles(model.theme, isStrict1Page);
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';
  const orientation = model.orientation === 'landscape' ? 'landscape' : 'portrait';

  return (
    <Document
      title={model.title}
      author={model.author || 'Vibeflow Studio'}
      subject={model.subtitle || 'Executive Document'}
      creator="Vibeflow Autonomous Studio"
      producer="React-PDF"
    >
      {/* Dedicated Cover Page */}
      {model.hasCoverPage && !isStrict1Page && (
        <Page size={pageSize} orientation={orientation} wrap={false} style={styles.page}>
          <View style={styles.coverContainer}>
            <View>
              <View style={styles.coverBadge}>
                <Text style={styles.coverBadgeText}>Executive Document</Text>
              </View>

              <Text style={styles.coverTitle}>{model.title}</Text>

              {model.subtitle && (
                <Text style={styles.coverSubtitle}>{model.subtitle}</Text>
              )}
            </View>

            {/* Bottom Metadata Box */}
            <View style={styles.coverMetaBox}>
              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Prepared By</Text>
                <Text style={styles.coverMetaValue}>
                  {model.author || 'Autonomous Agent Studio'}
                </Text>
              </View>

              {model.organization && (
                <View style={styles.coverMetaItem}>
                  <Text style={styles.coverMetaLabel}>Organization</Text>
                  <Text style={styles.coverMetaValue}>{model.organization}</Text>
                </View>
              )}

              <View style={styles.coverMetaItem}>
                <Text style={styles.coverMetaLabel}>Date</Text>
                <Text style={styles.coverMetaValue}>
                  {model.date || new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </Page>
      )}

      {/* Content Body Pages */}
      <Page size={pageSize} orientation={orientation} wrap={true} style={styles.page}>
        {!isStrict1Page && (
          <View style={styles.runningHeader} fixed>
            <Text style={styles.runningHeaderTitle}>{model.title}</Text>
            <Text style={styles.runningHeaderOrg}>
              {model.organization || 'Executive Document'}
            </Text>
          </View>
        )}

        <View style={styles.runningFooter} fixed>
          <Text style={styles.runningFooterNotice}>Confidential & Proprietary</Text>
          <Text
            style={styles.runningFooterPageNum}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

        {model.sections.map((section) => (
          <PdfSectionRenderer key={section.id} section={section} styles={styles} />
        ))}
      </Page>
    </Document>
  );
};

interface PdfSectionRendererProps {
  section: DocSection;
  styles: ReturnType<typeof createPdfStyles>;
}

const PdfSectionRenderer: React.FC<PdfSectionRendererProps> = ({ section, styles }) => {
  switch (section.type) {
    case 'heading': {
      const headingStyle =
        section.level === 1
          ? styles.h1
          : section.level === 2
          ? styles.h2
          : styles.h3;

      return (
        <Text style={headingStyle} minPresenceAhead={40}>
          {section.text}
        </Text>
      );
    }

    case 'paragraph': {
      return (
        <Text style={section.lead ? styles.leadParagraph : styles.paragraph}>
          {section.text}
        </Text>
      );
    }

    case 'callout': {
      return (
        <View style={styles.calloutContainer} wrap={false}>
          {(section.title || section.badge) && (
            <View style={styles.calloutHeader}>
              {section.badge && (
                <View style={styles.calloutBadge}>
                  <Text style={styles.calloutBadgeText}>{section.badge}</Text>
                </View>
              )}
              {section.title && (
                <Text style={styles.calloutTitle}>{section.title}</Text>
              )}
            </View>
          )}
          <Text style={styles.calloutText}>{section.text}</Text>
        </View>
      );
    }

    case 'stat-grid': {
      return (
        <View style={styles.statGrid} wrap={false}>
          {section.stats.map((st, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statValue}>{st.value}</Text>
              <Text style={styles.statLabel}>{st.label}</Text>
              {st.description && (
                <Text style={styles.statDesc}>{st.description}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }

    case 'table': {
      const columnCount = section.headers.length || 1;
      const colWidthPercent = `${Math.floor(100 / columnCount)}%`;

      return (
        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            {section.headers.map((h, i) => (
              <View key={i} style={{ width: colWidthPercent }}>
                <Text style={styles.tableHeaderText}>{h}</Text>
              </View>
            ))}
          </View>

          {section.rows.map((row, rIdx) => (
            <View
              key={rIdx}
              style={[
                styles.tableRow,
                rIdx % 2 === 1 ? styles.tableRowZebra : undefined,
              ]}
              wrap={false}
            >
              {row.map((cell, cIdx) => (
                <View key={cIdx} style={{ width: colWidthPercent }}>
                  <Text style={styles.tableCellText}>{cell}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    case 'bullet-list': {
      return (
        <View style={{ marginVertical: 4 }}>
          {section.items.map((item, i) => (
            <View key={i} style={styles.listItem} wrap={false}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    case 'numbered-list': {
      return (
        <View style={{ marginVertical: 4 }}>
          {section.items.map((item, i) => (
            <View key={i} style={styles.listItem} wrap={false}>
              <Text style={styles.listBullet}>{i + 1}.</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }

    case 'divider': {
      return <View style={styles.divider} />;
    }

    default:
      return null;
  }
};

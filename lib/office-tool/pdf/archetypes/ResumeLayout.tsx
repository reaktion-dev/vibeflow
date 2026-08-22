import React from 'react';
import { Page, Text, View, StyleSheet, Image, Svg, Circle, Line, Rect } from '@react-pdf/renderer';
import { WordDocModel, DocTimelineSection, DocSkillGaugesSection } from '../../types';
import { OFFICE_THEMES } from '../../types';

interface ResumeLayoutProps {
  model: WordDocModel;
}

export const ResumePdfLayout: React.FC<ResumeLayoutProps> = ({ model }) => {
  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['slate-minimal'];
  const pageSize = model.pageSize === 'a4' ? 'A4' : 'LETTER';

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 9,
      color: '#1E293B',
    },
    // Left Dark Rail (32%)
    sidebar: {
      width: '32%',
      backgroundColor: '#2D3139',
      color: '#FFFFFF',
      padding: 24,
      paddingTop: 32,
      justifyContent: 'space-between',
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatarCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: '#475569',
      borderWidth: 2,
      borderColor: '#94A3B8',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarInitials: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
    },
    sidebarSection: {
      marginBottom: 16,
    },
    sidebarHeading: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: '#CBD5E1',
      borderBottomWidth: 0.5,
      borderBottomColor: '#64748B',
      paddingBottom: 4,
      marginBottom: 8,
    },
    sidebarText: {
      fontSize: 7.5,
      color: '#E2E8F0',
      lineHeight: 1.4,
    },
    sidebarListItem: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    sidebarBullet: {
      width: 10,
      fontSize: 8,
      color: '#CBD5E1',
    },

    // Right Main Column (68%)
    mainContent: {
      width: '68%',
      padding: 28,
      paddingTop: 32,
      backgroundColor: '#FFFFFF',
    },
    headerName: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#1E293B',
      textTransform: 'uppercase',
      letterSpacing: 1,
      lineHeight: 1.1,
    },
    headerTitle: {
      fontSize: 9.5,
      fontFamily: 'Helvetica',
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginTop: 3,
      marginBottom: 12,
    },
    contactStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      marginBottom: 16,
    },
    contactItem: {
      fontSize: 7.5,
      color: '#475569',
      fontFamily: 'Helvetica',
    },

    // Category Headings
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1E293B',
      textTransform: 'uppercase',
      letterSpacing: 1,
      borderBottomWidth: 1,
      borderBottomColor: '#1E293B',
      paddingBottom: 3,
      marginTop: 12,
      marginBottom: 10,
    },

    // Timeline Elements
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    timelineLeft: {
      width: '35%',
      paddingRight: 10,
    },
    timelineInstitution: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#1E293B',
      textTransform: 'uppercase',
    },
    timelinePeriod: {
      fontSize: 7,
      color: '#64748B',
      marginTop: 2,
    },
    timelineRight: {
      width: '65%',
      borderLeftWidth: 1,
      borderLeftColor: '#CBD5E1',
      paddingLeft: 10,
      position: 'relative',
    },
    timelineRole: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      color: '#1E293B',
      marginBottom: 4,
    },
    bulletItem: {
      fontSize: 7.5,
      color: '#475569',
      lineHeight: 1.35,
      marginBottom: 2,
    },

    // Skill Progress Bars
    skillGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    skillItem: {
      width: '48%',
      marginBottom: 8,
    },
    skillName: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      color: '#334155',
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    progressBarBg: {
      height: 3.5,
      backgroundColor: '#E2E8F0',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 2,
    },
  });

  // Extract Timeline and Skill sections
  const timelineSections = model.sections.filter(
    (s) => s.type === 'timeline'
  ) as DocTimelineSection[];

  const skillSections = model.sections.filter(
    (s) => s.type === 'skill-gauges'
  ) as DocSkillGaugesSection[];

  const initials = (model.title || 'PV')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Page size={pageSize} wrap={false} style={styles.page}>
      {/* ── 1. Left Dark Rail (32%) ────────────────────────────────────────── */}
      <View style={styles.sidebar}>
        <View>
          {/* Avatar Container */}
          <View style={styles.avatarContainer}>
            {model.headshotUrl ? (
              <Image src={model.headshotUrl} style={styles.avatarCircle} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>

          {/* About Me */}
          {model.sidebarBio && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarHeading}>About Me</Text>
              <Text style={styles.sidebarText}>{model.sidebarBio}</Text>
            </View>
          )}

          {/* Links */}
          {model.sidebarLinks && model.sidebarLinks.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarHeading}>Links</Text>
              {model.sidebarLinks.map((link, i) => (
                <View key={i} style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 7, color: '#94A3B8' }}>{link.label}</Text>
                  <Text style={{ fontSize: 7.5, color: '#FFFFFF', textDecoration: 'underline' }}>
                    {link.url}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* References */}
          {model.sidebarReferences && model.sidebarReferences.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarHeading}>References</Text>
              {model.sidebarReferences.map((ref, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' }}>
                    {ref.name}
                  </Text>
                  <Text style={{ fontSize: 7, color: '#CBD5E1' }}>{ref.org}</Text>
                  <Text style={{ fontSize: 6.5, color: '#94A3B8' }}>{ref.contact}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Hobbies */}
          {model.sidebarHobbies && model.sidebarHobbies.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarHeading}>Hobbies</Text>
              {model.sidebarHobbies.map((hobby, i) => (
                <View key={i} style={styles.sidebarListItem}>
                  <Text style={styles.sidebarBullet}>•</Text>
                  <Text style={{ fontSize: 7.5, color: '#E2E8F0' }}>{hobby}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ── 2. Right Main Content Area (68%) ───────────────────────────────── */}
      <View style={styles.mainContent}>
        {/* Name and Professional Title */}
        <Text style={styles.headerName}>{model.title || 'Executive Resume'}</Text>
        {model.subtitle && <Text style={styles.headerTitle}>{model.subtitle}</Text>}

        {/* Contact Info Header Strip */}
        {model.contactInfo && (
          <View style={styles.contactStrip}>
            {model.contactInfo.location && (
              <Text style={styles.contactItem}>📍 {model.contactInfo.location}</Text>
            )}
            {model.contactInfo.phone && (
              <Text style={styles.contactItem}>📞 {model.contactInfo.phone}</Text>
            )}
            {model.contactInfo.email && (
              <Text style={styles.contactItem}>✉️ {model.contactInfo.email}</Text>
            )}
          </View>
        )}

        {/* Timeline Sections (Work Experience & Education) */}
        {timelineSections.map((sec, idx) => (
          <View key={sec.id || idx}>
            <Text style={styles.sectionTitle}>
              {sec.categoryTitle || 'Work Experience'}
            </Text>

            {sec.items.map((item, itemIdx) => (
              <View key={itemIdx} style={styles.timelineItem} wrap={false}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineInstitution}>{item.institution}</Text>
                  <Text style={styles.timelinePeriod}>{item.period}</Text>
                </View>

                <View style={styles.timelineRight}>
                  <Text style={styles.timelineRole}>• {item.title}</Text>
                  {item.bullets.map((b, bIdx) => (
                    <Text key={bIdx} style={styles.bulletItem}>
                      - {b}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Skills Section with Progress Bars */}
        {skillSections.map((sec, idx) => (
          <View key={sec.id || idx}>
            <Text style={styles.sectionTitle}>
              {sec.categoryTitle || 'Skills'}
            </Text>

            <View style={styles.skillGrid}>
              {sec.skills.map((skill, sIdx) => (
                <View key={sIdx} style={styles.skillItem}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(100, Math.max(10, skill.levelPercent))}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
};

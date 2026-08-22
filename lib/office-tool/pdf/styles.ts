import { StyleSheet } from '@react-pdf/renderer';
import { OfficeThemeName, OFFICE_THEMES } from '../types';

export function createPdfStyles(themeName: OfficeThemeName, isStrict1Page = false) {
  const theme = OFFICE_THEMES[themeName] ?? OFFICE_THEMES['corporate-navy'];

  return StyleSheet.create({
    page: {
      paddingTop: isStrict1Page ? 36 : 48,
      paddingBottom: isStrict1Page ? 36 : 48,
      paddingLeft: isStrict1Page ? 36 : 48,
      paddingRight: isStrict1Page ? 36 : 48,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#334155',
      lineHeight: 1.5,
    },

    // Running Header (Page 2+)
    runningHeader: {
      position: 'absolute',
      top: 20,
      left: 48,
      right: 48,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 0.5,
      borderBottomColor: '#E2E8F0',
      paddingBottom: 6,
    },
    runningHeaderTitle: {
      fontSize: 8,
      color: '#94A3B8',
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },
    runningHeaderOrg: {
      fontSize: 8,
      color: '#94A3B8',
    },

    // Running Footer
    runningFooter: {
      position: 'absolute',
      bottom: 20,
      left: 48,
      right: 48,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: '#E2E8F0',
      paddingTop: 6,
    },
    runningFooterNotice: {
      fontSize: 7.5,
      color: '#94A3B8',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    runningFooterPageNum: {
      fontSize: 8,
      color: '#64748B',
      fontFamily: 'Helvetica-Bold',
    },

    // Cover Page
    coverContainer: {
      height: '100%',
      justifyContent: 'space-between',
      paddingTop: 40,
      paddingBottom: 40,
    },
    coverBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.primary,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 4,
      marginBottom: 30,
    },
    coverBadgeText: {
      color: '#FFFFFF',
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    coverTitle: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      marginBottom: 10,
      lineHeight: 1.2,
    },
    coverSubtitle: {
      fontSize: 13,
      color: '#64748B',
      marginBottom: 24,
      lineHeight: 1.4,
    },
    coverMetaBox: {
      backgroundColor: theme.bgLight,
      borderLeftWidth: 4,
      borderLeftColor: theme.secondary,
      padding: 14,
      borderRadius: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    coverMetaItem: {
      flex: 1,
    },
    coverMetaLabel: {
      fontSize: 7.5,
      color: '#64748B',
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    coverMetaValue: {
      fontSize: 9.5,
      color: theme.textDark,
      fontFamily: 'Helvetica-Bold',
    },

    // Headings
    h1: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      marginTop: 18,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 4,
    },
    h2: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      marginTop: 14,
      marginBottom: 6,
    },
    h3: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      marginTop: 10,
      marginBottom: 4,
    },

    // Paragraphs
    paragraph: {
      fontSize: 9.5,
      color: '#334155',
      marginBottom: 8,
      lineHeight: 1.5,
    },
    leadParagraph: {
      fontSize: 11,
      color: '#1E293B',
      fontFamily: 'Helvetica',
      marginBottom: 12,
      lineHeight: 1.6,
    },

    // Callout Box
    calloutContainer: {
      backgroundColor: theme.bgLight,
      borderLeftWidth: 3.5,
      borderLeftColor: theme.secondary,
      padding: 12,
      borderRadius: 4,
      marginVertical: 8,
    },
    calloutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    calloutBadge: {
      backgroundColor: theme.secondary,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    calloutBadgeText: {
      color: '#FFFFFF',
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },
    calloutTitle: {
      fontSize: 9.5,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      textTransform: 'uppercase',
    },
    calloutText: {
      fontSize: 8.5,
      color: theme.textDark,
      lineHeight: 1.4,
    },

    // Stat Grid
    statGrid: {
      flexDirection: 'row',
      gap: 8,
      marginVertical: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.bgLight,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      padding: 10,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: theme.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      color: '#475569',
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    statDesc: {
      fontSize: 6.5,
      color: '#94A3B8',
      textAlign: 'center',
      marginTop: 2,
    },

    // Table
    table: {
      marginVertical: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableHeaderText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
      paddingVertical: 5,
      paddingHorizontal: 8,
    },
    tableRowZebra: {
      backgroundColor: '#F8FAFC',
    },
    tableCellText: {
      fontSize: 8,
      color: '#334155',
    },

    // Lists
    listItem: {
      flexDirection: 'row',
      marginBottom: 4,
      paddingLeft: 4,
    },
    listBullet: {
      width: 12,
      fontSize: 9,
      color: theme.primary,
      fontFamily: 'Helvetica-Bold',
    },
    listText: {
      flex: 1,
      fontSize: 9,
      color: '#334155',
    },

    // Divider
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      marginVertical: 10,
    },
  });
}

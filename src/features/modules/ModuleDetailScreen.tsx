import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Layers, ShieldCheck, Wrench } from 'lucide-react-native';
import { kiblatModulesData } from '../../constants/kiblatModulesData';
import {
  ContentBlock,
  CityReference,
  ScholarCard,
} from '../../types/module';

export const ModuleDetailScreen = () => {
  // Mengambil modul pertama sebagai sampel data
  const moduleData = kiblatModulesData[0];
  const navigation = useNavigation();

  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <Text key={index} style={styles.paragraph}>
            {block.content}
          </Text>
        );

      case 'h2':
        return (
          <Text key={index} style={styles.h2}>
            {block.content}
          </Text>
        );

      case 'h3':
        return (
          <Text key={index} style={styles.h3}>
            {block.content}
          </Text>
        );

      case 'quote':
        return (
          <View key={index} style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{block.text}"</Text>
            <Text style={styles.quoteSource}>— {block.source}</Text>
          </View>
        );

      case 'formula':
        return (
          <View key={index} style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>{block.title}</Text>
            <View style={styles.formulaExpressionBox}>
              <Text style={styles.formulaExpression}>{block.expression}</Text>
            </View>
            {block.explanation && (
              <Text style={styles.formulaExplanation}>{block.explanation}</Text>
            )}
            {block.variables && block.variables.length > 0 && (
              <View style={styles.variableContainer}>
                {block.variables.map((v, vIdx) => (
                  <Text key={vIdx} style={styles.variableText}>
                    • <Text style={styles.bold}>{v.symbol}</Text>: {v.meaning}{' '}
                    {v.value ? `(${v.value})` : ''}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );

      case 'illustration':
        return (
          <View key={index} style={styles.illustrationCard}>
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.illustrationPlaceholderText}>
                [ Diagram Visual: {block.svgType} ]
              </Text>
            </View>
            <Text style={styles.illustrationCaption}>{block.caption}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Navigasi */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#F8FAFC" size={20} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Modul Arah Kiblat</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Modul */}
        <View style={styles.header}>
          <Text style={styles.categoryBadge}>
            {moduleData.category.toUpperCase()} • {moduleData.readTimeMinutes} MNT BACA
          </Text>
          <Text style={styles.title}>{moduleData.title}</Text>
          <Text style={styles.subtitle}>{moduleData.subtitle}</Text>
          <View style={styles.divider} />
        </View>

        {/* Dynamic Blocks */}
        {moduleData.blocks.map((block, index) => renderBlock(block, index))}

        {/* Tabel Referensi Kota */}
        {moduleData.cityReferences && moduleData.cityReferences.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.h2}>Data Arah Kiblat Kota</Text>
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Kota</Text>
                <Text style={[styles.tableCellHeader, { flex: 1 }]}>Azimuth</Text>
                <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Jarak</Text>
              </View>
              {moduleData.cityReferences.map((city: CityReference, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{city.cityName}</Text>
                  <Text style={[styles.tableCellBold, { flex: 1 }]}>
                    {city.qiblaAzimuth}°
                  </Text>
                  <Text style={[styles.tableCellSub, { flex: 1.5 }]}>
                    {city.distanceKm} km
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tokoh Falak */}
        {moduleData.scholars && moduleData.scholars.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.h2}>Tokoh Ilmu Falak</Text>
            {moduleData.scholars.map((scholar: ScholarCard, idx: number) => (
              <View key={idx} style={styles.scholarCard}>
                <View style={styles.scholarAvatar}>
                  <Text style={styles.scholarInitials}>{scholar.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scholarName}>{scholar.name}</Text>
                  <Text style={styles.scholarEra}>{scholar.era}</Text>
                  <Text style={styles.scholarDesc}>{scholar.contribution}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Referensi Kitab & Dokumen */}
        {moduleData.references && moduleData.references.length > 0 && (
          <View style={styles.referencesContainer}>
            <Text style={styles.referenceTitle}>REFERENSI UDA</Text>
            {moduleData.references.map((ref: string, idx: number) => (
              <Text key={idx} style={styles.referenceItem}>
                {idx + 1}. {ref}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  topBarTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    marginBottom: 24,
  },
  categoryBadge: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 20,
  },
  paragraph: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'justify',
  },
  h2: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  h3: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
  },
  quoteCard: {
    backgroundColor: '#1E293B',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  quoteText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteSource: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  formulaCard: {
    backgroundColor: '#1E293B',
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  formulaTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  formulaExpressionBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  formulaExpression: {
    color: '#F8FAFC',
    fontFamily: 'Platform',
    fontSize: 13,
    lineHeight: 20,
  },
  formulaExplanation: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  variableContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  variableText: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#F59E0B',
  },
  illustrationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    alignItems: 'center',
  },
  illustrationPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  illustrationPlaceholderText: {
    color: '#38BDF8',
    fontSize: 13,
  },
  illustrationCaption: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 12,
  },
  tableCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0284C7',
    padding: 12,
  },
  tableCellHeader: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tableCell: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  tableCellBold: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  tableCellSub: {
    color: '#94A3B8',
    fontSize: 13,
  },
  scholarCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  scholarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scholarInitials: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '700',
  },
  scholarName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  scholarEra: {
    color: '#F59E0B',
    fontSize: 12,
    marginBottom: 4,
  },
  scholarDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  referencesContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  referenceTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  referenceItem: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 6,
  },
});
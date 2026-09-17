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
import { istiwaComponentsData, IstiwaComponentItem } from '../../constants/istiwaComponentsData';

export const IstiwaComponentScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Navigasi */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#F8FAFC" size={20} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Komponen Istiwa'ani</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Ringkasan */}
        <View style={styles.bannerCard}>
          <Layers color="#F59E0B" size={32} />
          <Text style={styles.bannerTitle}>Anatomi Instrumen Istiwa'ani</Text>
          <Text style={styles.bannerDesc}>
            Pengenalan bagian-bagian fisik alat ukur matahari (gnomon surya) beserta standar operasional kalibrasi di lapangan.
          </Text>
        </View>

        {/* Daftar Komponen */}
        <Text style={styles.sectionTitle}>DAFTAR KOMPONEN UTAMA</Text>
        
        {istiwaComponentsData.map((item: IstiwaComponentItem, index: number) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.componentName}>{item.name}</Text>
                <Text style={styles.arabicName}>{item.arabicName}</Text>
              </View>
            </View>

            <Text style={styles.functionText}>{item.functionText}</Text>

            {/* Spesifikasi */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Wrench color="#38BDF8" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.infoLabel}>Spesifikasi Fisik:</Text>
              </View>
              <Text style={styles.infoValue}>{item.specs}</Text>
            </View>

            {/* SOP Penggunaan */}
            <View style={[styles.infoBox, { borderLeftColor: '#10B981' }]}>
              <View style={styles.infoRow}>
                <ShieldCheck color="#10B981" size={16} style={{ marginRight: 8 }} />
                <Text style={[styles.infoLabel, { color: '#10B981' }]}>SOP & Kalibrasi:</Text>
              </View>
              <Text style={styles.infoValue}>{item.sopText}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bannerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  bannerDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  componentName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  arabicName: {
    color: '#F59E0B',
    fontSize: 13,
    marginTop: 2,
  },
  functionText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  infoValue: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
});
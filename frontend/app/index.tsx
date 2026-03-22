import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="flag" size={32} color="#E10600" />
            <Text style={styles.title}>Formula 1 Tracker</Text>
          </View>
          <Text style={styles.subtitle}>Your ultimate F1 companion</Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.grid}>
          <Link href="/standings" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#E10600' }]}>
                <Ionicons name="trophy" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Standings</Text>
              <Text style={styles.cardSubtitle}>Championship rankings</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/schedule" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#15151E' }]}>
                <Ionicons name="calendar" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Schedule</Text>
              <Text style={styles.cardSubtitle}>Race calendar</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/drivers" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#00D2BE' }]}>
                <Ionicons name="person" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Drivers</Text>
              <Text style={styles.cardSubtitle}>Driver profiles</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/teams" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF8700' }]}>
                <Ionicons name="people" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Teams</Text>
              <Text style={styles.cardSubtitle}>Constructor info</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#00D2BE" />
            <Text style={styles.featureText}>Live race tracking & results</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#00D2BE" />
            <Text style={styles.featureText}>Championship standings</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#00D2BE" />
            <Text style={styles.featureText}>Driver & team tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#00D2BE" />
            <Text style={styles.featureText}>Historical race data</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This app is not affiliated with, endorsed by, or sponsored by Formula One Licensing BV.
            Formula 1, F1, and related marks are trademarks of Formula One Licensing BV.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#ccc',
  },
  disclaimer: {
    padding: 16,
    backgroundColor: '#15151E',
    borderRadius: 12,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

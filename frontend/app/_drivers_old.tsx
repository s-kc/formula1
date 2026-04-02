import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
interface Driver {
  driverId: string;
  givenName: string;
  familyName: string;
  nationality: string;
  permanentNumber?: string;
  code?: string;
  dateOfBirth?: string;
}
// Country flag emojis mapping
const COUNTRY_FLAGS: { [key: string]: string } = {
  British: '🇬🇧',
  Dutch: '🇳🇱',
  Spanish: '🇪🇸',
  Monegasque: '🇲🇨',
  Mexican: '🇲🇽',
  Thai: '🇹🇭',
  French: '🇫🇷',
  Australian: '🇦🇺',
  Canadian: '🇨🇦',
  Japanese: '🇯🇵',
  Chinese: '🇨🇳',
  German: '🇩🇪',
  Finnish: '🇫🇮',
  Danish: '🇩🇰',
  American: '🇺🇸',
  New_Zealander: '🇳🇿',
  Argentine: '🇦🇷',
};
function getFlagForNationality(nationality: string): string {
  return COUNTRY_FLAGS[nationality.replace(' ', '_')] || '🏁';
}
export default function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/drivers`);
      const data = await response.json();
      if (data?.MRData?.DriverTable?.Drivers) {
        // Sort drivers by permanent number
        const sortedDrivers = data.MRData.DriverTable.Drivers.sort((a: Driver, b: Driver) => {
          const numA = parseInt(a.permanentNumber || '999');
          const numB = parseInt(b.permanentNumber || '999');
          return numA - numB;
        });
        setDrivers(sortedDrivers);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchDrivers();
  }, []);
  const onRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };
  const filteredDrivers = drivers.filter((driver) => {
    const fullName = `${driver.givenName} ${driver.familyName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading drivers...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>2025 F1 Drivers</Text>
          <Text style={styles.headerSubtitle}>{drivers.length} drivers on the grid</Text>
        </View>
        <View style={styles.driversContainer}>
          {filteredDrivers.map((driver) => (
            <Link key={driver.driverId} href={`/driver/${driver.driverId}`} asChild>
              <TouchableOpacity style={styles.driverCard}>
                <View style={styles.driverHeader}>
                  {driver.permanentNumber && (
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberText}>{driver.permanentNumber}</Text>
                    </View>
                  )}
                  {driver.code && (
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeText}>{driver.code}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>
                    {driver.givenName} {driver.familyName}
                  </Text>
                  <View style={styles.nationalityRow}>
                    <Text style={styles.flag}>{getFlagForNationality(driver.nationality)}</Text>
                    <Text style={styles.nationality}>{driver.nationality}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>
            </Link>
          ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  driversContainer: {
    padding: 16,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 12,
  },
  driverHeader: {
    alignItems: 'center',
    minWidth: 50,
    marginRight: 12,
  },
  numberBadge: {
    backgroundColor: '#E10600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  numberText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  codeBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    color: '#999',
    fontSize: 11,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  nationalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  nationality: {
    fontSize: 14,
    color: '#999',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
interface Constructor {
  constructorId: string;
  name: string;
  nationality: string;
  url?: string;
}
// Team colors mapping
const TEAM_COLORS: { [key: string]: string } = {
  red_bull: '#0600EF',
  ferrari: '#DC0000',
  mercedes: '#00D2BE',
  mclaren: '#FF8700',
  alpine: '#0090FF',
  aston_martin: '#006F62',
  williams: '#005AFF',
  alphatauri: '#2B4562',
  rb: '#2B4562',
  alfa: '#900000',
  kick_sauber: '#00FF00',
  sauber: '#00FF00',
  haas: '#FFFFFF',
};
// Country flag emojis mapping
const COUNTRY_FLAGS: { [key: string]: string } = {
  British: '🇬🇧',
  Italian: '🇮🇹',
  German: '🇩🇪',
  Austrian: '🇦🇹',
  French: '🇫🇷',
  American: '🇺🇸',
  Swiss: '🇨🇭',
};
function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] || '#999999';
}
function getFlagForNationality(nationality: string): string {
  return COUNTRY_FLAGS[nationality.replace(' ', '_')] || '🏁';
}
export default function TeamsScreen() {
  const [teams, setTeams] = useState<Constructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/constructors`);
      const data = await response.json();
      if (data?.MRData?.ConstructorTable?.Constructors) {
        setTeams(data.MRData.ConstructorTable.Constructors);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchTeams();
  }, []);
  const onRefresh = () => {
    setRefreshing(true);
    fetchTeams();
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading teams...</Text>
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
          <Text style={styles.headerTitle}>2025 F1 Teams</Text>
          <Text style={styles.headerSubtitle}>{teams.length} constructors competing</Text>
        </View>
        <View style={styles.teamsContainer}>
          {teams.map((team) => (
            <Link key={team.constructorId} href={`/team/${team.constructorId}`} asChild>
              <TouchableOpacity style={styles.teamCard}>
                <View
                  style={[
                    styles.colorStripe,
                    { backgroundColor: getTeamColor(team.constructorId) },
                  ]}
                />
                <View style={styles.teamContent}>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <View style={styles.nationalityRow}>
                      <Text style={styles.flag}>{getFlagForNationality(team.nationality)}</Text>
                      <Text style={styles.nationality}>{team.nationality}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </View>
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
  teamsContainer: {
    padding: 16,
  },
  teamCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  colorStripe: {
    width: 6,
  },
  teamContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  nationalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 18,
  },
  nationality: {
    fontSize: 14,
    color: '#999',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: {
    constructorId: string;
    name: string;
    nationality: string;
  };
}

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

function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] || '#999999';
}

export default function TeamsScreen() {
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/standings/constructors`);
      const data = await response.json();
      
      if (data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings) {
        setConstructorStandings(data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
      }
      
    } catch (error) {
      console.error('Error fetching constructor standings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStandings();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading constructor standings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Constructors</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />
        }
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Ionicons name="hammer" size={20} color="#E10600" />
          <Text style={styles.sectionTitle}>Constructors Championship</Text>
        </View>

        <View style={styles.standingsContainer}>
          {constructorStandings.map((standing, index) => (
            <View key={standing.Constructor.constructorId} style={styles.standingCard}>
              <View style={styles.positionSection}>
                <Text style={styles.position}>{standing.position}</Text>
                {index < 3 && (
                  <Ionicons
                    name="trophy"
                    size={16}
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                  />
                )}
              </View>
              
              <View
                style={[
                  styles.colorBar,
                  { backgroundColor: getTeamColor(standing.Constructor.constructorId) },
                ]}
              />
              
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{standing.Constructor.name}</Text>
                <Text style={styles.nationality}>{standing.Constructor.nationality}</Text>
              </View>
              
              <View style={styles.statsSection}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{standing.points}</Text>
                  <Text style={styles.statLabel}>PTS</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{standing.wins}</Text>
                  <Text style={styles.statLabel}>WINS</Text>
                </View>
              </View>
            </View>
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
  pageHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ccc',
    marginLeft: 8,
  },
  standingsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  standingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  positionSection: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  position: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  colorBar: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  nationality: {
    fontSize: 14,
    color: '#999',
  },
  statsSection: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  stat: {
    alignItems: 'center',
    marginRight: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E10600',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});

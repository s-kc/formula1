import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    givenName: string;
    familyName: string;
    nationality: string;
    permanentNumber?: string;
    code?: string;
  };
  Constructors: Array<{
    constructorId: string;
    name: string;
  }>;
}

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

function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] || '#999999';
}

export default function RidersScreen() {
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      
      // Fetch driver standings
      const driverResponse = await fetch(`${BACKEND_URL}/api/standings/drivers`);
      const driverData = await driverResponse.json();
      
      if (driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) {
        setDriverStandings(driverData.MRData.StandingsTable.StandingsLists[0].DriverStandings);
      }
      
    } catch (error) {
      console.error('Error fetching standings:', error);
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
          <Text style={styles.loadingText}>Loading standings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />
        }
      >
        <View style={styles.standingsContainer}>
          {driverStandings.map((standing, index) => (
            <View key={standing.Driver.driverId} style={styles.standingCard}>
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
                  { backgroundColor: getTeamColor(standing.Constructors[0]?.constructorId) },
                ]}
              />
              
              <View style={styles.driverInfo}>
                <View style={styles.driverNameSection}>
                  <Text style={styles.driverName}>
                    {standing.Driver.givenName} {standing.Driver.familyName}
                  </Text>
                  {standing.Driver.code && (
                    <Text style={styles.driverCode}>{standing.Driver.code}</Text>
                  )}
                </View>
                <Text style={styles.teamName}>{standing.Constructors[0]?.name}</Text>
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginHorizontal: 6,
  },
  activeTab: {
    backgroundColor: '#2a1a1a',
    borderColor: '#E10600',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#E10600',
  },
  scrollView: {
    flex: 1,
  },
  standingsContainer: {
    padding: 16,
  },
  standingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 12,
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
  },
  colorBar: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  driverCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E10600',
    backgroundColor: '#2a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamName: {
    fontSize: 14,
    color: '#999',
  },
  constructorName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
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

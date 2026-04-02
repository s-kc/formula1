import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

export default function ResultsScreen() {
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [raceResults, setRaceResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchScheduleAndLastRace();
  }, []);

  const fetchScheduleAndLastRace = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/schedule`);
      const data = await response.json();
      
      if (data?.MRData?.RaceTable?.Races) {
        const allRaces = data.MRData.RaceTable.Races;
        setRaces(allRaces);
        
        // Find last completed race
        const now = new Date();
        const pastRaces = allRaces.filter((race: any) => {
          const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
          return raceDateTime <= now;
        });
        
        if (pastRaces.length > 0) {
          const lastRace = pastRaces[pastRaces.length - 1];
          setSelectedRace(lastRace);
          fetchRaceResults(lastRace.round);
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRaceResults = async (round: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/race/${round}/results`);
      const data = await response.json();
      
      if (data?.MRData?.RaceTable?.Races?.[0]?.Results) {
        setRaceResults(data.MRData.RaceTable.Races[0].Results);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchScheduleAndLastRace();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading results...</Text>
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
        {selectedRace && (
          <View style={styles.raceHeader}>
            <Text style={styles.raceName}>{selectedRace.raceName}</Text>
            <Text style={styles.raceInfo}>
              {selectedRace.Circuit.Location.locality}, {selectedRace.Circuit.Location.country}
            </Text>
            <Text style={styles.raceDate}>
              {new Date(selectedRace.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}

        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Race Results</Text>
          {raceResults.map((result, index) => (
            <View key={result.position} style={styles.resultCard}>
              <View style={styles.positionSection}>
                <Text style={styles.position}>{result.position}</Text>
                {index < 3 && (
                  <Ionicons
                    name="trophy"
                    size={14}
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                  />
                )}
              </View>

              <View
                style={[
                  styles.colorBar,
                  { backgroundColor: getTeamColor(result.Constructor?.constructorId) },
                ]}
              />

              <View style={styles.driverInfo}>
                <View style={styles.driverNameRow}>
                  <Text style={styles.driverName}>
                    {result.Driver.givenName} {result.Driver.familyName}
                  </Text>
                  {result.Driver.code && (
                    <Text style={styles.driverCode}>{result.Driver.code}</Text>
                  )}
                </View>
                <Text style={styles.teamName}>{result.Constructor?.name}</Text>
                {result.Time?.time && (
                  <Text style={styles.time}>{result.Time.time}</Text>
                )}
                {result.status !== 'Finished' && (
                  <Text style={styles.status}>{result.status}</Text>
                )}
              </View>

              <View style={styles.pointsSection}>
                <Text style={styles.points}>{result.points}</Text>
                <Text style={styles.pointsLabel}>PTS</Text>
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
  scrollView: {
    flex: 1,
  },
  raceHeader: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  raceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  raceInfo: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  raceDate: {
    fontSize: 14,
    color: '#999',
  },
  resultsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  positionSection: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
  },
  position: {
    fontSize: 18,
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
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E10600',
    backgroundColor: '#2a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamName: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: '#00D2BE',
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: '#E10600',
    fontStyle: 'italic',
  },
  pointsSection: {
    alignItems: 'center',
    minWidth: 40,
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E10600',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#999',
  },
});

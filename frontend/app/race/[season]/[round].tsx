import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

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

export default function RaceDetailsScreen() {
  const { season, round } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'qualifying' | 'sprint' | 'race'>('race');
  const [raceData, setRaceData] = useState<any>(null);
  const [qualifyingData, setQualifyingData] = useState<any>(null);
  const [sprintData, setSprintData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRaceData();
  }, [season, round]);

  const fetchRaceData = async () => {
    try {
      setLoading(true);
      
      // Fetch race results
      const raceResponse = await fetch(`${BACKEND_URL}/api/race/${round}/results?season=${season}`);
      const raceJson = await raceResponse.json();
      if (raceJson?.MRData?.RaceTable?.Races?.[0]) {
        setRaceData(raceJson.MRData.RaceTable.Races[0]);
      }
      
      // Fetch qualifying results
      const qualifyingResponse = await fetch(`${BACKEND_URL}/api/race/${round}/qualifying?season=${season}`);
      const qualifyingJson = await qualifyingResponse.json();
      if (qualifyingJson?.MRData?.RaceTable?.Races?.[0]) {
        setQualifyingData(qualifyingJson.MRData.RaceTable.Races[0]);
      }
      
      // Fetch sprint results (may not exist for all races)
      const sprintResponse = await fetch(`${BACKEND_URL}/api/race/${round}/sprint?season=${season}`);
      const sprintJson = await sprintResponse.json();
      if (sprintJson?.MRData?.RaceTable?.Races?.[0]) {
        setSprintData(sprintJson.MRData.RaceTable.Races[0]);
      }
      
    } catch (error) {
      console.error('Error fetching race data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading race data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!raceData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No race data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Race Header */}
      <View style={styles.header}>
        <Text style={styles.raceName}>{raceData.raceName}</Text>
        <Text style={styles.raceInfo}>
          {raceData.Circuit.Location.locality}, {raceData.Circuit.Location.country}
        </Text>
        <Text style={styles.raceDate}>{new Date(raceData.date).toLocaleDateString('en-US', { 
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
        })}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'race' && styles.activeTab]}
          onPress={() => setActiveTab('race')}
        >
          <Ionicons name="trophy" size={20} color={activeTab === 'race' ? '#E10600' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'race' && styles.activeTabText]}>Race</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'qualifying' && styles.activeTab]}
          onPress={() => setActiveTab('qualifying')}
        >
          <Ionicons name="speedometer" size={20} color={activeTab === 'qualifying' ? '#E10600' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'qualifying' && styles.activeTabText]}>Qualifying</Text>
        </TouchableOpacity>

        {sprintData && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sprint' && styles.activeTab]}
            onPress={() => setActiveTab('sprint')}
          >
            <Ionicons name="flash" size={20} color={activeTab === 'sprint' ? '#E10600' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'sprint' && styles.activeTabText]}>Sprint</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Race Results */}
        {activeTab === 'race' && raceData.Results && (
          <View style={styles.resultsContainer}>
            {raceData.Results.map((result: any, index: number) => (
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
        )}

        {/* Qualifying Results */}
        {activeTab === 'qualifying' && qualifyingData?.QualifyingResults && (
          <View style={styles.resultsContainer}>
            {qualifyingData.QualifyingResults.map((result: any) => (
              <View key={result.position} style={styles.resultCard}>
                <View style={styles.positionSection}>
                  <Text style={styles.position}>{result.position}</Text>
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
                  <View style={styles.qualifyingTimes}>
                    {result.Q3 && (
                      <Text style={styles.bestTime}>Q3: {result.Q3}</Text>
                    )}
                    {!result.Q3 && result.Q2 && (
                      <Text style={styles.bestTime}>Q2: {result.Q2}</Text>
                    )}
                    {!result.Q3 && !result.Q2 && result.Q1 && (
                      <Text style={styles.bestTime}>Q1: {result.Q1}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sprint Results */}
        {activeTab === 'sprint' && sprintData?.SprintResults && (
          <View style={styles.resultsContainer}>
            {sprintData.SprintResults.map((result: any, index: number) => (
              <View key={result.position} style={styles.resultCard}>
                <View style={styles.positionSection}>
                  <Text style={styles.position}>{result.position}</Text>
                  {index < 3 && (
                    <Ionicons
                      name="flash"
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
                </View>

                <View style={styles.pointsSection}>
                  <Text style={styles.points}>{result.points}</Text>
                  <Text style={styles.pointsLabel}>PTS</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  errorText: {
    color: '#E10600',
    fontSize: 16,
  },
  header: {
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0c0c0c',
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
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#2a1a1a',
    borderColor: '#E10600',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#E10600',
  },
  scrollView: {
    flex: 1,
  },
  resultsContainer: {
    padding: 16,
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
  qualifyingTimes: {
    marginTop: 4,
  },
  bestTime: {
    fontSize: 14,
    color: '#00D2BE',
    fontWeight: '600',
  },
});

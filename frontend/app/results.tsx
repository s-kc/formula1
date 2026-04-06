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

const COUNTRY_FLAGS: { [key: string]: string } = {
  Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  Australia: '🇦🇺',
  Japan: '🇯🇵',
  China: '🇨🇳',
  USA: '🇺🇸',
  Italy: '🇮🇹',
  Monaco: '🇲🇨',
  Canada: '🇨🇦',
  Spain: '🇪🇸',
  Austria: '🇦🇹',
  UK: '🇬🇧',
  Hungary: '🇭🇺',
  Belgium: '🇧🇪',
  Netherlands: '🇳🇱',
  Azerbaijan: '🇦🇿',
  Singapore: '🇸🇬',
  Mexico: '🇲🇽',
  Brazil: '🇧🇷',
  Qatar: '🇶🇦',
  'United States': '🇺🇸',
  'United Arab Emirates': '🇦🇪',
  UAE: '🇦🇪',
};

const PODIUM_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

interface SessionResult {
  position: string;
  Driver: {
    driverId: string;
    givenName: string;
    familyName: string;
    code?: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  Time?: { time: string };
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] || '#999999';
}

function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🏁';
}

function getPodiumColor(position: number): string {
  return PODIUM_COLORS[position as keyof typeof PODIUM_COLORS] || '#999';
}

export default function ResultsScreen() {
  const [completedRaces, setCompletedRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [raceResults, setRaceResults] = useState<any[]>([]);
  const [qualifyingTop3, setQualifyingTop3] = useState<SessionResult[]>([]);
  const [sprintTop3, setSprintTop3] = useState<SessionResult[]>([]);
  const [raceTop3, setRaceTop3] = useState<SessionResult[]>([]);
  const [hasSprint, setHasSprint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState<'winners' | 'full'>('winners');

  useEffect(() => {
    fetchCompletedRaces();
  }, []);

  const fetchCompletedRaces = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/schedule`);
      const data = await response.json();
      
      if (data?.MRData?.RaceTable?.Races) {
        const allRaces = data.MRData.RaceTable.Races;
        
        // Filter only completed races
        const now = new Date();
        const pastRaces = allRaces.filter((race: any) => {
          const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
          return raceDateTime <= now;
        });
        
        setCompletedRaces(pastRaces.reverse()); // Show most recent first
      }
    } catch (error) {
      console.error('Error fetching completed races:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRaceResults = async (race: any) => {
    try {
      setLoadingResults(true);
      setSelectedRace(race);
      setActiveResultsTab('winners');
      
      // Check if race has sprint
      const raceHasSprint = !!race.Sprint;
      setHasSprint(raceHasSprint);
      
      // Fetch all results in parallel
      const [raceResponse, qualifyingResponse, sprintResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/race/${race.round}/results`),
        fetch(`${BACKEND_URL}/api/race/${race.round}/qualifying`),
        raceHasSprint ? fetch(`${BACKEND_URL}/api/race/${race.round}/sprint`) : Promise.resolve(null)
      ]);
      
      // Parse race results - get top 3
      const raceData = await raceResponse.json();
      if (raceData?.MRData?.RaceTable?.Races?.[0]?.Results) {
        const results = raceData.MRData.RaceTable.Races[0].Results;
        setRaceResults(results);
        // Get top 3
        const top3 = results.filter((r: any) => ['1', '2', '3'].includes(r.position));
        setRaceTop3(top3);
      } else {
        setRaceTop3([]);
      }
      
      // Parse qualifying results - get top 3
      const qualifyingData = await qualifyingResponse.json();
      if (qualifyingData?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults) {
        const qualResults = qualifyingData.MRData.RaceTable.Races[0].QualifyingResults;
        const top3 = qualResults.filter((r: any) => ['1', '2', '3'].includes(r.position));
        setQualifyingTop3(top3);
      } else {
        setQualifyingTop3([]);
      }
      
      // Parse sprint results - get top 3 if available
      if (sprintResponse) {
        const sprintData = await sprintResponse.json();
        if (sprintData?.MRData?.RaceTable?.Races?.[0]?.SprintResults) {
          const sprintResults = sprintData.MRData.RaceTable.Races[0].SprintResults;
          const top3 = sprintResults.filter((r: any) => ['1', '2', '3'].includes(r.position));
          setSprintTop3(top3);
        } else {
          setSprintTop3([]);
        }
      } else {
        setSprintTop3([]);
      }
      
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoadingResults(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSelectedRace(null);
    setRaceResults([]);
    setQualifyingTop3([]);
    setSprintTop3([]);
    setRaceTop3([]);
    fetchCompletedRaces();
  };

  const handleBackToRaces = () => {
    setSelectedRace(null);
    setRaceResults([]);
    setQualifyingTop3([]);
    setSprintTop3([]);
    setRaceTop3([]);
    setActiveResultsTab('winners');
  };

  const renderPodiumCard = (
    title: string, 
    top3: SessionResult[], 
    icon: string, 
    iconColor: string,
    getTimeValue: (result: SessionResult) => string | undefined
  ) => {
    if (top3.length === 0) return null;
    
    return (
      <View style={styles.podiumCard}>
        <View style={styles.podiumHeader}>
          <View style={[styles.podiumIconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon as any} size={24} color={iconColor} />
          </View>
          <Text style={styles.podiumTitle}>{title}</Text>
        </View>
        
        <View style={styles.podiumContent}>
          {top3.map((result, index) => {
            const position = parseInt(result.position);
            const timeValue = getTimeValue(result);
            
            return (
              <View key={result.position} style={styles.podiumRow}>
                <View style={styles.podiumPosition}>
                  <View style={[styles.positionBadge, { backgroundColor: getPodiumColor(position) + '30' }]}>
                    <Ionicons 
                      name="trophy" 
                      size={16} 
                      color={getPodiumColor(position)} 
                    />
                    <Text style={[styles.positionText, { color: getPodiumColor(position) }]}>
                      P{result.position}
                    </Text>
                  </View>
                </View>
                
                <View
                  style={[
                    styles.podiumColorBar,
                    { backgroundColor: getTeamColor(result.Constructor?.constructorId) },
                  ]}
                />
                
                <View style={styles.podiumDriverInfo}>
                  <View style={styles.podiumNameRow}>
                    <Text style={styles.podiumDriverName}>
                      {result.Driver.givenName} {result.Driver.familyName}
                    </Text>
                    {result.Driver.code && (
                      <Text style={styles.driverCode}>{result.Driver.code}</Text>
                    )}
                  </View>
                  <Text style={styles.podiumTeam}>{result.Constructor?.name}</Text>
                </View>
                
                {timeValue && (
                  <View style={styles.podiumTimeContainer}>
                    <Text style={styles.podiumTime}>{timeValue}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
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
        {!selectedRace ? (
          <View style={styles.racesListContainer}>
            {/* Page Header */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Completed Races</Text>
            </View>
            {completedRaces.map((race) => (
              <TouchableOpacity
                key={race.round}
                style={styles.raceCard}
                onPress={() => fetchRaceResults(race)}
              >
                <View style={styles.raceCardHeader}>
                  <View style={styles.raceTitleRow}>
                    <Text style={styles.raceFlag}>{getCountryFlag(race.Circuit.Location.country)}</Text>
                    <View style={styles.raceTitleContent}>
                      <Text style={styles.raceNameText}>{race.raceName}</Text>
                      <Text style={styles.circuitText}>{race.Circuit.circuitName}</Text>
                      <Text style={styles.locationText}>
                        {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar" size={16} color="#00D2BE" />
                    <Text style={styles.dateText}>
                      {new Date(race.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    {race.Sprint && (
                      <View style={styles.sprintBadge}>
                        <Text style={styles.sprintBadgeText}>SPRINT</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.viewResultsRow}>
                  <Text style={styles.viewResultsText}>View Results</Text>
                  <Ionicons name="chevron-forward" size={20} color="#E10600" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <>
            {/* Race Header */}
            <View style={styles.resultsHeader}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackToRaces}>
                <Ionicons name="arrow-back" size={24} color="#E10600" />
                <Text style={styles.backText}>Back to Races</Text>
              </TouchableOpacity>
              
              <View style={styles.raceInfoHeader}>
                <Text style={styles.raceFlag}>{getCountryFlag(selectedRace.Circuit.Location.country)}</Text>
                <View style={styles.raceInfoContent}>
                  <Text style={styles.raceName}>{selectedRace.raceName}</Text>
                  <Text style={styles.circuitName}>{selectedRace.Circuit.circuitName}</Text>
                  <Text style={styles.raceInfo}>
                    {selectedRace.Circuit.Location.locality}, {selectedRace.Circuit.Location.country}
                  </Text>
                  <View style={styles.raceDateRow}>
                    <Ionicons name="calendar" size={14} color="#999" />
                    <Text style={styles.raceDate}>
                      {new Date(selectedRace.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Results Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeResultsTab === 'winners' && styles.activeTab]}
                onPress={() => setActiveResultsTab('winners')}
              >
                <Ionicons
                  name="trophy"
                  size={18}
                  color={activeResultsTab === 'winners' ? '#E10600' : '#999'}
                />
                <Text style={[styles.tabText, activeResultsTab === 'winners' && styles.activeTabText]}>
                  Podium
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeResultsTab === 'full' && styles.activeTab]}
                onPress={() => setActiveResultsTab('full')}
              >
                <Ionicons
                  name="list"
                  size={18}
                  color={activeResultsTab === 'full' ? '#E10600' : '#999'}
                />
                <Text style={[styles.tabText, activeResultsTab === 'full' && styles.activeTabText]}>
                  Full Results
                </Text>
              </TouchableOpacity>
            </View>

            {/* Race Results */}
            {loadingResults ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E10600" />
                <Text style={styles.loadingText}>Loading session data...</Text>
              </View>
            ) : activeResultsTab === 'winners' ? (
              <View style={styles.podiumContainer}>
                <Text style={styles.sectionTitle}>Session Podiums</Text>
                
                {/* Qualifying Top 3 */}
                {renderPodiumCard(
                  'Qualifying',
                  qualifyingTop3,
                  'stopwatch',
                  '#9B59B6',
                  (result) => result.Q3 || result.Q2 || result.Q1
                )}
                
                {/* Sprint Top 3 (only if sprint weekend) */}
                {hasSprint && renderPodiumCard(
                  'Sprint Race',
                  sprintTop3,
                  'flash',
                  '#F39C12',
                  (result) => result.Time?.time
                )}
                
                {/* Race Top 3 */}
                {renderPodiumCard(
                  'Grand Prix',
                  raceTop3,
                  'flag',
                  '#E10600',
                  (result) => result.Time?.time
                )}
                
                {qualifyingTop3.length === 0 && sprintTop3.length === 0 && raceTop3.length === 0 && (
                  <View style={styles.noDataContainer}>
                    <Ionicons name="information-circle" size={48} color="#666" />
                    <Text style={styles.noDataText}>No session data available yet</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.resultsContainer}>
                <Text style={styles.sectionTitle}>Race Classification</Text>
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
            )}
          </>
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
    padding: 20,
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  racesListContainer: {
    padding: 16,
    paddingTop: 0,
  },
  pageHeader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  raceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  raceCardHeader: {
    marginBottom: 12,
  },
  raceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  raceFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  raceTitleContent: {
    flex: 1,
  },
  raceNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  circuitText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#999',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#00D2BE',
    marginLeft: 6,
    fontWeight: '600',
  },
  sprintBadge: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 10,
  },
  sprintBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewResultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  viewResultsText: {
    fontSize: 14,
    color: '#E10600',
    fontWeight: '600',
  },
  resultsHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#E10600',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  raceInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  raceInfoContent: {
    flex: 1,
  },
  raceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  circuitName: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  raceInfo: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  raceDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  raceDate: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#2a2a2a',
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
  podiumContainer: {
    padding: 16,
  },
  podiumCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  podiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  podiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  podiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  podiumContent: {
    padding: 4,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  podiumPosition: {
    marginRight: 10,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  podiumColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  podiumDriverInfo: {
    flex: 1,
  },
  podiumNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  podiumDriverName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  podiumTeam: {
    fontSize: 12,
    color: '#888',
  },
  podiumTimeContainer: {
    backgroundColor: '#0a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  podiumTime: {
    fontSize: 12,
    color: '#00D2BE',
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
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
});

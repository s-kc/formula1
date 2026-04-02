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

interface SessionWinner {
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

export default function ResultsScreen() {
  const [completedRaces, setCompletedRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [raceResults, setRaceResults] = useState<any[]>([]);
  const [qualifyingWinner, setQualifyingWinner] = useState<SessionWinner | null>(null);
  const [sprintWinner, setSprintWinner] = useState<SessionWinner | null>(null);
  const [raceWinner, setRaceWinner] = useState<SessionWinner | null>(null);
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
      
      // Parse race results
      const raceData = await raceResponse.json();
      if (raceData?.MRData?.RaceTable?.Races?.[0]?.Results) {
        const results = raceData.MRData.RaceTable.Races[0].Results;
        setRaceResults(results);
        // Get race winner (P1)
        const winner = results.find((r: any) => r.position === '1');
        setRaceWinner(winner || null);
      }
      
      // Parse qualifying results
      const qualifyingData = await qualifyingResponse.json();
      if (qualifyingData?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults) {
        const qualResults = qualifyingData.MRData.RaceTable.Races[0].QualifyingResults;
        const poleWinner = qualResults.find((r: any) => r.position === '1');
        setQualifyingWinner(poleWinner || null);
      } else {
        setQualifyingWinner(null);
      }
      
      // Parse sprint results if available
      if (sprintResponse) {
        const sprintData = await sprintResponse.json();
        if (sprintData?.MRData?.RaceTable?.Races?.[0]?.SprintResults) {
          const sprintResults = sprintData.MRData.RaceTable.Races[0].SprintResults;
          const sprintWinnerResult = sprintResults.find((r: any) => r.position === '1');
          setSprintWinner(sprintWinnerResult || null);
        } else {
          setSprintWinner(null);
        }
      } else {
        setSprintWinner(null);
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
    setQualifyingWinner(null);
    setSprintWinner(null);
    setRaceWinner(null);
    fetchCompletedRaces();
  };

  const handleBackToRaces = () => {
    setSelectedRace(null);
    setRaceResults([]);
    setQualifyingWinner(null);
    setSprintWinner(null);
    setRaceWinner(null);
    setActiveResultsTab('winners');
  };

  const renderWinnerCard = (
    title: string, 
    winner: SessionWinner | null, 
    icon: string, 
    iconColor: string,
    timeLabel: string,
    timeValue?: string
  ) => {
    if (!winner) return null;
    
    return (
      <View style={styles.winnerCard}>
        <View style={styles.winnerHeader}>
          <View style={styles.winnerIconContainer}>
            <Ionicons name={icon as any} size={24} color={iconColor} />
          </View>
          <Text style={styles.winnerTitle}>{title}</Text>
        </View>
        
        <View style={styles.winnerContent}>
          <View
            style={[
              styles.winnerColorBar,
              { backgroundColor: getTeamColor(winner.Constructor?.constructorId) },
            ]}
          />
          
          <View style={styles.winnerInfo}>
            <View style={styles.winnerNameRow}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
              <Text style={styles.winnerName}>
                {winner.Driver.givenName} {winner.Driver.familyName}
              </Text>
              {winner.Driver.code && (
                <Text style={styles.driverCode}>{winner.Driver.code}</Text>
              )}
            </View>
            <Text style={styles.winnerTeam}>{winner.Constructor?.name}</Text>
            {timeValue && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>{timeLabel}:</Text>
                <Text style={styles.timeValue}>{timeValue}</Text>
              </View>
            )}
          </View>
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
            <Text style={styles.sectionTitle}>Completed Races</Text>
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
                  Winners
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
              <View style={styles.winnersContainer}>
                <Text style={styles.sectionTitle}>Session Winners</Text>
                
                {/* Qualifying Winner */}
                {renderWinnerCard(
                  'Qualifying - Pole Position',
                  qualifyingWinner,
                  'stopwatch',
                  '#9B59B6',
                  'Best Time',
                  qualifyingWinner?.Q3 || qualifyingWinner?.Q2 || qualifyingWinner?.Q1
                )}
                
                {/* Sprint Winner (only if sprint weekend) */}
                {hasSprint && renderWinnerCard(
                  'Sprint Race Winner',
                  sprintWinner,
                  'flash',
                  '#F39C12',
                  'Time',
                  sprintWinner?.Time?.time
                )}
                
                {/* Race Winner */}
                {renderWinnerCard(
                  'Grand Prix Winner',
                  raceWinner,
                  'flag',
                  '#E10600',
                  'Time',
                  raceWinner?.Time?.time
                )}
                
                {!qualifyingWinner && !sprintWinner && !raceWinner && (
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
  winnersContainer: {
    padding: 16,
  },
  winnerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  winnerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  winnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerColorBar: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 14,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
    marginRight: 8,
  },
  winnerTeam: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 6,
  },
  timeValue: {
    fontSize: 14,
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

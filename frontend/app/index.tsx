import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Race {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitName: string;
    Location: {
      locality: string;
      country: string;
    };
  };
}

interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: {
    givenName: string;
    familyName: string;
    code?: string;
  };
  Constructors: Array<{
    constructorId: string;
    name: string;
  }>;
}

interface ConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: {
    name: string;
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

function getCountdown(raceDate: string, raceTime?: string): { text: string; isPast: boolean } {
  const dateTimeString = raceTime ? `${raceDate}T${raceTime}` : `${raceDate}T14:00:00Z`;
  const raceDateTime = new Date(dateTimeString);
  const now = new Date();
  const diff = raceDateTime.getTime() - now.getTime();

  if (diff < 0) {
    return { text: 'Completed', isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { text: `${days}d ${hours}h ${minutes}m`, isPast: false };
}

export default function HomeScreen() {
  const [races, setRaces] = useState<Race[]>([]);
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<{ text: string; isPast: boolean }>({ text: '', isPast: false });
  const [selectedSeason, setSelectedSeason] = useState('current');
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);

  const currentYear = new Date().getFullYear();
  const historicYears = [currentYear.toString(), ...Array.from({ length: 5 }, (_, i) => (currentYear - 1 - i).toString())];

  useEffect(() => {
    checkAvailableSeasons();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedSeason]);

  const checkAvailableSeasons = async () => {
    // Check which historic seasons have data
    const available = ['current'];
    for (const year of historicYears.slice(1)) { // Skip current year
      try {
        const response = await fetch(`${BACKEND_URL}/api/schedule?season=${year}`);
        const data = await response.json();
        if (data?.MRData?.RaceTable?.Races && data.MRData.RaceTable.Races.length > 0) {
          available.push(year);
        }
      } catch (error) {
        console.log(`No data for ${year}`);
      }
    }
    setAvailableSeasons(available);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const seasonParam = selectedSeason === 'current' ? 'current' : selectedSeason;
      
      // Fetch race schedule
      const scheduleResponse = await fetch(`${BACKEND_URL}/api/schedule?season=${seasonParam}`);
      const scheduleData = await scheduleResponse.json();
      if (scheduleData?.MRData?.RaceTable?.Races) {
        setRaces(scheduleData.MRData.RaceTable.Races);
      }
      
      // Fetch driver standings
      const driverResponse = await fetch(`${BACKEND_URL}/api/standings/drivers?season=${seasonParam}`);
      const driverData = await driverResponse.json();
      if (driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) {
        setDriverStandings(driverData.MRData.StandingsTable.StandingsLists[0].DriverStandings.slice(0, 5));
      }
      
      // Fetch constructor standings
      const constructorResponse = await fetch(`${BACKEND_URL}/api/standings/constructors?season=${seasonParam}`);
      const constructorData = await constructorResponse.json();
      if (constructorData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings) {
        setConstructorStandings(constructorData.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.slice(0, 3));
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSeason]);

  // Update countdown every minute
  useEffect(() => {
    const nextRace = getNextRace();
    if (nextRace) {
      const updateCountdown = () => {
        setCountdown(getCountdown(nextRace.date, nextRace.time));
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [races]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getNextRace = () => {
    const now = new Date();
    return races.find((race) => {
      const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
      return raceDateTime > now;
    });
  };

  const getLastRace = () => {
    const now = new Date();
    const pastRaces = races.filter((race) => {
      const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
      return raceDateTime <= now;
    });
    return pastRaces[pastRaces.length - 1];
  };

  const getCurrentRace = () => {
    const now = new Date();
    return races.find((race) => {
      const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
      const diffHours = (raceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= -3 && diffHours <= 0; // Race happening or just finished (within 3 hours)
    });
  };

  const nextRace = getNextRace();
  const lastRace = getLastRace();
  const currentRace = getCurrentRace();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading F1 data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="flag" size={32} color="#E10600" />
            <Text style={styles.title}>Formula 1 Tracker</Text>
          </View>
          <Text style={styles.subtitle}>Your ultimate F1 companion</Text>
        </View>

        {/* Season Selector */}
        {availableSeasons.length > 1 && (
          <View style={styles.seasonSelector}>
            <Text style={styles.seasonLabel}>Season:</Text>
            <View style={styles.seasonButtonsContainer}>
              {availableSeasons.map((season) => (
                <TouchableOpacity
                  key={season}
                  style={[
                    styles.seasonButton,
                    selectedSeason === season && styles.seasonButtonActive,
                  ]}
                  onPress={() => setSelectedSeason(season)}
                >
                  <Text
                    style={[
                      styles.seasonButtonText,
                      selectedSeason === season && styles.seasonButtonTextActive,
                    ]}
                  >
                    {season === 'current' ? currentYear : season}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Current Race */}
        {currentRace && (
          <View style={[styles.raceCard, { borderColor: '#FFD700' }]}>
            <View style={styles.raceHeader}>
              <Ionicons name="radio" size={20} color="#FFD700" />
              <Text style={[styles.raceLabel, { color: '#FFD700' }]}>LIVE NOW</Text>
            </View>
            <Text style={styles.raceName}>{currentRace.raceName}</Text>
            <Text style={styles.raceLocation}>
              {currentRace.Circuit.Location.locality}, {currentRace.Circuit.Location.country}
            </Text>
            <Text style={styles.raceCircuit}>{currentRace.Circuit.circuitName}</Text>
          </View>
        )}

        {/* Next Race */}
        {nextRace && (
          <View style={styles.raceCard}>
            <View style={styles.raceHeader}>
              <Ionicons name="flag" size={20} color="#E10600" />
              <Text style={styles.raceLabel}>NEXT RACE</Text>
            </View>
            <Text style={styles.raceName}>{nextRace.raceName}</Text>
            <Text style={styles.raceLocation}>
              {nextRace.Circuit.Location.locality}, {nextRace.Circuit.Location.country}
            </Text>
            <Text style={styles.raceCircuit}>{nextRace.Circuit.circuitName}</Text>
            <View style={styles.countdownContainer}>
              <Ionicons name="time" size={28} color="#00D2BE" />
              <Text style={styles.countdownText}>{countdown.text}</Text>
            </View>
          </View>
        )}

        {/* Last Race */}
        {lastRace && (
          <Link href={`/race/${selectedSeason === 'current' ? currentYear : selectedSeason}/${lastRace.round}`} asChild>
            <TouchableOpacity style={[styles.raceCard, { opacity: 0.8 }]}>
              <View style={styles.raceHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#00D2BE" />
                <Text style={[styles.raceLabel, { color: '#00D2BE' }]}>LAST RACE - VIEW RESULTS</Text>
              </View>
              <Text style={styles.raceName}>{lastRace.raceName}</Text>
              <Text style={styles.raceLocation}>
                {lastRace.Circuit.Location.locality}, {lastRace.Circuit.Location.country}
              </Text>
              <Text style={styles.raceCircuit}>{lastRace.Circuit.circuitName}</Text>
              <View style={styles.viewResultsRow}>
                <Text style={styles.viewResultsText}>View qualifying, sprint & race results</Text>
                <Ionicons name="chevron-forward" size={20} color="#00D2BE" />
              </View>
            </TouchableOpacity>
          </Link>
        )}

        {/* Championship Standings */}
        <View style={styles.standingsSection}>
          <Link href="/standings" asChild>
            <TouchableOpacity style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="trophy" size={24} color="#E10600" />
                <Text style={styles.sectionTitle}>Championship Standings</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </Link>

          {/* Top Drivers */}
          <Text style={styles.subsectionTitle}>Top Drivers</Text>
          {driverStandings.map((standing, index) => (
            <View key={standing.Driver.familyName} style={styles.standingRow}>
              <View style={styles.standingPosition}>
                <Text style={styles.positionText}>{standing.position}</Text>
                {index < 3 && (
                  <Ionicons
                    name="trophy"
                    size={12}
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                  />
                )}
              </View>
              <View
                style={[
                  styles.teamColorBar,
                  { backgroundColor: getTeamColor(standing.Constructors[0]?.constructorId) },
                ]}
              />
              <View style={styles.standingInfo}>
                <Text style={styles.driverNameSmall}>
                  {standing.Driver.givenName} {standing.Driver.familyName}
                </Text>
                <Text style={styles.teamNameSmall}>{standing.Constructors[0]?.name}</Text>
              </View>
              <View style={styles.standingPoints}>
                <Text style={styles.pointsText}>{standing.points}</Text>
                <Text style={styles.pointsLabel}>PTS</Text>
              </View>
            </View>
          ))}

          {/* Top Constructors */}
          <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>Top Constructors</Text>
          {constructorStandings.map((standing, index) => (
            <View key={standing.Constructor.name} style={styles.standingRow}>
              <View style={styles.standingPosition}>
                <Text style={styles.positionText}>{standing.position}</Text>
                {index < 3 && (
                  <Ionicons
                    name="trophy"
                    size={12}
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                  />
                )}
              </View>
              <View style={styles.standingInfo}>
                <Text style={styles.driverNameSmall}>{standing.Constructor.name}</Text>
              </View>
              <View style={styles.standingPoints}>
                <Text style={styles.pointsText}>{standing.points}</Text>
                <Text style={styles.pointsLabel}>PTS</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.grid}>
          <Link href="/schedule" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#15151E' }]}>
                <Ionicons name="calendar" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Schedule</Text>
              <Text style={styles.cardSubtitle}>Full calendar</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/drivers" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#00D2BE' }]}>
                <Ionicons name="person" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Drivers</Text>
              <Text style={styles.cardSubtitle}>All drivers</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/teams" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF8700' }]}>
                <Ionicons name="people" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Teams</Text>
              <Text style={styles.cardSubtitle}>All constructors</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/standings" asChild>
            <TouchableOpacity style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: '#E10600' }]}>
                <Ionicons name="trophy" size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>Full Standings</Text>
              <Text style={styles.cardSubtitle}>Complete rankings</Text>
            </TouchableOpacity>
          </Link>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  raceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E10600',
  },
  raceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  raceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E10600',
    marginLeft: 8,
  },
  raceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  raceLocation: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  raceCircuit: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  viewResultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  viewResultsText: {
    fontSize: 14,
    color: '#00D2BE',
    fontWeight: '600',
  },
  seasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 12,
  },
  seasonButtonsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  seasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  seasonButtonActive: {
    backgroundColor: '#E10600',
    borderColor: '#E10600',
  },
  seasonButtonText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  seasonButtonTextActive: {
    color: 'white',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151E',
    padding: 12,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D2BE',
    marginLeft: 10,
  },
  standingsSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    marginTop: 4,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  standingPosition: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  teamColorBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginLeft: 10,
  },
  standingInfo: {
    flex: 1,
    marginLeft: 10,
  },
  driverNameSmall: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  teamNameSmall: {
    fontSize: 12,
    color: '#999',
  },
  standingPoints: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E10600',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#999',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    marginHorizontal: -8,
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
    margin: 8,
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#1a1a0a',
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

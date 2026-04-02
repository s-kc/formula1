import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
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

const COUNTRY_FLAGS: { [key: string]: string } = {
  'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  'Australia': '🇦🇺',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Italy': '🇮🇹',
  'Monaco': '🇲🇨',
  'Canada': '🇨🇦',
  'Spain': '🇪🇸',
  'Austria': '🇦🇹',
  'UK': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'Hungary': '🇭🇺',
  'Belgium': '🇧🇪',
  'Netherlands': '🇳🇱',
  'Singapore': '🇸🇬',
  'Azerbaijan': '🇦🇿',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Qatar': '🇶🇦',
  'UAE': '🇦🇪',
  'Abu Dhabi': '🇦🇪',
  'Las Vegas': '🇺🇸',
  'Miami': '🇺🇸',
};

function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] || '#999999';
}

function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🏁';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const scheduleResponse = await fetch(`${BACKEND_URL}/api/schedule`);
      const scheduleData = await scheduleResponse.json();
      if (scheduleData?.MRData?.RaceTable?.Races) {
        setRaces(scheduleData.MRData.RaceTable.Races);
      }
      
      const driverResponse = await fetch(`${BACKEND_URL}/api/standings/drivers`);
      const driverData = await driverResponse.json();
      if (driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) {
        setDriverStandings(driverData.MRData.StandingsTable.StandingsLists[0].DriverStandings.slice(0, 5));
      }
      
      const constructorResponse = await fetch(`${BACKEND_URL}/api/standings/constructors`);
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
  }, []);

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

        {/* Current Race */}
        {currentRace && (
          <View style={[styles.raceCard, { borderColor: '#FFD700' }]}>
            <View style={styles.raceHeader}>
              <Ionicons name="radio" size={20} color="#FFD700" />
              <Text style={[styles.raceLabel, { color: '#FFD700' }]}>LIVE NOW</Text>
            </View>
            <View style={styles.raceMainContent}>
              <Text style={styles.countryFlag}>{getCountryFlag(currentRace.Circuit.Location.country)}</Text>
              <View style={styles.raceDetails}>
                <Text style={styles.raceName}>{currentRace.raceName}</Text>
                <Text style={styles.raceLocation}>
                  {currentRace.Circuit.Location.locality}, {currentRace.Circuit.Location.country}
                </Text>
                <Text style={styles.raceCircuit}>{currentRace.Circuit.circuitName}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar" size={16} color="#00D2BE" />
                  <Text style={styles.dateText}>{formatDate(currentRace.date)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Next Race */}
        {nextRace && (
          <View style={styles.raceCard}>
            <View style={styles.raceHeader}>
              <Ionicons name="flag" size={20} color="#E10600" />
              <Text style={styles.raceLabel}>NEXT RACE</Text>
            </View>
            <View style={styles.raceMainContent}>
              <Text style={styles.countryFlag}>{getCountryFlag(nextRace.Circuit.Location.country)}</Text>
              <View style={styles.raceDetails}>
                <Text style={styles.raceName}>{nextRace.raceName}</Text>
                <Text style={styles.raceLocation}>
                  {nextRace.Circuit.Location.locality}, {nextRace.Circuit.Location.country}
                </Text>
                <Text style={styles.raceCircuit}>{nextRace.Circuit.circuitName}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar" size={16} color="#00D2BE" />
                  <Text style={styles.dateText}>{formatDate(nextRace.date)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.countdownContainer}>
              <Ionicons name="time" size={28} color="#00D2BE" />
              <Text style={styles.countdownText}>{countdown.text}</Text>
            </View>
          </View>
        )}

        {/* Last Race */}
        {lastRace && (
          <View style={[styles.raceCard, styles.lastRaceCard]}>
            <View style={styles.raceHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#00D2BE" />
              <Text style={[styles.raceLabel, { color: '#00D2BE' }]}>LAST RACE</Text>
            </View>
            <View style={styles.raceMainContent}>
              <Text style={styles.countryFlag}>{getCountryFlag(lastRace.Circuit.Location.country)}</Text>
              <View style={styles.raceDetails}>
                <Text style={styles.raceName}>{lastRace.raceName}</Text>
                <Text style={styles.raceLocation}>
                  {lastRace.Circuit.Location.locality}, {lastRace.Circuit.Location.country}
                </Text>
                <Text style={styles.raceCircuit}>{lastRace.Circuit.circuitName}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar" size={16} color="#999" />
                  <Text style={[styles.dateText, { color: '#999' }]}>{formatDate(lastRace.date)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Championship Standings */}
        <View style={styles.standingsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trophy" size={24} color="#E10600" />
              <Text style={styles.sectionTitle}>Championship Standings</Text>
            </View>
          </View>

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
  lastRaceCard: {
    opacity: 0.8,
    borderColor: '#00D2BE',
  },
  raceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  raceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E10600',
    marginLeft: 8,
  },
  raceMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  countryFlag: {
    fontSize: 48,
    marginRight: 16,
  },
  raceDetails: {
    flex: 1,
  },
  raceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  raceLocation: {
    fontSize: 15,
    color: '#ccc',
    marginBottom: 4,
  },
  raceCircuit: {
    fontSize: 13,
    color: '#999',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#00D2BE',
    fontWeight: '600',
    marginLeft: 6,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151E',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
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

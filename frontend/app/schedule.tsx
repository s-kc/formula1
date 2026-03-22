import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
interface Race {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: {
      locality: string;
      country: string;
    };
  };
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
}
function getCountdown(raceDate: string, raceTime?: string): string {
  const dateTimeString = raceTime ? `${raceDate}T${raceTime}` : `${raceDate}T14:00:00Z`;
  const raceDateTime = new Date(dateTimeString);
  const now = new Date();
  const diff = raceDateTime.getTime() - now.getTime();
  if (diff < 0) {
    return 'Completed';
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export default function ScheduleScreen() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<{ [key: string]: string }>({});
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/schedule`);
      const data = await response.json();
      if (data?.MRData?.RaceTable?.Races) {
        setRaces(data.MRData.RaceTable.Races);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchSchedule();
  }, []);
  // Update countdowns every minute
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: { [key: string]: string } = {};
      races.forEach((race) => {
        newCountdowns[race.round] = getCountdown(race.date, race.time);
      });
      setCountdown(newCountdowns);
    };
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [races]);
  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };
  // Find next race
  const getNextRace = () => {
    const now = new Date();
    return races.find((race) => {
      const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
      return raceDateTime > now;
    });
  };
  const nextRace = getNextRace();
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
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
        {/* Next Race Highlight */}
        {nextRace && (
          <View style={styles.nextRaceCard}>
            <View style={styles.nextRaceHeader}>
              <Ionicons name="flag" size={24} color="#E10600" />
              <Text style={styles.nextRaceLabel}>NEXT RACE</Text>
            </View>
            <Text style={styles.nextRaceName}>{nextRace.raceName}</Text>
            <Text style={styles.nextRaceLocation}>
              {nextRace.Circuit.Location.locality}, {nextRace.Circuit.Location.country}
            </Text>
            <View style={styles.countdownContainer}>
              <Ionicons name="time" size={32} color="#00D2BE" />
              <Text style={styles.countdownText}>{countdown[nextRace.round]}</Text>
            </View>
            <Text style={styles.raceDate}>
              {new Date(nextRace.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}
        {/* Full Schedule */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.sectionTitle}>Full Season Calendar</Text>
          {races.map((race) => {
            const isNextRace = nextRace?.round === race.round;
            const isCompleted = countdown[race.round] === 'Completed';
            return (
              <TouchableOpacity
                key={race.round}
                style={[
                  styles.raceCard,
                  isNextRace && styles.nextRaceHighlight,
                  isCompleted && styles.completedRace,
                ]}
              >
                <View style={styles.raceHeader}>
                  <View style={styles.roundBadge}>
                    <Text style={styles.roundText}>R{race.round}</Text>
                  </View>
                  {isNextRace && (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>NEXT</Text>
                    </View>
                  )}
                  {isCompleted && (
                    <Ionicons name="checkmark-circle" size={20} color="#00D2BE" />
                  )}
                </View>
                <Text style={styles.raceName}>{race.raceName}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#999" />
                  <Text style={styles.circuitName}>{race.Circuit.circuitName}</Text>
                </View>
                <Text style={styles.location}>
                  {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                </Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateInfo}>
                    <Ionicons name="calendar" size={14} color="#E10600" />
                    <Text style={styles.dateText}>{formatDate(race.date)}</Text>
                  </View>
                  {!isCompleted && countdown[race.round] && (
                    <View style={styles.countdownBadge}>
                      <Ionicons name="timer" size={12} color="#00D2BE" />
                      <Text style={styles.countdownSmall}>{countdown[race.round]}</Text>
                    </View>
                  )}
                </View>
                {/* Weekend Schedule */}
                {(race.Sprint || race.Qualifying) && (
                  <View style={styles.weekendSchedule}>
                    {race.Sprint && (
                      <View style={styles.sessionBadge}>
                        <Text style={styles.sessionText}>Sprint</Text>
                      </View>
                    )}
                    {race.Qualifying && (
                      <View style={styles.sessionBadge}>
                        <Text style={styles.sessionText}>Qualifying</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
  nextRaceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E10600',
    alignItems: 'center',
  },
  nextRaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextRaceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E10600',
  },
  nextRaceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  nextRaceLocation: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D2BE',
  },
  raceDate: {
    fontSize: 14,
    color: '#999',
  },
  scheduleContainer: {
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
  nextRaceHighlight: {
    borderColor: '#E10600',
    borderWidth: 2,
  },
  completedRace: {
    opacity: 0.6,
  },
  raceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roundText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nextBadge: {
    backgroundColor: '#E10600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nextBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  raceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  circuitName: {
    fontSize: 14,
    color: '#ccc',
  },
  location: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#E10600',
    fontWeight: '600',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countdownSmall: {
    fontSize: 12,
    color: '#00D2BE',
    fontWeight: '600',
  },
  weekendSchedule: {
    flexDirection: 'row',
    marginTop: 12,
  },
  sessionBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionText: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
  },
});

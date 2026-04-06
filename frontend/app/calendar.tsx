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

// Country flag mapping
function getCountryFlag(country: string): string {
  const flagMap: { [key: string]: string } = {
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
  return flagMap[country] || '🏁';
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

export default function CalendarScreen() {
  const [races, setRaces] = useState<Race[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
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
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, [races]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const getFilteredRaces = () => {
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return races.filter((race) => {
        const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
        return raceDateTime > now;
      });
    } else if (activeTab === 'completed') {
      return races.filter((race) => {
        const raceDateTime = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`);
        return raceDateTime <= now;
      }).reverse();
    }
    return races;
  };

  const filteredRaces = getFilteredRaces();
  const upcomingCount = races.filter(r => {
    const dt = new Date(r.time ? `${r.date}T${r.time}` : `${r.date}T14:00:00Z`);
    return dt > new Date();
  }).length;
  const completedCount = races.length - upcomingCount;

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Race Calendar</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={activeTab === 'all' ? '#E10600' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({races.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === 'upcoming' ? '#E10600' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={activeTab === 'completed' ? '#E10600' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />
        }
      >
        <View style={styles.scheduleContainer}>
          {filteredRaces.map((race) => {
            const isCompleted = countdown[race.round] === 'Completed';
            
            return (
              <View
                key={race.round}
                style={[
                  styles.raceCard,
                  isCompleted && styles.completedRace,
                ]}
              >
                <View style={styles.raceHeader}>
                  <View style={styles.raceHeaderLeft}>
                    <View style={styles.roundBadge}>
                      <Text style={styles.roundText}>R{race.round}</Text>
                    </View>
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={20} color="#00D2BE" />
                    )}
                  </View>
                </View>

                <View style={styles.raceMainContent}>
                  <Text style={styles.raceFlag}>{getCountryFlag(race.Circuit.Location.country)}</Text>
                  
                  <View style={styles.raceDetails}>
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
                  </View>
                </View>
              </View>
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
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#E10600',
  },
  scheduleContainer: {
    padding: 16,
  },
  raceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  completedRace: {
    opacity: 0.6,
  },
  raceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  raceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  roundText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  raceMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  raceFlag: {
    fontSize: 40,
    marginRight: 16,
  },
  raceDetails: {
    flex: 1,
  },
  raceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  circuitName: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 4,
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
    marginLeft: 6,
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
    marginLeft: 4,
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
    marginRight: 8,
  },
  sessionText: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Rect, Polygon } from 'react-native-svg';

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
  haas: '#B6BABD',
};

// Team badge configurations
const TEAM_BADGES: { [key: string]: { bg: string; text: string; symbol: string } } = {
  mercedes: { bg: '#00D2BE', text: '#000', symbol: 'M' },
  ferrari: { bg: '#DC0000', text: '#FFF', symbol: 'F' },
  red_bull: { bg: '#0600EF', text: '#FFF', symbol: 'RB' },
  mclaren: { bg: '#FF8700', text: '#000', symbol: 'MCL' },
  alpine: { bg: '#0090FF', text: '#FFF', symbol: 'A' },
  aston_martin: { bg: '#006F62', text: '#FFF', symbol: 'AM' },
  williams: { bg: '#005AFF', text: '#FFF', symbol: 'W' },
  rb: { bg: '#2B4562', text: '#FFF', symbol: 'RB' },
  alphatauri: { bg: '#2B4562', text: '#FFF', symbol: 'AT' },
  haas: { bg: '#B6BABD', text: '#000', symbol: 'H' },
  kick_sauber: { bg: '#00FF00', text: '#000', symbol: 'KS' },
  sauber: { bg: '#00FF00', text: '#000', symbol: 'S' },
  alfa: { bg: '#900000', text: '#FFF', symbol: 'AR' },
  audi: { bg: '#E30613', text: '#FFF', symbol: 'AUDI' },
  cadillac: { bg: '#1E1E1E', text: '#FFF', symbol: 'CAD' },
};

function getTeamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] || '#999999';
}

function getTeamBadge(constructorId: string): { bg: string; text: string; symbol: string } {
  return TEAM_BADGES[constructorId] || { bg: '#666', text: '#FFF', symbol: '?' };
}

// Custom Team Logo Components
const MercedesLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="11" stroke="#FFF" strokeWidth="1" fill="none" />
    <Path
      d="M12 2 L12 12 L21 17 M12 12 L3 17 M12 12 L12 22"
      stroke="#FFF"
      strokeWidth="1.5"
      fill="none"
    />
  </Svg>
);

const FerrariLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 3 L12 8 M10 6 L14 6 M8 10 C8 10 9 8 12 8 C15 8 16 10 16 10 L16 18 C16 18 15 20 12 20 C9 20 8 18 8 18 Z M10 12 L10 16 M14 12 L14 16"
      stroke="#FFF"
      strokeWidth="1.5"
      fill="none"
    />
  </Svg>
);

const RedBullLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <G>
      <Path
        d="M6 12 C4 10 4 8 6 7 C8 6 10 8 10 10 L10 14 C10 16 8 17 7 16"
        stroke="#FFF"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M18 12 C20 10 20 8 18 7 C16 6 14 8 14 10 L14 14 C14 16 16 17 17 16"
        stroke="#FFF"
        strokeWidth="1.5"
        fill="none"
      />
    </G>
  </Svg>
);

const McLarenLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M4 12 L12 6 L20 12 L12 12 Z"
      stroke="#000"
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const AlpineLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 4 L4 20 L12 16 L20 20 Z"
      stroke="#FFF"
      strokeWidth="1.5"
      fill="none"
    />
  </Svg>
);

const AstonMartinLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M2 12 L6 8 L12 6 L18 8 L22 12 L18 12 L12 10 L6 12 Z"
      stroke="#FFF"
      strokeWidth="1.5"
      fill="none"
    />
  </Svg>
);

const WilliamsLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M4 6 L8 18 L12 10 L16 18 L20 6"
      stroke="#FFF"
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const HaasLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M6 6 L6 18 M6 12 L18 12 M18 6 L18 18"
      stroke="#333"
      strokeWidth="2.5"
      fill="none"
    />
  </Svg>
);

const AudiLogo = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="5" cy="12" r="3" stroke="#FFF" strokeWidth="1.5" fill="none" />
    <Circle cx="9.5" cy="12" r="3" stroke="#FFF" strokeWidth="1.5" fill="none" />
    <Circle cx="14.5" cy="12" r="3" stroke="#FFF" strokeWidth="1.5" fill="none" />
    <Circle cx="19" cy="12" r="3" stroke="#FFF" strokeWidth="1.5" fill="none" />
  </Svg>
);

// Team Badge Component with SVG icons
const TeamBadge = ({ constructorId, size = 40 }: { constructorId: string; size?: number }) => {
  const badge = getTeamBadge(constructorId);
  
  const renderLogo = () => {
    switch (constructorId) {
      case 'mercedes':
        return <MercedesLogo size={size * 0.65} />;
      case 'ferrari':
        return <FerrariLogo size={size * 0.65} />;
      case 'red_bull':
        return <RedBullLogo size={size * 0.65} />;
      case 'mclaren':
        return <McLarenLogo size={size * 0.65} />;
      case 'alpine':
        return <AlpineLogo size={size * 0.65} />;
      case 'aston_martin':
        return <AstonMartinLogo size={size * 0.65} />;
      case 'williams':
        return <WilliamsLogo size={size * 0.65} />;
      case 'haas':
        return <HaasLogo size={size * 0.65} />;
      case 'audi':
        return <AudiLogo size={size * 0.65} />;
      default:
        // For other teams, show text symbol
        return (
          <Text style={[
            styles.badgeText, 
            { 
              color: badge.text,
              fontSize: badge.symbol.length > 2 ? 10 : badge.symbol.length > 1 ? 12 : 16,
            }
          ]}>
            {badge.symbol}
          </Text>
        );
    }
  };

  return (
    <View style={[
      styles.teamBadge,
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: badge.bg,
      }
    ]}>
      {renderLogo()}
    </View>
  );
};

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />
        }
      >
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
              
              <TeamBadge constructorId={standing.Constructor.constructorId} size={44} />
              
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
    padding: 12,
    marginBottom: 12,
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
  teamBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  badgeText: {
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  nationality: {
    fontSize: 13,
    color: '#999',
  },
  statsSection: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  stat: {
    alignItems: 'center',
    marginRight: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E10600',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});

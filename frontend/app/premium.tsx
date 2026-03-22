import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
interface SubscriptionPrice {
  tier: string;
  price: number;
  billing_period: string;
  discount_percentage?: number;
}
interface OneTimePurchase {
  type: string;
  price: number;
  name: string;
}
export default function PremiumScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPrice[]>([]);
  const [oneTimePurchases, setOneTimePurchases] = useState<OneTimePurchase[]>([]);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  useEffect(() => {
    loadUserAndPrices();
  }, []);
  const loadUserAndPrices = async () => {
    try {
      setLoading(true);
      // Get or create user ID
      let storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) {
        storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('user_id', storedUserId);
      }
      setUserId(storedUserId);
      // Fetch prices
      const pricesResponse = await fetch(`${BACKEND_URL}/api/subscription/prices`);
      const pricesData = await pricesResponse.json();
      setSubscriptions(pricesData.subscriptions);
      setOneTimePurchases(pricesData.one_time_purchases);
      // Fetch user subscription status
      const subResponse = await fetch(`${BACKEND_URL}/api/subscription/${storedUserId}`);
      const subData = await subResponse.json();
      setUserSubscription(subData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };
  const handleSubscribe = async (tier: string) => {
    try {
      Alert.alert(
        'Confirm Subscription',
        `Subscribe to ${tier} plan?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Subscribe',
            onPress: async () => {
              const response = await fetch(
                `${BACKEND_URL}/api/subscription/${userId}/subscribe?tier=${tier}`,
                { method: 'POST' }
              );
              if (response.ok) {
                Alert.alert('Success!', 'Subscription activated! (Demo mode - no payment processed)');
                loadUserAndPrices();
              } else {
                Alert.alert('Error', 'Failed to activate subscription');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error subscribing:', error);
      Alert.alert('Error', 'Failed to process subscription');
    }
  };
  const handlePurchase = async (itemType: string) => {
    try {
      Alert.alert(
        'Confirm Purchase',
        `Purchase this item?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Purchase',
            onPress: async () => {
              const response = await fetch(
                `${BACKEND_URL}/api/subscription/${userId}/purchase?item=${itemType}`,
                { method: 'POST' }
              );
              if (response.ok) {
                Alert.alert('Success!', 'Purchase completed! (Demo mode - no payment processed)');
                loadUserAndPrices();
              } else {
                Alert.alert('Error', 'Failed to complete purchase');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error purchasing:', error);
      Alert.alert('Error', 'Failed to process purchase');
    }
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading premium options...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Current Status */}
        {userSubscription && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons 
                name={userSubscription.is_active ? "checkmark-circle" : "information-circle"} 
                size={24} 
                color={userSubscription.is_active ? "#00D2BE" : "#999"} 
              />
              <Text style={styles.statusTitle}>
                {userSubscription.is_active ? 'Premium Active' : 'Free Version'}
              </Text>
            </View>
            <Text style={styles.statusSubtitle}>
              Current Plan: {userSubscription.subscription_tier?.toUpperCase() || 'FREE'}
            </Text>
          </View>
        )}
        {/* Subscription Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 Subscription Plans</Text>
          {subscriptions.map((sub) => (
            <TouchableOpacity
              key={sub.tier}
              style={styles.planCard}
              onPress={() => handleSubscribe(sub.tier)}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>
                  {sub.tier === 'monthly' ? 'Monthly' : sub.tier === 'yearly' ? 'Yearly' : 'Lifetime'}
                </Text>
                {sub.discount_percentage && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>Save {sub.discount_percentage}%</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>${sub.price}</Text>
                <Text style={styles.billingPeriod}>/{sub.billing_period}</Text>
              </View>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color="#00D2BE" />
                  <Text style={styles.featureText}>All widget sizes</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color="#00D2BE" />
                  <Text style={styles.featureText}>Historical data (all years)</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color="#00D2BE" />
                  <Text style={styles.featureText}>Full standings</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color="#00D2BE" />
                  <Text style={styles.featureText}>Ad-free experience</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color="#00D2BE" />
                  <Text style={styles.featureText}>Race notifications</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={18} color="#00D2BE" />
                  <Text style={styles.featureText}>Favorite driver tracking</Text>
                </View>
              </View>
              <View style={styles.subscribeButton}>
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* One-Time Purchases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 One-Time Purchases</Text>
          {oneTimePurchases.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={styles.purchaseCard}
              onPress={() => handlePurchase(item.type)}
            >
              <View style={styles.purchaseInfo}>
                <Text style={styles.purchaseName}>{item.name}</Text>
                <Text style={styles.purchasePrice}>${item.price}</Text>
              </View>
              <Ionicons name="cart" size={24} color="#E10600" />
            </TouchableOpacity>
          ))}
        </View>
        {/* Free vs Premium Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Free vs Premium</Text>
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Basic dashboard</Text>
              <Ionicons name="checkmark" size={20} color="#00D2BE" />
              <Ionicons name="checkmark" size={20} color="#00D2BE" />
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Current season only</Text>
              <Ionicons name="checkmark" size={20} color="#00D2BE" />
              <Ionicons name="close" size={20} color="#666" />
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Top 5 standings</Text>
              <Ionicons name="checkmark" size={20} color="#00D2BE" />
              <Ionicons name="close" size={20} color="#666" />
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Ads</Text>
              <Ionicons name="checkmark" size={20} color="#E10600" />
              <Ionicons name="close" size={20} color="#666" />
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Lock screen widgets</Text>
              <Ionicons name="close" size={20} color="#666" />
              <Ionicons name="checkmark" size={20} color="#00D2BE" />
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Historical data</Text>
              <Ionicons name="close" size={20} color="#666" />
              <Ionicons name="checkmark" size={20} color="#00D2BE" />
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Notifications</Text>
              <Ionicons name="close" size={20} color="#666" />
              <Ionicons name="checkmark" size={20} color="#00D2BE" />
            </View>
          </View>
        </View>
        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle" size={20} color="#FF8700" />
          <Text style={styles.demoText}>
            Demo Mode: No actual payments are processed. Subscriptions are simulated for testing.
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
  scrollView: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E10600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  discountBadge: {
    backgroundColor: '#00D2BE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0c0c0c',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E10600',
  },
  billingPeriod: {
    fontSize: 16,
    color: '#999',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#ccc',
  },
  subscribeButton: {
    flexDirection: 'row',
    backgroundColor: '#E10600',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  purchaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  purchasePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E10600',
  },
  comparisonTable: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonLabel: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
  },
  demoNotice: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    backgroundColor: '#2a1a0a',
    borderRadius: 12,
    alignItems: 'center',
  },
  demoText: {
    flex: 1,
    fontSize: 13,
    color: '#FF8700',
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Settings, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  RefreshCw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useUserStore } from '@/store/userStore';

export default function SubscriptionScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { user, isPremium, setPremium } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  // Get subscription data from backend
  const { data: subscriptionData, refetch: refetchSubscription } = trpc.user.getSubscription.useQuery(
    { userId: user?.id || 'user_1' },
    { enabled: isPremium }
  );

  const cancelSubscriptionMutation = trpc.user.cancelSubscription.useMutation({
    onSuccess: () => {
      refetchSubscription();
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription has been cancelled. You will continue to have access to premium features until the end of your current billing period.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to cancel subscription');
    },
  });

  const handleCancelSubscription = () => {
    if (!subscriptionData) return;
    
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription? You will lose access to all premium features at the end of your current billing period.',
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            cancelSubscriptionMutation.mutate({
              userId: user?.id || 'user_1',
              subscriptionId: subscriptionData.id,
            });
          },
        },
      ]
    );
  };

  const handleUpdatePaymentMethod = () => {
    Alert.alert(
      'Update Payment Method',
      'You will be redirected to update your payment information.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: () => {
            // In a real app, you would open Paddle's payment method update flow
            router.push({
              pathname: '/webview',
              params: {
                url: 'https://lukashvelidze.github.io/unipilot/',
                title: 'Update Payment Method'
              }
            });
          },
        },
      ]
    );
  };

  const handleRefreshSubscription = async () => {
    setIsLoading(true);
    try {
      await refetchSubscription();
      Alert.alert('Subscription Updated', 'Your subscription information has been refreshed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh subscription data.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Subscription',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.noSubscriptionContainer}>
          <AlertCircle size={64} color={Colors.lightText} />
          <Text style={[styles.noSubscriptionTitle, { color: Colors.text }]}>
            No Active Subscription
          </Text>
          <Text style={[styles.noSubscriptionDescription, { color: Colors.lightText }]}>
            You don't have an active premium subscription. Upgrade to access all premium features.
          </Text>
          <Button
            title="Upgrade to Premium"
            onPress={() => router.push('/premium')}
            style={[styles.upgradeButton, { backgroundColor: Colors.primary }]}
            icon={<Crown size={20} color={Colors.white} />}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen
        options={{
          title: 'Subscription',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleRefreshSubscription} disabled={isLoading}>
              <RefreshCw size={24} color={isLoading ? Colors.lightText : Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Subscription Status */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.statusHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Crown size={48} color={Colors.white} />
        <Text style={styles.statusTitle}>Premium Active</Text>
        <View style={styles.statusBadge}>
          <CheckCircle size={16} color={Colors.white} />
          <Text style={styles.statusBadgeText}>Active</Text>
        </View>
      </LinearGradient>

      {/* Subscription Details */}
      <Card style={[styles.detailsCard, { backgroundColor: Colors.card }]} variant="elevated">
        <Text style={[styles.cardTitle, { color: Colors.text }]}>Subscription Details</Text>
        
        {subscriptionData ? (
          <>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Plan</Text>
              <Text style={[styles.detailValue, { color: Colors.text }]}>{subscriptionData.plan}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Price</Text>
              <Text style={[styles.detailValue, { color: Colors.text }]}>
                ${subscriptionData.price}/{subscriptionData.interval}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Status</Text>
              <View style={styles.statusContainer}>
                <CheckCircle size={16} color={subscriptionData.status === 'active' ? Colors.success : Colors.warning} />
                <Text style={[styles.statusText, { color: subscriptionData.status === 'active' ? Colors.success : Colors.warning }]}>
                  {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: Colors.lightText }]}>Next Billing</Text>
              <Text style={[styles.detailValue, { color: Colors.text }]}>
                {new Date(subscriptionData.nextBillingDate).toLocaleDateString()}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.detailValue, { color: Colors.lightText }]}>Loading subscription details...</Text>
        )}
      </Card>

      {/* Payment Method */}
      <Card style={[styles.paymentCard, { backgroundColor: Colors.card }]} variant="elevated">
        <View style={styles.cardHeader}>
          <CreditCard size={24} color={Colors.primary} />
          <Text style={[styles.cardTitle, { color: Colors.text }]}>Payment Method</Text>
        </View>
        
        <View style={[styles.paymentMethodContainer, { backgroundColor: Colors.surface }]}>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardBrand, { color: Colors.text }]}>
              {subscriptionData?.paymentMethod?.brand?.toUpperCase() || 'CARD'}
            </Text>
            <Text style={[styles.cardNumber, { color: Colors.lightText }]}>
              •••• •••• •••• {subscriptionData?.paymentMethod?.last4 || '****'}
            </Text>
            <Text style={[styles.cardExpiry, { color: Colors.lightText }]}>
              Expires {subscriptionData?.paymentMethod?.expiryMonth || '**'}/{subscriptionData?.paymentMethod?.expiryYear || '****'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.updateButton, { borderColor: Colors.border }]}
            onPress={handleUpdatePaymentMethod}
          >
            <Settings size={16} color={Colors.primary} />
            <Text style={[styles.updateButtonText, { color: Colors.primary }]}>Update</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Billing History */}
      <Card style={[styles.billingCard, { backgroundColor: Colors.card }]} variant="elevated">
        <View style={styles.cardHeader}>
          <Calendar size={24} color={Colors.primary} />
          <Text style={[styles.cardTitle, { color: Colors.text }]}>Billing History</Text>
        </View>
        
        <View style={styles.billingHistory}>
          <View style={[styles.billingItem, { borderBottomColor: Colors.border }]}>
            <View style={styles.billingInfo}>
              <Text style={[styles.billingDate, { color: Colors.text }]}>Jan 15, 2024</Text>
              <Text style={[styles.billingDescription, { color: Colors.lightText }]}>
                UniPilot Premium - Monthly
              </Text>
            </View>
            <Text style={[styles.billingAmount, { color: Colors.success }]}>$4.99</Text>
          </View>
          
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {
              router.push({
                pathname: '/webview',
                params: {
                  url: 'https://lukashvelidze.github.io/unipilot/',
                  title: 'Billing History'
                }
              });
            }}
          >
            <Text style={[styles.viewAllText, { color: Colors.primary }]}>View All Invoices</Text>
            <ExternalLink size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Subscription Actions */}
      <Card style={[styles.actionsCard, { backgroundColor: Colors.card }]} variant="elevated">
        <Text style={[styles.cardTitle, { color: Colors.text }]}>Subscription Actions</Text>
        
        <View style={styles.actionButtons}>
          <Button
            title="Manage Subscription"
            onPress={() => {
              router.push({
                pathname: '/webview',
                params: {
                  url: 'https://lukashvelidze.github.io/unipilot/',
                  title: 'Manage Subscription'
                }
              });
            }}
            variant="outline"
            icon={<ExternalLink size={20} color={Colors.primary} />}
            fullWidth
          />
          
          <Button
            title="Cancel Subscription"
            onPress={handleCancelSubscription}
            variant="outline"
            style={[styles.cancelButton, { borderColor: Colors.error }]}
            textStyle={{ color: Colors.error }}
            icon={<AlertCircle size={20} color={Colors.error} />}
            fullWidth
          />
        </View>
      </Card>

      {/* Support */}
      <Card style={[styles.supportCard, { backgroundColor: Colors.surface }]} variant="default">
        <Text style={[styles.supportTitle, { color: Colors.text }]}>Need Help?</Text>
        <Text style={[styles.supportDescription, { color: Colors.lightText }]}>
          If you have any questions about your subscription or billing, our support team is here to help.
        </Text>
        <Button
          title="Contact Support"
          onPress={() => {
            Alert.alert(
              'Contact Support',
              'You can reach our support team at support@unipilot.com or through our help center.',
              [{ text: 'OK' }]
            );
          }}
          variant="outline"
          fullWidth
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  noSubscriptionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noSubscriptionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  noSubscriptionDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    paddingHorizontal: 32,
  },
  statusHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  billingCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  billingHistory: {
    gap: 12,
  },
  billingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  billingInfo: {
    flex: 1,
  },
  billingDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  billingDescription: {
    fontSize: 12,
  },
  billingAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  actionButtons: {
    gap: 12,
  },
  cancelButton: {
    marginBottom: 0,
  },
  supportCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});
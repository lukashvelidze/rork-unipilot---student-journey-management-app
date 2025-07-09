import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Crown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import PaddleCheckout from './PaddleCheckout';
import { useUserStore } from '@/store/userStore';

interface PremiumUpgradeButtonProps {
  title?: string;
  subtitle?: string;
  style?: any;
}

export default function PremiumUpgradeButton({ 
  title = "Upgrade to Premium",
  subtitle = "Unlock all features",
  style 
}: PremiumUpgradeButtonProps) {
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const { user, setPremium } = useUserStore();

  const handleUpgradePress = () => {
    setCheckoutVisible(true);
  };

  const handleCheckoutSuccess = () => {
    setPremium(true);
    console.log('✅ Premium upgrade successful!');
  };

  const handleCheckoutCancel = () => {
    console.log('❌ Premium upgrade cancelled');
  };

  const handleCheckoutClose = () => {
    setCheckoutVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.upgradeButton, style]} 
        onPress={handleUpgradePress}
        activeOpacity={0.8}
      >
        <Crown size={20} color={Colors.white} style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </TouchableOpacity>

      <PaddleCheckout
        visible={checkoutVisible}
        onClose={handleCheckoutClose}
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
        customerEmail={user?.email}
        userId={user?.id}
        priceId="pri_01jyk3h7eec66x5m7h31p66r8w"
      />
    </>
  );
}

const styles = StyleSheet.create({
  upgradeButton: {
    backgroundColor: Colors.premium,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.premium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.white,
    fontSize: 12,
    opacity: 0.9,
    marginLeft: 4,
  },
});
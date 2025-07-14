import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function MemoryDetails() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Memory Details for ID: {id}</Text>
      <Text>This is a placeholder screen. Implement the actual memory details view here.</Text>
    </View>
  );
}

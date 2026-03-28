import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function DocumentDetails() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Document Details for ID: {id}</Text>
      <Text>This is a placeholder screen. Implement the actual document details view here.</Text>
    </View>
  );
}

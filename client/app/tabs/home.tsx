import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@rneui/themed';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Welcome to Vibesy</Text>
      <Button
        title="Parse Social Media Link"
        onPress={() => router.push('/parse-link')}
        buttonStyle={{ backgroundColor: '#007AFF' }}
        containerStyle={{ marginBottom: 16 }}
      />
      <Button
        title="View Map"
        onPress={() => router.push('/map')}
        buttonStyle={{ backgroundColor: '#34C759' }}
      />
    </View>
  );
} 
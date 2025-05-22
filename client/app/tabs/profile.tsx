import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '@rneui/themed';

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Profile</Text>
        
        <View className="bg-gray-100 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Account Information</Text>
          <Text className="text-gray-600">Username: user123</Text>
          <Text className="text-gray-600">Email: user@example.com</Text>
        </View>

        <View className="bg-gray-100 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Statistics</Text>
          <Text className="text-gray-600">Saved Locations: 0</Text>
          <Text className="text-gray-600">Parsed Links: 0</Text>
        </View>

        <Button
          title="Sign Out"
          buttonStyle={{ backgroundColor: '#FF3B30' }}
          containerStyle={{ marginTop: 16 }}
        />
      </View>
    </ScrollView>
  );
} 
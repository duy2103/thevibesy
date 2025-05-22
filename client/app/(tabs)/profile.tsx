import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type SavedLocation = {
  id: string;
  name: string;
  type: string;
  source: 'tiktok' | 'youtube' | 'instagram';
  date: string;
};

const MOCK_LOCATIONS: SavedLocation[] = [
  {
    id: '1',
    name: 'Awesome Coffee Shop',
    type: 'Café',
    source: 'tiktok',
    date: '2024-03-15'
  },
  {
    id: '2',
    name: 'Secret Beach Spot',
    type: 'Beach',
    source: 'instagram',
    date: '2024-03-14'
  },
  {
    id: '3',
    name: 'Hidden Restaurant',
    type: 'Restaurant',
    source: 'youtube',
    date: '2024-03-13'
  }
];

const ProfileScreen = () => {
  const [savedLocations] = useState<SavedLocation[]>(MOCK_LOCATIONS);

  const getSourceIcon = (source: SavedLocation['source']) => {
    switch (source) {
      case 'tiktok':
        return 'logo-tiktok';
      case 'youtube':
        return 'logo-youtube';
      case 'instagram':
        return 'logo-instagram';
      default:
        return 'location';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <TouchableOpacity 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons name="settings-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* User Info */}
        <View className="px-4 py-6 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
              <Image 
                source={{ uri: 'https://placekitten.com/200/200' }}
                className="w-full h-full"
              />
            </View>
            <View className="ml-4">
              <Text className="text-xl font-bold text-gray-900">John Doe</Text>
              <Text className="text-gray-600">Travel Enthusiast</Text>
            </View>
          </View>
          
          <View className="flex-row mt-6">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-900">{savedLocations.length}</Text>
              <Text className="text-sm text-gray-600">Places Saved</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-900">3</Text>
              <Text className="text-sm text-gray-600">Lists Created</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-900">12</Text>
              <Text className="text-sm text-gray-600">Places Visited</Text>
            </View>
          </View>
        </View>

        {/* Saved Locations */}
        <View className="px-4 py-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Recently Saved
          </Text>
          
          {savedLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-semibold text-gray-900">
                    {location.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {location.type}
                  </Text>
                </View>
                <Ionicons 
                  name={getSourceIcon(location.source)} 
                  size={24} 
                  color="#4B5563"
                />
              </View>
              
              <View className="flex-row items-center mt-3">
                <Text className="text-xs text-gray-500">
                  Saved on {new Date(location.date).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen; 
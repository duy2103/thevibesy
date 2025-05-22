import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

type SavedLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Saved Places</Text>
          <Text className="text-sm text-gray-600">Discover your collection</Text>
        </View>
        <TouchableOpacity 
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
        >
          <Ionicons name="options-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View className="flex-1 bg-gray-100">
        {errorMsg ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-red-500 text-center">{errorMsg}</Text>
          </View>
        ) : !location ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-600">Loading map...</Text>
          </View>
        ) : (
          <View className="flex-1">
            {/* Map View will be implemented here */}
            <View className="absolute bottom-6 left-4 right-4">
              <View className="bg-white rounded-2xl shadow-lg p-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Your Saved Places
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {selectedLocation ? 
                    'Location details will appear here' : 
                    'Select a location to see details'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="location" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default MapScreen; 
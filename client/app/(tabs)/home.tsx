import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const HomeScreen = () => {
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePasteLink = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      setLink(clipboardContent);
    } catch (error) {
      Alert.alert('Error', 'Could not access clipboard');
    }
  };

  const handleParseLink = async () => {
    if (!link) {
      Alert.alert('Error', 'Please enter a social media link');
      return;
    }
    
    setIsLoading(true);
    try {
      // TODO: Implement link parsing logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      Alert.alert('Success', 'Location saved successfully!');
      setLink('');
    } catch (error) {
      Alert.alert('Error', 'Failed to parse link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-4 py-6 border-b border-gray-100">
        <Text className="text-3xl font-bold text-gray-900">Vibesy</Text>
        <Text className="text-base text-gray-600 mt-1">
          Discover and save amazing places
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Link Input Section */}
        <View className="mt-6">
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Add New Location
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Paste a link from TikTok, YouTube Shorts, or Instagram Reels
            </Text>
            
            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200">
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="Paste your link here..."
                className="flex-1 px-4 py-3.5 text-base"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={handlePasteLink}
                className="px-4 py-3.5"
              >
                <Ionicons name="clipboard-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={handleParseLink}
              disabled={isLoading}
              className={`mt-4 rounded-xl py-4 items-center ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white font-semibold text-base">
                {isLoading ? 'Processing...' : 'Parse Link'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.push('/map')}
              className="flex-1 mr-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <View className="bg-blue-50 self-start p-2 rounded-lg mb-3">
                <Ionicons name="map" size={24} color="#2563EB" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">View Map</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Explore saved locations
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              className="flex-1 ml-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <View className="bg-purple-50 self-start p-2 rounded-lg mb-3">
                <Ionicons name="bookmark" size={24} color="#7C3AED" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">Profile</Text>
              <Text className="text-sm text-gray-600 mt-1">
                View saved places
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How it works */}
        <View className="mt-8 mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            How it works
          </Text>
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {[
              'Find a video mentioning a cool place',
              'Copy the video link',
              'Paste it here and tap "Parse Link"',
              'The location will be saved to your map!'
            ].map((step, index) => (
              <View key={index} className="flex-row items-center mb-4 last:mb-0">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Text className="text-blue-600 font-semibold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-gray-700">{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen; 
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const HomeScreen = () => {
  const [link, setLink] = useState('');
  const router = useRouter();

  const handlePasteLink = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      setLink(clipboardContent);
    } catch (error) {
      Alert.alert('Error', 'Could not access clipboard');
    }
  };

  const handleParseLink = () => {
    if (!link) {
      Alert.alert('Error', 'Please enter a social media link');
      return;
    }
    
    // TODO: Implement link parsing logic
    // This will be connected to your backend service
    Alert.alert('Success', 'Link parsed successfully! Location saved.');
    setLink('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="mt-4 mb-8">
          <Text className="text-3xl font-bold text-gray-900">Save Location</Text>
          <Text className="text-base text-gray-600 mt-2">
            Paste a TikTok, YouTube Short, or Instagram Reel link to save the mentioned location
          </Text>
        </View>

        {/* Link Input Section */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Social Media Link</Text>
          <View className="flex-row items-center bg-white rounded-lg border border-gray-200">
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="Paste your link here..."
              className="flex-1 px-4 py-3 text-base"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              onPress={handlePasteLink}
              className="px-4 py-3"
            >
              <Ionicons name="clipboard-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={handleParseLink}
            className="mt-4 bg-blue-600 rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold text-base">Parse Link</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.push('/map')}
              className="flex-1 mr-2 bg-gray-50 rounded-xl p-4 items-center"
            >
              <Ionicons name="map-outline" size={28} color="#4B5563" />
              <Text className="mt-2 text-gray-700 font-medium">View Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/saved')}
              className="flex-1 ml-2 bg-gray-50 rounded-xl p-4 items-center"
            >
              <Ionicons name="bookmark-outline" size={28} color="#4B5563" />
              <Text className="mt-2 text-gray-700 font-medium">Saved Places</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-2">How it works</Text>
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-base text-gray-600">
              1. Find a video mentioning a cool place{'\n'}
              2. Copy the video link{'\n'}
              3. Paste it here and tap "Parse Link"{'\n'}
              4. The location will be saved to your map!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen; 
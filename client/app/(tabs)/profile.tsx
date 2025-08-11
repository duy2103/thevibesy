import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getLocations } from '../utils/api';

const ProfileScreen = ({ token }: { token: string }) => {
  const [savedLocations, setSavedLocations] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      const loadLocations = async () => {
        try {
          const data = await getLocations(token);
          setSavedLocations(data);
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Failed to load saved locations');
        }
      };
      loadLocations();
    }
  }, [token]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Profile</Text>
          <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#f3f4f6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="settings-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {/* User Info */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, backgroundColor: '#e5e7eb', borderRadius: 40, overflow: 'hidden' }}>
              <Image source={{ uri: 'https://placekitten.com/200/200' }} style={{ width: '100%', height: '100%' }} />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>John Doe</Text>
              <Text style={{ color: '#6b7280' }}>Travel Enthusiast</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 24 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{savedLocations.length}</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Places Saved</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>1</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Lists Created</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>0</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>Places Visited</Text>
            </View>
          </View>
        </View>
        {/* Saved Locations */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
            Recently Saved
          </Text>
          {savedLocations.length === 0 && (
            <Text style={{ color: '#6b7280' }}>No locations saved yet.</Text>
          )}
          {savedLocations.map((location) => (
            <View key={location.id} style={styles.savedCard}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{location.name}</Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{location.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  savedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
});

export default ProfileScreen;
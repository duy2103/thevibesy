import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

type SavedLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
};

const MOCK_LOCATIONS: SavedLocation[] = [
  {
    id: '1',
    name: 'Cool Cafe',
    latitude: 37.78825,
    longitude: -122.4324,
    description: 'A trendy cafe with great atmosphere'
  },
  {
    id: '2',
    name: 'Secret Spot',
    latitude: 37.78825,
    longitude: -122.4324,
    description: 'Hidden gem with amazing views'
  }
];

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [savedLocations] = useState<SavedLocation[]>(MOCK_LOCATIONS);

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Places</Text>
          <Text style={styles.headerSubtitle}>Discover your collection</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="options-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Location List */}
        {savedLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            onPress={() => setSelectedLocation(location)}
            style={[
              styles.locationCard,
              selectedLocation?.id === location.id && styles.selectedCard
            ]}
          >
            <View style={styles.locationHeader}>
              <View>
                <Text style={styles.locationName}>{location.name}</Text>
                {location.description && (
                  <Text style={styles.locationDescription}>
                    {location.description}
                  </Text>
                )}
              </View>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#4B5563" />
              </View>
            </View>
            
            <View style={styles.locationFooter}>
              <Text style={styles.coordinates}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCard: {
    borderColor: '#3B82F6',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  locationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  locationIcon: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
  },
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  coordinates: {
    fontSize: 12,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MapScreen; 
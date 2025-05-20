import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  emoji: string;
  link: string;
}

const INITIAL_LOCATIONS: SavedLocation[] = [
  {
    id: '1',
    name: 'Cool Cafe',
    latitude: 37.78825,
    longitude: -122.4324,
    emoji: '☕️',
    link: 'https://www.tiktok.com/@user/video/123'
  },
  {
    id: '2',
    name: 'Amazing Restaurant',
    latitude: 37.78525,
    longitude: -122.4354,
    emoji: '🍜',
    link: 'https://www.youtube.com/shorts/abc'
  }
];

// Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';

export default function MapScreen() {
  const [locations] = useState<SavedLocation[]>(INITIAL_LOCATIONS);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 37.78825,
    lng: -122.4324
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      setMapCenter({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    })();
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Maps Not Configured</Text>
          <Text style={styles.message}>
            Please configure your Google Maps API key to use the map feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <View style={styles.container}>
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              style={styles.map}
              center={mapCenter}
              zoom={14}
            >
              {locations.map((location) => (
                <Marker
                  key={location.id}
                  position={{ lat: location.latitude, lng: location.longitude }}
                  title={`${location.emoji} ${location.name}`}
                />
              ))}
              {userLocation && (
                <Marker
                  position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                  title="You are here"
                />
              )}
            </Map>
          </APIProvider>
          
          <TouchableOpacity 
            style={styles.centerButton}
            onPress={() => {
              if (userLocation) {
                setMapCenter({
                  lat: userLocation.latitude,
                  lng: userLocation.longitude
                });
              }
            }}
          >
            <Ionicons name="locate" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    maxWidth: 300,
    lineHeight: 24,
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    padding: 20,
    color: 'red',
  },
  centerButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 15,
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
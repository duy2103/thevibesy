import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function MapScreen() {
  const [locations, setLocations] = useState<SavedLocation[]>(INITIAL_LOCATIONS);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  const initialRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <SafeAreaView style={styles.container}>
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {locations.map((location) => (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
              >
                <View style={styles.markerContainer}>
                  <Text style={styles.markerText}>{location.emoji}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          
          <TouchableOpacity 
            style={styles.centerButton}
            onPress={async () => {
              if (userLocation && mapRef.current) {
                const camera = await mapRef.current.getCamera();
                if (camera) {
                  camera.center = {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  };
                  mapRef.current.animateCamera(camera, { duration: 1000 });
                }
              }
            }}
          >
            <Ionicons name="locate" size={24} color="#007AFF" />
          </TouchableOpacity>
        </>
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
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  markerText: {
    fontSize: 24,
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
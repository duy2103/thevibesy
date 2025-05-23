import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';

// Only import Leaflet components for web
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, L: any;
if (Platform.OS === 'web') {
  const leaflet = require('leaflet');
  const reactLeaflet = require('react-leaflet');
  MapContainer = reactLeaflet.MapContainer;
  TileLayer = reactLeaflet.TileLayer;
  Marker = reactLeaflet.Marker;
  Popup = reactLeaflet.Popup;
  L = leaflet;
  
  // Fix Leaflet marker icon issue on web
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });
  
  // Import Leaflet CSS for web
  require('leaflet/dist/leaflet.css');
}

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
    latitude: 37.78945,
    longitude: -122.4384,
    description: 'Hidden gem with amazing views'
  }
];

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [savedLocations] = useState<SavedLocation[]>(MOCK_LOCATIONS);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.78825, -122.4324]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, use browser's geolocation API
        if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 1000,
            });
          });

          // Convert web geolocation to match Expo Location format
          const webLocation: Location.LocationObject = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          };

          setLocation(webLocation);
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        } else {
          setErrorMsg('Geolocation is not supported by your browser');
        }
      } else {
        // For native platforms, use Expo Location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(location);
        setMapCenter([location.coords.latitude, location.coords.longitude]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg(
        Platform.OS === 'web'
          ? 'Please allow location access in your browser settings'
          : 'Error getting your location. Please check your settings.'
      );
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Generate HTML for native WebView
  const generateMapHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; }
            #map { width: 100vw; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${mapCenter[0]}, ${mapCenter[1]}], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Add markers
            ${location ? 
              `L.marker([${location.coords.latitude}, ${location.coords.longitude}])
                .bindPopup('Your Location')
                .addTo(map);` 
              : ''
            }
            
            ${savedLocations.map(loc => 
              `L.marker([${loc.latitude}, ${loc.longitude}])
                .bindPopup('<h3>${loc.name}</h3>${loc.description || ''}')
                .addTo(map);`
            ).join('\n')}
          </script>
        </body>
      </html>
    `;
  };

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {location && (
            <Marker
              position={[location.coords.latitude, location.coords.longitude]}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {savedLocations.map((loc) => (
            <Marker
              key={loc.id}
              position={[loc.latitude, loc.longitude]}
              eventHandlers={{
                click: () => setSelectedLocation(loc),
              }}
            >
              <Popup>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{loc.name}</h3>
                  {loc.description && <p style={{ margin: 0 }}>{loc.description}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      );
    } else {
      return (
        <WebView
          source={{ html: generateMapHTML() }}
          style={{ flex: 1 }}
          scrollEnabled={false}
          bounces={false}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Saved Places</Text>
            <Text style={styles.headerSubtitle}>Discover your collection</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.buttonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <View style={styles.mapWrapper}>
            {renderMap()}
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
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
  headerTitleContainer: {
    flex: 1,
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
  buttonText: {
    fontSize: 24,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  errorText: {
    color: '#DC2626',
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      },
    }),
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MapScreen; 
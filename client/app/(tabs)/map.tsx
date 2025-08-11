import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Dimensions, Modal, TextInput, Alert, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import WebView from 'react-native-webview';
import debounce from 'lodash/debounce';
import { getLocations, addLocation } from '../utils/api';

// Only import Leaflet components for web
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, L: any, useMap: any;
if (Platform.OS === 'web') {
  const leaflet = require('leaflet');
  const reactLeaflet = require('react-leaflet');
  MapContainer = reactLeaflet.MapContainer;
  TileLayer = reactLeaflet.TileLayer;
  Marker = reactLeaflet.Marker;
  Popup = reactLeaflet.Popup;
  useMap = reactLeaflet.useMap;
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

// Update map style configuration
const MAP_STYLE = {
  default: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
};

// Update marker colors for better contrast with the new map style
const MARKER_COLORS = {
  currentLocation: '#34C759', // Green
  savedLocation: '#FF9500'    // Orange
};

// Add RecenterButton component for web
const RecenterButton = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  
  const handleClick = () => {
    map.setView(position, 15);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: '80px',
        right: '10px',
        zIndex: 1000,
        padding: '8px 12px',
        backgroundColor: 'white',
        border: '2px solid rgba(0,0,0,0.2)',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f8f8';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      <span>📍</span>
      <span style={{ fontSize: '14px' }}>Navigate to Me</span>
    </button>
  );
};

type SavedLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
};

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
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

const MapScreen = ({ token }: { token: string }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.78825, -122.4324]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ 
    name: '', 
    description: '', 
    address: '',
    latitude: 0,
    longitude: 0
  });
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SearchResult | null>(null);
  const webViewRef = useRef<WebView>(null);

  const checkLocationEnabled = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      setIsLocationEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  };

  const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const showLocationPermissionAlert = () => {
    Alert.alert(
      'Location Access Required',
      'Please enable location services to use all features of the app.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: openLocationSettings }
      ]
    );
  };

  const requestLocationPermission = async () => {
    try {
      const isEnabled = await checkLocationEnabled();
      if (!isEnabled) {
        showLocationPermissionAlert();
        return;
      }

      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 1000,
              });
            });

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
          } catch (error) {
            console.error('Error getting web location:', error);
            setErrorMsg('Please allow location access in your browser settings');
          }
        } else {
          setErrorMsg('Geolocation is not supported by your browser');
        }
      } else {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        
        if (existingStatus === 'granted') {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            setLocation(location);
            setMapCenter([location.coords.latitude, location.coords.longitude]);
          } catch (error) {
            console.error('Error getting location:', error);
            showLocationPermissionAlert();
          }
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setLocation(location);
              setMapCenter([location.coords.latitude, location.coords.longitude]);
            } catch (error) {
              console.error('Error getting location after permission:', error);
              showLocationPermissionAlert();
            }
          } else {
            setErrorMsg('Location permission is required to use this feature');
            showLocationPermissionAlert();
          }
        }
      }
    } catch (error) {
      console.error('Error in location permission flow:', error);
      setErrorMsg('Unable to access location services. Please check your settings.');
    }
  };

  useEffect(() => {
    requestLocationPermission();
    
    // Set up location subscription for real-time updates
    let locationSubscription: Location.LocationSubscription | null = null;
    
    const setupLocationUpdates = async () => {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            locationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 10000, // Update every 10 seconds
                distanceInterval: 10, // Update every 10 meters
              },
              (newLocation) => {
                setLocation(newLocation);
                // Don't update map center automatically to avoid disrupting user navigation
              }
            );
          }
        } catch (error) {
          console.error('Error setting up location updates:', error);
        }
      }
    };

    setupLocationUpdates();

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const navigateToCurrentLocation = () => {
    if (Platform.OS !== 'web' && webViewRef.current && location) {
      const script = `
        map.setView([${location.coords.latitude}, ${location.coords.longitude}], 15);
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const searchAddress = useCallback(
    debounce(async (address: string) => {
      if (!address.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept': 'application/json',
              'Accept-Language': 'en',
              'User-Agent': 'Vibesy-App/1.0',
              'Referer': 'https://vibesy.app'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON but received ${contentType}`);
        }

        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching address:', error);
        // Don't show alert for every error to avoid spamming the user
        if (!isSearching) {
          Alert.alert(
            'Search Error',
            'Unable to search address at the moment. Please try again later.'
          );
        }
      } finally {
        setIsSearching(false);
      }
    }, 1000), // Debounce for 1 second
    [] // Empty dependency array since we don't need to recreate the debounced function
  );

  // Add cleanup for debounced function
  useEffect(() => {
    return () => {
      searchAddress.cancel();
    };
  }, [searchAddress]);

  // Update the address input handling
  const handleAddressInput = (text: string) => {
    setNewLocation(prev => ({ ...prev, address: text }));
    if (text.trim()) {
      setIsSearching(true);
      searchAddress(text);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (result: SearchResult) => {
    setSelectedAddress(result);
    setNewLocation(prev => ({
      ...prev,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name
    }));
    setSearchResults([]); // Clear search results after selection
  };

  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }
    if (!token) {
      Alert.alert('Error', 'Please login first');
      return;
    }
    try {
      const loc = {
        name: newLocation.name,
        latitude: selectedAddress ? parseFloat(selectedAddress.lat) : (location?.coords.latitude || 0),
        longitude: selectedAddress ? parseFloat(selectedAddress.lon) : (location?.coords.longitude || 0),
        description: newLocation.description,
        address: selectedAddress?.display_name
      };
      await addLocation(token, loc);
      setIsAddingLocation(false);
      setNewLocation({ name: '', description: '', address: '', latitude: 0, longitude: 0 });
      setSelectedAddress(null);
      // Refresh locations
      const data = await getLocations(token);
      setSavedLocations(data);
      Alert.alert('Success', 'Location saved!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save location');
    }
  };

  useEffect(() => {
    if (token) {
      const fetchLocations = async () => {
        try {
          const data = await getLocations(token);
          setSavedLocations(data);
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Failed to load locations');
        }
      };
      fetchLocations();
    }
  }, [token]);

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
            .navigate-btn {
              position: absolute;
              top: 80px;
              right: 10px;
              zIndex: 1000;
              padding: 8px 12px;
              background-color: white;
              border: 2px solid rgba(0,0,0,0.2);
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              display: flex;
              align-items: center;
              gap: 6px;
              font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .navigate-btn:hover {
              background-color: #f8f8f8;
              transform: translateY(-1px);
              box-shadow: 0 3px 6px rgba(0,0,0,0.15);
            }
            .leaflet-popup-content {
              max-width: 200px;
              font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .leaflet-popup-content h3 {
              color: #1c1c1e;
              margin: 0 0 8px 0;
              font-size: 16px;
            }
            .leaflet-popup-content p {
              margin: 5px 0;
              color: #3a3a3c;
              font-size: 14px;
            }
            .leaflet-popup-content small {
              color: #666;
              font-size: 12px;
            }
            /* Custom marker styles */
            .custom-marker {
              background-color: ${MARKER_COLORS.savedLocation};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .custom-marker.current-location {
              background-color: ${MARKER_COLORS.currentLocation};
            }
            /* Map controls */
            .leaflet-control-attribution {
              font-size: 10px;
              background-color: rgba(255, 255, 255, 0.8) !important;
              backdrop-filter: blur(5px);
              -webkit-backdrop-filter: blur(5px);
              border-radius: 4px;
            }
            .leaflet-control-zoom {
              border: none !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
              border-radius: 8px !important;
              overflow: hidden;
            }
            .leaflet-control-zoom a {
              background-color: white !important;
              color: #1c1c1e !important;
              width: 32px !important;
              height: 32px !important;
              line-height: 32px !important;
              font-size: 16px !important;
              border: none !important;
            }
            .leaflet-control-zoom a:hover {
              background-color: #f8f8f8 !important;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <button class="navigate-btn" onclick="navigateToMe()">📍 Navigate to Me</button>
          <script>
            const map = L.map('map', {
              zoomControl: true,
              zoomAnimation: true,
              fadeAnimation: true,
              markerZoomAnimation: true
            }).setView([${mapCenter[0]}, ${mapCenter[1]}], 13);

            L.tileLayer('${MAP_STYLE.default}', {
              attribution: '${MAP_STYLE.attribution}',
              maxZoom: 19,
              minZoom: 3
            }).addTo(map);
            
            // Custom marker icon
            const createMarkerIcon = (isCurrentLocation = false) => {
              return L.divIcon({
                className: 'custom-marker' + (isCurrentLocation ? ' current-location' : ''),
                iconSize: [12, 12],
                iconAnchor: [6, 6],
                popupAnchor: [0, -6]
              });
            };

            ${location ? 
              `L.marker([${location.coords.latitude}, ${location.coords.longitude}], {
                icon: createMarkerIcon(true)
               })
                .bindPopup('Your Location')
                .addTo(map);` 
              : ''
            }
            
            ${savedLocations.map(loc => 
              `L.marker([${loc.latitude}, ${loc.longitude}], {
                icon: createMarkerIcon()
               })
                .bindPopup('<h3>${loc.name}</h3>${loc.description ? `<p>${loc.description}</p>` : ''}${loc.address ? `<p><small>${loc.address}</small></p>` : ''}')
                .addTo(map);`
            ).join('\n')}

            function navigateToMe() {
              ${location ? 
                `map.setView([${location.coords.latitude}, ${location.coords.longitude}], 15);`
                : ''
              }
            }
          </script>
        </body>
      </html>
    `;
  };

  const renderMap = () => {
    if (Platform.OS === 'web') {
      useEffect(() => {
        // Add global styles for web
        const style = document.createElement('style');
        style.textContent = `
          .custom-marker {
            background-color: ${MARKER_COLORS.savedLocation};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .custom-marker.current-location {
            background-color: ${MARKER_COLORS.currentLocation};
          }
          .leaflet-control-attribution {
            font-size: 10px;
            background-color: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            border-radius: 4px;
          }
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
            border-radius: 8px !important;
            overflow: hidden;
          }
          .leaflet-control-zoom a {
            background-color: white !important;
            color: #1c1c1e !important;
            width: 32px !important;
            height: 32px !important;
            line-height: 32px !important;
            font-size: 16px !important;
            border: none !important;
          }
          .leaflet-control-zoom a:hover {
            background-color: #f8f8f8 !important;
          }
        `;
        document.head.appendChild(style);
        
        return () => {
          document.head.removeChild(style);
        };
      }, []);

      return (
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution={MAP_STYLE.attribution}
            url={MAP_STYLE.default}
            maxZoom={19}
            minZoom={3}
          />
          
          {location && (
            <Marker
              position={[location.coords.latitude, location.coords.longitude]}
              icon={L.divIcon({
                className: 'custom-marker current-location',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
                popupAnchor: [0, -6]
              })}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {savedLocations.map((loc) => (
            <Marker
              key={loc.id}
              position={[loc.latitude, loc.longitude]}
              icon={L.divIcon({
                className: 'custom-marker',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
                popupAnchor: [0, -6]
              })}
              eventHandlers={{
                click: () => setSelectedLocation(loc),
              }}
            >
              <Popup>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{loc.name}</h3>
                  {loc.description && <p style={{ margin: '5px 0' }}>{loc.description}</p>}
                  {loc.address && (
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                      {loc.address}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {location && <RecenterButton position={[location.coords.latitude, location.coords.longitude]} />}
        </MapContainer>
      );
    } else {
      return (
        <WebView
          ref={webViewRef}
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
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            if (!location) {
              requestLocationPermission();
            } else {
              navigateToCurrentLocation();
            }
          }}
        >
          <Text style={styles.buttonText}>📍</Text>
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

      {/* Add Location Modal */}
      <Modal
        visible={isAddingLocation}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Location</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Location Name"
              value={newLocation.name}
              onChangeText={(text) => setNewLocation(prev => ({ ...prev, name: text }))}
            />

            <View style={styles.addressContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Search Address"
                value={newLocation.address}
                onChangeText={handleAddressInput}
              />
              {isSearching && (
                <ActivityIndicator style={styles.searchingIndicator} />
              )}
            </View>

            {searchResults.length > 0 && (
              <ScrollView 
                style={styles.searchResults}
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={`${result.lat}-${result.lon}-${index}`}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectAddress(result)}
                  >
                    <Text style={styles.searchResultText}>{result.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {searchResults.length === 0 && newLocation.address.trim() && !isSearching && (
              <Text style={styles.noResultsText}>No results found</Text>
            )}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newLocation.description}
              onChangeText={(text) => setNewLocation(prev => ({ ...prev, description: text }))}
              multiline
            />

            {selectedAddress && (
              <View style={styles.selectedAddressContainer}>
                <Text style={styles.selectedAddressText}>
                  Selected: {selectedAddress.display_name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedAddress(null);
                    setNewLocation(prev => ({ ...prev, address: '', latitude: 0, longitude: 0 }));
                  }}
                >
                  <Text style={styles.clearAddressText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddingLocation(false);
                  setNewLocation({ name: '', description: '', address: '', latitude: 0, longitude: 0 });
                  setSelectedAddress(null);
                  setSearchResults([]);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddLocation}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setIsAddingLocation(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerButton: {
    padding: 8,
  },
  buttonText: {
    fontSize: 24,
  },
  mapContainer: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  saveButton: {
    backgroundColor: '#34c759',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchingIndicator: {
    marginLeft: 8,
  },
  searchResults: {
    maxHeight: 150,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    fontSize: 14,
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  clearAddressText: {
    color: '#ff3b30',
    marginLeft: 8,
    fontSize: 12,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});

export default MapScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { parseScreenshot, saveParsedLocations } from '../utils/api';
import { router } from 'expo-router';

type ParsedLocation = {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  confidence: number;
  source: string;
};

const LocationsScreen = () => {
  const { authToken } = useAuth();
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [parsedLocations, setParsedLocations] = useState<ParsedLocation[]>([]);
  const [selectedLocationIndices, setSelectedLocationIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to use this feature.'
        );
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setParsedLocations([]);
        setSelectedLocationIndices(new Set());
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const parseImage = async () => {
    if (!selectedImage || !authToken) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await parseScreenshot(authToken, selectedImage);
      
      if (response.locations && response.locations.length > 0) {
        setParsedLocations(response.locations);
        setSelectedLocationIndices(new Set(response.locations.map((_: any, idx: number) => idx)));
        
        Alert.alert(
          'Success! 🎉',
          `Found ${response.locations.length} location(s)!\n\nSelect which locations to save, then click "Save Selected".`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'No Locations Found',
          'Could not find any locations in this image. Try:\n\n• Using a clearer screenshot\n• Images with 📍 emoji\n• Photos with location names or addresses'
        );
      }
    } catch (error: any) {
      console.error('Parse error:', error);
      Alert.alert(
        'Parsing Failed',
        error.message || 'Could not parse the screenshot. Please try another image.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const saveSelectedLocations = async () => {
    if (!authToken) return;

    const selected = parsedLocations.filter((_: any, idx: number) => 
      selectedLocationIndices.has(idx)
    );
    
    if (selected.length === 0) {
      Alert.alert('No Selection', 'Please select at least one location to save.');
      return;
    }

    setIsSaving(true);
    try {
      await saveParsedLocations(authToken, {
        locations: selected,
        source_info: {
          platform: 'screenshot',
          total_locations_found: selected.length,
        },
      });

      Alert.alert(
        'Saved! ✅',
        `Successfully saved ${selected.length} location(s) to your map!`,
        [
          {
            text: 'View Map',
            onPress: () => router.push('/map'),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );

      setSelectedImage(null);
      setParsedLocations([]);
      setSelectedLocationIndices(new Set());
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save locations');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLocationSelection = (index: number) => {
    const newSelection = new Set(selectedLocationIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedLocationIndices(newSelection);
  };

  const selectAll = () => {
    setSelectedLocationIndices(new Set(parsedLocations.map((_: any, idx: number) => idx)));
  };

  const deselectAll = () => {
    setSelectedLocationIndices(new Set());
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#10B981';
    if (confidence >= 0.8) return '#3B82F6';
    if (confidence >= 0.7) return '#F59E0B';
    return '#6B7280';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.8) return 'Good';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Location Parser</Text>
        <Text style={styles.headerSubtitle}>Extract locations from screenshots</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>💡 How to use:</Text>
          <Text style={styles.instructionsText}>
            1. 📷 Pick a screenshot from Instagram, Google Maps, or any app
          </Text>
          <Text style={styles.instructionsText}>
            2. 🔍 Parse the image to extract location text
          </Text>
          <Text style={styles.instructionsText}>
            3. ✅ Select locations you want to save
          </Text>
          <Text style={styles.instructionsText}>
            4. 🗺️ View them on the Map tab!
          </Text>
        </View>

        <TouchableOpacity
          onPress={pickImage}
          style={styles.pickButton}
          disabled={isProcessing || isSaving}
        >
          <Ionicons name="image-outline" size={24} color="white" />
          <Text style={styles.pickButtonText}>
            {selectedImage ? '✓ Change Screenshot' : '📷 Pick Screenshot'}
          </Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <Text style={styles.imageInfo}>
              ✓ Image selected ({Math.round(selectedImage.width)}x{Math.round(selectedImage.height)})
            </Text>
          </View>
        )}

        {selectedImage && !isProcessing && parsedLocations.length === 0 && (
          <TouchableOpacity
            onPress={parseImage}
            style={styles.parseButton}
            disabled={isProcessing || isSaving}
          >
            <Ionicons name="scan-outline" size={24} color="white" />
            <Text style={styles.parseButtonText}>🔍 Parse Screenshot</Text>
          </TouchableOpacity>
        )}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.processingText}>Analyzing image with OCR...</Text>
            <Text style={styles.processingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {parsedLocations.length > 0 && !isProcessing && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              🎉 Found {parsedLocations.length} Location{parsedLocations.length > 1 ? 's' : ''}!
            </Text>

            <View style={styles.selectionControls}>
              <Text style={styles.selectionText}>
                {selectedLocationIndices.size} of {parsedLocations.length} selected
              </Text>
              <View style={styles.selectionButtons}>
                <TouchableOpacity onPress={selectAll} style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deselectAll} style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {parsedLocations.map((location, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleLocationSelection(index)}
                style={[
                  styles.locationCard,
                  selectedLocationIndices.has(index) && styles.locationCardSelected,
                ]}
              >
                <View style={styles.locationCheckbox}>
                  <View style={[
                    styles.checkbox,
                    selectedLocationIndices.has(index) && styles.checkboxSelected,
                  ]}>
                    {selectedLocationIndices.has(index) && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                </View>
                <View style={styles.locationContent}>
                  <View style={styles.locationHeader}>
                    <Text style={styles.locationName}>{location.name}</Text>
                    <View
                      style={[
                        styles.confidenceBadge,
                        { backgroundColor: getConfidenceColor(location.confidence) },
                      ]}
                    >
                      <Text style={styles.confidenceText}>
                        {getConfidenceLabel(location.confidence)}
                      </Text>
                    </View>
                  </View>
                  {location.address && (
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      📍 {location.address}
                    </Text>
                  )}
                  <View style={styles.locationMeta}>
                    <Text style={styles.locationCoords}>
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </Text>
                    <Text style={styles.locationConfidence}>
                      {Math.round(location.confidence * 100)}% confident
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={saveSelectedLocations}
              style={[styles.saveSelectedButton, (isSaving || selectedLocationIndices.size === 0) && styles.buttonDisabled]}
              disabled={isSaving || selectedLocationIndices.size === 0}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={24} color="white" />
                  <Text style={styles.saveSelectedButtonText}>
                    Save Selected ({selectedLocationIndices.size})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!selectedImage && !isProcessing && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>✨ What works best:</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>📍</Text>
              <Text style={styles.tipText}>Instagram posts with location tags</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>🗺️</Text>
              <Text style={styles.tipText}>Google Maps screenshots</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>🍕</Text>
              <Text style={styles.tipText}>Restaurant menus with addresses</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>✈️</Text>
              <Text style={styles.tipText}>Travel itineraries and bookings</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipEmoji}>🌍</Text>
              <Text style={styles.tipText}>Supports 11+ languages worldwide!</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  instructionsBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
  },
  pickButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  imageInfo: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  parseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
  },
  parseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  processingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  locationCheckbox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  locationContent: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationCoords: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  locationConfidence: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  saveSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  saveSelectedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default LocationsScreen;

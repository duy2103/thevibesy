import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocations, getProfile, updateProfile } from '../utils/api';

const ProfileScreen = () => {
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadAuthToken();
  }, []);

  const loadAuthToken = async () => {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      setToken(authToken);
      if (authToken) {
        loadData(authToken);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Error loading auth token:', e);
      setLoading(false);
    }
  };

  const loadData = async (authToken: string) => {
    try {
      setLoading(true);
      const [locationsData, profileData] = await Promise.all([
        getLocations(authToken),
        getProfile(authToken)
      ]);
      setSavedLocations(locationsData);
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!token) return;
    try {
      await updateProfile(token, editedProfile);
      setProfile(editedProfile);
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.authPromptText}>Please login to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditingProfile(true)}
        >
          <Ionicons name="create-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
              }} 
              style={styles.avatar} 
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{profile?.email}</Text>
            {profile?.bio && (
              <Text style={styles.userBio}>{profile.bio}</Text>
            )}
          </View>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{savedLocations.length}</Text>
              <Text style={styles.statLabel}>Places Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Lists Created</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Places Visited</Text>
            </View>
          </View>
        </View>

        {/* Recently Saved Locations */}
        <View style={styles.locationsSection}>
          <Text style={styles.sectionTitle}>Recently Saved</Text>
          {savedLocations.length === 0 ? (
            <Text style={styles.emptyText}>No locations saved yet.</Text>
          ) : (
            savedLocations.slice(0, 5).map((location) => (
              <View key={location.id} style={styles.locationCard}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationDescription}>{location.description}</Text>
                {location.address && (
                  <Text style={styles.locationAddress}>{location.address}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditingProfile}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editedProfile.name || ''}
              onChangeText={(text) => setEditedProfile({...editedProfile, name: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Bio"
              value={editedProfile.bio || ''}
              onChangeText={(text) => setEditedProfile({...editedProfile, bio: text})}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Avatar URL"
              value={editedProfile.avatar_url || ''}
              onChangeText={(text) => setEditedProfile({...editedProfile, avatar_url: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditingProfile(false);
                  setEditedProfile(profile);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authPromptText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  editButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    color: '#6b7280',
    marginTop: 4,
  },
  userBio: {
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  locationsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyText: {
    color: '#6b7280',
  },
  locationCard: {
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
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  locationDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
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
});

export default ProfileScreen;

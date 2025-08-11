import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { register, login } from '../utils/api';

const DEMO_LOCATIONS = [
  { id: '1', name: 'Demo Place 1', description: 'A cool demo place' },
  { id: '2', name: 'Demo Place 2', description: 'Another awesome spot' },
];

const HomeScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [demoLocations] = useState(DEMO_LOCATIONS);

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await register(email, password);
      Alert.alert('Success', 'Registered! Now login.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login(email, password);
      Alert.alert('Success', 'Logged in!');
      setShowAuth(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => setShowAuth(false);

  if (showAuth) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login or Register</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              style={styles.input}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={handleRegister} style={[styles.parseBtn, { backgroundColor: '#7c3aed', flex: 1, marginRight: 8 }]} disabled={isLoading}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogin} style={[styles.parseBtn, { backgroundColor: '#2563eb', flex: 1, marginLeft: 8 }]} disabled={isLoading}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Login</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSkip} style={[styles.parseBtn, { backgroundColor: '#6b7280', marginTop: 16 }]}> 
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Skip for now (Demo)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // After skip, show demo locations
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 24 }}>Saved Places</Text>
        {demoLocations.length === 0 && (
          <Text style={{ color: '#6b7280' }}>No places saved yet.</Text>
        )}
        {demoLocations.map((loc) => (
          <View key={loc.id} style={styles.savedCard}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{loc.name}</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{loc.description}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  parseBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
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

export default HomeScreen;
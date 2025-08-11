import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const LocationsScreen = () => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<string | null>(null);

  const handleParse = () => {
    // Simulate parsing logic
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter a location string to parse.');
      return;
    }
    setParsed(`Parsed location: ${input}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>Location Parsing Tool</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste a location string or link here..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.button} onPress={handleParse}>
          <Text style={styles.buttonText}>Parse</Text>
        </TouchableOpacity>
        {parsed && (
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{parsed}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultText: {
    color: '#111827',
    fontSize: 16,
  },
});

export default LocationsScreen;

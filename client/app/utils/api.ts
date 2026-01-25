// API utility for Vibesy frontend
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_URL = Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.0.2.2:8000';
let API_BASE = DEFAULT_API_URL;

/** Allow overriding API base (useful on physical devices). */
export async function setApiBase(url: string) {
  API_BASE = url.replace(/\/$/, '');
  await AsyncStorage.setItem('api_base_override', API_BASE);
}

export async function initApiBase() {
  try {
    const override = await AsyncStorage.getItem('api_base_override');
    if (override) API_BASE = override;
  } catch {}
}

export function getApiBase() {
  return API_BASE;
}

// Call init early (non-blocking)
initApiBase();

export async function register(email: string, password: string) {
  const res = await fetch(`${getApiBase()}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Register failed:', res.status, errorText);
    throw new Error(errorText || `Registration failed (${res.status})`);
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${getApiBase()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Login failed:', res.status, errorText);
    throw new Error(errorText || `Login failed (${res.status})`);
  }
  return res.json();
}

export async function demoLogin() {
  const res = await fetch(`${getApiBase()}/demo-login`);
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Demo login failed:', res.status, errorText);
    throw new Error(errorText || `Demo login failed (${res.status})`);
  }
  return res.json();
}

export async function getLocations(token: string) {
  const res = await fetch(`${getApiBase()}/locations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addLocation(token: string, location: any) {
  const res = await fetch(`${getApiBase()}/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(location)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteLocation(token: string, locationId: string) {
  const res = await fetch(`${getApiBase()}/locations/${locationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getProfile(token: string) {
  const res = await fetch(`${getApiBase()}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProfile(token: string, profileData: any) {
  const res = await fetch(`${getApiBase()}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveParsedLocations(token: string, locationsData: any) {
  const res = await fetch(`${getApiBase()}/locations/from-parsed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(locationsData)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function parseScreenshot(token: string, file: any) {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    // On web, fetch the file from URI and create a Blob
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append('file', blob, file.name || 'screenshot.jpg');
    } catch (error) {
      console.error('Error creating blob from file:', error);
      throw new Error('Failed to process image file');
    }
  } else {
    // React Native FormData requires this specific format
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'screenshot.jpg',
      type: file.type || 'image/jpeg'
    } as any);
  }
  
  const res = await fetch(`${getApiBase()}/parse-screenshot`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function refreshLocations(token: string) {
  const res = await fetch(`${getApiBase()}/locations/refresh`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function debugToken(token: string) {
  const res = await fetch(`${getApiBase()}/debug/token?token=${encodeURIComponent(token)}`);
  return res.json();
}

export async function health() {
  const res = await fetch(`${getApiBase()}/health`);
  return res.json();
}

export default {};

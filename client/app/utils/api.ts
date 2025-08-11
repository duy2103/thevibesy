// API utility for Vibesy frontend
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'web' ? 'http://localhost:8000' : 'http://10.0.2.2:8000'; // Android emulator uses 10.0.2.2

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getLocations(token: string) {
  const res = await fetch(`${API_URL}/locations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addLocation(token: string, location: any) {
  const res = await fetch(`${API_URL}/locations`, {
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
  const res = await fetch(`${API_URL}/locations/${locationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default {};

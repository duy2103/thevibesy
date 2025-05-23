import { View } from 'react-native';

// Export a default component to satisfy the router requirement
export default View;

// Export your types
export type SavedLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
};

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedLink {
  url: string;
  type: 'instagram' | 'facebook' | 'twitter' | 'tiktok';
  location?: Location;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  savedLocations: Location[];
  parsedLinks: ParsedLink[];
}

export type RootStackParamList = {
  '(tabs)': undefined;
  'parse-link': undefined;
};

export type TabParamList = {
  home: undefined;
  map: undefined;
  profile: undefined;
}; 
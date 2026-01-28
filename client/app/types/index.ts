import { View } from 'react-native';

// Export a default component to satisfy the router requirement
export default View;

// API Response Types
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface LocationResponse {
  id: number;
  user_id: number;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
  source_url?: string;
}

export interface ParsedLocation {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  confidence: number;
  source: string;
  source_url?: string;
}

export interface ParseScreenshotResponse {
  locations: ParsedLocation[];
  source_info: {
    platform: string;
    url?: string;
    parsed_content: string;
    total_locations_found: number;
    meta?: {
      filename?: string;
      content_type?: string;
      ocr_length?: number;
      locations_extracted?: number;
      locations_geocoded?: number;
    };
  };
}

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
}

// Legacy types (for compatibility)
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

export type RootStackParamList = {
  '(tabs)': undefined;
  'parse-link': undefined;
};

export type TabParamList = {
  home: undefined;
  map: undefined;
  profile: undefined;
}; 
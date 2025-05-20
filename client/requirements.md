# Vibesy App Requirements

## Core Dependencies
- `expo`: ~53.0.9 - Main framework for React Native development
- `expo-router`: ~5.0.7 - File-based routing for Expo
- `react-native`: ^0.79.2 - Core React Native framework
- `react`: 19.0.0 - Core React library

## UI Components & Styling
- `@rneui/themed`: ^4.0.0-rc.8 - React Native Elements UI library
- `@rneui/base`: ^4.0.0-rc.7 - Base components for React Native Elements
- `nativewind`: ^4.1.23 - Tailwind CSS for React Native
- `tailwindcss`: ^3.4.17 - Utility-first CSS framework
- `react-native-safe-area-context`: 5.4.0 - Safe area handling

## Maps & Location
- `react-native-maps`: Latest - OpenStreetMap integration for React Native
- `expo-location`: Latest - Location services for Expo
- `@turf/turf`: Latest - Geospatial analysis tools

## Navigation & Gestures
- `@react-navigation/native`: ^7.1.9 - React Navigation core
- `react-native-gesture-handler`: ~2.24.0 - Gesture handling
- `react-native-reanimated`: ^3.17.4 - Animations library

## Data Management & Storage
- `@react-native-async-storage/async-storage`: Latest - Local storage
- `expo-sharing`: Latest - Share sheet functionality
- `expo-file-system`: Latest - File system access

## Development Dependencies
- `typescript`: ~5.8.3 - TypeScript support
- `@babel/core`: ^7.25.2 - Babel core
- `babel-plugin-module-resolver`: Latest - Module resolution
- `@babel/plugin-proposal-export-namespace-from`: Latest - ES module support
- `eslint`: ^9.0.0 - Code linting
- `eslint-config-expo`: ~9.2.0 - Expo ESLint configuration

## Installation
```bash
# Install core dependencies
npm install

# Install additional required packages
npm install react-native-maps @turf/turf expo-location @react-native-async-storage/async-storage expo-sharing expo-file-system

# Install dev dependencies
npm install --save-dev babel-plugin-module-resolver @babel/plugin-proposal-export-namespace-from
```

## Note
This app requires the following Expo development build plugins:
- expo-location
- expo-sharing
- expo-file-system
- react-native-maps

Make sure to configure your `app.json` and `eas.json` accordingly when building for production. 
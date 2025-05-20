import { Platform } from 'react-native';

let MapScreen;
if (Platform.OS === 'web') {
  MapScreen = require('./map.web').default;
} else {
  MapScreen = require('./map.native').default;
}

export default MapScreen; 
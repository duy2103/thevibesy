import 'react-native';
import { View } from 'react-native';

// Export a default component to satisfy the router requirement
export default View;

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
}

// NativeWind type declarations
declare module 'nativewind/types' {
  interface CustomTheme {
    colors: {
      primary: string;
      secondary: string;
      // Add more custom colors as needed
    };
  }
} 
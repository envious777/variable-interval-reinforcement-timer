export type Theme = {
    background: string;
    card: string;
    text: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    error: string;
};

// Default theme colors
export const lightTheme: Theme = {
  background: '#FFFFFF',
  card: '#F2F2F7',
  text: '#000000',
  border: '#C5C5C7',
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF9500',
  error: '#FF3B30',
};

export const darkTheme: Theme = {
  background: '#1C1C1E',
  card: '#2C2C2E',
  text: '#FFFFFF',
  border: '#38383A',
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  accent: '#FF9F0A',
  error: '#FF453A',
};

export const colors = {
  light: lightTheme,
  dark: darkTheme,
  success: '#34C759',
  destructive: '#FF3B30',
  white: '#FFFFFF',
  black: '#000000',
};
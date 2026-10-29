import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { DesignProvider, useDesign } from '../design-system/theme';

export default function RootLayout() {
  useFonts({
    Manrope: require('../../assets/fonts/manrope-regular.ttf'),
    ManropeBold: require('../../assets/fonts/manrope-bold.ttf'),
  });
  return (
    <DesignProvider>
      <Layout />
    </DesignProvider>
  );
}
function Layout() {
  const { colors, mode } = useDesign();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

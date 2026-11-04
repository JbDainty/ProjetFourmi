/** Bundled fonts: no remote font request is needed when the game is offline. */
export const F = {
  display: 'HerbariumDisplay',
  displayBold: 'HerbariumDisplayBold',
  body: 'HerbariumBody',
  medium: 'HerbariumMedium',
  bold: 'HerbariumBold',
  scientific: 'HerbariumScientific',
} as const;
export const botanicalFonts = {
  [F.display]: require('@expo-google-fonts/almendra/400Regular/Almendra_400Regular.ttf'),
  [F.displayBold]: require('@expo-google-fonts/almendra/700Bold/Almendra_700Bold.ttf'),
  [F.body]: require('@expo-google-fonts/alegreya-sans/400Regular/AlegreyaSans_400Regular.ttf'),
  [F.medium]: require('@expo-google-fonts/alegreya-sans/500Medium/AlegreyaSans_500Medium.ttf'),
  [F.bold]: require('@expo-google-fonts/alegreya-sans/700Bold/AlegreyaSans_700Bold.ttf'),
  [F.scientific]: require('@expo-google-fonts/alegreya/500Medium_Italic/Alegreya_500Medium_Italic.ttf'),
};

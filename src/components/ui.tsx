import React from 'react';
import { Text, TextProps, Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { F } from './fonts';
import Ionicons from '@expo/vector-icons/Ionicons';
export const C = {
  paper: '#ebe0c9',
  card: '#f4ead6',
  ink: '#293e34',
  muted: '#70694f',
  line: '#d3c3a3',
  green: '#365c49',
  gold: '#af8b49',
};
export function T({ serif = false, style, ...props }: TextProps & { serif?: boolean }) {
  const flattened = StyleSheet.flatten(style) || {};
  const { fontWeight, ...textStyle } = flattened;
  const weight = fontWeight === 'bold' ? 700 : Number(fontWeight || 400);
  const font =
    flattened.fontFamily ||
    (serif
      ? weight >= 600
        ? F.displayBold
        : F.display
      : weight >= 600
        ? F.bold
        : weight >= 500
          ? F.medium
          : F.body);
  const lineHeight =
    typeof flattened.fontSize === 'number'
      ? Math.max(22, Math.round(flattened.fontSize * (serif ? 1.16 : 1.3)))
      : 22;
  return (
    <Text
      {...props}
      style={[{ fontFamily: font, fontSize: 14, color: C.ink, lineHeight }, textStyle]}
    />
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <T style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: '600' }}>{children}</T>
  );
}
export function Icon({
  name,
  size = 20,
  color = C.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: secondary ? 'transparent' : C.green,
          paddingHorizontal: 22,
          paddingVertical: 13,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: secondary ? C.line : C.green,
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        style,
      ]}
    >
      <T style={{ color: secondary ? C.ink : '#fffaf0', fontSize: 13, fontWeight: '500' }}>
        {children}
      </T>
    </Pressable>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <View style={{ height: 3, backgroundColor: C.line, borderRadius: 2, overflow: 'hidden' }}>
      <View
        style={{ width: `${Math.min(100, value * 100)}%`, height: 3, backgroundColor: C.green }}
      />
    </View>
  );
}
export const ui = StyleSheet.create({
  page: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 28, paddingBottom: 45 },
  title: { fontSize: 44, lineHeight: 49, marginTop: 10, marginBottom: 9 },
  card: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    borderRadius: 4,
    padding: 24,
    overflow: 'hidden',
    zIndex: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muted: { color: C.muted },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 24 },
});

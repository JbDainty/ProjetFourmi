import React from 'react';
import { Text, TextProps, Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { F } from './fonts';
import { BotanicalIcon as Icon, type BotanicalIconName } from './BotanicalIcon';
export { Icon };
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
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  style,
  icon = 'leaf-outline',
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: BotanicalIconName;
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
          borderRadius: 18,
          borderWidth: 1,
          borderColor: secondary ? C.line : C.green,
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          minHeight: 48,
        },
        style,
      ]}
    >
      <Icon name={icon} size={19} color={secondary ? C.green : '#fff4dd'} />
      <T
        style={{
          color: secondary ? C.ink : '#fffaf0',
          fontSize: 13,
          fontWeight: '500',
          flexShrink: 1,
        }}
      >
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
    borderWidth: 0,
    backgroundColor: C.card,
    borderRadius: 30,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    padding: 24,
    overflow: 'hidden',
    zIndex: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muted: { color: C.muted },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 24 },
});

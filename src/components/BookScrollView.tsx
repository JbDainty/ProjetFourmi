import React, {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, View, type ScrollViewProps } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { T, C } from './ui';
import { F } from './fonts';

export const bookHeaderHeight = 100;
export const BookChromeContext = createContext<{ header: React.ReactNode; motion: boolean }>({
  header: null,
  motion: true,
});

/** The book's header and return arrow belong to the page, so nothing covers play. */
export const BookScrollView = forwardRef<ScrollView, ScrollViewProps>(function BookScrollView(
  { children, contentContainerStyle, ...props },
  forwardedRef,
) {
  const { header, motion } = useContext(BookChromeContext);
  const scroll = useRef<ScrollView>(null);
  useImperativeHandle(forwardedRef, () => scroll.current!);
  const geometry = useRef({ header: 0, body: 0, viewport: 0 });
  const [overflow, setOverflow] = useState(false);
  const measure = (part: keyof typeof geometry.current, height: number) => {
    geometry.current[part] = height;
    const size = geometry.current;
    // Measure without the footer so it cannot make its own arrow appear.
    setOverflow(size.viewport > 0 && size.header + size.body > size.viewport + 2);
  };
  return (
    <ScrollView
      {...props}
      ref={scroll}
      testID={props.testID ?? 'book-page-scroll'}
      contentContainerStyle={{ flexGrow: 1 }}
      onLayout={(event) => {
        measure('viewport', event.nativeEvent.layout.height);
        props.onLayout?.(event);
      }}
    >
      <View onLayout={(event) => measure('header', event.nativeEvent.layout.height)}>{header}</View>
      <View
        style={contentContainerStyle}
        onLayout={(event) => measure('body', event.nativeEvent.layout.height)}
      >
        {children}
      </View>
      {overflow && (
        <View
          testID="book-return-footer"
          style={{
            width: '100%',
            maxWidth: 1180,
            alignSelf: 'center',
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Revenir en haut de la page"
            accessibilityHint="Retrouver le titre, le carnet et les graines"
            onPress={() => scroll.current?.scrollTo({ y: 0, animated: motion })}
            style={({ pressed }) => ({
              width: 54,
              minHeight: 62,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Svg width="42" height="42" viewBox="0 0 48 48" accessible={false} pointerEvents="none">
              <Circle cx="24" cy="24" r="19" fill="#f2e6c9" fillOpacity=".8" />
              <Path
                d="M10 34 Q5 22 13 11 M34 37 Q42 28 37 15"
                fill="none"
                stroke="#b29b64"
                strokeWidth=".7"
              />
              <G fill="#c5cea6" stroke="#718761" strokeWidth=".75">
                <Path d="M23 31 Q11 30 13 20 Q23 21 23 31Z M24 25 Q35 23 34 14 Q25 16 24 25Z" />
              </G>
              <Path
                d="M23 38 Q26 25 24 9 M17 17 Q23 13 24 9 Q27 14 31 17 M23 31 16 24 M24 25 31 18"
                fill="none"
                stroke={C.green}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M37 6 38 9 41 10 38 11 37 14 36 11 33 10 36 9Z"
                fill="#b29b64"
                opacity=".8"
              />
            </Svg>
            <T style={{ fontFamily: F.handwriting, fontSize: 17, lineHeight: 20, color: C.green }}>
              Haut
            </T>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
});

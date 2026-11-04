import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Platform,
  Text,
  View,
  type TextLayoutEventData,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { F } from './fonts';
import { C } from './ui';

type Props = {
  text: string;
  handwritten: boolean;
  motion: boolean;
  request: number;
  ready?: boolean;
  bare?: boolean;
};
export function PencilNote({
  text,
  handwritten,
  motion,
  request,
  ready = true,
  bare = false,
}: Props) {
  const key = text + '\0' + request;
  const characters = Array.from(text);
  const animated = handwritten && motion;
  const [reveal, setReveal] = useState({ key, count: animated ? 0 : characters.length });
  const count = !ready ? 0 : !animated ? characters.length : reveal.key === key ? reveal.count : 0;
  const prefix = characters.slice(0, count).join('');
  const writing = ready && animated && count < characters.length;
  const [pen, setPen] = useState({ x: 0, y: 21 });
  const [width, setWidth] = useState(0);
  const textRef = useRef<Text>(null);

  useEffect(() => {
    if (!ready || !animated || !characters.length) return;
    let cursor = 0;
    let timer: ReturnType<typeof setTimeout>;
    setReveal({ key, count: 0 });
    setPen({ x: 0, y: 21 });
    const write = () => {
      cursor += 1;
      setReveal({ key, count: cursor });
      if (cursor < characters.length) {
        const previous = characters[cursor - 1];
        const pause = /[,;:.!?]/.test(previous)
          ? 110
          : previous === ' '
            ? 48
            : 26 + (cursor % 4) * 6;
        timer = setTimeout(write, pause);
      }
    };
    timer = setTimeout(write, 80);
    return () => clearTimeout(timer);
  }, [key, animated, ready]);

  // Native Text supplies line geometry. On the web, a DOM Range locates the
  // final letter precisely, including wrapping and the actual bundled font.
  const positionNativePen = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (Platform.OS === 'web' || !writing) return;
    const line = event.nativeEvent.lines.at(-1);
    if (line) {
      const x = line.x + line.width,
        y = line.y + line.height * 0.8;
      setPen((previous) => (previous.x === x && previous.y === y ? previous : { x, y }));
    }
  };
  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || !writing || !prefix || !textRef.current) return;
    const node = textRef.current as unknown as HTMLElement;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let last: Node | null = null;
    while (walker.nextNode()) if (walker.currentNode.textContent) last = walker.currentNode;
    if (!last) return;
    const end = last.textContent!.replace(/\s+$/, '').length;
    if (!end) return;
    const range = document.createRange();
    range.setStart(last, end - 1);
    range.setEnd(last, end);
    const letter = range.getBoundingClientRect(),
      box = node.getBoundingClientRect();
    setPen({ x: letter.right - box.left + 1, y: letter.bottom - box.top - 5 });
  }, [prefix, width, writing]);

  const lettering = {
    fontFamily: handwritten ? F.handwriting : F.body,
    fontSize: handwritten ? 22 : 12,
    lineHeight: handwritten ? 27 : 22,
    color: handwritten ? '#535348' : C.muted,
  };
  return (
    <View
      testID={writing ? 'pencil-note-writing' : 'pencil-note-idle'}
      accessible
      accessibilityLabel={ready ? text : undefined}
      accessibilityLiveRegion="polite"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        minHeight: bare ? 27 : 44,
        backgroundColor: bare ? 'transparent' : '#f4ead6ee',
        borderRadius: bare ? 0 : 18,
        paddingVertical: bare ? 0 : 8,
        paddingLeft: bare ? 0 : 14,
        paddingRight: bare ? 26 : handwritten ? 36 : 14,
        marginBottom: bare ? 0 : 12,
      }}
    >
      {/* Reserve the final paragraph height so the tubes stay still while writing. */}
      <Text
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[lettering, { opacity: 0 }]}
      >
        {text}
      </Text>
      <Text
        ref={textRef}
        testID="hint-writing-text"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onTextLayout={positionNativePen}
        style={[
          lettering,
          {
            position: 'absolute',
            top: bare ? 0 : 8,
            left: bare ? 0 : 14,
            right: bare ? 26 : handwritten ? 36 : 14,
            textAlign: handwritten ? 'left' : 'center',
          },
        ]}
      >
        {prefix}
      </Text>
      {writing && (
        <View
          testID="hint-pencil"
          pointerEvents="none"
          accessible={false}
          style={{
            position: 'absolute',
            left: (bare ? 0 : 14) + pen.x,
            top: (bare ? 0 : 8) + pen.y - 35,
            width: 29,
            height: 37,
            transform: [{ rotate: `${Math.sin(count * 1.7) * 3}deg` }],
          }}
        >
          <Svg width="29" height="37" viewBox="0 0 29 37" accessible={false}>
            <Path
              d="M1 35 5 22 21 2 27 7 11 27Z"
              fill="#bf9b60"
              stroke="#806844"
              strokeWidth=".7"
            />
            <Path d="M5 22 1 35 11 27Z" fill="#e7cea0" />
            <Path d="M1 35 3 29 6 31Z" fill="#45453e" />
            <Path d="M6 23 22 3 24 5 8 25Z" fill="#e4c184" />
            <Path d="M10 27 26 7" stroke="#8b7049" strokeWidth="1" />
            <Path d="M21 2 23 0 29 5 27 7Z" fill="#7c806b" />
            <Path d="M.5 36 3 35.8" stroke="#6e6b5c" strokeOpacity=".35" strokeWidth=".6" />
          </Svg>
        </View>
      )}
    </View>
  );
}

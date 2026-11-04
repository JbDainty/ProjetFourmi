import React from 'react';
import Svg, { Path, G, Ellipse, Circle } from 'react-native-svg';
export type BotanicalIconName =
  | 'flask-outline'
  | 'book-outline'
  | 'map-outline'
  | 'bag-handle-outline'
  | 'options-outline'
  | 'leaf-outline'
  | 'sparkles-outline'
  | 'flower-outline'
  | 'water-outline'
  | 'arrow-undo-outline'
  | 'refresh-outline'
  | 'bulb-outline'
  | 'close-outline'
  | 'sunny-outline'
  | 'ribbon-outline'
  | 'lock-closed-outline'
  | 'checkmark-circle-outline'
  | 'ellipse-outline'
  | 'seed-outline'
  | 'eye-outline'
  | 'archive-outline'
  | 'arrow-forward-outline';
type Props = { name: BotanicalIconName; size?: number; color?: string };
function Leaf({
  x = 0,
  y = 0,
  angle = 0,
  scale = 1,
}: {
  x?: number;
  y?: number;
  angle?: number;
  scale?: number;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <Path d="M0 0 C-7-4-8-12-2-21 C3-16 9-7 0 0Z" fill="currentColor" fillOpacity=".1" />
      <Path d="M0 0 C-7-4-8-12-2-21 C3-16 9-7 0 0Z M0-1 Q-1-10-2-19 M-1-8-5-12 M-1-11 3-15" />
    </G>
  );
}
function BotanicalIconDrawing({ name, size = 20, color = '#293e34' }: Props) {
  let drawing: React.ReactNode;
  switch (name) {
    case 'leaf-outline':
      drawing = (
        <>
          <Leaf x={15} y={27} angle={33} />
          <Path d="M7 29 Q13 23 18 13" />
          <Path d="M17 23 Q24 24 27 18" />
          <Leaf x={23} y={23} angle={65} scale={0.34} />
        </>
      );
      break;
    case 'flask-outline':
      drawing = (
        <>
          <Path d="M12 4 Q16 3 20 4 M13 4 13 11 Q12 14 7 23 Q4 29 11 29 H23 Q28 29 25 23 L19 11 V4 M10 21 Q15 19 23 22" />
          <Path d="M15 27 Q14 21 18 17" />
          <Leaf x={16} y={25} angle={42} scale={0.37} />
          <Path d="M9 24 8 26" opacity=".5" />
        </>
      );
      break;
    case 'book-outline':
      drawing = (
        <>
          <Path d="M16 7 Q10 3 4 6 L5 26 Q11 23 16 27 Q22 23 28 25 L29 5 Q22 3 16 7 V27 M3 9 2 28 Q9 25 16 29 Q23 26 30 28" />
          <Leaf x={23} y={21} angle={-18} scale={0.53} />
          <Path d="M7 11 Q10 10 13 12 M7 15 12 16 M8 19 12 20" opacity=".6" />
        </>
      );
      break;
    case 'map-outline':
      drawing = (
        <>
          <Path d="M7 27 C5 20 18 23 15 16 S22 12 24 5" strokeDasharray="1.5 2.6" />
          <Circle cx="7" cy="27" r="2.5" />
          <Circle cx="16" cy="15" r="2.2" />
          <Leaf x={24} y={10} angle={35} scale={0.55} />
          <Leaf x={11} y={21} angle={-62} scale={0.42} />
          <Path d="M3 5 Q8 3 12 7 M27 21 29 26 24 29" opacity=".6" />
        </>
      );
      break;
    case 'bag-handle-outline':
      drawing = (
        <>
          <Path d="M10 10 Q17 14 23 10 M11 10 8 4 Q13 6 16 3 Q18 6 24 4 L22 11 C24 16 29 21 26 26 Q23 31 15 29 Q5 30 5 24 C5 18 10 15 11 10 M9 11 Q18 15 25 11" />
          <Leaf x={17} y={25} angle={25} scale={0.55} />
          <Path d="M11 6 Q16 8 21 6" opacity=".6" />
        </>
      );
      break;
    case 'options-outline':
      drawing = (
        <>
          <Path d="M5 7 Q15 5 27 8 M4 17 Q16 19 28 15 M5 27 Q18 23 27 26" />
          <Ellipse cx="12" cy="7" rx="3" ry="4.3" transform="rotate(24 12 7)" />
          <Ellipse cx="23" cy="16" rx="3" ry="4.3" transform="rotate(-18 23 16)" />
          <Ellipse cx="13" cy="25" rx="3" ry="4.3" transform="rotate(24 13 25)" />
          <Path d="M11 8 13 5 M22 18 24 14 M12 27 14 23" />
        </>
      );
      break;
    case 'arrow-undo-outline':
      drawing = (
        <>
          <Path d="M8 11 C28 1 33 28 12 27 Q6 27 5 23 M8 5 Q8 11 3 14 Q8 13 13 17" />
          <Leaf x={23} y={24} angle={55} scale={0.43} />
          <Path d="M20 8 Q23 10 25 14" opacity=".45" />
        </>
      );
      break;
    case 'refresh-outline':
      drawing = (
        <>
          <Path d="M25 10 C19-2 3 6 5 18 Q5 26 15 28 Q25 29 28 19 M25 4 26 11 19 10" />
          <Leaf x={7} y={20} angle={-35} scale={0.46} />
          <Leaf x={19} y={28} angle={74} scale={0.43} />
        </>
      );
      break;
    case 'bulb-outline':
    case 'eye-outline':
      drawing = (
        <>
          <Circle cx="13" cy="13" r="8.8" />
          <Path d="M19 20 Q22 24 28 29 M21 21 29 27" />
          <Leaf x={14} y={18} angle={22} scale={0.58} />
          <Path d="M6 9 4 7 M12 2 12 0 M22 8 25 6" opacity=".55" />
        </>
      );
      break;
    case 'close-outline':
      drawing = (
        <>
          <Path d="M6 6 Q16 17 27 27 M6 27 Q17 15 26 6" />
          <Leaf x={11} y={11} angle={-40} scale={0.29} />
          <Leaf x={24} y={24} angle={105} scale={0.25} />
        </>
      );
      break;
    case 'water-outline':
      drawing = (
        <>
          <Path d="M16 3 C15 10 5 16 7 23 C8 31 24 31 26 23 C28 16 20 11 16 3Z" />
          <Leaf x={17} y={26} angle={25} scale={0.58} />
          <Path d="M11 15 Q7 22 12 25" opacity=".55" />
        </>
      );
      break;
    case 'sparkles-outline':
    case 'seed-outline':
      drawing = (
        <>
          <Ellipse
            cx="12"
            cy="19"
            rx="5"
            ry="8"
            transform="rotate(-30 12 19)"
            fill="currentColor"
            fillOpacity=".1"
          />
          <Path d="M9 14 Q10 19 15 25" />
          <Ellipse cx="23" cy="10" rx="3.8" ry="6" transform="rotate(35 23 10)" />
          <Path d="M25 6 21 14 M3 6 3 10 M1 8 5 8 M26 23 26 27 M24 25 28 25" />
        </>
      );
      break;
    case 'sunny-outline':
    case 'flower-outline':
      drawing = (
        <>
          <Path d="M16 29 Q20 22 17 17" />
          <Leaf x={16} y={28} angle={-58} scale={0.52} />
          <Leaf x={19} y={25} angle={65} scale={0.4} />
          {Array.from({ length: 8 }, (_, i) => (
            <Ellipse
              key={i}
              cx="16"
              cy="6.5"
              rx="2.5"
              ry="5"
              transform={`rotate(${i * 45} 16 13)`}
              fill="currentColor"
              fillOpacity=".055"
            />
          ))}
          <Circle cx="16" cy="13" r="3.5" />
          <Circle cx="15" cy="12" r=".45" />
          <Circle cx="17" cy="14" r=".45" />
        </>
      );
      break;
    case 'ribbon-outline':
    case 'checkmark-circle-outline':
      drawing = (
        <>
          <Path d="M23 5 C9-1 0 13 8 24 Q16 33 27 21 M11 16 15 21 24 10" />
          <Leaf x={10} y={26} angle={-65} scale={0.4} />
          <Leaf x={26} y={13} angle={40} scale={0.4} />
          {name === 'ribbon-outline' && <Path d="M11 27 9 31 16 29 21 31 22 26" />}
        </>
      );
      break;
    case 'lock-closed-outline':
      drawing = (
        <>
          <Path d="M10 13 V9 C10-1 24 1 24 10 V13 M9 13 Q16 11 26 13 L25 27 Q18 30 8 27 L7 14Z" />
          <Leaf x={17} y={25} angle={25} scale={0.43} />
        </>
      );
      break;
    case 'ellipse-outline':
      drawing = (
        <>
          <Path d="M10 28 Q15 18 17 9" />
          <Ellipse
            cx="18"
            cy="10"
            rx="6"
            ry="9"
            transform="rotate(15 18 10)"
            fill="currentColor"
            fillOpacity=".055"
          />
          <Path d="M18 2 Q15 11 20 18 M16 23 Q22 24 26 20" />
        </>
      );
      break;
    case 'archive-outline':
      drawing = (
        <>
          <Path d="M6 12 5 28 Q17 30 27 27 L26 12 M4 7 Q16 4 28 7 V12 Q17 15 4 12Z M12 18 Q17 20 22 18" />
          <Leaf x={17} y={7} angle={-20} scale={0.35} />
        </>
      );
      break;
    case 'arrow-forward-outline':
      drawing = (
        <>
          <Path d="M4 18 Q16 13 27 17 M20 10 Q24 15 29 16 Q24 18 21 24" />
          <Leaf x={11} y={17} angle={-30} scale={0.5} />
        </>
      );
      break;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      color={color}
      accessible={false}
      accessibilityElementsHidden
      pointerEvents="none"
      testID="botanical-button-icon"
    >
      <G fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        {drawing}
      </G>
    </Svg>
  );
}
export const BotanicalIcon = React.memo(BotanicalIconDrawing);

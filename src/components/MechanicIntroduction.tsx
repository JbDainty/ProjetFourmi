import { RuleMark } from './RuleMark';
import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import Svg, { Path, Circle, Rect, G, Text as SvgText } from 'react-native-svg';
import { mechanicDetails, type Mechanic } from '../engine/mechanics';
import { Paper } from './Paper';
import { T, Button, C } from './ui';
export function MechanicIntroduction({
  mechanics,
  motion,
  onClose,
}: {
  mechanics: Mechanic[];
  motion: boolean;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible animationType={motion ? 'fade' : 'none'} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#233e31c9',
          padding: 18,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ScrollView
          style={{ maxHeight: '94%', width: '100%', maxWidth: 430 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <Paper
            testID="mechanic-introduction"
            accessibilityViewIsModal
            style={{ padding: 30, borderRadius: 28, backgroundColor: C.card, gap: 14 }}
          >
            <T style={{ letterSpacing: 2, fontSize: 11, textAlign: 'center' }}>
              UNE NOUVELLE PAGE DU SAVOIR
            </T>
            {mechanics.map((id) => (
              <View key={id} style={{ alignItems: 'center', gap: 10 }}>
                <T serif style={{ fontSize: 29, lineHeight: 32, textAlign: 'center' }}>
                  {mechanicDetails[id].name}
                </T>
                <Svg width="250" height="85" viewBox="0 0 250 85" accessible={false}>
                  <Path
                    d="M30 10V65Q30 80 45 80Q60 80 60 65V10M185 10V65Q185 80 200 80Q215 80 215 65V10"
                    fill="#e7e4cf"
                    stroke="#7a9278"
                    strokeWidth="1.4"
                  />
                  <Rect
                    x="34"
                    y={id === 'locks' ? 18 : 48}
                    width="22"
                    height={id === 'locks' ? 52 : 22}
                    rx="4"
                    fill="#7b9d91"
                  />
                  <Rect
                    x="189"
                    y={id === 'pipette' ? 58 : 28}
                    width="22"
                    height={id === 'pipette' ? 12 : 42}
                    rx="4"
                    fill={id === 'links' || id === 'filter' ? '#7b9d91' : '#d5b66b'}
                  />
                  <Path
                    d="M85 43Q125 20 165 43M153 33 165 43 153 50"
                    stroke="#8c9b69"
                    fill="none"
                    strokeWidth="2"
                  />
                  {id === 'locks' && (
                    <>
                      <G transform="translate(45 44)">
                        <RuleMark kind="brush" />
                      </G>
                      <G transform="translate(200 41)">
                        <RuleMark kind="lock" />
                      </G>
                    </>
                  )}
                  {id === 'mystery' && (
                    <>
                      <Rect x="34" y="48" width="22" height="22" fill="#a99eaf" />
                      <SvgText x="45" y="64" fontSize="17" textAnchor="middle" fill="#fff7df">
                        ?
                      </SvgText>
                    </>
                  )}
                  {id === 'capacity' && (
                    <>
                      <Rect x="29" y="8" width="34" height="22" fill={C.card} />
                      <Path d="M30 30H60M185 10H215" stroke="#7b9374" />
                      <SvgText x="45" y="43" textAnchor="middle" fontSize="15" fill="#5c7555">
                        2
                      </SvgText>
                      <SvgText x="200" y="23" textAnchor="middle" fontSize="15" fill="#5c7555">
                        3
                      </SvgText>
                    </>
                  )}
                  {id === 'filter' && (
                    <Circle
                      cx="200"
                      cy="10"
                      r="8"
                      fill="#7b9d91"
                      stroke="#f7e8bc"
                      strokeWidth="2"
                    />
                  )}
                  {id === 'crystal' && (
                    <G transform="translate(45 62)">
                      <RuleMark kind="crystal" />
                    </G>
                  )}
                  {id === 'conservation' && (
                    <G transform="translate(200 40)">
                      <RuleMark kind="conservation" />
                    </G>
                  )}
                  {id === 'pipette' && (
                    <SvgText x="162" y="65" textAnchor="middle" fontSize="16" fill="#5f7753">
                      1
                    </SvgText>
                  )}
                  <Circle cx="125" cy="39" r="17" fill="#f2e6c8" stroke="#a58e54" />
                  <G transform="translate(125 39)">
                    <RuleMark kind={id} />
                  </G>
                </Svg>
                <T style={{ fontSize: 17, lineHeight: 24, textAlign: 'center' }}>
                  {mechanicDetails[id].intro}
                </T>
              </View>
            ))}
            <Button icon="leaf-outline" onPress={onClose}>
              J’ai compris
            </Button>
          </Paper>
        </ScrollView>
      </View>
    </Modal>
  );
}

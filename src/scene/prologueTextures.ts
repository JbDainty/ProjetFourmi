import * as THREE from 'three';
/** Static imports keep every production texture in the native bundle and offline export. */
export const prologueTextureAssets = {
  leather: require('../../assets/prologue/leather.png'),
  paper: require('../../assets/prologue/paper.png'),
  edge: require('../../assets/prologue/edge.png'),
  wood: require('../../assets/prologue/wood.png'),
  glow: require('../../assets/prologue/glow.png'),
  floorFade: require('../../assets/prologue/floorFade.png'),
  leaf: require('../../assets/prologue/leaf.png'),
  page0: require('../../assets/prologue/page0.png'),
  page1: require('../../assets/prologue/page1.png'),
  page2: require('../../assets/prologue/page2.png'),
  page3: require('../../assets/prologue/page3.png'),
} as const;
export type PrologueTextures = {
  -readonly [K in keyof typeof prologueTextureAssets]: THREE.Texture;
};
export type OpeningSceneProps = { progress: number; onReady?: () => void; onLoading?: () => void };
export const disposePrologueTextures = (textures: PrologueTextures) =>
  Object.values(textures).forEach((t) => t.dispose());

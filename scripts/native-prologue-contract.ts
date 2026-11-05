import * as THREE from 'three';
import { textureFromPNG } from '../src/scene/pngTexture';
import { createNativeRenderer } from '../src/scene/nativeRenderer';
import { createPrologueScene } from '../src/scene/prologueScene';
import type { PrologueTextures } from '../src/scene/prologueTextures';
import type { ExpoWebGLRenderingContext } from 'expo-gl';

/** Exercises the native adapter against a real GL2 context; this is not a device test. */
export function start(canvas: HTMLCanvasElement, files: Record<string, number[]>) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
  })! as unknown as ExpoWebGLRenderingContext;
  if (!gl) throw Error('GL2 unavailable');
  let submitted = 0;
  (gl as any).supportsWebGL2 = true;
  gl.endFrameEXP = () => {
    gl.flush();
    submitted++;
  };
  const textures: Partial<PrologueTextures> = {};
  for (const [name, bytes] of Object.entries(files))
    textures[name as keyof PrologueTextures] = textureFromPNG(new Uint8Array(bytes));
  const renderer = createNativeRenderer(gl),
    world = createPrologueScene(renderer, textures as PrologueTextures);
  world.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
  return {
    advance(p: number) {
      const metrics = world.update(p);
      gl.endFrameEXP();
      return { ...metrics, submitted, error: gl.getError() };
    },
    dispose() {
      world.dispose();
      renderer.dispose();
    },
  };
}

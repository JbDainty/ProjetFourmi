import * as THREE from 'three';
import type { ExpoWebGLRenderingContext } from 'expo-gl';

/** Three receives a real Expo OpenGL ES 3 context, never a browser/WebView. */
export function createNativeRenderer(gl: ExpoWebGLRenderingContext) {
  if ((gl as unknown as { supportsWebGL2?: boolean }).supportsWebGL2 === false)
    throw Error('OpenGL ES 3 required');
  const canvas = {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    style: {},
    addEventListener() {},
    removeEventListener() {},
    getContext() {
      return context;
    },
  };
  const bound = new Map<PropertyKey, unknown>();
  const context = new Proxy(gl, {
    get(target, key) {
      if (key === 'canvas') return canvas;
      if (key === 'pixelStorei')
        return (pname: number, value: number | boolean) => {
          // Expo implements flip/alignment; Three's other unpack values are defaults.
          if (pname === target.UNPACK_FLIP_Y_WEBGL || pname === target.UNPACK_ALIGNMENT)
            target.pixelStorei(pname, value);
          else if (pname === target.UNPACK_PREMULTIPLY_ALPHA_WEBGL && Number(value) !== 0)
            throw Error('Premultiplied texture input unsupported');
          else if (pname !== target.UNPACK_COLORSPACE_CONVERSION_WEBGL && Number(value) !== 0)
            throw Error('Non-default texture unpack unsupported');
        };
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!bound.has(key)) bound.set(key, value.bind(target));
      return bound.get(key);
    },
    set(target, key, value) {
      return Reflect.set(target, key, value, target);
    },
  });
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as unknown as HTMLCanvasElement,
    context: context as unknown as WebGL2RenderingContext,
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    outputBufferType: THREE.UnsignedByteType,
  });
  renderer.setPixelRatio(1); // GLView's drawing buffer is already in physical pixels.
  return renderer;
}

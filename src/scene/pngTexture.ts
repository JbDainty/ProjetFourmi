import * as UPNG from 'upng-js';
import * as THREE from 'three';
/** Native-safe PNG decoding: no TextEncoder, Image, Canvas, Blob or DOM dependency. */
export function textureFromPNG(bytes: Uint8Array): THREE.DataTexture {
  const exact = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const decoded = UPNG.decode(exact);
  if (decoded.width > 2048 || decoded.height > 2048 || decoded.frames.length > 1)
    throw Error('Invalid prologue texture');
  const rgba = new Uint8Array(UPNG.toRGBA8(decoded)[0]);
  if (rgba.length !== decoded.width * decoded.height * 4) throw Error('Invalid prologue pixels');
  const texture = new THREE.DataTexture(
    rgba,
    decoded.width,
    decoded.height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

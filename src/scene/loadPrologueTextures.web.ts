import { Asset } from 'expo-asset';
import { textureFromPNG } from './pngTexture';
import { prologueTextureAssets, type PrologueTextures } from './prologueTextures';
/** The Web preview decodes the exact same packed RGBA textures as Android/iOS. */
export async function loadPrologueTextures(signal: AbortSignal): Promise<PrologueTextures> {
  const entries: [string, ReturnType<typeof textureFromPNG>][] = [];
  try {
    for (const [name, source] of Object.entries(prologueTextureAssets)) {
      const response = await fetch(Asset.fromModule(source).uri, { signal });
      if (!response.ok) throw Error('Prologue texture unavailable');
      entries.push([name, textureFromPNG(new Uint8Array(await response.arrayBuffer()))]);
    }
    const complete: Partial<PrologueTextures> = Object.fromEntries(entries);
    return complete as PrologueTextures;
  } catch (error) {
    entries.forEach(([, texture]) => texture.dispose());
    throw error;
  }
}

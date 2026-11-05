import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { textureFromPNG } from './pngTexture';
import { prologueTextureAssets, type PrologueTextures } from './prologueTextures';

export async function loadPrologueTextures(signal: AbortSignal): Promise<PrologueTextures> {
  const entries: [string, ReturnType<typeof textureFromPNG>][] = [];
  try {
    for (const [name, source] of Object.entries(prologueTextureAssets)) {
      if (signal.aborted) throw Error('Prologue cancelled');
      const asset = await Asset.fromModule(source).downloadAsync();
      if (signal.aborted) throw Error('Prologue cancelled');
      if (!asset.localUri) throw Error('Local prologue texture missing');
      const bytes = await new File(asset.localUri).bytes();
      if (signal.aborted) throw Error('Prologue cancelled');
      entries.push([name, textureFromPNG(bytes)]);
    }
    const complete: Partial<PrologueTextures> = Object.fromEntries(entries);
    return complete as PrologueTextures;
  } catch (error) {
    entries.forEach(([, texture]) => texture.dispose());
    throw error;
  }
}

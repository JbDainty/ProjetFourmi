import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, PixelRatio, View } from 'react-native';
import { prologueSurface } from '../scene/renderBudget';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { createNativeRenderer } from '../scene/nativeRenderer';
import { createPrologueScene } from '../scene/prologueScene';
import { createProloguePlayer } from '../scene/prologuePlayer';
import { loadPrologueTextures } from '../scene/loadPrologueTextures';
import {
  disposePrologueTextures,
  type OpeningSceneProps,
  type PrologueTextures,
} from '../scene/prologueTextures';
import { OpeningScene as Fallback } from './OpeningSceneFallback';

/** Realtime Android/iOS fallback if the local cinematic cannot be decoded. */
export function OpeningScene({ progress, progressSource, onReady, onLoading }: OpeningSceneProps) {
  const clock = useRef(progress);
  clock.current = progress;
  const callbacks = useRef({ onReady, onLoading, progressSource });
  callbacks.current = { onReady, onLoading, progressSource };
  const [size, setSize] = useState({ width: 0, height: 0 });
  const surface = prologueSurface(size.width, size.height, PixelRatio.get());
  const lifetime = useRef({ alive: true, generation: 0 });
  const resources = useRef<(() => void) | null>(null);
  const player = useRef<ReturnType<typeof createProloguePlayer> | null>(null);
  const active = useRef(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  const [failed, setFailed] = useState(false);
  useLayoutEffect(() => {
    lifetime.current.alive = true;
    return () => {
      lifetime.current.alive = false;
      lifetime.current.generation++;
      player.current?.dispose();
      resources.current?.();
      resources.current = null;
    };
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      active.current = state === 'active';
      player.current?.setActive(active.current);
    });
    return () => subscription.remove();
  }, []);
  const create = useCallback(async (gl: ExpoWebGLRenderingContext) => {
    const run = ++lifetime.current.generation;
    player.current?.dispose();
    resources.current?.();
    resources.current = null;
    if (!lifetime.current.alive) return;
    callbacks.current.onLoading?.();
    const abort = new AbortController();
    let maps: PrologueTextures | undefined,
      world: ReturnType<typeof createPrologueScene> | undefined,
      renderer: ReturnType<typeof createNativeRenderer> | undefined,
      cleaned = false;
    const clean = () => {
      if (cleaned) return;
      cleaned = true;
      abort.abort();
      player.current?.dispose();
      try {
        if (world) world.dispose();
        else if (maps) disposePrologueTextures(maps);
        renderer?.dispose();
      } catch {
        /* GLView may already have destroyed its surface. */
      }
    };
    resources.current = clean;
    try {
      maps = await loadPrologueTextures(abort.signal);
      if (!lifetime.current.alive || run !== lifetime.current.generation) {
        disposePrologueTextures(maps);
        return;
      }
      if (!active.current)
        await new Promise<void>((resolve, reject) => {
          const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
              cleanup();
              resolve();
            }
          });
          const cancelled = () => {
            cleanup();
            reject(Error('Prologue cancelled'));
          };
          const cleanup = () => {
            subscription.remove();
            abort.signal.removeEventListener('abort', cancelled);
          };
          abort.signal.addEventListener('abort', cancelled, { once: true });
          if (abort.signal.aborted) cancelled();
          else if (active.current) {
            cleanup();
            resolve();
          }
        });
      if (!lifetime.current.alive || run !== lifetime.current.generation) {
        disposePrologueTextures(maps);
        return;
      }
      renderer = createNativeRenderer(gl);
      world = createPrologueScene(renderer, maps);
      world.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      // Submit an actual first frame before starting the movie clock.
      world.update(callbacks.current.progressSource?.() ?? clock.current);
      gl.endFrameEXP();
      callbacks.current.onReady?.();
      let width = gl.drawingBufferWidth,
        height = gl.drawingBufferHeight;
      const draw = (p: number) => {
        if (!world || !lifetime.current.alive) return;
        if (width !== gl.drawingBufferWidth || height !== gl.drawingBufferHeight) {
          width = gl.drawingBufferWidth;
          height = gl.drawingBufferHeight;
          world.resize(width, height);
        }
        world.update(p);
        gl.endFrameEXP();
      };
      const playing = createProloguePlayer({
        request: (callback) => requestAnimationFrame(callback),
        cancel: (id) => cancelAnimationFrame(id),
        fps: 60,
        progress: () => callbacks.current.progressSource?.() ?? clock.current,
        draw,
        failed: () => {
          clean();
          if (lifetime.current.alive && run === lifetime.current.generation) setFailed(true);
        },
      });
      player.current = playing;
      playing.setActive(active.current);
    } catch (error) {
      clean();
      if (lifetime.current.alive && run === lifetime.current.generation) setFailed(true);
    }
  }, []);
  return (
    <View
      testID="opening-film-art"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      pointerEvents="none"
      onLayout={({ nativeEvent: { layout } }) =>
        setSize((previous) =>
          previous.width === layout.width && previous.height === layout.height
            ? previous
            : { width: layout.width, height: layout.height },
        )
      }
    >
      {failed ? (
        <Fallback
          progress={progress}
          progressSource={progressSource}
          onReady={() => callbacks.current.onReady?.()}
        />
      ) : size.width > 0 && size.height > 0 ? (
        <GLView
          testID="opening-native-gl"
          style={{
            width: surface.width,
            height: surface.height,
            transform: [{ scale: surface.scale }],
          }}
          msaaSamples={2}
          onContextCreate={create}
        />
      ) : null}
    </View>
  );
}

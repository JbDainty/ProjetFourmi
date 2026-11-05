import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createPrologueScene } from '../scene/prologueScene';
import { createProloguePlayer } from '../scene/prologuePlayer';
import { loadPrologueTextures } from '../scene/loadPrologueTextures.web';
import {
  disposePrologueTextures,
  type OpeningSceneProps,
  type PrologueTextures,
} from '../scene/prologueTextures';
import { OpeningScene as Fallback } from './OpeningSceneFallback';

/** Browser preview of the production mobile scene, with the same geometry/textures. */
export function OpeningScene({ progress, progressSource, onReady, onLoading }: OpeningSceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    clock = useRef(progress);
  clock.current = progress;
  const callbacks = useRef({ onReady, onLoading, progressSource });
  callbacks.current = { onReady, onLoading, progressSource };
  const [mode, setMode] = useState<'loading' | 'webgl' | 'fallback'>('loading');
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: element,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      setMode('fallback');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const abort = new AbortController();
    let disposed = false,
      maps: PrologueTextures | undefined,
      world: ReturnType<typeof createPrologueScene> | undefined,
      player: ReturnType<typeof createProloguePlayer> | undefined;
    const resize = () => {
      world?.resize(element.clientWidth || 390, element.clientHeight || 844);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const clean = () => {
      if (disposed) return;
      disposed = true;
      abort.abort();
      player?.dispose();
      observer.disconnect();
      document.removeEventListener('visibilitychange', visible);
      element.removeEventListener('webglcontextlost', lost);
      if (world) world.dispose();
      else if (maps) disposePrologueTextures(maps);
      renderer.dispose();
      renderer.forceContextLoss();
    };
    const fail = () => {
      clean();
      setMode('fallback');
    };
    const visible = () => player?.setActive(!document.hidden);
    const lost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    document.addEventListener('visibilitychange', visible);
    element.addEventListener('webglcontextlost', lost);
    callbacks.current.onLoading?.();
    void (async () => {
      try {
        maps = await loadPrologueTextures(abort.signal);
        if (disposed) {
          disposePrologueTextures(maps);
          return;
        }
        world = createPrologueScene(renderer, maps);
        resize();
        const draw = (p: number) => {
          const metrics = world?.update(p);
          element.dataset.progress = p.toFixed(3);
          element.dataset.pages = String(metrics?.pages);
          element.dataset.draws = String(renderer.info.render.calls);
        };
        draw(callbacks.current.progressSource?.() ?? clock.current);
        setMode('webgl');
        callbacks.current.onReady?.();
        player = createProloguePlayer({
          request: (callback) => requestAnimationFrame(callback),
          cancel: (id) => cancelAnimationFrame(id),
          fps: 60,
          progress: () => callbacks.current.progressSource?.() ?? clock.current,
          draw,
          failed: fail,
        });
        visible();
      } catch {
        if (!disposed) fail();
      }
    })();
    return clean;
  }, []);
  return React.createElement(
    'div',
    {
      'data-testid': 'opening-film-art',
      style: { position: 'relative', width: '100%', height: '100%' },
    },
    mode === 'fallback' && React.createElement(Fallback, { progress, progressSource, onReady }),
    React.createElement('canvas', {
      ref: canvas,
      'data-testid': 'opening-webgl-book',
      'data-renderer': mode,
      'aria-hidden': true,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: mode === 'fallback' ? 'none' : 'block',
      },
    }),
  );
}

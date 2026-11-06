import React, { useEffect, useRef, useState } from 'react';
import { AppState, Image, StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { OpeningSceneProps } from '../scene/prologueTextures';
import { prologueDuration } from '../animation/prologue';
import { OpeningScene as RealtimeFallback } from './OpeningSceneRealtime';

const film = require('../../assets/cinematic/herbier-opening.mp4');
const poster = require('../../assets/cinematic/opening-poster.jpg');

/** An offline silent movie; the existing audio coordinator alone owns the music. */
export function OpeningScene(props: OpeningSceneProps) {
  const callbacks = useRef(props);
  callbacks.current = props;
  const [failed, setFailed] = useState(false);
  const [decoded, setDecoded] = useState(false);
  const firstFrame = useRef<() => void>(() => {});
  const player = useVideoPlayer(null, (p) => {
    p.muted = true;
    p.volume = 0;
    p.loop = false;
    p.audioMixingMode = 'mixWithOthers';
    p.allowsExternalPlayback = false;
    p.showNowPlayingNotification = false;
  });
  const lifecycle = useRef({
    alive: true,
    failed: false,
    ready: false,
    decoded: false,
    active: AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  });
  useEffect(() => {
    const state = lifecycle.current;
    state.alive = true;
    let disposed = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const cancelTimeout = () => {
      clearTimeout(watchdog);
      watchdog = undefined;
    };
    const fail = () => {
      if (disposed || !state.alive || state.failed) return;
      state.failed = true;
      cancelTimeout();
      try {
        player.pause();
      } catch {}
      callbacks.current.onLoading?.();
      setFailed(true);
    };
    const watch = () => {
      cancelTimeout();
      if (state.active && (!state.ready || !state.decoded)) watchdog = setTimeout(fail, 12000);
    };
    const resume = () => {
      if (!state.alive || state.failed || !state.active || !state.ready) return;
      try {
        const position =
          ((callbacks.current.progressSource?.() ?? callbacks.current.progress) *
            prologueDuration) /
          1000;
        // A single seek on resume; never seek or update React on every video frame.
        if (Math.abs(player.currentTime - position) > 0.12) player.currentTime = position;
        player.play();
        if (state.decoded) callbacks.current.onReady?.();
      } catch {
        fail();
      }
    };
    firstFrame.current = () => {
      if (!state.alive || state.failed || state.decoded) return;
      state.decoded = true;
      setDecoded(true);
      if (state.ready) {
        cancelTimeout();
        if (state.active) callbacks.current.onReady?.();
      }
    };
    callbacks.current.onLoading?.();
    const status = player.addListener('statusChange', ({ status }) => {
      if (disposed || !state.alive || state.failed) return;
      if (status === 'error') fail();
      else if (status === 'readyToPlay') {
        state.ready = true;
        if (state.decoded) cancelTimeout();
        else watch();
        resume();
      } else if (status === 'loading') {
        state.ready = false;
        callbacks.current.onLoading?.();
        watch();
      }
    });
    const foreground = AppState.addEventListener('change', (next) => {
      state.active = next === 'active';
      if (!state.active) {
        cancelTimeout();
        try {
          player.pause();
        } catch {}
      } else {
        watch();
        resume();
      }
    });
    watch();
    // Async loading avoids a synchronous AVAsset read on the iOS UI thread.
    void player.replaceAsync(film).catch(fail);
    return () => {
      disposed = true;
      state.alive = false;
      cancelTimeout();
      foreground.remove();
      try {
        status.remove();
      } catch {}
      try {
        player.pause();
      } catch {}
      // useVideoPlayer releases the native player automatically at unmount.
    };
  }, [player]);
  if (failed) return <RealtimeFallback {...props} />;
  return (
    <View
      testID="opening-film-art"
      pointerEvents="none"
      style={{ flex: 1, backgroundColor: '#15231c', overflow: 'hidden' }}
    >
      <View testID="opening-cinematic-video" style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          nativeControls={false}
          playsInline
          contentFit="cover"
          surfaceType="textureView"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          onFirstFrameRender={() => firstFrame.current()}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {!decoded && (
        <Image
          testID="opening-cinematic-poster"
          source={poster}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 210,
          backgroundColor: '#0b171c24',
        }}
      />
    </View>
  );
}

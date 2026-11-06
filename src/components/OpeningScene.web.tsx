import React, { useEffect, useRef, useState } from 'react';
import { AppState, Image, StyleSheet, View } from 'react-native';
import { prologueDuration } from '../animation/prologue';
import type { OpeningSceneProps } from '../scene/prologueTextures';
import { OpeningScene as RealtimeFallback } from './OpeningSceneRealtime';

const film: string = require('../../assets/cinematic/herbier-opening.mp4');
const poster = require('../../assets/cinematic/opening-poster.jpg');

/** HTML media playback keeps browser play-promise cancellation under our control. */
export function OpeningScene(props: OpeningSceneProps) {
  const callbacks = useRef(props);
  callbacks.current = props;
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [decoded, setDecoded] = useState(false);
  const actions = useRef({ ready: () => {}, waiting: () => {}, error: () => {} });
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    let alive = true,
      failed = false;
    let active = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
      clearTimeout(watchdog);
      watchdog = undefined;
    };
    const fail = () => {
      if (!alive || failed) return;
      failed = true;
      cancel();
      media.pause();
      callbacks.current.onLoading?.();
      setFailed(true);
    };
    const watch = () => {
      cancel();
      if (active) watchdog = setTimeout(fail, 12000);
    };
    const start = () => {
      if (!alive || failed || !active || media.readyState < 2) return;
      const position =
        ((callbacks.current.progressSource?.() ?? callbacks.current.progress) * prologueDuration) /
        1000;
      if (Math.abs(media.currentTime - position) > 0.12) media.currentTime = position;
      void media
        .play()
        .then(() => {
          if (!alive || failed || !active) return;
          cancel();
          callbacks.current.onReady?.();
        })
        .catch((error: DOMException) => {
          // Skipping or replacing an intro legitimately cancels a pending play request.
          if (alive && error.name !== 'AbortError') fail();
        });
    };
    media.muted = true;
    media.volume = 0;
    actions.current = {
      ready: () => {
        if (alive) {
          setDecoded(true);
          start();
        }
      },
      waiting: () => {
        if (alive && !failed) {
          callbacks.current.onLoading?.();
          watch();
        }
      },
      error: fail,
    };
    callbacks.current.onLoading?.();
    const subscription = AppState.addEventListener('change', (state) => {
      active = state === 'active';
      if (active) {
        watch();
        start();
      } else {
        cancel();
        media.pause();
      }
    });
    watch();
    // loadeddata may already have arrived from the HTTP cache before effects mount.
    if (media.error) fail();
    else if (media.readyState >= 2) actions.current.ready();
    return () => {
      alive = false;
      cancel();
      subscription.remove();
      media.pause();
      media.removeAttribute('src');
      media.load();
    };
  }, []);
  if (failed) return <RealtimeFallback {...props} />;
  return (
    <View
      testID="opening-film-art"
      pointerEvents="none"
      style={{ flex: 1, backgroundColor: '#15231c', overflow: 'hidden' }}
    >
      <View testID="opening-cinematic-video" style={StyleSheet.absoluteFill}>
        <video
          ref={video}
          src={film}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onLoadedData={() => actions.current.ready()}
          onCanPlay={() => actions.current.ready()}
          onWaiting={() => actions.current.waiting()}
          onError={() => actions.current.error()}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
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

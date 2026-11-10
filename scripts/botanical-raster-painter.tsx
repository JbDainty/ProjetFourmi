import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Botanical } from '../src/components/Botanical';

/** Build-time cache of the existing illustration, not a mobile Canvas renderer. */
export async function paintBotanical(index: number, stage: number) {
  const resolution = index < 20 ? 540 : 360;
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() =>
      root.render(<Botanical index={index} stage={stage} size={resolution} labels={false} />),
    );
    const svg = host.querySelector('svg')!;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', String(resolution));
    svg.setAttribute('height', String(Math.ceil(resolution * 1.36)));
    const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = Math.ceil(resolution * 1.36);
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      return canvas.toDataURL(index < 20 ? 'image/png' : 'image/webp', 0.91);
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    flushSync(() => root.unmount());
    host.remove();
  }
}

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const movie = 'assets/cinematic/herbier-opening.mp4';
const metadata = JSON.parse(readFileSync('assets/cinematic/manifest.json', 'utf8'));
const bytes = readFileSync(movie);
assert.equal(createHash('sha256').update(bytes).digest('hex'), metadata.sha256);
assert.equal(bytes.length, metadata.bytes);
assert.ok(bytes.length < 20 * 1024 * 1024, 'The intro should remain a small embedded asset.');
const probe = JSON.parse(
  execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', movie], {
    encoding: 'utf8',
  }),
);
assert.equal(probe.streams.length, 1, 'The movie must not add a competing audio track.');
const video = probe.streams[0];
assert.equal(video.codec_name, 'h264');
assert.equal(video.profile, 'High');
assert.equal(video.level, 31);
assert.equal(video.width, 720);
assert.equal(video.height, 1280);
assert.equal(video.pix_fmt, 'yuv420p');
assert.equal(video.avg_frame_rate, '24/1');
assert.equal(Number(video.nb_frames), metadata.encoded_frames);
assert.ok(Number(video.nb_frames) >= 354 && Number(video.nb_frames) <= 356);
assert.ok(Number(probe.format.duration) > 14.7 && Number(probe.format.duration) < 15);
assert.ok(
  !JSON.stringify(probe).includes('DEVELOPMENT'),
  'A decoder test fixture must never be published.',
);
const hashes = execFileSync('ffmpeg', ['-v', 'error', '-i', movie, '-an', '-f', 'framemd5', '-'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter((x) => x && !x.startsWith('#'))
  .map((x) => x.split(',').at(-1).trim());
assert.ok(
  new Set(hashes).size > 330,
  'The final film must contain the rendered animation, not a still-image fixture.',
);
console.log(
  `Film verified: ${video.width}×${video.height}, ${video.nb_frames} decoded frames, ${new Set(hashes).size} distinct frames, H.264 High 3.1, no audio, ${(bytes.length / 1024 / 1024).toFixed(1)} MiB, SHA256 matches manifest.`,
);

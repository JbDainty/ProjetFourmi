import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readGit = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const remote = readGit('remote', 'get-url', 'origin');
const match = remote.match(
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/,
);
if (!match)
  throw new Error('Le déploiement nécessite une origine HTTPS GitHub sans identifiants intégrés.');
const env = { ...process.env, EXPO_PUBLIC_BASE_PATH: `/${match[2]}` };
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, env, stdio: 'inherit' });
// Build before touching the published branch. Authentication stays with native Git.
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build:web']);
const branchExists = !!readGit('ls-remote', '--heads', 'origin', 'refs/heads/gh-pages');
const stage = mkdtempSync(join(tmpdir(), 'color-world-pages-'));
try {
  if (branchExists)
    run('git', ['clone', '--depth', '1', '--branch', 'gh-pages', '--single-branch', remote, stage]);
  else {
    run('git', ['init', '--initial-branch=gh-pages', stage]);
    run('git', ['remote', 'add', 'origin', remote], stage);
  }
  for (const field of ['user.name', 'user.email'])
    run('git', ['config', field, readGit('config', field)], stage);
  // Retain hashed assets from earlier builds: already-open games can still request
  // their files while the new version installs. The current export overwrites
  // entry points and the service worker, which only precaches its own manifest.
  cpSync(join(root, 'dist'), stage, { recursive: true });
  run('git', ['add', '--all'], stage);
  const changes = execFileSync('git', ['status', '--porcelain'], {
    cwd: stage,
    encoding: 'utf8',
  }).trim();
  if (changes) {
    run('git', ['commit', '-m', 'Publish COLOR WORLD web test build'], stage);
    run('git', ['push', 'origin', 'HEAD:refs/heads/gh-pages'], stage);
  }
  console.log(
    `Site prêt sur la branche gh-pages. Adresse après activation GitHub Pages : https://${match[1].toLowerCase()}.github.io/${match[2]}/`,
  );
  console.log('Réglages : Settings > Pages > Deploy from a branch > gh-pages > / (root).');
} finally {
  rmSync(stage, { recursive: true, force: true });
}

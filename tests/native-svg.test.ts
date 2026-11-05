import { beforeAll, expect, it, vi } from 'vitest';
import { build } from 'esbuild';
import React from 'react';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';

let extractGradient: (props: object, parent: object) => { gradient: number[] };
beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const compiled = await build({
    stdin: {
      contents: `export { default } from ${JSON.stringify(require.resolve('react-native-svg/lib/module/lib/extract/extractGradient.js'))};`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react'],
    plugins: [
      {
        name: 'native-color-only',
        setup(builder) {
          builder.onResolve({ filter: /^react-native$/ }, () => ({
            path: 'native-color',
            namespace: 'test-color',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'test-color' }, () => ({
            contents: 'export const processColor = () => 0xff123456;',
            loader: 'js',
          }));
        },
      },
    ],
  });
  const module = { exports: {} as { default: typeof extractGradient } };
  new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(
    require,
    module,
    module.exports,
  );
  extractGradient = module.exports.default;
});

it('every literal gradient stop in the game is accepted by the actual native SVG parser', () => {
  const offsets: { file: string; value: string }[] = [];
  for (const folder of ['src/components', 'app']) {
    for (const name of readdirSync(folder).filter((file) => file.endsWith('.tsx'))) {
      const file = `${folder}/${name}`;
      const source = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node) => {
        if (
          (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
          node.tagName.getText(source) === 'Stop'
        ) {
          for (const attr of node.attributes.properties) {
            if (
              ts.isJsxAttribute(attr) &&
              attr.name.getText(source) === 'offset' &&
              attr.initializer &&
              ts.isStringLiteral(attr.initializer)
            )
              offsets.push({ file, value: attr.initializer.text });
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  }
  expect(offsets.length).toBeGreaterThan(50);
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    for (const { file, value } of offsets) {
      const parsed = extractGradient(
        {
          id: 'native-check',
          children: [React.createElement('stop', { offset: value, stopColor: '#123456' })],
        },
        {},
      );
      expect(warning.mock.calls, `${file}: offset=${value}`).toEqual([]);
      expect(parsed.gradient[0], `${file}: offset=${value}`).toBeCloseTo(
        value.endsWith('%') ? parseFloat(value) / 100 : Number(value),
      );
    }
  } finally {
    warning.mockRestore();
  }
});

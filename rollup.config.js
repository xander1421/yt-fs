import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';
const isFirefox = process.env.TARGET === 'firefox';
const outDir = isFirefox ? 'dist-firefox' : 'dist';

const tsPlugin = () =>
  typescript({
    tsconfig: './tsconfig.json',
    outputToFilesystem: false,
    compilerOptions: { outDir: `./${outDir}` },
  });

const terserPlugins = isProduction
  ? [terser({ compress: { drop_console: true, drop_debugger: true }, mangle: { properties: false } })]
  : [];

// One IIFE bundle per entry point.
const script = (name, extraPlugins = []) => ({
  input: `src/${name}.ts`,
  output: { file: `${outDir}/${name}.js`, format: 'iife', sourcemap: !isProduction },
  plugins: [tsPlugin(), ...extraPlugins, ...terserPlugins],
});

export default [
  // Content script also carries the copy step for static assets + pages.
  script('content', [
    copy({
      targets: [
        {
          src: isFirefox ? 'src/manifest.firefox.json' : 'src/manifest.json',
          dest: outDir,
          rename: 'manifest.json',
        },
        { src: 'src/styles.css', dest: outDir },
        { src: 'src/popup.html', dest: outDir },
        { src: 'src/options.html', dest: outDir },
        // Only the icons the manifest references — not dev scratch (alpha_test.png, *.svg).
        { src: 'src/icons/32.png', dest: `${outDir}/icons` },
        { src: 'src/icons/48.png', dest: `${outDir}/icons` },
        { src: 'src/icons/128.png', dest: `${outDir}/icons` },
        ...(isProduction
          ? []
          : [
              { src: 'README.md', dest: outDir },
              { src: 'CHANGELOG.md', dest: outDir },
            ]),
      ],
    }),
  ]),
  script('background'),
  script('popup'),
  script('options'),
];

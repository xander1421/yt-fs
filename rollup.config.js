import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';
const isFirefox = process.env.TARGET === 'firefox';

export default [
  // Content script build
  {
    input: 'src/content.ts',
    output: {
      file: isFirefox ? 'dist-firefox/content.js' : 'dist/content.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        outputToFilesystem: false,
        compilerOptions: {
          outDir: isFirefox ? './dist-firefox' : './dist'
        }
      }),
      copy({
        targets: [
          { 
            src: isFirefox ? 'src/manifest.firefox.json' : 'src/manifest.json', 
            dest: isFirefox ? 'dist-firefox' : 'dist',
            rename: 'manifest.json'
          },
          { src: 'src/styles.css', dest: isFirefox ? 'dist-firefox' : 'dist' },
          { src: 'src/icons', dest: isFirefox ? 'dist-firefox' : 'dist' },
          // Only include docs in development builds
          ...(isProduction ? [] : [
            { src: 'README.md', dest: isFirefox ? 'dist-firefox' : 'dist' },
            { src: 'CHANGELOG.md', dest: isFirefox ? 'dist-firefox' : 'dist' }
          ])
        ]
      }),
      ...(isProduction ? [
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          mangle: {
            properties: false
          }
        })
      ] : [])
    ]
  },
  // Background script build
  {
    input: 'src/background.ts',
    output: {
      file: isFirefox ? 'dist-firefox/background.js' : 'dist/background.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        outputToFilesystem: false,
        compilerOptions: {
          outDir: isFirefox ? './dist-firefox' : './dist'
        }
      }),
      ...(isProduction ? [
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          mangle: {
            properties: false
          }
        })
      ] : [])
    ]
  }
];
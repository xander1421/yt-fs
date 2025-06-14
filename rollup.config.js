import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // Content script build
  {
    input: 'src/content.ts',
    output: {
      file: 'dist/content.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      copy({
        targets: [
          { src: 'src/manifest.json', dest: 'dist' },
          { src: 'src/styles.css', dest: 'dist' },
          { src: 'src/icons', dest: 'dist' },
          // Only include docs in development builds
          ...(isProduction ? [] : [
            { src: 'README.md', dest: 'dist' },
            { src: 'CHANGELOG.md', dest: 'dist' }
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
      file: 'dist/background.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
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
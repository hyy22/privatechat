import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import vue from '@vitejs/plugin-vue';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import builtins from 'rollup-plugin-node-builtins';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  if (command === 'serve') {
    return {
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:9000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            ws: true,
          },
        },
      },
      plugins: [vue(), nodePolyfills()],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
    };
  }
  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'safari-pinned-tab.svg',
        ],
        manifest: {
          name: 'PRIVATE CHAT',
          short_name: 'PRICHAT',
          description: 'a private and safe im that can host by yourself',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        crypto: 'crypto-browserify',
        util: 'rollup-plugin-node-polyfills/polyfills/util',
        sys: 'util',
        events: 'rollup-plugin-node-polyfills/polyfills/events',
        stream: 'rollup-plugin-node-polyfills/polyfills/stream',
        path: 'rollup-plugin-node-polyfills/polyfills/path',
        querystring: 'rollup-plugin-node-polyfills/polyfills/qs',
        punycode: 'rollup-plugin-node-polyfills/polyfills/punycode',
        url: 'rollup-plugin-node-polyfills/polyfills/url',
        http: 'rollup-plugin-node-polyfills/polyfills/http',
        https: 'rollup-plugin-node-polyfills/polyfills/http',
        os: 'rollup-plugin-node-polyfills/polyfills/os',
        assert: 'rollup-plugin-node-polyfills/polyfills/assert',
        constants: 'rollup-plugin-node-polyfills/polyfills/constants',
        _stream_duplex:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
        _stream_passthrough:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
        _stream_readable:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
        _stream_writable:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
        _stream_transform:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
        timers: 'rollup-plugin-node-polyfills/polyfills/timers',
        console: 'rollup-plugin-node-polyfills/polyfills/console',
        vm: 'rollup-plugin-node-polyfills/polyfills/vm',
        zlib: 'rollup-plugin-node-polyfills/polyfills/zlib',
        tty: 'rollup-plugin-node-polyfills/polyfills/tty',
        domain: 'rollup-plugin-node-polyfills/polyfills/domain',
        buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
        supported: { bigint: true },
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true,
          }),
          NodeModulesPolyfillPlugin(),
        ],
      },
    },
    build: {
      target: 'es2020',
      rollupOptions: {
        plugins: [
          // Enable rollup polyfills plugin
          // used during production bundling
          builtins(),
          rollupNodePolyFill(),
        ],
      },
    },
  };
});

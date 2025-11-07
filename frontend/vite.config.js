import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import eslint from 'vite-plugin-eslint'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    eslint({
      cache: false,
      include: ['src/**/*.vue', 'src/**/*.js'],
      exclude: ['node_modules', 'dist'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'ImmunizeMe - Healthcare Management System',
        short_name: 'ImmunizeMe',
        description: 'Healthcare and vaccination management system',
        theme_color: '#0d6efd',
        background_color: '#0d6efd',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\.(vue|ts|jsx|tsx)$/], // Don't fallback for API calls or source files
        runtimeCaching: [
          {
            // Cache route modules served by Vite dev server
            // Use StaleWhileRevalidate to always try network first in dev
            urlPattern: ({ url }) => {
              return url.pathname.startsWith('/src/') && 
                     /\.(js|ts|vue|css|jsx|tsx)$/.test(url.pathname)
            },
            handler: 'NetworkFirst', // Changed from CacheFirst to NetworkFirst
            options: {
              cacheName: 'dev-src-modules',
              networkTimeoutSeconds: 3, // Quick fallback to cache if network slow
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
              cacheableResponse: { statuses: [0, 200] },
              // Custom plugin to strip Vite's timestamp query params before caching
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }) => {
                    const url = new URL(request.url)
                    // Remove Vite's timestamp parameter (t=xxx)
                    url.searchParams.delete('t')
                    url.searchParams.delete('import')
                    return url.toString()
                  }
                }
              ]
            }
          },
          {
            // Cache Vite HMR client and helper modules best-effort (dev only)
            urlPattern: ({ url }) => {
              return url.pathname.startsWith('/@vite/') || 
                     url.pathname.startsWith('/@fs/') ||
                     url.pathname.startsWith('/@id/')
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'vite-internals',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Cache compiled assets (chunks, CSS) from /assets/ in dev and prod
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'compiled-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Cache API requests to backend while allowing fresh network when available
            urlPattern: /^\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'backend-api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Queue POST requests to /api when offline and replay later
            urlPattern: /^\/api\/.*$/,
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: {
                name: 'api-post-queue',
                options: {
                  maxRetentionTime: 24 * 60 // minutes
                }
              }
            }
          },
          {
            // Queue PUT requests to /api when offline and replay later
            urlPattern: /^\/api\/.*$/,
            handler: 'NetworkOnly',
            method: 'PUT',
            options: {
              backgroundSync: {
                name: 'api-put-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          },
          {
            // Queue DELETE requests to /api when offline and replay later
            urlPattern: /^\/api\/.*$/,
            handler: 'NetworkOnly',
            method: 'DELETE',
            options: {
              backgroundSync: {
                name: 'api-delete-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        // In dev, VitePWA uses a temporary dev-dist folder which usually has no assets
        // (only the generated sw/workbox files, which are ignored by Workbox). This
        // triggers a harmless Workbox warning about glob patterns not matching files.
        // Suppress that noise to keep the console clean during local dev.
        suppressWarnings: true
      }
    })
  ],
  base: '/', // Ensure assets are loaded from root
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 2000, // Increase limit to 2MB (default is 500KB)
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

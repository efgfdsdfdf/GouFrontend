import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'favicon.png'],
                manifest: {
                    name: 'GoUnion',
                    short_name: 'GoUnion',
                    description: 'The elite campus collective',
                    theme_color: '#030303',
                    background_color: '#030303',
                    display: 'standalone',
                    orientation: 'portrait',
                    start_url: '/login',
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable'
                        }
                    ]
                },
                workbox: {
                    clientsClaim: true,
                    skipWaiting: true,
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                    navigateFallback: '/index.html',
                    navigateFallbackAllowlist: [/^(?!\/__).*/],
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/ui-avatars\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'ui-avatars',
                                expiration: {
                                    maxEntries: 100,
                                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        },
                        {
                            urlPattern: /^https:\/\/grainy-gradients\.vercel\.app\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'external-assets',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 30
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        }
                    ]
                }
            })
        ],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});

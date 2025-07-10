/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */
// Service Worker 文件 (sw.js) - 缓存优先策略 + 版本控制
const CACHE_VERSION = '1.0.1'; // 版本号，每次更新时修改这里
const CACHE_NAME = `my-site-cache-v${CACHE_VERSION}`;
const urlsToCache = [
    '/',
    'index.html',
    'index.js'
];

// 安装Service Worker
self.addEventListener('install', event => {
    console.log('SW: Installing version', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('已打开缓存:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // 强制激活新的 Service Worker
                return self.skipWaiting();
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', event => {
    console.log('SW: Activating version', CACHE_VERSION);
    // 删除旧缓存
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return null; // 修复ESLint警告
                })
            );
        }).then(() => {
            // 立即控制所有客户端
            return self.clients.claim();
        })
    );
});

// 拦截网络请求 - 缓存优先策略 + 后台更新
self.addEventListener('fetch', event => {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // 如果有缓存，立即返回缓存内容
                if (cachedResponse) {
                    console.log('从缓存中获取:', event.request.url);

                    // 后台检查更新（stale-while-revalidate 策略）
                    fetch(event.request)
                        .then(fetchResponse => {
                            // 如果网络请求成功，更新缓存
                            if (fetchResponse && fetchResponse.status === 200) {
                                const responseClone = fetchResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, responseClone);
                                        console.log('后台更新缓存:', event.request.url);
                                    });
                            }
                        })
                        .catch(() => {
                            // 网络请求失败，继续使用缓存
                            console.log('网络请求失败，使用缓存:', event.request.url);
                        });

                    return cachedResponse;
                }

                // 如果没有缓存，从网络获取
                return fetch(event.request)
                    .then(fetchResponse => {
                        // 检查响应是否有效
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }

                        // 克隆响应用于缓存
                        const responseToCache = fetchResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                console.log('首次缓存:', event.request.url);
                            });

                        return fetchResponse;
                    });
            })
    );
});

// 监听来自主线程的消息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CHECK_UPDATE') {
        // 通知客户端当前版本
        event.ports[0].postMessage({
            type: 'VERSION_INFO',
            version: CACHE_VERSION
        });
    }
});

/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */
// Service Worker 文件 (sw.js)
const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    'styles.css',
    'app.js'
];

// 安装Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('已打开缓存');
                return cache.addAll(urlsToCache);
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', event => {
    // 删除旧缓存
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果缓存中有匹配的资源，则返回缓存
                if (response) {
                    console.log('从缓存中获取:', event.request.url);
                    return response;
                }
                
                // 否则从网络获取
                return fetch(event.request).then(response => {
                    // 检查是否收到有效响应
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // 克隆响应（因为响应是流，只能使用一次）
                    const responseToCache = response.clone();
                    
                    // 将新资源添加到缓存
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
    );
});
// 动态渲染页面标题和内容
window.onload = function() {
    // 动态设置页面标题
    const pageTitle = "Service Worker 演示 - 缓存优先策略";
    document.title = pageTitle;

    // 动态设置主标题内容
    const mainTitle = "Service Worker 演示 (JS渲染) v2";
    document.getElementById("content").innerHTML = mainTitle;

    // 检查Service Worker更新
    checkForUpdates();

    // 显示版本信息
    displayVersionInfo();
};

// 检查Service Worker更新
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            // 检查更新
            registration.update();

            // 监听新的Service Worker安装
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 有新版本可用
                        showUpdateNotification();
                    }
                });
            });
        });

        // 监听Service Worker控制权变更
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Service Worker已更新，刷新页面
            window.location.reload();
        });
    }
}

// 显示更新通知
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    notification.innerHTML = `
        <div>发现新版本！</div>
        <button onclick="updateServiceWorker()" style="
            background: white;
            color: #4CAF50;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
        ">立即更新</button>
        <button onclick="this.parentElement.remove()" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 5px 10px;
            border-radius: 4px;
            margin: 10px 0 0 10px;
            cursor: pointer;
        ">稍后</button>
    `;
    document.body.appendChild(notification);
}

// 更新Service Worker
function updateServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            if (registration.waiting) {
                // 发送消息给等待中的Service Worker
                registration.waiting.postMessage({type: 'SKIP_WAITING'});
            }
        });
    }
}

// 显示版本信息
function displayVersionInfo() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            // 创建消息通道
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = function(event) {
                if (event.data.type === 'VERSION_INFO') {
                    console.log('当前Service Worker版本:', event.data.version);
                    // 可以在页面上显示版本信息
                    const versionElement = document.createElement('div');
                    versionElement.style.cssText = `
                        position: fixed;
                        bottom: 20px;
                        left: 20px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-family: monospace;
                    `;
                    versionElement.textContent = `版本: ${event.data.version}`;
                    document.body.appendChild(versionElement);
                }
            };

            // 发送消息请求版本信息
            registration.active.postMessage({
                type: 'CHECK_UPDATE'
            }, [messageChannel.port2]);
        });
    }
}



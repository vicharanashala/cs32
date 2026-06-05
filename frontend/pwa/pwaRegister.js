import toast from 'react-hot-toast';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const register = () => {
      const swUrl = '/sw.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
          
          // Request permission for push notifications if needed
          if ('Notification' in window && Notification.permission === 'default') {
            console.log('[PWA] Push notification support available.');
          }

          // Monitor for updates and notify/reload to apply changes
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New service worker version installed. Refreshing cache.');
                  toast.success('App updated! Reloading to apply changes...', {
                    id: 'pwa-update-toast',
                    duration: 3000,
                    position: 'top-right',
                    icon: '🔄'
                  });
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }
  }
}

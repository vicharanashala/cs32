export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('utm_source=pwa');

  if (!isStandalone) {
    console.log('[PWA] Running in standard browser. Ensuring service worker is unregistered to prevent cache conflicts.');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().then((success) => {
            if (success) console.log('[PWA] Unregistered service worker:', registration.scope);
          });
        }
      });
    }
    return;
  }

  if ('serviceWorker' in navigator) {
    const register = () => {
      const swUrl = '/sw.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully in PWA mode with scope:', registration.scope);
          
          if ('Notification' in window && Notification.permission === 'default') {
            console.log('[PWA] Push notification support available.');
          }
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

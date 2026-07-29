let deferredPrompt = null;

export function initPWA(onInstallAvailable, onOnlineStatusChange) {
  if (typeof window === 'undefined') return;

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA ServiceWorker registered with scope:', reg.scope))
        .catch((err) => console.log('PWA ServiceWorker registration failed:', err));
    });
  }

  // Before Install Prompt Listener
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (onInstallAvailable) onInstallAvailable(true);
  });

  // Online / Offline Listeners
  window.addEventListener('online', () => onOnlineStatusChange && onOnlineStatusChange(true));
  window.addEventListener('offline', () => onOnlineStatusChange && onOnlineStatusChange(false));
}

export async function promptInstallPWA() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

import { useEffect, useState } from 'react';
import Button from './Button';

export default function PwaControls() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    function captureInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) setWaitingWorker(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaitingWorker(worker);
          });
        });
      }).catch(() => {
        // The app remains usable without the optional service worker.
      });
    }
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  function update() {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  }

  return <div className="pwa-controls">
    {installPrompt && <Button variant="ghost" onClick={install}>Install app</Button>}
    {waitingWorker && <Button variant="ghost" onClick={update}>Update available</Button>}
  </div>;
}

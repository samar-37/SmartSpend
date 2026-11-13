// Extra PWA helpers: trigger prompt etc.
export function listenForInstallPrompt(){
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    // show UI to allow installing
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install app';
    installBtn.style.position = 'fixed'; installBtn.style.right='12px'; installBtn.style.bottom='12px';
    document.body.appendChild(installBtn);
    installBtn.addEventListener('click', async ()=>{
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      document.body.removeChild(installBtn);
      deferredPrompt = null;
    });
  });
}
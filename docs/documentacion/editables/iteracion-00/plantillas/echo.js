import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let client;

// Instancia única: no crear otra conexión en cada render de React.
export function getEcho() {
  if (!client) {
    window.Pusher = Pusher;
    const tls = import.meta.env.VITE_REVERB_SCHEME === 'https';
    client = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT),
      forceTLS: tls,
      enabledTransports: tls ? ['wss'] : ['ws'],
    });
  }
  return client;
}

export function disconnectEcho() {
  client?.disconnect();
  client = undefined;
}

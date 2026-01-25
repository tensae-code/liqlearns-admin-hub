const defaultStunServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export const getIceServers = (): RTCIceServer[] => {
  const rawUrls = import.meta.env.VITE_TURN_URLS;
  const urls = rawUrls
    ? rawUrls.split(',').map((url) => url.trim()).filter(Boolean)
    : [];

  if (urls.length === 0) {
    return defaultStunServers;
  }

  const username = import.meta.env.VITE_TURN_USERNAME;
  const credential = import.meta.env.VITE_TURN_CREDENTIAL;

  const turnServer: RTCIceServer = {
    urls,
    ...(username ? { username } : {}),
    ...(credential ? { credential } : {}),
  };

  return [...defaultStunServers, turnServer];
};

'use client';

import { useEffect, useState } from 'react';

type PermState = 'unsupported' | 'denied' | 'granted' | 'default' | 'loading';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function PushToggle() {
  const [state, setState] = useState<PermState>('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported'); return;
    }
    setState(Notification.permission as PermState);
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    );
  }, []);

  const enable = async () => {
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState('denied'); setWorking(false); return; }
      setState('granted');

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setSubscribed(true);
    } catch (e) {
      console.error(e);
    }
    setWorking(false);
  };

  const disable = async () => {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) {
      console.error(e);
    }
    setWorking(false);
  };

  if (state === 'loading') return null;

  if (state === 'unsupported') {
    return (
      <div className="flex items-center justify-between bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3 opacity-50">
        <div>
          <p className="text-sm font-semibold text-[#f1f5f9]">Match Reminders</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">Not supported in this browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-[#0f1923] border border-white/8 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[#f1f5f9]">Match Reminders</p>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          {state === 'denied'
            ? 'Blocked — enable in browser settings'
            : subscribed
            ? 'Notified 1hr before each match'
            : 'Get notified before matches kick off'}
        </p>
      </div>
      {state !== 'denied' && (
        <button
          onClick={subscribed ? disable : enable}
          disabled={working}
          className={`flex items-center w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${subscribed ? 'bg-[#f59e0b]' : 'bg-[#1a2535]'}`}
        >
          <span className={`size-4 shrink-0 rounded-full bg-white shadow transition-[margin-left] duration-200 ${subscribed ? 'ml-7' : 'ml-1'}`} />
        </button>
      )}
    </div>
  );
}

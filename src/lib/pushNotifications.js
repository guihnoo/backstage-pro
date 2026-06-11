import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

async function getServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.ready;
}

export async function subscribeToPush(userId) {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (!isPushSupported()) throw new Error('Seu navegador não suporta notificações push.');
  if (!VAPID_PUBLIC) {
    throw new Error('Push ainda não configurado no servidor (VAPID).');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificação negada.');
  }

  const registration = await getServiceWorkerRegistration();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }

  const json = subscription.toJSON();
  const keys = json.keys || {};

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: navigator.userAgent?.slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) throw error;
  return subscription;
}

export async function unsubscribeFromPush(userId) {
  if (!userId) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  const endpoint = subscription?.endpoint;

  if (subscription) await subscription.unsubscribe();

  if (endpoint) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
  }
}

/** Teste local — mostra notificação sem servidor push */
export async function showTestNotification() {
  if (!isPushSupported()) throw new Error('Notificações não suportadas.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permissão negada.');

  const registration = await getServiceWorkerRegistration();
  await registration.showNotification('Backstage Pro', {
    body: 'Alertas no celular ativados! Você receberá shows e pagamentos importantes.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'backstage-test',
    data: { url: '/' },
  });
}

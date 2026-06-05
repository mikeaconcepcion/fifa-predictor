import webpush from 'web-push';

export function getWebPush() {
  webpush.setVapidDetails(
    'mailto:mikeaconcepcion@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush;
}

export default webpush;

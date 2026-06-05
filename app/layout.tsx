import type { Metadata, Viewport } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });

const APP_URL = 'https://fifa-predictor-kappa.vercel.app';

export const metadata: Metadata = {
  title: 'World Cup 2026 Predictor',
  description: 'Predict every FIFA World Cup 2026 match, earn points for correct picks, and compete with friends in private groups.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WC 2026 Predictor',
  },
  openGraph: {
    title: 'World Cup 2026 Predictor',
    description: 'Predict every FIFA World Cup 2026 match and compete with friends.',
    url: APP_URL,
    siteName: 'WC 2026 Predictor',
    type: 'website',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Cup 2026 Predictor',
    description: 'Predict every FIFA World Cup 2026 match and compete with friends.',
    images: [`${APP_URL}/opengraph-image`],
  },
};

export const viewport: Viewport = {
  themeColor: '#080c14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className="min-h-screen bg-[#080c14] text-[#f1f5f9]">
        {children}
      </body>
    </html>
  );
}

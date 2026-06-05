import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fifa-predictor-kappa.vercel.app';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080c14',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stadium background */}
        <img
          src={`${base}/Stadiumcrowd.jpg`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
        />

        {/* Dark overlay — heavier to ensure text contrast */}
        <div style={{ position: 'absolute', inset: 0, background: '#080c14dd' }} />

        {/* Gold top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#f59e0b' }} />

        {/* Content */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {/* Trophy */}
          <img
            src={`${base}/trophy.png`}
            style={{ width: 110, height: 110, objectFit: 'contain', marginBottom: 16 }}
          />

          {/* Title */}
          <div style={{ fontSize: 96, fontWeight: 900, color: '#f59e0b', letterSpacing: 8, textTransform: 'uppercase', lineHeight: 1, fontFamily: 'sans-serif' }}>
            WORLD CUP 2026
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 36, fontWeight: 700, color: '#f1f5f9', letterSpacing: 16, textTransform: 'uppercase', marginTop: 12, fontFamily: 'sans-serif' }}>
            PREDICTOR
          </div>

          {/* Gold divider */}
          <div style={{ width: 80, height: 3, background: '#f59e0b', borderRadius: 99, marginTop: 24, marginBottom: 24 }} />

          {/* Tagline */}
          <div style={{ fontSize: 26, color: '#f1f5f9', letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Predict · Compete · Win
          </div>

          {/* Hosts */}
          <div style={{ fontSize: 20, color: '#94a3b8', letterSpacing: 6, textTransform: 'uppercase', marginTop: 16, fontFamily: 'sans-serif' }}>
            USA · Canada · Mexico · June 11 – July 19
          </div>
        </div>

        {/* URL bottom */}
        <div style={{
          position: 'absolute', bottom: 28, right: 40,
          fontSize: 18, color: '#94a3b8', fontFamily: 'sans-serif', letterSpacing: 2,
        }}>
          fifa-predictor-kappa.vercel.app
        </div>

        {/* Gold bottom bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: '#f59e0b' }} />
      </div>
    ),
    { ...size }
  );
}

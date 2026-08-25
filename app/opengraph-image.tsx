import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Satori (next/og's renderer) can't use system/CSS fonts — it needs real
// font bytes. next/og's own default-font auto-load hits a file:// URL bug
// on Windows dev paths containing a space (this repo's "signal ai"
// folder), so the font is fetched explicitly here instead — the standard
// documented pattern for next/og, and it sidesteps that platform bug
// entirely since it's a network fetch, not local file resolution.
async function loadInter(): Promise<ArrayBuffer> {
  const res = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
  );
  return res.arrayBuffer();
}

// Matches the real brand tokens in tailwind.config.ts (paper/graphite/
// cobalt/slate/hairline) and the 5-bar SignalLogo shape used everywhere
// else in the app, rather than inventing separate share-image branding.
export default async function OpengraphImage() {
  const interRegular = await loadInter();

  const bars = [
    { h: 70, c: '#c3c5c0' },
    { h: 140, c: '#9b9e9a' },
    { h: 260, c: '#17427f' },
    { h: 110, c: '#9b9e9a' },
    { h: 55, c: '#c3c5c0' },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#f4f4f2',
          padding: '72px',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '32px' }}>
            {bars.map((b, i) => (
              <div
                key={i}
                style={{
                  width: '9px',
                  height: `${b.h / 8.5}px`,
                  borderRadius: '3px',
                  backgroundColor: b.c,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: '34px', fontWeight: 700, color: '#16181a', letterSpacing: '-0.01em' }}>
            Signal
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '980px' }}>
          <div
            style={{
              fontSize: '62px',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#16181a',
            }}
          >
            Your competitors moved this week.
          </div>
          <div style={{ fontSize: '30px', color: '#5f6467', lineHeight: 1.4 }}>
            Pricing, changelog, and hiring changes — checked weekly, summarised in plain English.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '28px',
            borderTop: '2px solid #dedfd9',
            paddingTop: '24px',
            fontSize: '22px',
            color: '#17427f',
            letterSpacing: '0.04em',
          }}
        >
          <div>PRICING</div>
          <div>LAUNCHES</div>
          <div>HIRING</div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Inter', data: interRegular, style: 'normal', weight: 700 }] },
  );
}

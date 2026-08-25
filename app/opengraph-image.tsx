import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Without this, Next statically pre-renders this route at build time —
// which runs next/og's font-loading code as part of `next build` itself.
// On this Windows dev machine that hits a file:// URL bug in that
// resolution and fails the build outright (exit code 1, confirmed
// locally). Forcing dynamic rendering defers execution to actual request
// time in the deployed runtime instead.
export const dynamic = 'force-dynamic';

// Deliberately NOT supplying a custom font here (an earlier version fetched
// one from Google Fonts) — that added a fragile external dependency and
// still crashed at runtime in production. next/og's own default font is
// resolved from a normal Linux path in the deployed runtime (only the
// Windows-path-with-a-space case above is broken, and force-dynamic
// already avoids hitting that at build time), so relying on it is both
// simpler and more robust than a hand-picked font URL.

// Matches the real brand tokens in tailwind.config.ts (paper/graphite/
// cobalt/slate/hairline) and the 5-bar SignalLogo shape used everywhere
// else in the app, rather than inventing separate share-image branding.
export default function OpengraphImage() {
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
    { ...size },
  );
}

import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://signal-ai.in';
const TITLE = 'Signal';
const DESCRIPTION =
  'Signal watches your competitors’ pricing pages, changelogs, and job boards, and sends one plain-English email a week when something meaningful changes.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s — ${TITLE}` },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: TITLE,
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The server has no way to see a URL fragment, so a Supabase
            auth-email link (#access_token=...) always gets the normal
            page's full HTML first — the browser paints that raw markup
            before any React JS has even loaded, let alone hydrated and run
            AuthHashHandler's redirect logic. That's a real bug seen live:
            it reads as "the link just took me to the website" for the
            second-plus it takes JS to catch up. This blocking script runs
            during HTML parsing, before first paint, and hides the page
            immediately when it sees that fragment; AuthHashHandler restores
            visibility once it's ready to show its own "Signing you in"
            overlay in the same tick. The timeout is a safety net only, in
            case that handoff never happens for some reason. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(window.location.hash.indexOf('access_token=')!==-1){document.documentElement.style.visibility='hidden';setTimeout(function(){document.documentElement.style.visibility='';},4000);}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}

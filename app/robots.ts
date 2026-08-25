import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://signal-ai.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth-gated or transactional pages — nothing here is content worth
      // indexing, and /dashboard, /admin already 302 anonymous crawlers to
      // /login anyway.
      disallow: [
        '/dashboard',
        '/admin',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/api/',
        '/auth/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

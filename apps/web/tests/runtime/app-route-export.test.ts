import { describe, expect, it } from 'vitest';
import nextConfig, { resolveAllowedDevOrigins } from '../../next.config';
import * as spaShellRoute from '../../app/[[...slug]]/page';

describe('SPA shell export route', () => {
  it('stays compatible with static export builds', () => {
    expect(nextConfig.output).toBe('export');
    expect('dynamicParams' in spaShellRoute).toBe(false);
    expect(spaShellRoute.generateStaticParams()).toEqual([{ slug: [] }]);
  });
});

describe('Next.js dev origins', () => {
  it('allows IPv4 browser origins when the web sidecar binds to all interfaces', () => {
    expect(resolveAllowedDevOrigins({ OD_HOST: '0.0.0.0' })).toContain('*.*.*.*');
  });

  it('allows explicit extra dev origins from env', () => {
    expect(
      resolveAllowedDevOrigins({
        OD_ALLOWED_DEV_ORIGINS: '13.209.4.19, preview.example.com ',
      }),
    ).toEqual(['127.0.0.1', '13.209.4.19', 'preview.example.com']);
  });
});

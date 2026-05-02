import type { Locale } from '@utils/locales';

const DEFAULT_BASE_URL = 'https://www.uniqlo.com/us/en/';

export const AppUrl = {
  Default: process.env.BASE_URL ?? DEFAULT_BASE_URL,
} as const;

export function getLocale(): Locale {
  const candidate = process.env.BASE_URL?.trim();
  let url: URL;
  try {
    url = new URL(candidate && candidate.length > 0 ? candidate : DEFAULT_BASE_URL);
  } catch {
    url = new URL(DEFAULT_BASE_URL);
  }
  const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  if (pathname.endsWith('/vn/en/')) return 'vn';
  if (pathname.endsWith('/uk/en/')) return 'uk';
  return 'us';
}
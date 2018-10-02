import normalizeUrl from 'normalize-url';

export function canonicalizeUrl(url) {
  let normalizedUrl = normalizeUrl(url, {
    normalizeProtocol: true,
    normalizeHttps: false,
    stripFragment: true,
    stripWWW: false,
    removeQueryParameters: [/^utm_\w+/i, 'ref', 'sr_share', 'ncid', 'mod'],
    removeTrailingSlash: true,
    removeDirectoryIndex: [/^index\.[a-z]+$/, /^default\.[a-z]+$/]
  }).replace('//?', '/?');
  normalizedUrl = normalizedUrl.split('?')[0];
  if (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }
  return normalizedUrl;
}

export function extractDomain(url) {
  let domain = url.split('/')[0];
  if (url.indexOf('://') > -1) {
    domain = url.split('/')[2];
  }
  return domain.split(':')[0];
}

export function extractPath(url) {
  const withoutProtocol = url.split('//')[1];
  const parts = withoutProtocol.split('/');
  return parts.slice(1, 100).join('/').split('?')[0].split('#')[0];
}

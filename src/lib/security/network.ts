import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateIpv4(address: string) {
  return (
    address.startsWith('10.') ||
    address.startsWith('127.') ||
    address.startsWith('169.254.') ||
    address.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.') ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

function isDisallowedIp(address: string) {
  if (net.isIPv4(address)) {
    return isPrivateIpv4(address);
  }

  if (net.isIPv6(address)) {
    return isPrivateIpv6(address);
  }

  return false;
}

export async function assertSafeOutboundHttpUrl(input: string) {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed');
  }

  if (parsed.username || parsed.password) {
    throw new Error('Embedded credentials are not allowed');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Target host is not allowed');
  }

  if (net.isIP(hostname) && isDisallowedIp(hostname)) {
    throw new Error('Target IP is not allowed');
  }

  const resolved = await dns.lookup(hostname, { all: true });
  if (resolved.some((entry) => isDisallowedIp(entry.address))) {
    throw new Error('Target resolves to a private or loopback address');
  }

  return parsed;
}

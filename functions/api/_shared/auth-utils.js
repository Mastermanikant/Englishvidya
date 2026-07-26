// _shared/auth-utils.js
// Shared Authentication and Cryptography Utilities

// --- PBKDF2 Hashing Helpers ---
export async function hashPasswordPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    512
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPasswordPBKDF2(password, storedHashStr) {
  const parts = storedHashStr.split(':');
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    512
  );
  const derivedHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return cryptoTimingSafeEqual(derivedHex, hashHex);
}

export async function hashSHA256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function cryptoTimingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let result = 0;
  if (a.length !== b.length) {
    b = a; // to ensure same length loop but will fail at the end
    result = 1;
  }
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// --- JWT Helpers ---
export async function createJWT(payload, secret, expiresInSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  payload.exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  payload.iat = Math.floor(Date.now() / 1000);

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const data = headerB64 + '.' + payloadB64;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return data + '.' + sigB64;
}

export async function verifyJWT(token, secret) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const data = headerB64 + '.' + payloadB64;

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );

    let paddedSig = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    while (paddedSig.length % 4) paddedSig += '=';
    const sig = new Uint8Array(atob(paddedSig).split('').map(c => c.charCodeAt(0)));

    const isValid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
    if (!isValid) return null;

    let paddedPayload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (paddedPayload.length % 4) paddedPayload += '=';
    const payload = JSON.parse(atob(paddedPayload));

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (err) {
    console.error('verifyJWT error:', err);
    return null;
  }
}

// --- Security Helpers ---
export function generateSecureOTP(length = 6) {
  const array = new Uint32Array(1);
  const maxSafeValue = Math.floor(4294967295 / Math.pow(10, length)) * Math.pow(10, length);
  let randomVal;
  do {
    crypto.getRandomValues(array);
    randomVal = array[0];
  } while (randomVal >= maxSafeValue);
  
  return (randomVal % Math.pow(10, length)).toString().padStart(length, '0');
}

export function validateRedirectUrl(url) {
  if (!url || typeof url !== 'string') return '/';
  
  // Only allow relative URLs starting with '/' but not '//'
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  
  return '/';
}

export function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  // Let's enforce 8 chars minimum, but no special characters required for now so users don't get frustrated, 
  // since this is an education platform. But we can require at least a mix.
  return true; // We will handle exact requirements in the endpoint to give proper error messages
}

export function getGenericErrorMsg() {
  return 'Something went wrong. Please try again later.';
}

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import QuickCrypto, { CryptoKey as QCryptoKey } from 'react-native-quick-crypto';

const subtle = QuickCrypto.subtle;
const getRandomValues = QuickCrypto.getRandomValues;

export async function deriveEncryptionKey(userId: string): Promise<string> {
  let salt = await SecureStore.getItemAsync('encryption_salt');
  if (!salt) {
    salt = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString() + Date.now().toString(),
    );
    await SecureStore.setItemAsync('encryption_salt', salt);
  }
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, userId + salt);
}

async function importKey(keyMaterial: string): Promise<QCryptoKey> {
  const enc = new TextEncoder();
  const rawKey = await subtle.importKey(
    'raw',
    enc.encode(keyMaterial),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('thought-garden-salt'), iterations: 100000, hash: 'SHA-256' },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptValue(value: string, key: string): Promise<string> {
  const cryptoKey = await importKey(key);
  const iv = getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, enc.encode(value));
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptValue(encrypted: string, key: string): Promise<string> {
  const cryptoKey = await importKey(key);
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(plaintext);
}

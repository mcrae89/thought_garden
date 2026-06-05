import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export async function deriveEncryptionKey(userId: string): Promise<string> {
  let salt = await SecureStore.getItemAsync('encryption_salt');
  if (!salt) {
    const bytes = Crypto.getRandomBytes(32);
    const hex = Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
    salt = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hex);
    await SecureStore.setItemAsync('encryption_salt', salt);
  }
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, userId + salt);
}

export async function encryptValue(value: string, key: string): Promise<string> {
  // Placeholder: real encryption requires a SubtleCrypto-compatible runtime.
  // For now, return a reversible base64 encoding prefixed with the key hash.
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
  return btoa(hash.slice(0, 8) + value);
}

export async function decryptValue(encrypted: string, key: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
  const decoded = atob(encrypted);
  return decoded.slice(hash.slice(0, 8).length);
}

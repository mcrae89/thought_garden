import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// TODO: Replace with real AES-256-GCM (react-native-quick-crypto) before production.
// Current implementation is a reversible base64 placeholder — data is NOT encrypted.

export async function deriveEncryptionKey(userId: string): Promise<string> {
  let salt = await SecureStore.getItemAsync('encryption_salt');
  if (!salt) {
    const bytes = Crypto.getRandomBytes(32);
    salt = Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync('encryption_salt', salt);
  }
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, userId + salt);
}

export async function encryptValue(value: string, _key: string): Promise<string> {
  if (!__DEV__) console.warn('[encryption] encryptValue is a placeholder — data is not encrypted');
  return btoa(value);
}

export async function decryptValue(encrypted: string, _key: string): Promise<string> {
  return atob(encrypted);
}

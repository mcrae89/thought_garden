import { encryptValue, decryptValue } from '@/modules/sync/encryption';

describe('encryption', () => {
  const key = 'test-encryption-key-abc123';

  it('should encrypt and decrypt round-trip correctly', async () => {
    const original = 'Hello, Thought Garden! 🌱';
    const encrypted = await encryptValue(original, key);
    const decrypted = await decryptValue(encrypted, key);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertext for same input (random IV)', async () => {
    const value = 'same input value';
    const encrypted1 = await encryptValue(value, key);
    const encrypted2 = await encryptValue(value, key);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should fail to decrypt with wrong key', async () => {
    const encrypted = await encryptValue('secret data', 'key-a');
    await expect(decryptValue(encrypted, 'key-b')).rejects.toThrow();
  });
});

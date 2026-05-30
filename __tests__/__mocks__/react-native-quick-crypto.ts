// Use Node's built-in crypto as a stand-in for tests
import { webcrypto } from 'crypto';

const QuickCrypto = {
  subtle: webcrypto.subtle,
  getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
};

export default QuickCrypto;

import type { AuthError } from '@/shared/result';

export { authService } from './auth-service';

export type OAuthProvider = 'apple' | 'google';

export interface Session {
  readonly userId: string;
  readonly accessToken: string;
  readonly expiresAt: Date;
}

export type Unsubscribe = () => void;

export interface AuthResult {
  readonly success: boolean;
  readonly session?: Session;
  readonly error?: AuthError;
}

export interface AuthService {
  signInWithEmail(email: string, password: string): Promise<AuthResult>;
  signInWithOAuth(provider: OAuthProvider): Promise<AuthResult>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: (session: Session | null) => void): Unsubscribe;
  getFailedAttempts(): Promise<number>;
  isAccountLocked(): Promise<boolean>;
}

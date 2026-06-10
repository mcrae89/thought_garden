import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/modules/auth';
import { modalStyles } from './styles';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const tier = useAuthStore((s) => s.tier);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function handleSignOut() {
    try {
      await authService.signOut();
    } catch (e) {
      // signOut failure is non-fatal; clear session regardless
    } finally {
      clearSession();
      await SecureStore.deleteItemAsync('sync_last_pulled_at');
      onClose();
    }
  }

  return (
    <Pressable style={modalStyles.backdrop} onPress={onClose}>
      <Pressable style={modalStyles.modalSheet}>
        <Text style={modalStyles.modalTitle}>Settings</Text>
        <Text style={modalStyles.detailText}>Tier: {tier}</Text>
        <TouchableOpacity
          style={modalStyles.actionButton}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
        >
          <Text style={modalStyles.actionButtonText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} accessibilityLabel="Close">
          <Text style={modalStyles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  );
}

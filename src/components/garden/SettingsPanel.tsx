import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/modules/auth';
import { modalStyles } from './styles';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const tier = useAuthStore((s) => s.tier);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <View style={modalStyles.modalSheet}>
      <Text style={modalStyles.modalTitle}>Settings</Text>
      <Text style={modalStyles.detailText}>Tier: {tier}</Text>
      <TouchableOpacity
        style={modalStyles.actionButton}
        onPress={async () => { await authService.signOut(); clearSession(); onClose(); }}
        accessibilityLabel="Sign out"
      >
        <Text style={modalStyles.actionButtonText}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} accessibilityLabel="Close">
        <Text style={modalStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

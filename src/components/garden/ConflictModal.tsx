import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useSyncStore } from '@/stores/sync-store';
import { modalStyles } from './styles';

export function ConflictModal() {
  const conflictPending = useSyncStore((s) => s.conflictPending);
  const resolveConflict = useSyncStore((s) => s.resolveConflict);
  const dismissConflict = useSyncStore((s) => s.dismissConflict);

  const handle = (choice: 'local' | 'server') => {
    resolveConflict?.(choice);
    dismissConflict();
  };

  return (
    <Modal visible={conflictPending} animationType="fade" transparent onRequestClose={() => handle('local')}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={modalStyles.modalSheet}>
          <Text style={modalStyles.modalTitle}>Sync Conflict</Text>
          <Text style={modalStyles.detailText}>Your local data differs from the server. Which version would you like to keep?</Text>
          <TouchableOpacity style={modalStyles.actionButton} onPress={() => handle('local')} accessibilityLabel="Keep my version">
            <Text style={modalStyles.actionButtonText}>Keep My Version</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.closeButton} onPress={() => handle('server')} accessibilityLabel="Use server version">
            <Text style={modalStyles.closeButtonText}>Use Server Version</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

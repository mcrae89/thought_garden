import { View, Text, TouchableOpacity } from 'react-native';
import { useNotificationStore } from '@/stores/notification-store';
import { modalStyles } from './styles';

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const notifications = useNotificationStore((s) => s.notifications);
  return (
    <View style={modalStyles.modalSheet}>
      <Text style={modalStyles.modalTitle}>Notifications</Text>
      {notifications.length === 0 && <Text style={modalStyles.emptyText}>No notifications</Text>}
      {notifications.map((n, i) => (
        <Text key={i} style={modalStyles.detailText}>{n.achievementType}: {n.seedEmotion}</Text>
      ))}
      <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} accessibilityLabel="Close">
        <Text style={modalStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

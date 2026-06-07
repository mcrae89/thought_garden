import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNotificationStore } from '@/stores/notification-store';
import { modalStyles } from './styles';
import type { AchievementResult } from '@/modules/achievements';

function NotificationDetail({ notification, onDismiss }: { notification: AchievementResult; onDismiss: () => void }) {
  return (
    <View style={modalStyles.modalSheet}>
      <Text style={modalStyles.modalTitle}>New Achievement!</Text>
      <Text style={modalStyles.detailText}>Type: {notification.achievementType}</Text>
      <Text style={modalStyles.detailText}>Seed earned: {notification.seedEmotion}</Text>
      <Text style={modalStyles.detailText}>A new {notification.seedEmotion} seed has been added to your collection.</Text>
      <TouchableOpacity style={modalStyles.closeButton} onPress={onDismiss} accessibilityLabel="Mark as read">
        <Text style={modalStyles.closeButtonText}>Got it!</Text>
      </TouchableOpacity>
    </View>
  );
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismissAt = useNotificationStore((s) => s.dismissAt);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const openNotification = openKey !== null ? notifications.find((n) => n.achievementKey === openKey) : null;

  if (openNotification) {
    const index = notifications.indexOf(openNotification);
    return (
      <NotificationDetail
        notification={openNotification}
        onDismiss={() => {
          dismissAt(index);
          setOpenKey(null);
        }}
      />
    );
  }

  return (
    <View style={modalStyles.modalSheet}>
      <Text style={modalStyles.modalTitle}>Notifications</Text>
      {notifications.length === 0 && <Text style={modalStyles.emptyText}>No notifications</Text>}
      {notifications.map((n) => (
        <TouchableOpacity
          key={n.achievementKey}
          onPress={() => setOpenKey(n.achievementKey)}
          accessibilityLabel={`Open ${n.achievementType} notification`}
        >
          <Text style={modalStyles.detailText}>{n.achievementType}: {n.seedEmotion}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} accessibilityLabel="Close">
        <Text style={modalStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

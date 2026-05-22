import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, variant === 'ghost' ? styles.ghost : styles.primary, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:        { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  primary:     { backgroundColor: '#4CAF82' },
  ghost:       { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4CAF82' },
  disabled:    { opacity: 0.4 },
  label:       { color: '#fff', fontWeight: '600', fontSize: 16 },
  ghostLabel:  { color: '#4CAF82' },
});

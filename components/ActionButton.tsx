import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import BarcodeIcon from '../assets/icons/BarcodeIcon';
import ManualToggleIcon from '../assets/icons/ManualToggleIcon';

interface ActionButtonProps {
  type: 'barcode' | 'manual';
  onPress: () => void;
  label: string;
  style?: ViewStyle;
}

const ActionButton: React.FC<ActionButtonProps> = ({ type, onPress, label, style }) => {
  const Icon = type === 'barcode' ? BarcodeIcon : ManualToggleIcon;
  
  return (
    <TouchableOpacity 
      style={[styles.actionButton, style]}
      onPress={onPress}
    >
      <Icon width={20} height={20} color="#0088FF" />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0088FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0088FF',
    fontWeight: '600',
  },
});

export default ActionButton;
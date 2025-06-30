'use client';

import { View, Text, Modal, TouchableOpacity, Image } from 'react-native';
import { styles } from './styles';

interface RoleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRole: (role: 'guardian' | 'taker') => void;
}

export function RoleSelectionModal({ visible, onClose, onSelectRole }: RoleSelectionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>누구로 시작할까요?</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => onSelectRole('guardian')}>
              <Image source={require('../../assets/do.png')} style={styles.iconImage} />
              <Text style={styles.modalButtonText}>보호자</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={() => onSelectRole('taker')}>
            <Image source={require('../../assets/me.png')} style={styles.iconImage} />
            <Text style={styles.modalButtonText}>복용자</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
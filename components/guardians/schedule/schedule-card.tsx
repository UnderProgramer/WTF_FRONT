import {View, Text, StyleSheet} from 'react-native';
import ActionButton from '../ui/action-button';

export type Schedule = {
  id: number;
  patientName: string;
  medicationName: string;
  time: string;
  category: string;
  isCompleted: boolean;
};

type ScheduleCardProps = {
  schedule: Schedule;
  onConfirm?: (id: number) => void;
};

export default function ScheduleCard({schedule, onConfirm}: ScheduleCardProps) {
  return (
    <View key={schedule.id} style={styles.scheduleCard}>
      <View style={styles.scheduleTimeContainer}>
        <Text style={styles.scheduleTime}>{schedule.time}</Text>
        <View
          style={[
            styles.statusDot,
            schedule.isCompleted && styles.statusDotCompleted,
          ]}
        />
      </View>
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleMedication}>{schedule.medicationName}</Text>
        <Text style={styles.schedulePatient}>{schedule.patientName}</Text>
        <Text style={styles.scheduleCategory}>{schedule.category}</Text>
      </View>
      <ActionButton
        label={schedule.isCompleted ? '완료됨' : '복용 확인'}
        variant={schedule.isCompleted ? 'success' : 'primary'}
        onPress={() => onConfirm && onConfirm(schedule.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleTimeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  statusDotCompleted: {
    backgroundColor: '#10B981',
  },
  scheduleInfo: {
    flex: 1,
    marginRight: 16,
  },
  scheduleMedication: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  schedulePatient: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 2,
  },
  scheduleCategory: {
    fontSize: 13,
    color: '#94A3B8',
  },
});

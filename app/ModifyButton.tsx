import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

const ModifyButton = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [pillModalVisible, setPillModalVisible] = useState(false);
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedPills, setSelectedPills] = useState({ 1: null, 2: null, 3: null });
  const [alarms, setAlarms] = useState({ 1: [], 2: [], 3: [] });
  const [currentPillSlot, setCurrentPillSlot] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const pillChoices = ["Pill A", "Pill B", "Pill C", "Pill D", "Pill E"];

  const handlePillEdit = (slot: number) => {
    setCurrentPillSlot(slot);
    setPillModalVisible(true);
  };

  const handlePillSelection = (pill: string) => {
    if (currentPillSlot !== null) {
      setSelectedPills((prev) => ({ ...prev, [currentPillSlot]: pill }));
    }
    setPillModalVisible(false);
  };

  const handleEditAlarm = (slot: number) => {
    setCurrentPillSlot(slot);
    setAlarmModalVisible(true);
  };

  const onChangeDate = (_event: any, selected: Date | undefined) => {
    if (selected && currentPillSlot !== null) {
      setSelectedDate(selected);
      setAlarms((prev) => {
        const updatedAlarms = [...prev[currentPillSlot]];
        updatedAlarms.push(selected);
        return { ...prev, [currentPillSlot]: updatedAlarms };
      });
    }
    setShowDatePicker(false);
  };

  const removeAlarm = (slot: number, index: number) => {
    setAlarms((prev) => {
      const updatedAlarms = [...prev[slot]];
      updatedAlarms.splice(index, 1);
      return { ...prev, [slot]: updatedAlarms };
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.secondary }]}>
          MODIFY <Text style={[styles.headerHighlight, { color: theme.primary }]}>SCHEDULE</Text>
        </Text>
      </View>

      {[1, 2, 3].map((slot) => (
        <View key={slot} style={[styles.pillContainer, { backgroundColor: theme.card }]}>
          <View>
            <Text style={[styles.pillText, { color: theme.text }]}>
              Container {slot}: {selectedPills[slot] || "No pill set"}
            </Text>
            {alarms[slot].map((alarm, idx) => (
              <View key={idx} style={styles.alarmRow}>
                <Text style={[styles.alarmText, { color: theme.textSecondary }]}>
                  {alarm.toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => removeAlarm(slot, idx)}>
                  <Ionicons name="trash" size={20} color={theme.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => handlePillEdit(slot)}>
              <Ionicons name="pencil" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEditAlarm(slot)}>
              <Ionicons name="alarm" size={24} color={theme.secondary} style={{ marginTop: 10 }} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Pill Selection Modal */}
      <Modal visible={pillModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.secondary }]}>Edit Pill</Text>
            <FlatList
              data={pillChoices}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => handlePillSelection(item)} 
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                >
                  <Text style={[styles.modalItemText, { color: theme.text }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              onPress={() => setPillModalVisible(false)} 
              style={[styles.cancelButton, { backgroundColor: theme.error }]}
            >
              <Text style={[styles.cancelButtonText, { color: theme.card }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alarm Modal */}
      <Modal visible={alarmModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.secondary }]}>Add Alarm</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.datePickerText, { color: theme.primary }]}>Pick Date & Time</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="datetime"
                display="default"
                onChange={onChangeDate}
              />
            )}
            <TouchableOpacity 
              onPress={() => setAlarmModalVisible(false)} 
              style={[styles.confirmButton, { backgroundColor: theme.success }]}
            >
              <Text style={[styles.confirmButtonText, { color: theme.card }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerHighlight: {
    color: '#4A90E2',
  },
  pillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 2,
  },
  pillText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  alarmText: {
    fontSize: 14,
    marginTop: 5,
  },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    width: '100%',
  },
  modalItemText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  datePickerText: {
    fontSize: 16,
    marginBottom: 10,
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: 'bold',
  },
});

export default ModifyButton;

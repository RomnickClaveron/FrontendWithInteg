import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Modal, FlatList, ScrollView, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

// Explicit types for slots and state objects
type PillSlot = 1 | 2 | 3;

type SelectedPillsState = Record<PillSlot, string | null>;

type AlarmsState = Record<PillSlot, Date[]>;

const SetScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [pillModalVisible, setPillModalVisible] = useState(false);
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [selectedPills, setSelectedPills] = useState<SelectedPillsState>({ 1: null, 2: null, 3: null });
  const [alarms, setAlarms] = useState<AlarmsState>({ 1: [], 2: [], 3: [] });
  const [currentPillSlot, setCurrentPillSlot] = useState<PillSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const pillChoices = ["Pill A", "Pill B", "Pill C", "Pill D", "Pill E"];

  const handlePillSelection = (pill: string) => {
    if (currentPillSlot === null) return;
    setSelectedPills((prev) => ({ ...prev, [currentPillSlot]: pill }));
    setPillModalVisible(false);
    setAlarmModalVisible(true);
  };

  const handleAddPill = (slot: PillSlot) => {
    setCurrentPillSlot(slot);
    setWarningModalVisible(true);
  };

  const handleContinue = () => {
    setWarningModalVisible(false);
    setPillModalVisible(true);
  };

  const onChangeDate = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event?.type === 'set' && selected) {
        if (showTimePicker) {
          // Time picked
          const updated = new Date(selectedDate);
          updated.setHours(selected.getHours());
          updated.setMinutes(selected.getMinutes());
          updated.setSeconds(0);
          updated.setMilliseconds(0);
          setSelectedDate(updated);
          setShowTimePicker(false);
          setConfirmModalVisible(true);
        } else {
          // Date picked
          const updated = new Date(selectedDate);
          updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
          setSelectedDate(updated);
          setShowDatePicker(false);
          setShowTimePicker(true);
        }
      } else {
        // Dismissed
        setShowDatePicker(false);
        setShowTimePicker(false);
      }
    } else {
      // iOS: combined datetime
      if (selected) {
        setSelectedDate(selected);
      }
      setShowDatePicker(false);
    }
  };

  const confirmAlarm = () => {
    if (currentPillSlot === null) return;
    setAlarms((prev) => ({
      ...prev,
      [currentPillSlot]: [...prev[currentPillSlot], selectedDate],
    }));
    setConfirmModalVisible(false);
    setAlarmModalVisible(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={30} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.secondary }]}>
          SET-UP <Text style={[styles.headerHighlight, { color: theme.primary }]}>SCHEDULE</Text>
        </Text>
      </View>

      <Image source={require("@/assets/images/pillnow.png")} style={styles.pillImage} />
      <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Pill Intake</Text>
      {([1, 2, 3] as const).map((num) => (
        <View key={num} style={[styles.pillContainer, { backgroundColor: theme.card }]}>
          <View>
            <Text style={[styles.pillText, { color: theme.primary }]}>Container {num}: {selectedPills[num] || "ADD PILL"}</Text>
            {alarms[num].map((alarm: Date, index: number) => (
              <Text key={index} style={[styles.alarmText, { color: theme.text }]}>{alarm.toLocaleString()}</Text>
            ))}
          </View>
          <TouchableOpacity onPress={() => handleAddPill(num)}>
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity 
        style={[styles.confirmButton, { backgroundColor: theme.primary }]} 
        onPress={() => navigation.navigate("ModifySchedule" as never)}
      > 
        <Text style={[styles.confirmButtonText, { color: theme.card }]}>CONFIRM</Text>
      </TouchableOpacity>

      {/* Warning Modal */}
      <Modal visible={warningModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <TouchableOpacity 
              style={styles.closeButtonTop} 
              onPress={() => setWarningModalVisible(false)}
            >
              <Ionicons name="close-circle" size={24} color={theme.text} />
            </TouchableOpacity>
            <Ionicons name="warning" size={50} color="#FFA500" style={styles.warningIcon} />
            <Text style={[styles.modalTitle, { color: theme.secondary }]}>Important Notice</Text>
            <Text style={[styles.warningText, { color: theme.text }]}>
              Please put your medicine first to the container before setting it up.
            </Text>
            <TouchableOpacity 
              onPress={handleContinue} 
              style={[styles.continueButton, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.continueButtonText, { color: theme.card }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pill Selection Modal */}
      <Modal visible={pillModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.secondary }]}>Select a Pill</Text>
            <FlatList 
              data={pillChoices} 
              keyExtractor={(item) => item} 
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => handlePillSelection(item)} 
                  style={[styles.modalItem, { borderBottomColor: theme.background }]}
                >
                  <Text style={[styles.modalItemText, { color: theme.primary }]}>{item}</Text>
                </TouchableOpacity>
              )} 
            />
            <TouchableOpacity 
              onPress={() => setPillModalVisible(false)} 
              style={[styles.cancelButton, { backgroundColor: theme.secondary }]}
            >
              <Text style={[styles.cancelButtonText, { color: theme.card }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alarm & Date Selection Modal */}
      <Modal visible={alarmModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.secondary }]}>Set Alarm</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.datePickerText, { color: theme.primary }]}>Pick Date & Time</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker 
                value={selectedDate} 
                mode={Platform.OS === 'ios' ? 'datetime' : 'date'} 
                display="default" 
                onChange={onChangeDate} 
              />
            )}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker 
                value={selectedDate} 
                mode="time" 
                display="default" 
                onChange={onChangeDate} 
              />
            )}
            <TouchableOpacity 
              onPress={confirmAlarm} 
              style={[styles.confirmButton, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.confirmButtonText, { color: theme.card }]}>Confirm</Text>
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
    justifyContent: 'flex-start',
    width: '100%',
    marginTop: 40,
    padding: 15,
    borderRadius: 15,
    elevation: 8,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerHighlight: {
    color: '#4A90E2',
  },
  pillImage: {
    width: 150,
    height: 100,
    resizeMode: 'contain',
    marginVertical: 20,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    width: '100%',
    justifyContent: 'space-between',
    elevation: 3,
  },
  pillText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  alarmText: {
    fontSize: 14,
    marginTop: 4,
  },
  confirmButton: {
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    position: 'relative',
  },
  closeButtonTop: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    width: '100%',
  },
  modalItemText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerText: {
    fontSize: 16,
    marginBottom: 15,
  },
  warningIcon: {
    marginBottom: 15,
    marginTop: 10,
  },
  warningText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  continueButton: {
    padding: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SetScreen;

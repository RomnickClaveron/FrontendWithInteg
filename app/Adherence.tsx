import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

interface Medication {
  containerId: number;
  medicineName: string;
  scheduledTime: string;
  date: string;
  taken: boolean;
}

const Adherence = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Example data
  const exampleMedications: Medication[] = [
    {
      containerId: 1,
      medicineName: "Paracetamol",
      scheduledTime: "08:00 AM",
      date: "2024-04-20",
      taken: true
    },
    {
      containerId: 2,
      medicineName: "Vitamin C",
      scheduledTime: "12:00 PM",
      date: "2024-04-20",
      taken: false
    },
    {
      containerId: 3,
      medicineName: "Multivitamin",
      scheduledTime: "06:00 PM",
      date: "2024-04-20",
      taken: false
    }
  ];

  const [medications] = useState<Medication[]>(exampleMedications);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleMarkAsTaken = (medication: Medication) => {
    // This is just for example, in real app this would update the API
    console.log(`Marking medication ${medication.medicineName} as taken`);
    setModalVisible(false);
  };

  const handleGenerateReport = () => {
    router.push({
      pathname: '/Generate',
      params: { adherenceData: JSON.stringify(medications) }
    });
  };

  const renderMedicationCard = ({ item }: { item: Medication }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => {
        setSelectedMedication(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.containerText, { color: theme.primary }]}>Container {item.containerId}</Text>
        <Ionicons 
          name={item.taken ? "checkmark-circle" : "time"} 
          size={24} 
          color={item.taken ? theme.success : theme.warning} 
        />
      </View>
      <Text style={[styles.medicineName, { color: theme.text }]}>{item.medicineName}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{item.scheduledTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.secondary }]}>
            MEDICATION <Text style={[styles.highlight, { color: theme.primary }]}>ADHERENCE</Text>
          </Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <FlatList
          data={medications}
          renderItem={renderMedicationCard}
          keyExtractor={(item) => item.containerId.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={[styles.bottomContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.generateButton, { backgroundColor: theme.primary }]}
          onPress={handleGenerateReport}
        >
          <Ionicons name="document-text-outline" size={20} color={theme.card} />
          <Text style={[styles.generateButtonText, { color: theme.card }]}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedMedication && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.secondary }]}>Medication Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={[styles.modalText, { color: theme.text }]}>Container: {selectedMedication.containerId}</Text>
                  <Text style={[styles.modalText, { color: theme.text }]}>Medicine: {selectedMedication.medicineName}</Text>
                  <Text style={[styles.modalText, { color: theme.text }]}>Scheduled Time: {selectedMedication.scheduledTime}</Text>
                  <Text style={[styles.modalText, { color: theme.text }]}>Date: {selectedMedication.date}</Text>
                  <Text style={[styles.modalText, { color: theme.text }]}>
                    Status: {selectedMedication.taken ? 'Taken' : 'Pending'}
                  </Text>
                </View>
                {!selectedMedication.taken && (
                  <TouchableOpacity 
                    style={[styles.markButton, { backgroundColor: theme.success }]}
                    onPress={() => handleMarkAsTaken(selectedMedication)}
                  >
                    <Text style={[styles.markButtonText, { color: theme.card }]}>Mark as Taken</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 12,
    borderRadius: 12,
    elevation: 4,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  highlight: {
    color: '#4A90E2',
  },
  contentContainer: {
    flex: 1,
    marginTop: 100,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  containerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  medicineName: {
    fontSize: 16,
    marginBottom: 10,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    gap: 10,
  },
  modalText: {
    fontSize: 16,
  },
  markButton: {
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderTopWidth: 1,
  },
  generateButton: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Adherence;

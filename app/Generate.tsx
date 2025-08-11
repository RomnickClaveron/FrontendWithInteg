import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface Medication {
  containerId: number;
  medicineName: string;
  scheduledTime: string;
  date: string;
  taken: boolean;
}

const Generate = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { adherenceData } = route.params as { adherenceData: Medication[] };

  useEffect(() => {
    generatePDF();
  }, []);

  const generatePDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              h1 {
                color: #D14A99;
                text-align: center;
              }
              .container {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
              }
              .header {
                color: #4A90E2;
                font-weight: bold;
              }
              .status {
                color: #4CAF50;
              }
              .pending {
                color: #FFA500;
              }
            </style>
          </head>
          <body>
            <h1>Medication Adherence Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            ${adherenceData.map(med => `
              <div class="container">
                <h2 class="header">Container ${med.containerId}</h2>
                <p><strong>Medicine:</strong> ${med.medicineName}</p>
                <p><strong>Scheduled Time:</strong> ${med.scheduledTime}</p>
                <p><strong>Date:</strong> ${med.date}</p>
                <p><strong>Status:</strong> 
                  <span class="${med.taken ? 'status' : 'pending'}">
                    ${med.taken ? 'Taken' : 'Pending'}
                  </span>
                </p>
              </div>
            `).join('')}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Medication Adherence Report',
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Generating PDF report...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  text: {
    fontSize: 18,
    color: '#666666',
  },
});

export default Generate;

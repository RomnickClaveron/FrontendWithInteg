import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ElderProfile from './components/ElderProfile';

type RootStackParamList = {
  CaregiverDashboard: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function EldersProf() {
  const navigation = useNavigation<NavigationProp>();

  const handleElderSelected = (elderId: string, elderName: string) => {
    // Navigate back to dashboard after elder selection
    navigation.navigate('CaregiverDashboard');
  };

  const handleBack = () => {
    navigation.navigate('CaregiverDashboard');
  };

  return (
    <ElderProfile 
      onElderSelected={handleElderSelected}
      onBack={handleBack}
    />
  );
}

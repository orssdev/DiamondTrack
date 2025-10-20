// components/AddTeamModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ref, push, set } from 'firebase/database';
import { db } from '../../firebaseConfig'; // Adjust path if necessary

interface AddTeamModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (teamData: { id: string; leagueId: string; name: string; location: string; record: { wins: number; losses: number; ties: number } }) => Promise<void>;
  selectedLeagueId: string | null;
  selectedLeagueName: string; // To display in the modal title
  // optional initial data for edit
  initialData?: { id: string; leagueId: string; name: string; location: string; record?: { wins: number; losses: number; ties: number } } | null;
  mode?: 'add' | 'edit';
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ isVisible, onClose, onSave, selectedLeagueId, selectedLeagueName, initialData = null, mode = 'add' }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [id, setId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setId(initialData.id ?? '');
      setName(initialData.name ?? '');
      setLocation(initialData.location ?? '');
    } else if (mode === 'add') {
      setId('');
      setName('');
      setLocation('');
    }
  }, [initialData, mode, isVisible]);

  const handleSave = async () => {
    if (!id.trim() || !name.trim() || !location.trim()) {
      Alert.alert('Missing Information', 'Please enter an id, team name and location.');
      return;
    }
    if (!selectedLeagueId) {
      Alert.alert('Error', 'No league selected. Cannot add team.');
      return;
    }

    setIsSaving(true);
    try {
      // Default record to 0-0-0 when creating a new team
      await onSave({
        id: id.trim(),
        leagueId: selectedLeagueId,
        name,
        location,
        record: { wins: 0, losses: 0, ties: 0 },
      });
      Alert.alert('Success', 'Team added successfully!');
      setName('');
      setLocation('');
      setId('');
      onClose();
    } catch (error) {
      console.error('Error adding team:', error);
      Alert.alert('Error', 'Failed to add team. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{mode === 'edit' ? 'Edit Team' : `Add New Team to ${selectedLeagueName}`}</Text>

          <TextInput
            style={modalStyles.input}
            placeholder="Team Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            editable={!isSaving}
          />
          <TextInput
            style={modalStyles.input}
            placeholder="Team ID (unique key)"
            placeholderTextColor="#666"
            value={id}
            onChangeText={setId}
            editable={!isSaving && mode !== 'edit'}
          />
          <TextInput
            style={modalStyles.input}
            placeholder="Location"
            placeholderTextColor="#666"
            value={location}
            onChangeText={setLocation}
            editable={!isSaving}
          />

          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonCancel]}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={modalStyles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonSave]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={modalStyles.textStyle}>{mode === 'edit' ? 'Save Changes' : 'Save Team'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Re-using modalStyles from AddLeagueModal for consistency.
// You might want to extract these into a common stylesheet for larger apps.
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#ccc',
  },
  buttonSave: {
    backgroundColor: '#007bff',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AddTeamModal;

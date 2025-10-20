// components/AddLeagueModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ref, push, set } from 'firebase/database';
import { db } from '../../firebaseConfig'; // Adjust path if necessary

interface AddLeagueModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (leagueData: { id: string; name: string; country: string }) => Promise<void>;
  // optional initial data for edit
  initialData?: { id: string; name: string; country: string } | null;
  // mode: 'add' | 'edit'
  mode?: 'add' | 'edit';
}

const AddLeagueModal: React.FC<AddLeagueModalProps> = ({ isVisible, onClose, onSave, initialData = null, mode = 'add' }) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [id, setId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // populate fields when initialData changes (edit mode)
  React.useEffect(() => {
    if (initialData) {
      setId(initialData.id ?? '');
      setName(initialData.name ?? '');
      setCountry(initialData.country ?? '');
    } else if (mode === 'add') {
      setId('');
      setName('');
      setCountry('');
    }
  }, [initialData, mode, isVisible]);

  const handleSave = async () => {
    if (!id.trim() || !name.trim() || !country.trim()) {
      Alert.alert('Missing Information', 'Please enter an id, league name and country.');
      return;
    }

    setIsSaving(true);
    try {
    await onSave({ id: id.trim(), name, country });
      Alert.alert('Success', 'League added successfully!');
      setName('');
      setCountry('');
    setId('');
      onClose();
    } catch (error) {
      console.error('Error adding league:', error);
      Alert.alert('Error', 'Failed to add league. Please try again.');
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
          <Text style={modalStyles.modalTitle}>{mode === 'edit' ? 'Edit League' : 'Add New League'}</Text>

          <TextInput
            style={modalStyles.input}
            placeholder="League Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            editable={!isSaving}
          />
          <TextInput
            style={modalStyles.input}
            placeholder="League ID (unique key)"
            placeholderTextColor="#666"
            value={id}
            onChangeText={setId}
            editable={!isSaving && mode !== 'edit'}
          />
          <TextInput
            style={modalStyles.input}
            placeholder="Country"
            placeholderTextColor="#666"
            value={country}
            onChangeText={setCountry}
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
                <Text style={modalStyles.textStyle}>{mode === 'edit' ? 'Save Changes' : 'Save League'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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

export default AddLeagueModal;

import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface Item {
  label: string;
  value: string;
}

interface DropdownProps {
  items: Item[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  enabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ items, selectedValue, onValueChange, placeholder = 'Select', enabled = true }) => {
  const [open, setOpen] = React.useState(false);
  const selectedItem = items.find(i => i.value === selectedValue);

  return (
    <>
      <TouchableOpacity
        style={[styles.container, !enabled && styles.disabled]}
        onPress={() => enabled && setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, !selectedItem && styles.placeholder]}>{selectedItem ? selectedItem.label : placeholder}</Text>
        <Text style={styles.chev}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer} pointerEvents="box-none">
          <View style={styles.modalBox}>
            <FlatList
              data={items}
              keyExtractor={(it) => it.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => { onValueChange(item.value); setOpen(false); }}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  text: { fontSize: 16, color: '#000' },
  placeholder: { color: '#666' },
  chev: { fontSize: 18, color: '#666' },
  disabled: { opacity: 0.6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', maxHeight: '60%', backgroundColor: '#fff', borderRadius: 8, padding: 8, elevation: 6, borderWidth: 1, borderColor: '#ddd' },
  item: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemText: { fontSize: 16 },
});

export default Dropdown;

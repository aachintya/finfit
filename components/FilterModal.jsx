// components/FilterModal.jsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export const FilterModal = ({ visible, onClose, onApplyFilters, categories }) => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      type: selectedType,
      categories: selectedCategories,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedType('ALL');
    setSelectedCategories([]);
    onApplyFilters({ type: 'ALL', categories: [] });
    onClose();
  };

  // Remove duplicates from categories array
  const uniqueCategories = [...new Set(categories)];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Transactions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Transaction Type Filter */}
            <Text style={styles.sectionTitle}>Transaction Type</Text>
            <View style={styles.typeContainer}>
              {['ALL', 'EXPENSE', 'INCOME'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && styles.typeButtonActive
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    selectedType === type && styles.typeButtonTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Filter */}
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoryContainer}>
              {uniqueCategories.map((category, index) => (
                <TouchableOpacity
                  key={`${category}-${index}`}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(category) && styles.categoryChipActive
                  ]}
                  onPress={() => handleCategoryToggle(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategories.includes(category) && styles.categoryChipTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.pri,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: hp('80%'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightbackground,
  },
  title: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scrollView: {
    padding: wp('4%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: hp('1.5%'),
    marginTop: hp('1%'),
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: hp('2%'),
  },
  typeButton: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightbackground,
    backgroundColor: COLORS.background,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: wp('3.5%'),
    color: COLORS.text.secondary,
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3%'),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.lightbackground,
    backgroundColor: COLORS.background,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: wp('3.2%'),
    color: COLORS.text.secondary,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: wp('4%'),
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightbackground,
  },
  resetButton: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightbackground,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: wp('4%'),
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: wp('4%'),
    color: '#fff',
    fontWeight: '600',
  },
});
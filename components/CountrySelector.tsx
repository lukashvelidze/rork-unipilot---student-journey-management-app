import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { ChevronDown, Search, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Country } from "@/types/user";

interface CountrySelectorProps {
  label?: string;
  value?: Country | null;
  onChange: (country: Country) => void;
  countries: Country[];
  placeholder?: string;
  error?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  label,
  value,
  onChange,
  countries,
  placeholder = "Select a country",
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (country: Country) => {
    onChange(country);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.selector, error ? styles.selectorError : null]}
        onPress={() => setModalVisible(true)}
      >
        {value ? (
          <View style={styles.selectedCountry}>
            <Text style={styles.flag}>{value.flag}</Text>
            <Text style={styles.countryName}>{value.name}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        <ChevronDown size={20} color={Colors.lightText} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.lightText} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={18} color={Colors.lightText} />
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    value?.code === item.code && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: Colors.text,
    fontWeight: "500",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
  },
  selectorError: {
    borderColor: Colors.error,
  },
  selectedCountry: {
    flexDirection: "row",
    alignItems: "center",
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryName: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    fontSize: 16,
    color: Colors.lightText,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  countryList: {
    maxHeight: "70%",
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedItem: {
    backgroundColor: Colors.primaryLight,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryItemName: {
    fontSize: 16,
    color: Colors.text,
  },
});

export default CountrySelector;
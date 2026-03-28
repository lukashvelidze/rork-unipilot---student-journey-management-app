import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
import { ChevronDown, Search, X } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { Country } from "@/types/user";

interface CountrySelectorProps {
  label: string;
  value: Country | null;
  onChange: (country: Country) => void;
  countries: Country[];
  error?: string;
  placeholder?: string;
}

export default function CountrySelector({
  label,
  value,
  onChange,
  countries,
  error,
  placeholder = "Select a country..."
}: CountrySelectorProps) {
  const Colors = useColors();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelect = (country: Country) => {
    onChange(country);
    setIsOpen(false);
    setSearchQuery("");
  };
  
  const clearSearch = () => {
    setSearchQuery("");
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: Colors.text }]}>{label}</Text>
      
      <TouchableOpacity
        style={[
          styles.selector,
          { 
            backgroundColor: Colors.lightBackground,
            borderColor: error ? Colors.error : Colors.border,
          }
        ]}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.selectedValue}>
          {value ? (
            <>
              <Text style={styles.flag}>{value.flag}</Text>
              <Text style={[styles.countryName, { color: Colors.text }]}>
                {value.name}
              </Text>
            </>
          ) : (
            <Text style={[styles.placeholder, { color: Colors.lightText }]}>
              {placeholder}
            </Text>
          )}
        </View>
        <ChevronDown size={20} color={Colors.lightText} />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.error, { color: Colors.error }]}>{error}</Text>
      )}
      
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.modal, { backgroundColor: Colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: Colors.border }]}>
            <Text style={[styles.modalTitle, { color: Colors.text }]}>
              {label}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: Colors.lightBackground }]}>
              <Search size={20} color={Colors.lightText} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: Colors.text }]}
                placeholder="Search countries..."
                placeholderTextColor={Colors.lightText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <X size={18} color={Colors.lightText} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  { 
                    backgroundColor: value?.code === item.code ? Colors.primary + "20" : "transparent",
                    borderBottomColor: Colors.border,
                  }
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[
                  styles.countryName,
                  { 
                    color: value?.code === item.code ? Colors.primary : Colors.text,
                    fontWeight: value?.code === item.code ? "600" : "400",
                  }
                ]}>
                  {item.name}
                </Text>
                {item.isPopularDestination && (
                  <View style={[styles.popularBadge, { backgroundColor: Colors.secondary }]}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedValue: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryName: {
    fontSize: 16,
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  separator: {
    height: 1,
    backgroundColor: "transparent",
  },
});
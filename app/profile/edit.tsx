import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Save, User, Mail, MapPin, GraduationCap, Calendar, Target } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import CountrySelector from "@/components/CountrySelector";
import Avatar from "@/components/Avatar";
import { useUserStore } from "@/store/userStore";
import { countries } from "@/mocks/countries";
import { Country } from "@/types/user";

const educationLevels = [
  { value: "high_school", label: "High School" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Other" },
];

const careerGoals = [
  "Technology & Engineering",
  "Business & Finance",
  "Healthcare & Medicine",
  "Arts & Design",
  "Science & Research",
  "Education",
  "Law & Government",
  "Media & Communications",
  "Other",
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    homeCountry: null as Country | null,
    destinationCountry: null as Country | null,
    educationLevel: "bachelors",
    careerGoal: "",
    bio: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    homeCountry: "",
    destinationCountry: "",
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        homeCountry: user.homeCountry || null,
        destinationCountry: user.destinationCountry || null,
        educationLevel: user.educationBackground?.level || "bachelors",
        careerGoal: user.careerGoal || "",
        bio: user.bio || "",
      });
    }
  }, [user]);
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else {
      newErrors.name = "";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    } else {
      newErrors.email = "";
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = {
          ...user,
          name: formData.name,
          email: formData.email,
          homeCountry: formData.homeCountry || user.homeCountry,
          destinationCountry: formData.destinationCountry || user.destinationCountry,
          educationBackground: {
            ...user.educationBackground,
            level: formData.educationLevel,
          },
          careerGoal: formData.careerGoal,
          bio: formData.bio,
        };
        
        setUser(updatedUser);
        
        Alert.alert(
          "Profile Updated",
          "Your profile has been successfully updated.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "There was an issue updating your profile. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderEducationLevelSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Education Level</Text>
      <View style={styles.optionsGrid}>
        {educationLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.optionButton,
              formData.educationLevel === level.value && styles.optionButtonActive,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, educationLevel: level.value }))}
          >
            <Text style={[
              styles.optionButtonText,
              formData.educationLevel === level.value && styles.optionButtonTextActive,
            ]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  const renderCareerGoalSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Career Interest</Text>
      <View style={styles.optionsGrid}>
        {careerGoals.map((goal) => (
          <TouchableOpacity
            key={goal}
            style={[
              styles.optionButton,
              formData.careerGoal === goal && styles.optionButtonActive,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, careerGoal: goal }))}
          >
            <Text style={[
              styles.optionButtonText,
              formData.careerGoal === goal && styles.optionButtonTextActive,
            ]}>
              {goal}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User data not available</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Picture Section */}
      <Card style={styles.avatarCard} variant="elevated">
        <View style={styles.avatarSection}>
          <Avatar
            size="large"
            name={formData.name}
            showBorder
          />
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarTitle}>Profile Picture</Text>
            <Text style={styles.avatarSubtitle}>
              Your avatar is generated from your name
            </Text>
          </View>
        </View>
      </Card>
      
      {/* Basic Information */}
      <Card style={styles.section} variant="default">
        <View style={styles.sectionHeader}>
          <User size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>
        
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          error={errors.name}
          autoCapitalize="words"
        />
        
        <Input
          label="Email Address"
          placeholder="Enter your email address"
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Input
          label="Bio (Optional)"
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
          multiline
          numberOfLines={3}
          style={styles.bioInput}
        />
      </Card>
      
      {/* Location Information */}
      <Card style={styles.section} variant="default">
        <View style={styles.sectionHeader}>
          <MapPin size={20} color={Colors.secondary} />
          <Text style={styles.sectionTitle}>Location</Text>
        </View>
        
        <CountrySelector
          label="Home Country"
          value={formData.homeCountry}
          onChange={(country) => setFormData(prev => ({ ...prev, homeCountry: country }))}
          countries={countries}
          error={errors.homeCountry}
        />
        
        <CountrySelector
          label="Destination Country"
          value={formData.destinationCountry}
          onChange={(country) => setFormData(prev => ({ ...prev, destinationCountry: country }))}
          countries={countries}
          error={errors.destinationCountry}
        />
      </Card>
      
      {/* Education Information */}
      <Card style={styles.section} variant="default">
        <View style={styles.sectionHeader}>
          <GraduationCap size={20} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Education</Text>
        </View>
        
        {renderEducationLevelSelector()}
      </Card>
      
      {/* Career Goals */}
      <Card style={styles.section} variant="default">
        <View style={styles.sectionHeader}>
          <Target size={20} color={Colors.success} />
          <Text style={styles.sectionTitle}>Career Goals</Text>
        </View>
        
        {renderCareerGoalSelector()}
      </Card>
      
      {/* Save Button */}
      <Button
        title="Save Changes"
        onPress={handleSave}
        loading={isLoading}
        icon={<Save size={20} color={Colors.white} />}
        fullWidth
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarCard: {
    marginBottom: 20,
    padding: 20,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarInfo: {
    marginLeft: 16,
    flex: 1,
  },
  avatarTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  avatarSubtitle: {
    fontSize: 14,
    color: Colors.lightText,
  },
  section: {
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 8,
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  optionButtonTextActive: {
    color: Colors.white,
  },
  saveButton: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginTop: 20,
  },
});
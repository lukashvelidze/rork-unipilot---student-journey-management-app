import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useDocumentStore } from "@/store/documentStore";
import { DocumentType } from "@/types/user";
import { generateId } from "@/utils/helpers";

export default function NewDocumentScreen() {
  const router = useRouter();
  const { addDocument } = useDocumentStore();
  
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("passport");
  const [expiryDate, setExpiryDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    expiryDate: "",
    reminderDate: "",
  });
  
  const documentTypes: { value: DocumentType; label: string }[] = [
    { value: "passport", label: "Passport" },
    { value: "visa", label: "Visa" },
    { value: "i20", label: "I-20" },
    { value: "admission_letter", label: "Admission Letter" },
    { value: "financial_documents", label: "Financial Documents" },
    { value: "transcripts", label: "Transcripts" },
    { value: "test_scores", label: "Test Scores" },
    { value: "health_insurance", label: "Health Insurance" },
    { value: "other", label: "Other" },
  ];
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!name.trim()) {
      newErrors.name = "Document name is required";
      isValid = false;
    } else {
      newErrors.name = "";
    }
    
    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = "Please use YYYY-MM-DD format";
      isValid = false;
    } else {
      newErrors.expiryDate = "";
    }
    
    if (reminderDate && !/^\d{4}-\d{2}-\d{2}$/.test(reminderDate)) {
      newErrors.reminderDate = "Please use YYYY-MM-DD format";
      isValid = false;
    } else {
      newErrors.reminderDate = "";
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      const now = new Date();
      const expiry = expiryDate ? new Date(expiryDate) : null;
      
      let status: "valid" | "expiring_soon" | "expired" | "pending" = "valid";
      
      if (expiry) {
        if (expiry < now) {
          status = "expired";
        } else {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(now.getDate() + 30);
          
          if (expiry <= thirtyDaysFromNow) {
            status = "expiring_soon";
          }
        }
      }
      
      const newDocument = {
        id: generateId(),
        type,
        name,
        expiryDate: expiryDate || undefined,
        reminderDate: reminderDate || undefined,
        status,
      };
      
      addDocument(newDocument);
      
      Alert.alert(
        "Success",
        "Document added successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add New Document</Text>
      
      <Input
        label="Document Name"
        placeholder="Enter document name"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
      
      <Text style={styles.label}>Document Type</Text>
      <View style={styles.typeContainer}>
        {documentTypes.map((docType) => (
          <Button
            key={docType.value}
            title={docType.label}
            variant={type === docType.value ? "primary" : "outline"}
            size="small"
            onPress={() => setType(docType.value)}
            style={styles.typeButton}
          />
        ))}
      </View>
      
      <Input
        label="Expiry Date (YYYY-MM-DD)"
        placeholder="e.g., 2025-12-31"
        value={expiryDate}
        onChangeText={setExpiryDate}
        error={errors.expiryDate}
        rightIcon={<Calendar size={20} color={Colors.lightText} />}
      />
      
      <Input
        label="Reminder Date (YYYY-MM-DD)"
        placeholder="e.g., 2025-11-30"
        value={reminderDate}
        onChangeText={setReminderDate}
        error={errors.reminderDate}
        rightIcon={<Calendar size={20} color={Colors.lightText} />}
      />
      
      <Button
        title="Add Document"
        onPress={handleSubmit}
        style={styles.submitButton}
        fullWidth
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  typeButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 24,
  },
});
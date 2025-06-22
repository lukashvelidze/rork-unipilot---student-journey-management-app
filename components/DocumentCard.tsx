import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { FileText, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import Card from "./Card";
import { Document } from "@/types/user";
import { formatDate, isDateExpired, isDateExpiringSoon } from "@/utils/dateUtils";
import { getDocumentStatusColor } from "@/utils/helpers";

interface DocumentCardProps {
  document: Document;
  onPress?: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPress }) => {
  const getStatusIcon = () => {
    switch (document.status) {
      case "valid":
        return <CheckCircle size={18} color={Colors.success} />;
      case "expiring_soon":
        return <Clock size={18} color={Colors.warning} />;
      case "expired":
        return <AlertCircle size={18} color={Colors.error} />;
      case "pending":
        return <Clock size={18} color={Colors.lightText} />;
      default:
        return null;
    }
  };

  const getDocumentTypeIcon = () => {
    return <FileText size={24} color={Colors.primary} />;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>{getDocumentTypeIcon()}</View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{document.name}</Text>
            <View style={styles.statusContainer}>
              {getStatusIcon()}
              <Text
                style={[
                  styles.statusText,
                  { color: getDocumentStatusColor(document.status) },
                ]}
              >
                {document.status.replace("_", " ").charAt(0).toUpperCase() + 
                 document.status.replace("_", " ").slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {document.expiryDate && (
          <View style={styles.expiryContainer}>
            <Calendar size={16} color={Colors.lightText} style={styles.calendarIcon} />
            <Text
              style={[
                styles.expiryText,
                isDateExpired(document.expiryDate)
                  ? styles.expiredText
                  : isDateExpiringSoon(document.expiryDate)
                  ? styles.expiringSoonText
                  : null,
              ]}
            >
              {isDateExpired(document.expiryDate)
                ? "Expired on "
                : "Expires on "}
              {formatDate(document.expiryDate)}
            </Text>
          </View>
        )}

        {document.reminderDate && (
          <View style={styles.reminderContainer}>
            <Clock size={16} color={Colors.lightText} style={styles.calendarIcon} />
            <Text style={styles.reminderText}>
              Reminder set for {formatDate(document.reminderDate)}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    marginLeft: 4,
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  calendarIcon: {
    marginRight: 6,
  },
  expiryText: {
    fontSize: 14,
    color: Colors.text,
  },
  expiredText: {
    color: Colors.error,
  },
  expiringSoonText: {
    color: Colors.warning,
  },
  reminderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reminderText: {
    fontSize: 14,
    color: Colors.lightText,
  },
});

export default DocumentCard;
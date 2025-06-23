// Previous imports remain the same...

export default function UniPilotAIScreen() {
  const router = useRouter();
  const { user, isPremium } = useUserStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Previous code remains the same...
  
  const handleSend = () => {
    if (!message.trim()) return;

    // Check if user has reached free message limit
    if (!isPremium && messageCount >= 3) {
      showPremiumAlert();
      return;
    }

    // Rest of the handleSend function remains the same...
  };

  // Previous code remains the same...
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Crown size={24} color="#FFD700" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>UniPilot AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isPremium ? "Premium Access" : `${3 - messageCount} free messages left`}
            </Text>
          </View>
        </View>
        {!isPremium && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/premium")}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rest of the component remains the same... */}
    </KeyboardAvoidingView>
  );
}

// Styles remain the same...
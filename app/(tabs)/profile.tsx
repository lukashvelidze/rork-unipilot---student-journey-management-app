// Previous imports remain the same...

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isPremium, logout } = useUserStore();
  
  // Previous code remains the same until the header section...
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Avatar
            size="large"
            name={user.name}
            showBorder
          />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color="#FFD700" />
                <Text style={styles.premiumText}>Premium Member</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Settings size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Rest of the component remains the same... */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Previous styles remain the same...
  
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  premiumText: {
    fontSize: 12,
    color: "#FFD700",
    marginLeft: 4,
    fontWeight: "600",
  },
});
// Previous imports remain the same...

export default function HomeScreen() {
  const router = useRouter();
  const { user, isPremium } = useUserStore();
  const { journeyProgress, setJourneyProgress, updateTask } = useJourneyStore();
  const { documents } = useDocumentStore();
  
  // Previous state and effects remain the same...
  
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Previous sections remain the same until Premium Section */}
        
        {/* Only show Premium Section if not premium */}
        {!isPremium && (
          <Card style={styles.premiumCard} variant="elevated" borderRadius="large">
            <View style={styles.premiumHeader}>
              <View style={styles.premiumTitleContainer}>
                <Crown size={22} color="#FFD700" style={styles.crownIcon} />
                <Text style={styles.premiumTitle}>UniPilot Premium</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>$4.99/mo</Text>
              </View>
            </View>
            
            <Text style={styles.premiumDescription}>
              Get personalized guidance from education experts and unlock premium resources for your international student journey.
            </Text>
            
            <View style={styles.premiumFeatures}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.primary} />
                <Text style={styles.featureText}>1-on-1 expert consultations</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.primary} />
                <Text style={styles.featureText}>Visa application guides</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={Colors.primary} />
                <Text style={styles.featureText}>University application templates</Text>
              </View>
            </View>
            
            <Button
              title="Upgrade to Premium"
              onPress={() => router.push("/premium")}
              variant="primary"
              size="medium"
              fullWidth
              icon={<Crown size={18} color={Colors.white} />}
              iconPosition="left"
              style={styles.premiumButton}
            />
          </Card>
        )}
        
        {/* Show Premium Resources Section if premium */}
        {isPremium && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Crown size={18} color="#FFD700" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Premium Resources</Text>
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.resourcesContainer}
            >
              <Card style={styles.resourceCard} variant="elevated" borderRadius="large">
                <View style={styles.resourceIconContainer}>
                  <FileText size={24} color={Colors.primary} />
                </View>
                <Text style={styles.resourceTitle}>Visa Guide</Text>
                <Text style={styles.resourceDescription}>
                  Step-by-step guide for student visa application
                </Text>
                <Button
                  title="View Guide"
                  onPress={() => router.push("/resources/visa-guide")}
                  variant="secondary"
                  size="small"
                  fullWidth
                />
              </Card>
              
              <Card style={styles.resourceCard} variant="elevated" borderRadius="large">
                <View style={styles.resourceIconContainer}>
                  <School size={24} color={Colors.secondary} />
                </View>
                <Text style={styles.resourceTitle}>Application Templates</Text>
                <Text style={styles.resourceDescription}>
                  University application templates and examples
                </Text>
                <Button
                  title="View Templates"
                  onPress={() => router.push("/resources/templates")}
                  variant="secondary"
                  size="small"
                  fullWidth
                />
              </Card>
              
              <Card style={styles.resourceCard} variant="elevated" borderRadius="large">
                <View style={styles.resourceIconContainer}>
                  <MessageCircle size={24} color="#4CAF50" />
                </View>
                <Text style={styles.resourceTitle}>Expert Chat</Text>
                <Text style={styles.resourceDescription}>
                  Chat with education experts
                </Text>
                <Button
                  title="Start Chat"
                  onPress={() => router.push("/resources/expert-chat")}
                  variant="secondary"
                  size="small"
                  fullWidth
                />
              </Card>
            </ScrollView>
          </View>
        )}
        
        {/* Rest of the sections remain the same */}
      </ScrollView>
    </>
  );
}

// Add new styles for premium resources
const styles = StyleSheet.create({
  // Previous styles remain the same...
  
  resourcesContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  resourceCard: {
    width: 200,
    marginRight: 16,
    padding: 16,
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 12,
    color: Colors.lightText,
    marginBottom: 12,
  },
});
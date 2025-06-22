import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Crown, Check, MessageCircle, Send, Lock, BookOpen, Award, FileCheck, GraduationCap, Briefcase } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium, setPremium } = useUserStore();
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Scroll to expert section if coming from home screen with #expert hash
  useEffect(() => {
    if (router.pathname.includes("#expert")) {
      setActiveTab("expert");
    }
  }, [router.pathname]);
  
  const handlePromoCodeSubmit = () => {
    if (promoCode.toLowerCase() === "admin") {
      setPremium(true);
      Alert.alert(
        "Success",
        "Promo code applied! You now have access to UniPilot Premium features.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Invalid Code",
        "The promo code you entered is not valid. Please try again or subscribe to access premium features.",
        [{ text: "OK" }]
      );
    }
  };
  
  const handleSubscribe = () => {
    Alert.alert(
      "Subscribe to UniPilot Premium",
      "This will start your subscription at $4.99/month after a 7-day free trial.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Subscribe",
          onPress: () => {
            setPremium(true);
            Alert.alert(
              "Subscription Successful",
              "Welcome to UniPilot Premium! You now have access to all premium features.",
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };
  
  const handleSendMessage = () => {
    if (message.trim()) {
      Alert.alert(
        "Message Sent",
        "An expert will respond to your message shortly.",
        [
          {
            text: "OK",
            onPress: () => setMessage(""),
          },
        ]
      );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "resources":
        return renderResourcesTab();
      case "expert":
        return renderExpertTab();
      case "guides":
        return renderGuidesTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => {
    if (!isPremium) {
      return (
        <View style={styles.subscriptionSection}>
          <Card style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Unlock Premium Features</Text>
            <Text style={styles.price}>$4.99<Text style={styles.perMonth}>/month</Text></Text>
            <Text style={styles.trialText}>7-day free trial, cancel anytime</Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>1-on-1 expert consultations</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>Visa application guides & templates</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>University application assistance</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>Personalized study abroad roadmap</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={18} color={Colors.primary} />
                <Text style={styles.featureText}>Priority support for all questions</Text>
              </View>
            </View>
            
            <Button
              title="Subscribe Now"
              onPress={handleSubscribe}
              style={styles.subscribeButton}
              fullWidth
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.promoContainer}>
              <Text style={styles.promoLabel}>Have a promo code?</Text>
              <View style={styles.promoInputContainer}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[
                    styles.promoButton,
                    !promoCode.trim() && styles.promoButtonDisabled,
                  ]}
                  onPress={handlePromoCodeSubmit}
                  disabled={!promoCode.trim()}
                >
                  <Text style={styles.promoButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
          
          <View style={styles.testimonialSection}>
            <Text style={styles.testimonialTitle}>What Students Say</Text>
            
            <Card style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                  style={styles.testimonialAvatar}
                />
                <View>
                  <Text style={styles.testimonialName}>Sarah Chen</Text>
                  <Text style={styles.testimonialInfo}>Harvard University, USA</Text>
                </View>
              </View>
              <Text style={styles.testimonialContent}>
                "The expert guidance from UniPilot Premium was invaluable during my visa application process. They helped me prepare for my interview and all my documents were approved on the first try!"
              </Text>
            </Card>
            
            <Card style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                  style={styles.testimonialAvatar}
                />
                <View>
                  <Text style={styles.testimonialName}>Miguel Rodriguez</Text>
                  <Text style={styles.testimonialInfo}>University of Toronto, Canada</Text>
                </View>
              </View>
              <Text style={styles.testimonialContent}>
                "Worth every penny! The personalized roadmap helped me stay on track with my applications, and the expert advice on scholarship applications helped me secure funding."
              </Text>
            </Card>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.premiumContent}>
          <Card style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome to Premium!</Text>
            <Text style={styles.welcomeText}>
              You now have access to all premium features including expert consultations, visa guides, and personalized assistance.
            </Text>
          </Card>
          
          <View style={styles.premiumOverviewSection}>
            <Text style={styles.sectionTitle}>Your Premium Benefits</Text>
            
            <View style={styles.benefitsGrid}>
              <TouchableOpacity 
                style={styles.benefitCard}
                onPress={() => setActiveTab("expert")}
              >
                <View style={[styles.benefitIcon, { backgroundColor: Colors.primaryLight }]}>
                  <MessageCircle size={24} color={Colors.primary} />
                </View>
                <Text style={styles.benefitTitle}>Expert Consultations</Text>
                <Text style={styles.benefitDescription}>
                  Chat with education advisors
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.benefitCard}
                onPress={() => setActiveTab("resources")}
              >
                <View style={[styles.benefitIcon, { backgroundColor: "#FFF8E1" }]}>
                  <FileCheck size={24} color="#FFA000" />
                </View>
                <Text style={styles.benefitTitle}>Premium Resources</Text>
                <Text style={styles.benefitDescription}>
                  Templates and guides
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.benefitCard}
                onPress={() => setActiveTab("guides")}
              >
                <View style={[styles.benefitIcon, { backgroundColor: "#E8F5E9" }]}>
                  <BookOpen size={24} color={Colors.secondary} />
                </View>
                <Text style={styles.benefitTitle}>Study Guides</Text>
                <Text style={styles.benefitDescription}>
                  Academic success strategies
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.benefitCard}
                onPress={() => router.push("/premium/roadmap")}
              >
                <View style={[styles.benefitIcon, { backgroundColor: "#F3E5F5" }]}>
                  <Award size={24} color="#9C27B0" />
                </View>
                <Text style={styles.benefitTitle}>Personalized Roadmap</Text>
                <Text style={styles.benefitDescription}>
                  Custom journey planning
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Coming Soon</Text>
            <Card style={styles.upcomingCard}>
              <View style={styles.upcomingHeader}>
                <GraduationCap size={24} color={Colors.primary} />
                <Text style={styles.upcomingTitle}>University Matching Service</Text>
              </View>
              <Text style={styles.upcomingDescription}>
                We're developing an AI-powered university matching service to help you find the perfect schools based on your profile, preferences, and goals.
              </Text>
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingBadgeText}>Coming in July</Text>
              </View>
            </Card>
          </View>
        </View>
      );
    }
  };

  const renderResourcesTab = () => {
    if (!isPremium) {
      return (
        <View style={styles.lockedContent}>
          <Lock size={48} color={Colors.lightText} />
          <Text style={styles.lockedTitle}>Premium Content Locked</Text>
          <Text style={styles.lockedDescription}>
            Subscribe to UniPilot Premium to access exclusive resources and templates
          </Text>
          <Button
            title="Subscribe Now"
            onPress={handleSubscribe}
            style={styles.lockedButton}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.resourcesContent}>
        <Text style={styles.resourcesTitle}>Premium Resources</Text>
        <Text style={styles.resourcesSubtitle}>
          Access exclusive guides, templates and tools to help with your international education journey
        </Text>
        
        <View style={styles.resourceCategorySection}>
          <Text style={styles.resourceCategoryTitle}>Visa Application</Text>
          
          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <FileCheck size={24} color={Colors.primary} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Student Visa Guide</Text>
              <Text style={styles.resourceDescription}>
                Comprehensive guide to student visa applications with country-specific tips
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <FileCheck size={24} color={Colors.primary} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Visa Interview Preparation</Text>
              <Text style={styles.resourceDescription}>
                Common questions and best practices for visa interviews
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.resourceCategorySection}>
          <Text style={styles.resourceCategoryTitle}>University Applications</Text>
          
          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Award size={24} color="#FFA000" />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Personal Statement Templates</Text>
              <Text style={styles.resourceDescription}>
                Winning personal statement examples with annotations and tips
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Award size={24} color="#FFA000" />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Scholarship Application Guide</Text>
              <Text style={styles.resourceDescription}>
                How to find and apply for international scholarships
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.resourceCategorySection}>
          <Text style={styles.resourceCategoryTitle}>Accommodation</Text>
          
          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <BookOpen size={24} color={Colors.secondary} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Housing Guide</Text>
              <Text style={styles.resourceDescription}>
                Finding student accommodation with country-specific advice
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <BookOpen size={24} color={Colors.secondary} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Rental Agreement Checklist</Text>
              <Text style={styles.resourceDescription}>
                What to look for in rental agreements and leases
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderExpertTab = () => {
    if (!isPremium) {
      return (
        <View style={styles.lockedContent}>
          <Lock size={48} color={Colors.lightText} />
          <Text style={styles.lockedTitle}>Expert Consultations Locked</Text>
          <Text style={styles.lockedDescription}>
            Subscribe to UniPilot Premium to chat with education experts
          </Text>
          <Button
            title="Subscribe Now"
            onPress={handleSubscribe}
            style={styles.lockedButton}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.expertContent}>
        <Text style={styles.expertTitle}>Talk to an Expert</Text>
        <Text style={styles.expertSubtitle}>
          Get personalized advice from our education consultants
        </Text>
        
        <Card style={styles.expertProfileCard}>
          <View style={styles.expertProfileHeader}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
              style={styles.expertProfileAvatar}
            />
            <View style={styles.expertProfileInfo}>
              <Text style={styles.expertProfileName}>Dr. Emma Wilson</Text>
              <Text style={styles.expertProfileTitle}>International Education Advisor</Text>
              <View style={styles.expertProfileBadge}>
                <Text style={styles.expertProfileBadgeText}>Available Now</Text>
              </View>
            </View>
          </View>
          <Text style={styles.expertProfileBio}>
            Dr. Wilson has 15+ years of experience helping international students navigate admissions to top universities in the US, UK, and Canada. She specializes in scholarship applications and visa processes.
          </Text>
        </Card>
        
        <Card style={styles.chatCard}>
          <View style={styles.chatHeader}>
            <View style={styles.expertInfo}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
                style={styles.expertAvatar}
              />
              <View>
                <Text style={styles.expertName}>Dr. Emma Wilson</Text>
                <Text style={styles.expertTitle}>International Education Advisor</Text>
              </View>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.chatMessages}>
            <View style={styles.expertMessage}>
              <Text style={styles.messageText}>
                Hello! I'm Dr. Wilson, your personal education advisor. How can I help with your international study plans today?
              </Text>
              <Text style={styles.messageTime}>Just now</Text>
            </View>
          </View>
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your message..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !message.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <Send size={20} color={message.trim() ? Colors.white : Colors.lightText} />
            </TouchableOpacity>
          </View>
        </Card>
        
        <View style={styles.otherExpertsSection}>
          <Text style={styles.otherExpertsTitle}>Other Available Experts</Text>
          
          <TouchableOpacity style={styles.otherExpertCard}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
              style={styles.otherExpertAvatar}
            />
            <View style={styles.otherExpertInfo}>
              <Text style={styles.otherExpertName}>Prof. James Chen</Text>
              <Text style={styles.otherExpertTitle}>Academic Advisor</Text>
            </View>
            <View style={styles.otherExpertBadge}>
              <Text style={styles.otherExpertBadgeText}>Available</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.otherExpertCard}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" }}
              style={styles.otherExpertAvatar}
            />
            <View style={styles.otherExpertInfo}>
              <Text style={styles.otherExpertName}>Maria Rodriguez</Text>
              <Text style={styles.otherExpertTitle}>Visa Specialist</Text>
            </View>
            <View style={styles.otherExpertBadge}>
              <Text style={styles.otherExpertBadgeText}>Available</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderGuidesTab = () => {
    if (!isPremium) {
      return (
        <View style={styles.lockedContent}>
          <Lock size={48} color={Colors.lightText} />
          <Text style={styles.lockedTitle}>Study Guides Locked</Text>
          <Text style={styles.lockedDescription}>
            Subscribe to UniPilot Premium to access academic success guides
          </Text>
          <Button
            title="Subscribe Now"
            onPress={handleSubscribe}
            style={styles.lockedButton}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.guidesContent}>
        <Text style={styles.guidesTitle}>Premium Study Guides</Text>
        <Text style={styles.guidesSubtitle}>
          Expert strategies to excel in your academic journey
        </Text>
        
        <TouchableOpacity style={styles.guideCard}>
          <View style={styles.guideIconContainer}>
            <Calendar size={24} color={Colors.primary} />
          </View>
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>Time Management for Students</Text>
            <Text style={styles.guideDescription}>
              Master your schedule and boost productivity with proven techniques
            </Text>
            <View style={styles.guideStats}>
              <Text style={styles.guideLength}>15 min read</Text>
              <Text style={styles.guideDifficulty}>Beginner</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.guideCard}>
          <View style={styles.guideIconContainer}>
            <BookOpen size={24} color={Colors.secondary} />
          </View>
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>Exam Preparation Strategies</Text>
            <Text style={styles.guideDescription}>
              Effective techniques for academic success in international universities
            </Text>
            <View style={styles.guideStats}>
              <Text style={styles.guideLength}>20 min read</Text>
              <Text style={styles.guideDifficulty}>Intermediate</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.guideCard}>
          <View style={styles.guideIconContainer}>
            <Briefcase size={24} color="#FF9800" />
          </View>
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>Research Paper Writing</Text>
            <Text style={styles.guideDescription}>
              From outline to final submission - a comprehensive guide
            </Text>
            <View style={styles.guideStats}>
              <Text style={styles.guideLength}>25 min read</Text>
              <Text style={styles.guideDifficulty}>Advanced</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.guideCard}>
          <View style={styles.guideIconContainer}>
            <GraduationCap size={24} color="#9C27B0" />
          </View>
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>Adapting to a New Academic System</Text>
            <Text style={styles.guideDescription}>
              How to thrive in different educational environments around the world
            </Text>
            <View style={styles.guideStats}>
              <Text style={styles.guideLength}>18 min read</Text>
              <Text style={styles.guideDifficulty}>Intermediate</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Crown size={32} color="#FFD700" style={styles.crownIcon} />
        <Text style={styles.title}>UniPilot Premium</Text>
        <Text style={styles.subtitle}>Expert guidance for your international education journey</Text>
      </View>
      
      {isPremium && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "overview" && styles.activeTab]}
            onPress={() => setActiveTab("overview")}
          >
            <Text style={[styles.tabText, activeTab === "overview" && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "resources" && styles.activeTab]}
            onPress={() => setActiveTab("resources")}
          >
            <Text style={[styles.tabText, activeTab === "resources" && styles.activeTabText]}>Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "expert" && styles.activeTab]}
            onPress={() => setActiveTab("expert")}
          >
            <Text style={[styles.tabText, activeTab === "expert" && styles.activeTabText]}>Expert</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "guides" && styles.activeTab]}
            onPress={() => setActiveTab("guides")}
          >
            <Text style={[styles.tabText, activeTab === "guides" && styles.activeTabText]}>Guides</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    paddingTop: Theme.spacing.l,
    paddingBottom: Theme.spacing.m,
    backgroundColor: Colors.background,
  },
  crownIcon: {
    marginBottom: Theme.spacing.s,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
    textAlign: "center",
    maxWidth: "80%",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.m,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
    fontWeight: Theme.fontWeight.medium,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.l,
    paddingBottom: Theme.spacing.xxl,
  },
  
  // Subscription Section
  subscriptionSection: {
    marginBottom: Theme.spacing.l,
  },
  pricingCard: {
    alignItems: "center",
    marginBottom: Theme.spacing.l,
  },
  pricingTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.m,
  },
  price: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
  },
  perMonth: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.regular,
    color: Colors.lightText,
  },
  trialText: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
    marginBottom: Theme.spacing.l,
  },
  featuresContainer: {
    alignSelf: "stretch",
    marginBottom: Theme.spacing.l,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.m,
  },
  featureText: {
    fontSize: Theme.fontSize.m,
    color: Colors.text,
    marginLeft: Theme.spacing.m,
  },
  subscribeButton: {
    marginBottom: Theme.spacing.m,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: Theme.spacing.m,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: Theme.spacing.m,
    color: Colors.lightText,
    fontSize: Theme.fontSize.s,
  },
  promoContainer: {
    width: "100%",
  },
  promoLabel: {
    fontSize: Theme.fontSize.s,
    color: Colors.text,
    marginBottom: Theme.spacing.s,
  },
  promoInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.m,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    fontSize: Theme.fontSize.m,
    marginRight: Theme.spacing.s,
  },
  promoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    borderRadius: Theme.borderRadius.m,
  },
  promoButtonDisabled: {
    backgroundColor: Colors.lightBackground,
  },
  promoButtonText: {
    color: Colors.white,
    fontWeight: Theme.fontWeight.semibold,
  },
  
  // Testimonial Section
  testimonialSection: {
    marginBottom: Theme.spacing.l,
  },
  testimonialTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.m,
  },
  testimonialCard: {
    marginBottom: Theme.spacing.m,
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.m,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Theme.spacing.m,
  },
  testimonialName: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  testimonialInfo: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
  },
  testimonialContent: {
    fontSize: Theme.fontSize.s,
    color: Colors.text,
    lineHeight: 20,
    fontStyle: "italic",
  },
  
  // Premium Content
  premiumContent: {
    marginBottom: Theme.spacing.l,
  },
  welcomeCard: {
    marginBottom: Theme.spacing.l,
    backgroundColor: Colors.primaryLight,
  },
  welcomeTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Theme.spacing.s,
  },
  welcomeText: {
    fontSize: Theme.fontSize.m,
    color: Colors.text,
    lineHeight: 22,
  },
  
  // Premium Overview Section
  premiumOverviewSection: {
    marginBottom: Theme.spacing.l,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.m,
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  benefitCard: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    ...Theme.shadow.small,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.s,
  },
  benefitTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
  },
  
  // Upcoming Section
  upcomingSection: {
    marginBottom: Theme.spacing.l,
  },
  upcomingCard: {
    backgroundColor: "#F5F5F5",
  },
  upcomingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.s,
  },
  upcomingTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginLeft: Theme.spacing.s,
  },
  upcomingDescription: {
    fontSize: Theme.fontSize.s,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Theme.spacing.s,
  },
  upcomingBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 16,
  },
  upcomingBadgeText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.white,
    fontWeight: Theme.fontWeight.medium,
  },
  
  // Locked Content
  lockedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.xl,
  },
  lockedTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginTop: Theme.spacing.m,
    marginBottom: Theme.spacing.s,
  },
  lockedDescription: {
    fontSize: Theme.fontSize.m,
    color: Colors.lightText,
    textAlign: "center",
    marginBottom: Theme.spacing.l,
    paddingHorizontal: Theme.spacing.l,
  },
  lockedButton: {
    width: "80%",
  },
  
  // Resources Tab
  resourcesContent: {
    marginBottom: Theme.spacing.l,
  },
  resourcesTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.s,
  },
  resourcesSubtitle: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
    marginBottom: Theme.spacing.l,
  },
  resourceCategorySection: {
    marginBottom: Theme.spacing.l,
  },
  resourceCategoryTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.m,
  },
  resourceCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    ...Theme.shadow.small,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
    lineHeight: 18,
  },
  
  // Expert Tab
  expertContent: {
    marginBottom: Theme.spacing.l,
  },
  expertTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.s,
  },
  expertSubtitle: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
    marginBottom: Theme.spacing.l,
  },
  expertProfileCard: {
    marginBottom: Theme.spacing.l,
  },
  expertProfileHeader: {
    flexDirection: "row",
    marginBottom: Theme.spacing.m,
  },
  expertProfileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Theme.spacing.m,
  },
  expertProfileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  expertProfileName: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  expertProfileTitle: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
    marginBottom: Theme.spacing.s,
  },
  expertProfileBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 16,
  },
  expertProfileBadgeText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.white,
    fontWeight: Theme.fontWeight.medium,
  },
  expertProfileBio: {
    fontSize: Theme.fontSize.s,
    color: Colors.text,
    lineHeight: 20,
  },
  chatCard: {
    padding: 0,
    marginBottom: Theme.spacing.l,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expertInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  expertAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Theme.spacing.m,
  },
  expertName: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
  },
  expertTitle: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  chatMessages: {
    padding: Theme.spacing.m,
    minHeight: 120,
  },
  expertMessage: {
    backgroundColor: Colors.lightBackground,
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    borderTopLeftRadius: 4,
    maxWidth: "80%",
    marginBottom: Theme.spacing.s,
  },
  messageText: {
    fontSize: Theme.fontSize.s,
    color: Colors.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    paddingHorizontal: Theme.spacing.m,
    paddingVertical: Theme.spacing.s,
    maxHeight: 100,
    fontSize: Theme.fontSize.s,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Theme.spacing.s,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.lightBackground,
  },
  otherExpertsSection: {
    marginBottom: Theme.spacing.l,
  },
  otherExpertsTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.m,
  },
  otherExpertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    ...Theme.shadow.small,
  },
  otherExpertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Theme.spacing.m,
  },
  otherExpertInfo: {
    flex: 1,
  },
  otherExpertName: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  otherExpertTitle: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
  },
  otherExpertBadge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: Theme.spacing.s,
    paddingVertical: 2,
    borderRadius: 12,
  },
  otherExpertBadgeText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.secondary,
    fontWeight: Theme.fontWeight.medium,
  },
  
  // Guides Tab
  guidesContent: {
    marginBottom: Theme.spacing.l,
  },
  guidesTitle: {
    fontSize: Theme.fontSize.l,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Theme.spacing.s,
  },
  guidesSubtitle: {
    fontSize: Theme.fontSize.s,
    color: Colors.lightText,
    marginBottom: Theme.spacing.l,
  },
  guideCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    ...Theme.shadow.small,
  },
  guideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.m,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: Theme.fontSize.m,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: Theme.fontSize.xs,
    color: Colors.lightText,
    lineHeight: 18,
    marginBottom: Theme.spacing.s,
  },
  guideStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  guideLength: {
    fontSize: Theme.fontSize.xs,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
    marginRight: Theme.spacing.m,
  },
  guideDifficulty: {
    fontSize: Theme.fontSize.xs,
    color: Colors.secondary,
    fontWeight: Theme.fontWeight.medium,
  },
});
import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Clock, BookOpen, Star, Download, Share, Heart, Bookmark } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import PaddleForm from "@/components/PaddleForm";
import { useUserStore } from "@/store/userStore";

const { width } = Dimensions.get("window");

interface ResourceContent {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  author: string;
  publishedDate: string;
  heroImage: string;
  content: {
    introduction: string;
    sections: {
      title: string;
      content: string;
      tips?: string[];
      examples?: string[];
    }[];
    conclusion: string;
    actionItems: string[];
  };
  relatedResources: string[];
}

const resourcesContent: Record<string, ResourceContent> = {
  "1": {
    id: "1",
    title: "Personal Statement Template",
    description: "Professional template for crafting compelling personal statements",
    category: "Application Materials",
    estimatedTime: "30 min",
    difficulty: "Intermediate",
    author: "Dr. Sarah Johnson",
    publishedDate: "2024-01-15",
    heroImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
    content: {
      introduction: "Your personal statement is your opportunity to tell your unique story and convince admissions committees why you're the perfect fit for their program. This comprehensive guide will walk you through creating a compelling personal statement that stands out.",
      sections: [
        {
          title: "Understanding the Purpose",
          content: "A personal statement serves multiple purposes: it showcases your personality, demonstrates your writing skills, explains your motivation, and highlights your unique experiences. Admissions committees read thousands of applications, so your statement needs to be memorable and authentic.",
          tips: [
            "Be authentic and genuine in your writing",
            "Show, don't just tell your experiences",
            "Connect your past experiences to future goals",
            "Demonstrate growth and self-reflection"
          ]
        },
        {
          title: "Structure and Format",
          content: "A well-structured personal statement typically follows a clear format: engaging opening, body paragraphs that tell your story, and a strong conclusion that ties everything together.",
          examples: [
            "Hook: Start with a compelling anecdote or question",
            "Body: 2-3 main themes or experiences",
            "Conclusion: Future goals and program fit"
          ]
        },
        {
          title: "Common Mistakes to Avoid",
          content: "Many applicants make similar mistakes that can weaken their personal statements. Being aware of these pitfalls can help you create a stronger application.",
          tips: [
            "Avoid clichés and generic statements",
            "Don't repeat information from other parts of your application",
            "Avoid being too modest or too boastful",
            "Don't exceed the word limit"
          ]
        }
      ],
      conclusion: "Remember, your personal statement is your chance to show who you are beyond grades and test scores. Take time to reflect on your experiences, be authentic in your writing, and clearly articulate why you're passionate about your chosen field of study.",
      actionItems: [
        "Brainstorm key experiences and themes",
        "Create an outline with main points",
        "Write your first draft",
        "Get feedback from mentors or advisors",
        "Revise and polish your statement",
        "Proofread for grammar and spelling"
      ]
    },
    relatedResources: ["2", "4", "8"]
  },
  "2": {
    id: "2",
    title: "University Research Guide",
    description: "Complete guide to researching and selecting the right universities",
    category: "Research",
    estimatedTime: "45 min",
    difficulty: "Beginner",
    author: "Prof. Michael Chen",
    publishedDate: "2024-01-20",
    heroImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop",
    content: {
      introduction: "Choosing the right university is one of the most important decisions in your academic journey. This comprehensive guide will help you research and evaluate universities systematically to find the perfect fit for your goals.",
      sections: [
        {
          title: "Defining Your Criteria",
          content: "Before diving into research, it's crucial to understand what you're looking for in a university. Consider factors like academic programs, location, campus culture, size, and financial considerations.",
          tips: [
            "List your must-haves vs. nice-to-haves",
            "Consider your learning style and preferences",
            "Think about career goals and industry connections",
            "Evaluate financial constraints realistically"
          ]
        },
        {
          title: "Research Methods and Resources",
          content: "There are numerous ways to gather information about universities. Use multiple sources to get a comprehensive view of each institution.",
          examples: [
            "Official university websites and virtual tours",
            "University rankings and guidebooks",
            "Student forums and social media groups",
            "Alumni networks and informational interviews",
            "University fairs and information sessions"
          ]
        },
        {
          title: "Evaluating Academic Programs",
          content: "The quality and fit of academic programs should be your primary consideration. Look beyond rankings to understand what makes a program excellent for your specific goals.",
          tips: [
            "Review curriculum and course offerings",
            "Research faculty expertise and research opportunities",
            "Check accreditation and program reputation",
            "Look at graduate outcomes and employment rates"
          ]
        }
      ],
      conclusion: "Thorough university research takes time, but it's an investment in your future. Use this systematic approach to evaluate your options and make an informed decision that aligns with your academic and career goals.",
      actionItems: [
        "Create a list of evaluation criteria",
        "Research 10-15 potential universities",
        "Create a comparison spreadsheet",
        "Attend virtual information sessions",
        "Connect with current students or alumni",
        "Narrow down to your top 5-8 choices"
      ]
    },
    relatedResources: ["1", "3", "5"]
  },
  "3": {
    id: "3",
    title: "Scholarship Application Masterclass",
    description: "Video series on finding and applying for scholarships",
    category: "Funding",
    estimatedTime: "2 hours",
    difficulty: "Intermediate",
    author: "Lisa Rodriguez",
    publishedDate: "2024-02-01",
    heroImage: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop",
    content: {
      introduction: "Scholarships can significantly reduce the financial burden of studying abroad. This masterclass will teach you how to find, apply for, and win scholarships that align with your profile and goals.",
      sections: [
        {
          title: "Types of Scholarships",
          content: "Understanding different types of scholarships helps you target your applications more effectively. Each type has different criteria and application processes.",
          examples: [
            "Merit-based scholarships (academic achievement)",
            "Need-based scholarships (financial circumstances)",
            "Demographic scholarships (background, identity)",
            "Field-specific scholarships (major or career focus)",
            "University-specific scholarships (institutional funding)"
          ]
        },
        {
          title: "Finding Scholarship Opportunities",
          content: "The key to scholarship success is finding opportunities that match your profile. Use multiple search strategies to uncover hidden gems.",
          tips: [
            "Use scholarship search engines and databases",
            "Check with your target universities directly",
            "Research professional associations in your field",
            "Look into government and foundation programs",
            "Network with alumni and current students"
          ]
        },
        {
          title: "Crafting Winning Applications",
          content: "A successful scholarship application tells a compelling story while meeting all requirements. Attention to detail and authentic storytelling are crucial.",
          tips: [
            "Read requirements carefully and follow instructions",
            "Tailor each application to the specific scholarship",
            "Highlight achievements relevant to the scholarship",
            "Get strong letters of recommendation",
            "Proofread everything multiple times"
          ]
        }
      ],
      conclusion: "Scholarship applications require time and effort, but the financial benefits make it worthwhile. Start early, stay organized, and apply to multiple opportunities to maximize your chances of success.",
      actionItems: [
        "Create a scholarship search strategy",
        "Build a master application with essays and documents",
        "Research and list 20+ potential scholarships",
        "Create an application timeline and deadlines",
        "Request letters of recommendation early",
        "Submit applications well before deadlines"
      ]
    },
    relatedResources: ["2", "7", "4"]
  }
};

export default function PremiumResourceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isPremium } = useUserStore();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const isUserPremium = isPremium || user?.isPremium || false;
  const resource = id ? resourcesContent[id] : null;
  
  if (!resource) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Resource not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }
  
  if (!isUserPremium) {
    return (
      <View style={styles.premiumContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.premiumGradient}
        >
          <Text style={styles.premiumTitle}>Premium Content</Text>
          <Text style={styles.premiumDescription}>
            This resource is only available to premium members. Upgrade to access all premium content and accelerate your study abroad journey.
          </Text>
          
          <View style={styles.premiumFeatures}>
            <Text style={styles.featuresTitle}>What you get with Premium:</Text>
            <Text style={styles.featureItem}>✓ Access to all premium resources</Text>
            <Text style={styles.featureItem}>✓ AI-powered guidance and recommendations</Text>
            <Text style={styles.featureItem}>✓ Exclusive templates and tools</Text>
            <Text style={styles.featureItem}>✓ Priority support and expert consultations</Text>
          </View>
          
          <PaddleForm
            productId="pro_01jyk34xa92kd6h2x3vw7sv5tf"
            priceId="pri_01jyk3h7eec66x5m7h31p66r8w"
            productName="UniPilot Premium"
            price="$4.99"
            buttonTitle="Subscribe $4.99"
            onSuccess={() => {
              console.log("🎉 Premium subscription successful from resource detail");
              // Refresh the page to show the content
              router.replace(`/premium/${id}`);
            }}
            onError={(error) => {
              console.error("💥 Premium subscription error from resource detail:", error);
            }}
          />
          
          <TouchableOpacity 
            style={styles.backToResourcesButton}
            onPress={() => router.push("/premium/resources")}
          >
            <Text style={styles.backToResourcesText}>Browse All Premium Resources</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return Colors.success;
      case "Intermediate": return Colors.warning;
      case "Advanced": return Colors.error;
      default: return Colors.primary;
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark 
              size={20} 
              color={isBookmarked ? Colors.primary : Colors.lightText}
              fill={isBookmarked ? Colors.primary : "none"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color={Colors.lightText} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: resource.heroImage }} style={styles.heroImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{resource.category}</Text>
              </View>
              <Text style={styles.heroTitle}>{resource.title}</Text>
              <Text style={styles.heroDescription}>{resource.description}</Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* Meta Information */}
        <Card style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.metaText}>{resource.estimatedTime}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <BookOpen size={16} color={Colors.secondary} />
              <Text style={[styles.metaText, { color: getDifficultyColor(resource.difficulty) }]}>
                {resource.difficulty}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Star size={16} color={Colors.warning} />
              <Text style={styles.metaText}>4.8 (124)</Text>
            </View>
          </View>
          
          <View style={styles.authorRow}>
            <Text style={styles.authorText}>By {resource.author}</Text>
            <Text style={styles.dateText}>
              {new Date(resource.publishedDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.likeButton, isLiked && styles.likeButtonActive]}
              onPress={() => setIsLiked(!isLiked)}
            >
              <Heart 
                size={16} 
                color={isLiked ? Colors.white : Colors.primary}
                fill={isLiked ? Colors.white : "none"}
              />
              <Text style={[styles.likeText, isLiked && styles.likeTextActive]}>
                {isLiked ? "Liked" : "Like"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.downloadButton}>
              <Download size={16} color={Colors.white} />
              <Text style={styles.downloadText}>Save for Offline</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Content */}
        <Card style={styles.contentCard}>
          <Text style={styles.introductionTitle}>Introduction</Text>
          <Text style={styles.introductionText}>{resource.content.introduction}</Text>
          
          {resource.content.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
              
              {section.tips && (
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>💡 Key Tips:</Text>
                  {section.tips.map((tip, tipIndex) => (
                    <View key={tipIndex} style={styles.tipItem}>
                      <View style={styles.tipBullet} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {section.examples && (
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>📋 Examples:</Text>
                  {section.examples.map((example, exampleIndex) => (
                    <View key={exampleIndex} style={styles.exampleItem}>
                      <Text style={styles.exampleText}>{example}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          
          <View style={styles.conclusionSection}>
            <Text style={styles.conclusionTitle}>Conclusion</Text>
            <Text style={styles.conclusionText}>{resource.content.conclusion}</Text>
          </View>
          
          <View style={styles.actionItemsSection}>
            <Text style={styles.actionItemsTitle}>🎯 Action Items</Text>
            {resource.content.actionItems.map((item, index) => (
              <View key={index} style={styles.actionItem}>
                <View style={styles.actionItemNumber}>
                  <Text style={styles.actionItemNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.actionItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </Card>
        
        {/* Related Resources */}
        <Card style={styles.relatedCard}>
          <Text style={styles.relatedTitle}>Related Resources</Text>
          <View style={styles.relatedList}>
            {resource.relatedResources.map((relatedId) => {
              const relatedResource = resourcesContent[relatedId];
              if (!relatedResource) return null;
              
              return (
                <TouchableOpacity
                  key={relatedId}
                  style={styles.relatedItem}
                  onPress={() => router.push(`/premium/${relatedId}`)}
                >
                  <Image 
                    source={{ uri: relatedResource.heroImage }} 
                    style={styles.relatedImage} 
                  />
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedItemTitle}>{relatedResource.title}</Text>
                    <Text style={styles.relatedItemCategory}>{relatedResource.category}</Text>
                    <Text style={styles.relatedItemTime}>{relatedResource.estimatedTime}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 20,
  },
  premiumContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  premiumGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  premiumDescription: {
    fontSize: 16,
    color: Colors.white,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  premiumFeatures: {
    marginBottom: 32,
    alignSelf: "stretch",
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  featureItem: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: 8,
    textAlign: "center",
  },
  backToResourcesButton: {
    marginTop: 16,
    padding: 12,
  },
  backToResourcesText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    position: "relative",
    height: 300,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  categoryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 22,
  },
  metaCard: {
    margin: 16,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  authorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  authorText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 12,
    color: Colors.lightText,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  likeButtonActive: {
    backgroundColor: Colors.primary,
  },
  likeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  likeTextActive: {
    color: Colors.white,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    gap: 6,
  },
  downloadText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "500",
  },
  contentCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  introductionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  introductionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  tipsContainer: {
    backgroundColor: Colors.lightBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  examplesContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  exampleItem: {
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontStyle: "italic",
  },
  conclusionSection: {
    backgroundColor: Colors.primary + "10",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  conclusionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  conclusionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  actionItemsSection: {
    backgroundColor: Colors.success + "10",
    padding: 20,
    borderRadius: 12,
  },
  actionItemsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  actionItemNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  actionItemNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },
  actionItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  relatedCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  relatedList: {
    gap: 12,
  },
  relatedItem: {
    flexDirection: "row",
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    overflow: "hidden",
  },
  relatedImage: {
    width: 80,
    height: 80,
  },
  relatedContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  relatedItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  relatedItemCategory: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 2,
  },
  relatedItemTime: {
    fontSize: 12,
    color: Colors.lightText,
  },
});
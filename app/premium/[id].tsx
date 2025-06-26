import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Clock, BookOpen, Star, Download, Share, Heart, Bookmark, Play, Users, Target, CheckCircle, ExternalLink, Zap, Award, TrendingUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

const { width } = Dimensions.get("window");

interface ResourceContent {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "guide" | "video" | "webinar" | "tool" | "template" | "course" | "calculator";
  estimatedTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  author: string;
  publishedDate: string;
  heroImage: string;
  features: string[];
  content: {
    introduction: string;
    sections: {
      title: string;
      content: string;
      tips?: string[];
      examples?: string[];
      tools?: string[];
    }[];
    conclusion: string;
    actionItems: string[];
  };
  relatedResources: string[];
  tools?: {
    name: string;
    description: string;
    action: string;
  }[];
  downloads?: {
    name: string;
    type: string;
    size: string;
  }[];
}

const resourcesContent: Record<string, ResourceContent> = {
  "1": {
    id: "1",
    title: "Personal Statement Masterclass",
    description: "Complete guide to writing compelling personal statements that get you accepted",
    category: "Application Materials",
    type: "guide",
    estimatedTime: "45 min",
    difficulty: "Intermediate",
    author: "Dr. Sarah Johnson",
    publishedDate: "2024-01-15",
    heroImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
    features: ["Step-by-step guide", "Real examples", "Expert feedback", "Templates included"],
    content: {
      introduction: "Your personal statement is your opportunity to tell your unique story and convince admissions committees why you're the perfect fit for their program. This comprehensive masterclass will walk you through creating a compelling personal statement that stands out from thousands of applications.",
      sections: [
        {
          title: "Understanding the Purpose",
          content: "A personal statement serves multiple critical purposes: it showcases your personality beyond grades, demonstrates your writing skills, explains your motivation for the field, and highlights your unique experiences. Admissions committees read thousands of applications, so your statement needs to be memorable, authentic, and compelling.",
          tips: [
            "Be authentic and genuine in your writing - admissions officers can spot fake stories",
            "Show, don't just tell your experiences with specific examples",
            "Connect your past experiences to future goals clearly",
            "Demonstrate growth and self-reflection throughout your journey"
          ]
        },
        {
          title: "Structure and Format",
          content: "A well-structured personal statement typically follows a clear format: engaging opening that hooks the reader, body paragraphs that tell your story chronologically or thematically, and a strong conclusion that ties everything together and looks forward.",
          examples: [
            "Hook: Start with a compelling anecdote, question, or moment of realization",
            "Body: 2-3 main themes or transformative experiences",
            "Conclusion: Future goals and how this program fits your journey"
          ],
          tools: [
            "Personal Statement Template",
            "Structure Checker",
            "Word Count Optimizer"
          ]
        },
        {
          title: "Common Mistakes to Avoid",
          content: "Many applicants make similar mistakes that can weaken their personal statements. Being aware of these pitfalls can help you create a stronger, more impactful application that stands out for the right reasons.",
          tips: [
            "Avoid clichés and generic statements like 'I want to help people'",
            "Don't repeat information from other parts of your application",
            "Avoid being too modest or too boastful - find the right balance",
            "Don't exceed the word limit - every word should count",
            "Avoid controversial topics unless directly relevant to your field"
          ]
        },
        {
          title: "Advanced Writing Techniques",
          content: "Take your personal statement to the next level with advanced writing techniques that create emotional connection and memorable impact.",
          tips: [
            "Use the 'show, don't tell' principle with vivid examples",
            "Create narrative tension and resolution",
            "Use sensory details to make your experiences come alive",
            "Employ the 'so what?' test for every paragraph"
          ]
        }
      ],
      conclusion: "Remember, your personal statement is your chance to show who you are beyond grades and test scores. Take time to reflect on your experiences, be authentic in your writing, and clearly articulate why you're passionate about your chosen field. With the strategies and templates in this masterclass, you'll create a personal statement that opens doors to your dream university.",
      actionItems: [
        "Brainstorm key experiences and themes using our worksheet",
        "Create an outline with main points and supporting details",
        "Write your first draft using our template",
        "Get feedback from mentors, advisors, or our expert review service",
        "Revise and polish your statement using our checklist",
        "Proofread for grammar and spelling with our tools",
        "Submit with confidence!"
      ]
    },
    relatedResources: ["2", "4", "8"],
    tools: [
      {
        name: "Personal Statement Template",
        description: "Professional template with proven structure",
        action: "Download Template"
      },
      {
        name: "AI Writing Assistant",
        description: "Get suggestions and improvements",
        action: "Launch Tool"
      },
      {
        name: "Expert Review Service",
        description: "Get professional feedback",
        action: "Book Review"
      }
    ],
    downloads: [
      {
        name: "Personal Statement Template",
        type: "PDF",
        size: "2.3 MB"
      },
      {
        name: "Example Statements Collection",
        type: "PDF",
        size: "5.1 MB"
      },
      {
        name: "Brainstorming Worksheet",
        type: "PDF",
        size: "1.2 MB"
      }
    ]
  },
  "6": {
    id: "6",
    title: "AI Essay Generator",
    description: "Generate personalized essays, SOPs, and cover letters using advanced AI",
    category: "AI Tools",
    type: "tool",
    estimatedTime: "15 min",
    difficulty: "Beginner",
    author: "UniPilot AI Team",
    publishedDate: "2024-02-01",
    heroImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
    features: ["AI-powered writing", "Multiple formats", "Plagiarism check", "Expert review"],
    content: {
      introduction: "Harness the power of advanced AI to create compelling essays, statements of purpose, and cover letters. Our AI Essay Generator uses cutting-edge technology to help you craft personalized, high-quality content that reflects your unique story and goals.",
      sections: [
        {
          title: "How AI Writing Works",
          content: "Our AI Essay Generator uses advanced natural language processing to understand your background, goals, and requirements, then generates personalized content that maintains your authentic voice while ensuring professional quality and structure.",
          tips: [
            "Provide detailed information about your background and goals",
            "Be specific about the program and university you're applying to",
            "Review and personalize the generated content",
            "Use the AI as a starting point, not a final product"
          ]
        },
        {
          title: "Supported Document Types",
          content: "Generate various types of application documents with specialized templates and AI models trained for each format.",
          examples: [
            "Personal Statements for university applications",
            "Statements of Purpose for graduate programs",
            "Cover Letters for scholarship applications",
            "Motivation Letters for exchange programs",
            "Research Proposals for PhD applications"
          ]
        },
        {
          title: "Quality Assurance",
          content: "Every generated document goes through multiple quality checks to ensure originality, coherence, and professional standards.",
          tools: [
            "Plagiarism Detection",
            "Grammar and Style Checker",
            "Readability Analysis",
            "Expert Review Option"
          ]
        }
      ],
      conclusion: "The AI Essay Generator is a powerful tool to help you overcome writer's block and create compelling application documents. Remember to always review, personalize, and refine the generated content to ensure it truly represents your voice and story.",
      actionItems: [
        "Input your background information and goals",
        "Select the type of document you need",
        "Generate your first draft using AI",
        "Review and personalize the content",
        "Run plagiarism and grammar checks",
        "Get expert feedback if needed",
        "Finalize and submit your application"
      ]
    },
    relatedResources: ["1", "4", "11"],
    tools: [
      {
        name: "AI Essay Generator",
        description: "Generate personalized essays and SOPs",
        action: "Launch Generator"
      },
      {
        name: "Plagiarism Checker",
        description: "Ensure originality of your content",
        action: "Check Plagiarism"
      },
      {
        name: "Grammar Assistant",
        description: "Perfect your writing style",
        action: "Check Grammar"
      }
    ]
  },
  "9": {
    id: "9",
    title: "Flight Booking Masterclass",
    description: "Learn how to find the cheapest flights and travel hacks for students",
    category: "Travel",
    type: "guide",
    estimatedTime: "35 min",
    difficulty: "Beginner",
    author: "Travel Expert Mike Chen",
    publishedDate: "2024-02-10",
    heroImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop",
    features: ["Booking strategies", "Price alerts", "Route optimization", "Student discounts"],
    content: {
      introduction: "Master the art of finding cheap flights with proven strategies used by travel experts. This comprehensive guide will save you hundreds of dollars on your study abroad journey and teach you insider secrets that airlines don't want you to know.",
      sections: [
        {
          title: "Best Booking Strategies",
          content: "Learn when to book, how to find the best deals, and which tools to use for maximum savings on international flights.",
          tips: [
            "Book international flights 2-3 months in advance for best prices",
            "Use incognito mode to avoid price tracking cookies",
            "Compare prices across multiple booking sites",
            "Consider nearby airports for significant savings",
            "Be flexible with dates - mid-week flights are often cheaper"
          ]
        },
        {
          title: "Student Discounts and Special Deals",
          content: "Discover exclusive student discounts and special programs that can save you up to 50% on flights.",
          examples: [
            "Student Universe - exclusive student fares",
            "STA Travel - student and youth discounts",
            "Airline student programs - direct discounts",
            "Credit card travel rewards - maximize points",
            "Group booking discounts - travel with friends"
          ]
        },
        {
          title: "Advanced Search Techniques",
          content: "Use professional search techniques to find hidden deals and error fares that can save you thousands.",
          tools: [
            "Google Flights - comprehensive search",
            "Skyscanner - flexible date search",
            "Momondo - creative routing",
            "ITA Matrix - advanced search options"
          ]
        }
      ],
      conclusion: "With these strategies and tools, you'll be able to find the best flight deals and save money for your studies abroad. Remember to always book with reputable airlines and read the fine print before purchasing.",
      actionItems: [
        "Set up price alerts for your route",
        "Compare prices across multiple platforms",
        "Check for student discounts",
        "Consider alternative airports and routes",
        "Book at the optimal time",
        "Purchase travel insurance",
        "Prepare for your journey"
      ]
    },
    relatedResources: ["5", "7", "8"],
    tools: [
      {
        name: "Flight Price Tracker",
        description: "Track prices and get alerts",
        action: "Set Alert"
      },
      {
        name: "Route Optimizer",
        description: "Find the best routes and connections",
        action: "Optimize Route"
      },
      {
        name: "Student Discount Finder",
        description: "Find exclusive student deals",
        action: "Find Discounts"
      }
    ]
  }
};

export default function PremiumResourceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isPremium } = useUserStore();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  
  const resource = id ? resourcesContent[id] : null;
  
  if (!resource) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Resource not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }
  
  if (!isPremium) {
    return (
      <View style={styles.premiumContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.premiumGradient}
        >
          <Zap size={48} color={Colors.white} />
          <Text style={styles.premiumTitle}>Premium Content</Text>
          <Text style={styles.premiumDescription}>
            This resource is only available to premium members. Upgrade to access all premium content and accelerate your study abroad journey!
          </Text>
          <Button
            title="Upgrade to Premium"
            onPress={() => router.push("/premium")}
            style={styles.upgradeButton}
            icon={<Award size={20} color={Colors.white} />}
          />
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
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return Play;
      case "webinar": return Users;
      case "tool": return Target;
      case "course": return Award;
      case "calculator": return TrendingUp;
      default: return BookOpen;
    }
  };
  
  const handleToolAction = (tool: any) => {
    Alert.alert(
      tool.name,
      `${tool.description}\n\nThis tool is now available in your premium dashboard.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Tool", onPress: () => console.log(`Opening ${tool.name}`) },
      ]
    );
  };
  
  const handleDownload = (download: any) => {
    Alert.alert(
      "Download Ready",
      `${download.name} (${download.type}, ${download.size}) is ready for download.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Download", onPress: () => console.log(`Downloading ${download.name}`) },
      ]
    );
  };
  
  const TypeIcon = getTypeIcon(resource.type);
  
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
              <View style={styles.heroHeader}>
                <View style={styles.categoryBadge}>
                  <TypeIcon size={16} color={Colors.white} />
                  <Text style={styles.categoryText}>{resource.category}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{resource.type.toUpperCase()}</Text>
                </View>
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
          
          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's Included:</Text>
            <View style={styles.featuresList}>
              {resource.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <CheckCircle size={14} color={Colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
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
        
        {/* Tools Section */}
        {resource.tools && (
          <Card style={styles.toolsCard}>
            <Text style={styles.toolsTitle}>🛠️ Interactive Tools</Text>
            <View style={styles.toolsList}>
              {resource.tools.map((tool, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.toolItem}
                  onPress={() => handleToolAction(tool)}
                >
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                  <View style={styles.toolAction}>
                    <Text style={styles.toolActionText}>{tool.action}</Text>
                    <ExternalLink size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}
        
        {/* Content */}
        <Card style={styles.contentCard}>
          <Text style={styles.introductionTitle}>Introduction</Text>
          <Text style={styles.introductionText}>{resource.content.introduction}</Text>
          
          {/* Section Navigation */}
          <View style={styles.sectionNav}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {resource.content.sections.map((section, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sectionNavItem,
                    activeSection === index && styles.sectionNavItemActive
                  ]}
                  onPress={() => setActiveSection(index)}
                >
                  <Text style={[
                    styles.sectionNavText,
                    activeSection === index && styles.sectionNavTextActive
                  ]}>
                    {section.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Active Section Content */}
          {resource.content.sections.map((section, index) => (
            <View key={index} style={[styles.section, activeSection !== index && styles.sectionHidden]}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
              
              {section.tips && (
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>💡 Pro Tips:</Text>
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
              
              {section.tools && (
                <View style={styles.sectionToolsContainer}>
                  <Text style={styles.sectionToolsTitle}>🔧 Tools for this section:</Text>
                  {section.tools.map((tool, toolIndex) => (
                    <View key={toolIndex} style={styles.sectionToolItem}>
                      <Target size={14} color={Colors.primary} />
                      <Text style={styles.sectionToolText}>{tool}</Text>
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
        
        {/* Downloads Section */}
        {resource.downloads && (
          <Card style={styles.downloadsCard}>
            <Text style={styles.downloadsTitle}>📥 Downloads</Text>
            <View style={styles.downloadsList}>
              {resource.downloads.map((download, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.downloadItem}
                  onPress={() => handleDownload(download)}
                >
                  <View style={styles.downloadInfo}>
                    <Text style={styles.downloadName}>{download.name}</Text>
                    <Text style={styles.downloadMeta}>{download.type} • {download.size}</Text>
                  </View>
                  <Download size={20} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}
        
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
                  <ArrowRight size={16} color={Colors.lightText} />
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
    marginTop: 16,
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
  upgradeButton: {
    minWidth: 200,
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
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  typeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: Colors.white,
    fontSize: 10,
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
  featuresContainer: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
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
  toolsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  toolsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  toolsList: {
    gap: 12,
  },
  toolItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolInfo: {
    flex: 1,
    marginRight: 12,
  },
  toolName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 12,
    color: Colors.lightText,
  },
  toolAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toolActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
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
  sectionNav: {
    marginBottom: 24,
  },
  sectionNavItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionNavItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sectionNavText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text,
  },
  sectionNavTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: 32,
  },
  sectionHidden: {
    display: "none",
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
    marginBottom: 16,
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
  sectionToolsContainer: {
    backgroundColor: Colors.flightBackground,
    padding: 16,
    borderRadius: 12,
  },
  sectionToolsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  sectionToolItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  sectionToolText: {
    fontSize: 13,
    color: Colors.text,
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
  downloadsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  downloadsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  downloadsList: {
    gap: 12,
  },
  downloadItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  downloadMeta: {
    fontSize: 12,
    color: Colors.lightText,
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
    alignItems: "center",
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
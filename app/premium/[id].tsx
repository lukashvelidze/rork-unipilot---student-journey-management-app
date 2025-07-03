import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Clock, BookOpen, Star, Download, Share, Heart, Bookmark, Play, Users, Target, CheckCircle, ExternalLink, Zap, Award, TrendingUp, ChevronRight } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
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
      introduction: "Your personal statement is your opportunity to tell your unique story and convince admissions committees why you are the perfect fit for their program. This comprehensive masterclass will walk you through creating a compelling personal statement that stands out from thousands of applications.",
      sections: [
        {
          title: "Understanding the Purpose",
          content: "A personal statement serves multiple critical purposes: it showcases your personality beyond grades, demonstrates your writing skills, explains your motivation for the field, and highlights your unique experiences. Admissions committees read thousands of applications, so your statement needs to be memorable, authentic, and compelling.",
          tips: [
            "Be authentic and genuine in your writing - admissions officers can spot fake stories",
            "Show, do not just tell your experiences with specific examples",
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
            "Do not repeat information from other parts of your application",
            "Avoid being too modest or too boastful - find the right balance",
            "Do not exceed the word limit - every word should count",
            "Avoid controversial topics unless directly relevant to your field"
          ]
        },
        {
          title: "Advanced Writing Techniques",
          content: "Take your personal statement to the next level with advanced writing techniques that create emotional connection and memorable impact.",
          tips: [
            "Use the 'show, do not tell' principle with vivid examples",
            "Create narrative tension and resolution",
            "Use sensory details to make your experiences come alive",
            "Employ the 'so what?' test for every paragraph"
          ]
        }
      ],
      conclusion: "Remember, your personal statement is your chance to show who you are beyond grades and test scores. Take time to reflect on your experiences, be authentic in your writing, and clearly articulate why you are passionate about your chosen field. With the strategies and templates in this masterclass, you will create a personal statement that opens doors to your dream university.",
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
  "2": {
    id: "2",
    title: "University Selection Strategy",
    description: "Data-driven approach to selecting universities that match your profile and goals",
    category: "University Selection",
    type: "guide",
    estimatedTime: "60 min",
    difficulty: "Intermediate",
    author: "Prof. Michael Chen",
    publishedDate: "2024-01-20",
    heroImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop",
    features: ["University ranking analysis", "Admission probability calculator", "Cost comparison tool", "Program matching"],
    content: {
      introduction: "Choosing the right university is one of the most important decisions in your academic journey. This comprehensive guide provides a data-driven approach to university selection, helping you find institutions that align with your academic goals, financial situation, and career aspirations.",
      sections: [
        {
          title: "Research Methodology",
          content: "Effective university research goes beyond rankings. You need to consider multiple factors including program quality, faculty expertise, research opportunities, location, cost, and career outcomes. This section teaches you how to systematically evaluate universities using reliable data sources.",
          tips: [
            "Use multiple ranking systems, not just one",
            "Look at employment rates and salary data for graduates",
            "Consider the university's research output in your field",
            "Evaluate the diversity and international student support"
          ]
        },
        {
          title: "Admission Probability Analysis",
          content: "Understanding your chances of admission helps you create a balanced list of reach, match, and safety schools. Learn how to analyze admission statistics and position yourself as a competitive candidate.",
          examples: [
            "Reach schools: 10-30% admission probability",
            "Match schools: 40-70% admission probability", 
            "Safety schools: 80%+ admission probability"
          ]
        }
      ],
      conclusion: "A strategic approach to university selection significantly increases your chances of admission and ensures you find the best fit for your goals.",
      actionItems: [
        "Create a comprehensive university research spreadsheet",
        "Calculate your admission probability for each school",
        "Visit campuses or attend virtual information sessions",
        "Connect with current students and alumni"
      ]
    },
    relatedResources: ["1", "3", "analytics"],
    tools: [
      {
        name: "University Comparison Tool",
        description: "Compare universities side by side",
        action: "Launch Tool"
      }
    ]
  },
  "mentor": {
    id: "mentor",
    title: "Personal Mentor Access",
    description: "Get 1-on-1 guidance from university admission experts and successful alumni",
    category: "Mentoring",
    type: "tool",
    estimatedTime: "Ongoing",
    difficulty: "Beginner",
    author: "UniPilot Mentor Team",
    publishedDate: "2024-02-01",
    heroImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop",
    features: ["1-on-1 sessions", "Expert guidance", "Mock interviews", "Application review"],
    content: {
      introduction: "Connect with experienced mentors who have successfully navigated the study abroad journey. Our personal mentors provide tailored guidance, expert insights, and ongoing support to help you achieve your academic goals.",
      sections: [
        {
          title: "How Personal Mentoring Works",
          content: "Our mentoring program pairs you with experienced professionals who understand your specific field and destination country. Each mentor brings years of experience in admissions, career development, and international education.",
          tips: [
            "Schedule regular sessions to maintain momentum",
            "Come prepared with specific questions and goals",
            "Be open to feedback and constructive criticism",
            "Take notes during sessions for future reference"
          ]
        },
        {
          title: "Types of Mentoring Support",
          content: "Our mentors provide comprehensive support across all aspects of your study abroad journey, from initial planning to post-graduation career guidance.",
          examples: [
            "University selection and program matching",
            "Application strategy and timeline planning",
            "Personal statement and essay review",
            "Interview preparation and practice",
            "Scholarship application guidance",
            "Career planning and networking advice"
          ]
        },
        {
          title: "Mentor Expertise Areas",
          content: "Our diverse team of mentors covers all major fields of study and destination countries, ensuring you get specialized guidance for your specific goals.",
          tools: [
            "Engineering and Technology",
            "Business and Management",
            "Medicine and Healthcare",
            "Arts and Humanities",
            "Sciences and Research"
          ]
        }
      ],
      conclusion: "Personal mentoring is one of the most valuable investments you can make in your study abroad journey. Our mentors have helped thousands of students achieve their dreams and are committed to your success.",
      actionItems: [
        "Complete your profile to match with the right mentor",
        "Schedule your first consultation session",
        "Prepare questions and goals for your meeting",
        "Follow through on mentor recommendations",
        "Maintain regular communication",
        "Provide feedback to improve the experience"
      ]
    },
    relatedResources: ["analytics", "resources"],
    tools: [
      {
        name: "Mentor Matching",
        description: "Find the perfect mentor for your goals",
        action: "Find Mentor"
      },
      {
        name: "Session Scheduler",
        description: "Book your mentoring sessions",
        action: "Schedule Session"
      },
      {
        name: "Progress Tracker",
        description: "Track your mentoring progress",
        action: "View Progress"
      }
    ]
  },
  "analytics": {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Detailed progress tracking, success predictions, and performance insights",
    category: "Analytics",
    type: "tool",
    estimatedTime: "Ongoing",
    difficulty: "Intermediate",
    author: "UniPilot Analytics Team",
    publishedDate: "2024-02-15",
    heroImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    features: ["Progress tracking", "Success predictions", "Performance insights", "Goal setting"],
    content: {
      introduction: "Leverage the power of data to optimize your study abroad journey. Our advanced analytics provide deep insights into your progress, predict your success probability, and help you make data-driven decisions.",
      sections: [
        {
          title: "Progress Tracking",
          content: "Monitor your journey with comprehensive tracking across all stages of your study abroad process. Our analytics dashboard provides real-time insights into your progress and areas for improvement.",
          tips: [
            "Check your dashboard regularly for updates",
            "Set weekly and monthly progress goals",
            "Use insights to prioritize your tasks",
            "Compare your progress with successful students"
          ]
        },
        {
          title: "Success Prediction Models",
          content: "Our AI-powered models analyze thousands of successful applications to predict your likelihood of acceptance at different universities and programs.",
          examples: [
            "University acceptance probability",
            "Scholarship award likelihood",
            "Visa approval chances",
            "Program completion success rate"
          ]
        },
        {
          title: "Performance Benchmarking",
          content: "Compare your performance against successful students with similar profiles and goals to identify areas for improvement and optimization.",
          tools: [
            "Peer Comparison Dashboard",
            "Success Metrics Tracker",
            "Goal Achievement Monitor",
            "Performance Improvement Suggestions"
          ]
        }
      ],
      conclusion: "Data-driven decision making is crucial for study abroad success. Our analytics help you understand where you stand, what you need to improve, and how to optimize your chances of success.",
      actionItems: [
        "Set up your analytics dashboard",
        "Define your success metrics and goals",
        "Review weekly progress reports",
        "Act on improvement recommendations",
        "Track your success probability over time",
        "Celebrate milestone achievements"
      ]
    },
    relatedResources: ["mentor", "webinars"],
    tools: [
      {
        name: "Analytics Dashboard",
        description: "Comprehensive progress tracking",
        action: "View Dashboard"
      },
      {
        name: "Success Predictor",
        description: "AI-powered success predictions",
        action: "Check Predictions"
      },
      {
        name: "Goal Tracker",
        description: "Set and track your goals",
        action: "Manage Goals"
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
  
  const handleSubscribe = async () => {
    try {
      await WebBrowser.openBrowserAsync("https://lukashvelidze.github.io/unipilot/");
    } catch (error) {
      console.error("Error opening subscription page:", error);
      Alert.alert(
        "Error",
        "Unable to open subscription page. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };
  
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
            title="Subscribe Now - $4.99/month"
            onPress={handleSubscribe}
            style={[styles.upgradeButton, { backgroundColor: Colors.white }]}
            icon={<Award size={20} color={Colors.primary} />}
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
      `${tool.description}

This tool is now available in your premium dashboard.`,
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
                  <ChevronRight size={16} color={Colors.lightText} />
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
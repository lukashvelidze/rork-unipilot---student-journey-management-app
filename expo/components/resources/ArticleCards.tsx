import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  ArrowRight,
  BadgeDollarSign,
  Bookmark,
  BookOpen,
  Globe2,
  Home,
  Lock,
  MessageSquareText,
  Plane,
  Stamp,
} from "lucide-react-native";
import { CARD_SHADOW, RADIUS, UI } from "@/constants/design";
import { FALLBACK_ARTICLE_IMAGE } from "@/lib/articles";
import { Article } from "@/types/articles";

/** Icon for an article category slug/title. */
export const categoryIcon = (slugOrTitle: string) => {
  const key = slugOrTitle.toLowerCase();
  if (/scholar|fund|financ|money/.test(key)) return BadgeDollarSign;
  if (/visa|immigr/.test(key)) return Stamp;
  if (/hous|accommod|apartment|test-category/.test(key)) return Home;
  if (/flight|travel/.test(key)) return Plane;
  if (/country|guide/.test(key)) return Globe2;
  if (/interview/.test(key)) return MessageSquareText;
  return BookOpen;
};

const readLabel = (article: Article) =>
  article.reading_time_minutes ? `${article.reading_time_minutes} MIN READ` : "GUIDE";

type CardProps = {
  article: Article;
  saved: boolean;
  locked: boolean;
  onPress: () => void;
  onToggleSave: () => void;
};

function SaveButton({ saved, onPress, title }: { saved: boolean; onPress: () => void; title: string }) {
  return (
    <TouchableOpacity
      accessibilityLabel={saved ? `Remove ${title} from saved` : `Save ${title}`}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      hitSlop={12}
      onPress={() => {
        Haptics.selectionAsync().catch(() => null);
        onPress();
      }}
    >
      <Bookmark
        color={UI.primary}
        fill={saved ? UI.primary : "transparent"}
        size={18}
        strokeWidth={2}
      />
    </TouchableOpacity>
  );
}

function ReadBadge({ article, locked }: { article: Article; locked: boolean }) {
  return (
    <View style={styles.badge}>
      {locked ? <Lock color={UI.primary} size={10} strokeWidth={2.6} /> : null}
      <Text style={styles.badgeText}>{locked ? "PREMIUM" : readLabel(article)}</Text>
    </View>
  );
}

/**
 * Cover image, over a branded placeholder (category icon on soft coral) that
 * shows while loading and for guides without their own cover.
 */
function ArticleCover({ article }: { article: Article }) {
  const Icon = categoryIcon(article.categories[0]?.slug ?? article.categories[0]?.title ?? "");
  const hasCover = !!article.cover_image_url && article.cover_image_url !== FALLBACK_ARTICLE_IMAGE;
  return (
    <View style={styles.featuredImage}>
      <View style={styles.coverPlaceholder}>
        <Icon color={UI.primary} size={34} strokeWidth={1.5} />
      </View>
      {hasCover ? (
        <Image
          contentFit="cover"
          source={{ uri: article.cover_image_url as string }}
          style={StyleSheet.absoluteFill}
          transition={200}
        />
      ) : null}
    </View>
  );
}

/** Featured card with the cover image on the left. */
export function FeaturedArticleCard({ article, saved, locked, onPress, onToggleSave }: CardProps) {
  return (
    <Pressable
      accessibilityLabel={article.title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
    >
      <ArticleCover article={article} />
      <View style={styles.featuredBody}>
        <View style={styles.badgeRow}>
          <ReadBadge article={article} locked={locked} />
          <SaveButton onPress={onToggleSave} saved={saved} title={article.title} />
        </View>
        <Text numberOfLines={2} style={styles.featuredTitle}>
          {article.title}
        </Text>
        {article.summary ? (
          <Text numberOfLines={2} style={styles.summary}>
            {article.summary}
          </Text>
        ) : null}
        <View style={styles.readLink}>
          <Text style={styles.readLinkText}>Read guide</Text>
          <ArrowRight color={UI.primary} size={14} strokeWidth={2.4} />
        </View>
      </View>
    </Pressable>
  );
}

/** Text-only card (second featured slot, saved list, search results). */
export function CompactArticleCard({ article, saved, locked, onPress, onToggleSave }: CardProps) {
  return (
    <Pressable
      accessibilityLabel={article.title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.badgeRow}>
        <ReadBadge article={article} locked={locked} />
        <SaveButton onPress={onToggleSave} saved={saved} title={article.title} />
      </View>
      <Text numberOfLines={2} style={styles.compactTitle}>
        {article.title}
      </Text>
      {article.summary ? (
        <Text numberOfLines={2} style={styles.summary}>
          {article.summary}
        </Text>
      ) : null}
      <View style={styles.pill}>
        <Text style={styles.pillText}>Read guide</Text>
        <ArrowRight color={UI.primary} size={13} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  featured: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    flexDirection: "row",
    minHeight: 150,
    overflow: "hidden",
    ...CARD_SHADOW,
  },
  featuredImage: {
    backgroundColor: UI.primarySoft,
    overflow: "hidden",
    width: 118,
  },
  coverPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBody: {
    flex: 1,
    padding: 14,
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badge: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    color: UI.primary,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  featuredTitle: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
  },
  summary: {
    color: UI.textSecondary,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 5,
  },
  readLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 10,
  },
  readLinkText: {
    color: UI.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  compact: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    padding: 16,
    ...CARD_SHADOW,
  },
  compactTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
  },
  pill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: UI.primary,
    fontSize: 12.5,
    fontWeight: "700",
  },
});

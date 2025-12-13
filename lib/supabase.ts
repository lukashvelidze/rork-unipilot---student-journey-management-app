import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import {
  Article,
  ArticleFilters,
  ArticleInput,
  CommunityComment,
  CommunityCommentInput,
  CommunityUserProfile,
  CommunityPost,
  CommunityPostFilters,
  CommunityPostInput,
} from '@/types/community';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl!;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signUpWithEmail = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signInWithEmail = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * Create or update user profile
 * Ensures user is authenticated before insert/update to comply with RLS policies
 */
export async function createProfile(profileData: {
  full_name: string;
  email?: string;
  country_origin?: string;
  level_of_study?: string;
  destination_country?: string;
  visa_type?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert([{
      id: user.id, // MUST match auth.uid()
      full_name: profileData.full_name,
      email: profileData.email || user.email || undefined,
      country_origin: profileData.country_origin,
      level_of_study: profileData.level_of_study,
      destination_country: profileData.destination_country,
      visa_type: profileData.visa_type,
    }]);

  if (error) throw error;
  return data;
}

/**
 * Update user profile
 * Ensures user is authenticated before update to comply with RLS policies
 */
export async function updateProfile(updates: {
  full_name?: string;
  country_origin?: string;
  level_of_study?: string;
  destination_country?: string;
  visa_type?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
  return data;
}

/**
 * Helper function to get flag emoji from country code
 * Uses Unicode regional indicator symbols
 */
function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  
  // Convert country code to flag emoji
  // Each letter is converted to its regional indicator symbol
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

/**
 * Fetch origin and destination countries from Supabase
 * Returns both lists mapped to Country interface for use in onboarding dropdowns
 */
export async function getCountries() {
  const { data: origin, error: originError } = await supabase
    .from('origin_countries')
    .select('code, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (originError) throw originError;

  const { data: destination, error: destError } = await supabase
    .from('destination_countries')
    .select('code, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (destError) throw destError;

  // Map to Country interface with flags
  const originCountries = (origin || []).map(country => ({
    code: country.code,
    name: country.name,
    flag: getCountryFlag(country.code),
  }));

  const destinationCountries = (destination || []).map(country => ({
    code: country.code,
    name: country.name,
    flag: getCountryFlag(country.code),
    isPopularDestination: false, // Can be set based on database field if needed
  }));

  return { origin: originCountries, destination: destinationCountries };
}

/**
 * Generate a UUID v4
 * Safe implementation for React Native that avoids regex crashes in Hermes
 */
function generateUUID(): string {
  // Use a safer approach without regex to avoid Hermes crashes
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  let uuid = '';

  for (let i = 0; i < template.length; i++) {
    const c = template[i];
    if (c === 'x') {
      const r = Math.random() * 16 | 0;
      uuid += r.toString(16);
    } else if (c === 'y') {
      const r = Math.random() * 16 | 0;
      const v = (r & 0x3 | 0x8);
      uuid += v.toString(16);
    } else {
      uuid += c;
    }
  }

  return uuid;
}

/**
 * Convert local image URI to File (Expo-compatible)
 * Uses fetch().blob() then converts to File for Supabase Storage
 * File objects work perfectly with Supabase Storage in Expo
 * @param uri - Local file URI
 * @param filename - File name
 * @returns File object
 */
export async function uriToFile(uri: string, filename: string): Promise<File> {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  return new File([blob], filename, {
    type: blob.type || "image/jpeg",
  });
}

/**
 * Upload a document to Supabase storage and insert record into documents table
 * @param userId - User ID
 * @param categoryId - ID of the document category
 * @param fileUri - Local file URI
 * @param originalFileName - Original file name
 * @param fileExt - File extension (optional, will be detected from URI if not provided)
 * @returns The inserted document record
 */
export async function uploadDocument(userId: string, categoryId: string, fileUri: string, originalFileName: string, fileExt?: string) {
  if (!userId) throw new Error("User not authenticated");

  try {
    // Check if category is premium and user subscription
    const { data: category } = await supabase
      .from("document_categories")
      .select("is_premium")
      .eq("id", categoryId)
      .single();

    if (category?.is_premium) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", userId)
        .single();

      if (profile?.subscription_tier === "free") {
        throw new Error("Premium feature");
      }
    }

    // 1. Detect file extension from URI if not provided
    const ext = fileExt || fileUri.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${userId}/${categoryId}/${fileName}`;

    // 2. Convert URI -> File (File works perfectly with Supabase Storage in Expo)
    const file = await uriToFile(fileUri, fileName);

    // 3. Upload to Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // 4. Insert into documents table
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        category_id: categoryId,
        file_path: filePath,
        original_name: originalFileName,
        metadata: {}, // optional later
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
}

/**
 * Load document categories with their fields
 * @returns Array of document categories with nested fields
 */
export async function loadDocumentCategories() {
  const { data, error } = await supabase
    .from("document_categories")
    .select(`
      id,
      code,
      title,
      description,
      is_active,
      is_premium,
      sort_order,
      document_category_fields (
        id,
        label,
        field_name,
        field_type,
        is_required,
        options,
        sort_order
      )
    `)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Load user's saved documents with signed URLs for preview
 * @returns Array of user documents with preview URLs
 */
export async function loadUserDocuments() {
  // First check session to ensure we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error in loadUserDocuments:', sessionError);
    throw new Error(`Session error: ${sessionError.message}`);
  }
  
  if (!session || !session.user) {
    throw new Error('User not authenticated - no active session');
  }

  // Use user from session (more reliable than getUser() after navigation)
  const user = session.user;

  const { data: documents, error } = await supabase
    .from("documents")
    .select(`
      id,
      file_path,
      original_name,
      is_verified,
      is_rejected,
      admin_notes,
      created_at,
      document_categories (
        id,
        title,
        code
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Generate signed URLs for each document
  const documentsWithUrls = await Promise.all(
    (documents || []).map(async (doc) => {
      const { data: signedUrlData } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 60 * 60); // 1 hour expiry

      return {
        ...doc,
        preview_url: signedUrlData?.signedUrl || null,
      };
    })
  );

  return documentsWithUrls;
}

/**
 * Delete a document from storage and database
 * @param documentId - ID of the document to delete
 * @param filePath - Path to the file in storage
 */
export async function deleteDocument(documentId: string, filePath: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([filePath]);

  if (storageError) {
    throw storageError;
  }

  // Delete DB row (RLS will ensure user can only delete their own documents)
  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", user.id); // Extra safety check

  if (dbError) throw dbError;
}

export interface VisaTypeOption {
  id: string;
  code: string;
  title: string;
  description?: string | null;
}

const normalizeCountryCode = (code?: string | null) =>
  code && typeof code === "string" ? code.trim().toUpperCase() : null;

const normalizeVisaType = (code?: string | null) =>
  code && typeof code === "string" ? code.trim().toUpperCase() : null;

const normalizeVisaArray = (visaTypes?: string[] | null) => {
  if (!visaTypes || visaTypes.length === 0) {
    return null;
  }
  const normalized = visaTypes
    .map((visa) => normalizeVisaType(visa))
    .filter((visa): visa is string => !!visa);
  return normalized.length > 0 ? normalized : null;
};

const matchesArticleFilters = (article: Article, origin: string | null, visa: string | null) => {
  const originMatches =
    article.is_global ||
    !article.origin_country_code ||
    !origin ||
    normalizeCountryCode(article.origin_country_code) === origin;

  const visaList = article.visa_types?.map((value) => normalizeVisaType(value)).filter(Boolean) as string[] | undefined;
  const visaMatches =
    !article.visa_types ||
    !visaList ||
    visaList.length === 0 ||
    !visa ||
    visaList.includes(visa);

  return originMatches && visaMatches;
};

const matchesCommunityPostFilters = (
  post: CommunityPost,
  origin: string | null,
  visa: string | null,
  linkedArticleId?: string | null
) => {
  if (linkedArticleId && post.linked_article_id !== linkedArticleId) {
    return false;
  }

  const originMatches =
    !origin ||
    !post.origin_country_code ||
    normalizeCountryCode(post.origin_country_code) === origin;

  const visaMatches =
    !visa ||
    !post.visa_type ||
    normalizeVisaType(post.visa_type) === visa;

  return originMatches && visaMatches;
};

const buildCommentTree = (comments: CommunityComment[]): CommunityComment[] => {
  const map = new Map<string, CommunityComment>();
  const roots: CommunityComment[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  map.forEach((comment) => {
    if (comment.parent_id && map.has(comment.parent_id)) {
      const parent = map.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  return roots;
};

const isMissingColumnError = (error: any, column: string) => {
  if (!error) return false;
  if (error.code === "42703") return true;
  if (typeof error.message === "string" && error.message.includes(column)) return true;
  return false;
};

const payloadHasKey = (payload: Record<string, any>, key: string) =>
  Object.prototype.hasOwnProperty.call(payload, key);


export async function fetchVisaTypesForDestination(countryCode?: string | null) {
  const normalizedCode = normalizeCountryCode(countryCode);

  if (!normalizedCode) {
    return [];
  }

  const { data, error } = await supabase
    .from("visa_types")
    .select("id, code, title, description, is_active, country_code")
    .or(`country_code.eq.${normalizedCode},country_code.is.null`)
    .eq("is_active", true)
    .order("country_code", { ascending: false })
    .order("title", { ascending: true });

  if (error) throw error;

  return (data || []).map((visa) => ({
    id: visa.id,
    code: visa.code,
    title: visa.title,
    description: visa.description,
  })) as VisaTypeOption[];
}

export async function fetchArticles(filters: ArticleFilters): Promise<Article[]> {
  const destination = normalizeCountryCode(filters.destinationCountry);
  if (!destination) {
    throw new Error("Destination country is required");
  }

  const query = supabase
    .from("articles")
    .select("*")
    .eq("destination_country_code", destination)
    .order("updated_at", { ascending: false });

  if (!filters.includeDrafts) {
    query.eq("published", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  const normalizedOrigin = normalizeCountryCode(filters.originCountry || null);
  const normalizedVisa = normalizeVisaType(filters.visaType || null);
  const articles = (data || []) as Article[];

  if (!articles.length) {
    return [];
  }

  const authorIds = Array.from(
    new Set(articles.map((article) => article.author_id).filter((id): id is string => !!id))
  );
  const authorMap = new Map<string, ArticleAuthor>();

  if (authorIds.length > 0) {
    const { data: authors, error: authorError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", authorIds);

    if (authorError) {
      console.warn("Unable to load article authors:", authorError.message);
    }

    authors?.forEach((author: any) => {
      authorMap.set(author.id, {
        id: author.id,
        display_name: author.display_name || author.full_name || null,
        avatar_url: author.avatar_url || null,
        full_name: author.full_name || null,
      });
    });
  }

  return articles
    .filter((article) => matchesArticleFilters(article, normalizedOrigin, normalizedVisa))
    .map((article) => ({
      ...article,
      author: article.author_id ? authorMap.get(article.author_id) || null : null,
    }));
}

export async function upsertArticle(input: ArticleInput): Promise<Article> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const destination = normalizeCountryCode(input.destination_country_code);

  if (!destination) {
    throw new Error("Destination country code is required");
  }

  const upsertPayload: any = {
    title: input.title,
    summary: input.summary || null,
    content: input.content,
    destination_country_code: destination,
    origin_country_code: normalizeCountryCode(input.origin_country_code || null),
    visa_types: normalizeVisaArray(input.visa_types),
    is_global: !!input.is_global,
    published: input.published ?? true,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    upsertPayload.id = input.id;
    if (input.author_id) {
      upsertPayload.author_id = input.author_id;
    }
  } else if (input.author_id || user.id) {
    upsertPayload.author_id = input.author_id || user.id;
  }

  const upsertOnce = async (payload: any) => {
    return supabase
      .from("articles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
  };

  let { data, error } = await upsertOnce(upsertPayload);

  if (error && isMissingColumnError(error, "author_id") && payloadHasKey(upsertPayload, "author_id")) {
    const fallbackPayload = { ...upsertPayload };
    delete fallbackPayload.author_id;
    ({ data, error } = await upsertOnce(fallbackPayload));
  }

  if (error) throw error;
  return data as Article;
}

export async function deleteArticle(articleId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId);

  if (error) throw error;
}

export async function fetchCommunityPosts(filters: CommunityPostFilters): Promise<CommunityPost[]> {
  const destination = normalizeCountryCode(filters.destinationCountry);
  if (!destination) {
    throw new Error("Destination country is required");
  }

  const buildPostsQuery = (includeHiddenFilter: boolean) => {
    let query = supabase
      .from("community_posts")
      .select("*")
      .eq("destination_country_code", destination)
      .order("created_at", { ascending: false });

    if (includeHiddenFilter) {
      query = query.eq("is_hidden", false);
    }

    if (filters.linkedArticleId) {
      query = query.eq("linked_article_id", filters.linkedArticleId);
    }

    return query;
  };

  let { data, error } = await buildPostsQuery(true);

  if (error && isMissingColumnError(error, "is_hidden")) {
    ({ data, error } = await buildPostsQuery(false));
  }

  if (error) throw error;

  const posts = (data || []) as CommunityPost[];

  if (!posts.length) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const postUserIds = posts.map((post) => post.user_id).filter((id): id is string => !!id);
  const articleIds = posts.map((post) => post.linked_article_id).filter((id): id is string => !!id);

  const fetchCommentsQuery = (includeHiddenFilter: boolean) => {
    let query = supabase
      .from("community_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    if (includeHiddenFilter) {
      query = query.eq("is_hidden", false);
    }

    return query;
  };

  let { data: commentsData, error: commentsError } = await fetchCommentsQuery(true);

  if (commentsError && isMissingColumnError(commentsError, "is_hidden")) {
    ({ data: commentsData, error: commentsError } = await fetchCommentsQuery(false));
  }

  if (commentsError) throw commentsError;

  const comments = (commentsData || []) as CommunityComment[];
  const commentUserIds = comments.map((comment) => comment.user_id).filter((id): id is string => !!id);

  const uniqueUserIds = Array.from(new Set([...postUserIds, ...commentUserIds]));
  const authorMap = new Map<string, CommunityUserProfile>();

  if (uniqueUserIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", uniqueUserIds);

    if (profilesError) {
      console.warn("Unable to load community profiles:", profilesError.message);
    }

    profilesData?.forEach((profile: any) => {
      authorMap.set(profile.id, {
        id: profile.id,
        display_name: profile.display_name || profile.full_name || null,
        avatar_url: profile.avatar_url || null,
        bio: profile.bio || null,
        full_name: profile.full_name || null,
      });
    });
  }

  const articleMap = new Map<string, Pick<Article, "id" | "title">>();
  if (articleIds.length > 0) {
    const uniqueArticleIds = Array.from(new Set(articleIds));
    const { data: linkedArticles } = await supabase
      .from("articles")
      .select("id, title")
      .in("id", uniqueArticleIds);

    linkedArticles?.forEach((article) => {
      articleMap.set(article.id, article);
    });
  }

  const commentsByPost = new Map<string, CommunityComment[]>();
  comments.forEach((comment) => {
    const enrichedComment: CommunityComment = {
      ...comment,
      author: comment.user_id ? authorMap.get(comment.user_id) || null : null,
    };
    const bucket = commentsByPost.get(comment.post_id) || [];
    bucket.push(enrichedComment);
    commentsByPost.set(comment.post_id, bucket);
  });

  const normalizedOrigin = normalizeCountryCode(filters.originCountry || null);
  const normalizedVisa = normalizeVisaType(filters.visaType || null);

  return posts
    .map((post) => {
      const postComments = commentsByPost.get(post.id) || [];

      return {
        ...post,
        author: post.user_id ? authorMap.get(post.user_id) || null : null,
        article: post.linked_article_id ? articleMap.get(post.linked_article_id) || null : null,
        comments: buildCommentTree(postComments),
      } as CommunityPost;
    })
    .filter((post) => matchesCommunityPostFilters(post, normalizedOrigin, normalizedVisa, filters.linkedArticleId));
}

export async function createCommunityPost(input: CommunityPostInput): Promise<CommunityPost> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const destination = normalizeCountryCode(input.destination_country_code);
  if (!destination) {
    throw new Error("Destination country is required");
  }

  const payload: Record<string, any> = {
    title: input.title,
    body: input.body,
    destination_country_code: destination,
    origin_country_code: normalizeCountryCode(input.origin_country_code || null),
    visa_type: normalizeVisaType(input.visa_type || null),
    anonymous: !!input.anonymous,
    linked_article_id: input.linked_article_id || null,
    user_id: user.id,
  };

  const insertPost = async (body: Record<string, any>) =>
    supabase.from("community_posts").insert([body]).select("*").single();

  let { data, error } = await insertPost(payload);

  if (error && isMissingColumnError(error, "user_id") && payloadHasKey(payload, "user_id")) {
    const fallback = { ...payload };
    delete fallback.user_id;
    ({ data, error } = await insertPost(fallback));
  }

  if (error) throw error;

  return data as CommunityPost;
}

export async function createCommunityComment(input: CommunityCommentInput): Promise<CommunityComment> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  if (!input.post_id) {
    throw new Error("Post ID is required");
  }

  let payload: Record<string, any> = {
    post_id: input.post_id,
    body: input.body,
    anonymous: !!input.anonymous,
    parent_id: input.parent_id || null,
    user_id: user.id,
  };

  const insertComment = async (body: Record<string, any>) =>
    supabase.from("community_comments").insert([body]).select("*").single();

  while (true) {
    const { data, error } = await insertComment(payload);
    if (!error) {
      return data as CommunityComment;
    }

    if (isMissingColumnError(error, "parent_id") && payloadHasKey(payload, "parent_id")) {
      const { parent_id, ...rest } = payload;
      payload = rest;
      continue;
    }

    if (isMissingColumnError(error, "user_id") && payloadHasKey(payload, "user_id")) {
      const { user_id, ...rest } = payload;
      payload = rest;
      continue;
    }

    throw error;
  }
}

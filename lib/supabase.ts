import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl!;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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

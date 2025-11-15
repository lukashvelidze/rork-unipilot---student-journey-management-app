import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';

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


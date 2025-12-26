import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { JourneyStage, Memory, MemoryMood } from "@/types/user";

export interface CreateMemoryInput {
  title: string;
  description: string;
  stage: JourneyStage;
  mood?: MemoryMood;
  tags?: string[];
  mediaUri?: string | null;
}

const MEMORY_BUCKET = "user-memories";
const FALLBACK_MEMORY_IMAGE = "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&q=60";

const mapMemoryWithSignedUrl = async (record: any): Promise<Memory> => {
  let imageUrl = FALLBACK_MEMORY_IMAGE;

  if (record.media_path) {
    const { data } = await supabase.storage
      .from(MEMORY_BUCKET)
      .createSignedUrl(record.media_path, 60 * 60); // 1 hour

    imageUrl = data?.signedUrl || imageUrl;
  }

  return {
    id: record.id,
    title: record.title,
    description: record.description || "",
    date: record.created_at || new Date().toISOString(),
    stage: record.journey_stage as JourneyStage,
    mood: (record.feelings as MemoryMood) || undefined,
    tags: (record.tags as string[]) || [],
    imageUrl,
    storagePath: record.media_path || undefined,
  };
};

export async function fetchUserMemories(): Promise<Memory[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching memories:", error);
    throw error;
  }

  return Promise.all((data || []).map(mapMemoryWithSignedUrl));
}

function base64ToUint8Array(base64: string) {
  let binaryString: string;
  if (typeof atob === "function") {
    binaryString = atob(base64);
  } else {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let output = "";
    let buffer = 0;
    let bits = 0;
    for (const char of base64.replace(/=+$/, "")) {
      const value = chars.indexOf(char);
      if (value < 0) continue;
      buffer = (buffer << 6) | value;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    binaryString = output;
  }

  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function uploadMemoryMedia(userId: string, uri: string) {
  const ext = uri.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  // Validate the file exists and has size before reading
  const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
  if (!fileInfo.exists || (fileInfo.size ?? 0) === 0) {
    throw new Error("Could not read selected image. Please try again.");
  }

  // Read via FileSystem to avoid 0-byte blobs from fetch() on some platforms
  const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = base64ToUint8Array(base64Data);

  if (!bytes || bytes.length === 0) {
    throw new Error("Could not read selected image. Please try again.");
  }

  // Use Blob to avoid the File constructor limitations on some RN runtimes/simulators
  const blob = new Blob([bytes.buffer], { type: "image/jpeg" });
  if (!blob || (blob as any).size === 0) {
    throw new Error("Could not read selected image. Please try again.");
  }

  const { error } = await supabase.storage
    .from(MEMORY_BUCKET)
    .upload(filePath, blob, {
      upsert: false,
      contentType: "image/jpeg",
    });

  if (error) {
    console.error("Error uploading memory media:", error);
    throw error;
  }

  return filePath;
}

export async function createMemoryEntry(input: CreateMemoryInput): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  let mediaPath: string | null = null;

  if (input.mediaUri) {
    mediaPath = await uploadMemoryMedia(user.id, input.mediaUri);
  }

  const { data, error } = await supabase
    .from("memories")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      journey_stage: input.stage,
      feelings: input.mood,
      tags: input.tags && input.tags.length > 0 ? input.tags : [],
      media_path: mediaPath,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating memory:", error);
    throw error;
  }

  return mapMemoryWithSignedUrl(data);
}

export async function updateMemoryEntry(
  memoryId: string,
  updates: {
    title?: string;
    description?: string;
    stage?: JourneyStage;
    mood?: MemoryMood;
    tags?: string[];
    mediaUri?: string | null;
  }
): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch existing memory for storagePath
  const { data: existing } = await supabase
    .from("memories")
    .select("media_path")
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .single();

  let mediaPath = existing?.media_path || null;

  if (updates.mediaUri) {
    // Replace media
    mediaPath = await uploadMemoryMedia(user.id, updates.mediaUri);
    // Optionally clean old media
    if (existing?.media_path && existing.media_path !== mediaPath) {
      await supabase.storage.from(MEMORY_BUCKET).remove([existing.media_path]);
    }
  }

  const { data, error } = await supabase
    .from("memories")
    .update({
      title: updates.title,
      description: updates.description,
      journey_stage: updates.stage,
      feelings: updates.mood,
      tags: updates.tags,
      media_path: mediaPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating memory:", error);
    throw error;
  }

  return mapMemoryWithSignedUrl(data);
}

export async function deleteMemoryEntry(memoryId: string, storagePath?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  if (storagePath) {
    await supabase.storage.from(MEMORY_BUCKET).remove([storagePath]);
  }

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting memory:", error);
    throw error;
  }
}

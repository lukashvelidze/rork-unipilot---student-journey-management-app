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

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  heif: "image/heic",
  webp: "image/webp",
};

const getFileExtension = (uri: string) => {
  const clean = uri.split("?")[0];
  return (clean.split(".").pop() || "jpg").toLowerCase();
};

const guessContentType = (uri: string) => MIME_BY_EXTENSION[getFileExtension(uri)] || "image/jpeg";

async function uriToArrayBuffer(uri: string) {
  const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  if (!base64Data) {
    throw new Error("Could not read selected image. Please try again.");
  }

  const bytes = base64ToUint8Array(base64Data);
  if (!bytes || bytes.length === 0) {
    throw new Error("Could not read selected image. Please try again.");
  }

  return {
    arrayBuffer: bytes.buffer,
    contentType: guessContentType(uri),
  };
}

const mapMemoryWithSignedUrl = async (record: any): Promise<Memory> => {
  let imageUrl = FALLBACK_MEMORY_IMAGE;

  if (record.media_path) {
    const { data, error } = await supabase.storage
      .from(MEMORY_BUCKET)
      .createSignedUrl(record.media_path, 60 * 60); // 1 hour

    if (error) {
      console.warn("Failed to create signed URL for memory media:", error);
    }

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

async function uploadMemoryMedia(userId: string, uri: string, memoryId?: string) {
  const ext = getFileExtension(uri);
  const fileName = memoryId ? `${memoryId}.${ext}` : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  // Validate the file exists and has size before reading
  const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
  if (!fileInfo.exists || (fileInfo.size ?? 0) === 0) {
    throw new Error("Could not read selected image. Please try again.");
  }

  const { arrayBuffer, contentType } = await uriToArrayBuffer(uri);

  const { error } = await supabase.storage
    .from(MEMORY_BUCKET)
    .upload(filePath, arrayBuffer, {
      upsert: true,
      contentType,
    });

  if (error) {
    console.error("Error uploading memory media:", error);
    throw new Error("Failed to upload image. Please try again.");
  }

  return filePath;
}

export async function createMemoryEntry(input: CreateMemoryInput): Promise<Memory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: created, error: createError } = await supabase
    .from("memories")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      journey_stage: input.stage,
      feelings: input.mood,
      tags: input.tags && input.tags.length > 0 ? input.tags : [],
      media_path: null,
    })
    .select()
    .single();

  if (createError) {
    console.error("Error creating memory:", createError);
    throw createError;
  }

  let record = created;

  if (input.mediaUri) {
    let mediaPath: string | null = null;

    try {
      mediaPath = await uploadMemoryMedia(user.id, input.mediaUri, created.id);

      const { data: updated, error: updateError } = await supabase
        .from("memories")
        .update({
          media_path: mediaPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", created.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating memory with media path:", updateError);
        throw updateError;
      }

      record = updated;
    } catch (error) {
      // Clean up partial data if upload fails
      if (mediaPath) {
        await supabase.storage.from(MEMORY_BUCKET).remove([mediaPath]);
      }
      await supabase.from("memories").delete().eq("id", created.id).eq("user_id", user.id);
      throw error;
    }
  }

  return mapMemoryWithSignedUrl(record);
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
    const newPath = await uploadMemoryMedia(user.id, updates.mediaUri, memoryId);
    // Remove old media only after successful upload
    if (existing?.media_path && existing.media_path !== newPath) {
      await supabase.storage.from(MEMORY_BUCKET).remove([existing.media_path]);
    }
    mediaPath = newPath;
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

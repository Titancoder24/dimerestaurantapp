import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

/**
 * Pick an image from the user's library and upload it to a Supabase Storage
 * bucket. Returns a public URL on success.
 *
 * Path convention: <prefix>/<timestamp>-<random>.<ext>
 *   prefix is typically a restaurant_id, user_id, or order_id so RLS / cleanup
 *   policies can scope by ownership.
 */
export async function pickAndUpload(opts: {
  bucket: "restaurant-media" | "menu-media" | "review-media" | "avatars";
  prefix: string;
  quality?: number;
  aspect?: [number, number];
}): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: opts.quality ?? 0.8,
    allowsEditing: true,
    aspect: opts.aspect,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const ext = (asset.uri.split(".").pop() ?? "jpg").toLowerCase();
  const filename = `${opts.prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const fileBody = await fetch(asset.uri).then((r) => r.blob());

  const { error } = await supabase.storage.from(opts.bucket).upload(filename, fileBody, {
    contentType: asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(opts.bucket).getPublicUrl(filename);
  return data.publicUrl;
}

export async function pickMultipleAndUpload(opts: {
  bucket: "restaurant-media" | "menu-media" | "review-media";
  prefix: string;
  max?: number;
}): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: opts.max ?? 5,
  });
  if (result.canceled) return [];

  const urls: string[] = [];
  for (const asset of result.assets) {
    const ext = (asset.uri.split(".").pop() ?? "jpg").toLowerCase();
    const filename = `${opts.prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await fetch(asset.uri).then((r) => r.blob());
    const { error } = await supabase.storage.from(opts.bucket).upload(filename, blob, {
      contentType: asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`,
    });
    if (error) continue;
    const { data } = supabase.storage.from(opts.bucket).getPublicUrl(filename);
    urls.push(data.publicUrl);
  }
  return urls;
}

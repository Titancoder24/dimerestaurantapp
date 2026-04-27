import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { supabase } from "./supabase";

function resolveType(asset: ImagePicker.ImagePickerAsset): { ext: string; contentType: string } {
  if (asset.mimeType) {
    const ext = asset.mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    return { ext, contentType: asset.mimeType };
  }
  const match = asset.uri.match(/\.(jpe?g|png|gif|webp|heic)$/i);
  if (match) {
    const ext = match[1]!.toLowerCase().replace("jpeg", "jpg");
    return { ext, contentType: `image/${ext === "jpg" ? "jpeg" : ext}` };
  }
  return { ext: "jpg", contentType: "image/jpeg" };
}

async function readFileBody(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") {
    return fetch(uri).then((r) => r.arrayBuffer());
  }
  const FileSystem = require("expo-file-system") as typeof import("expo-file-system");
  const { decode } = require("base64-arraybuffer") as typeof import("base64-arraybuffer");
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decode(base64);
}

async function uploadAsset(
  asset: ImagePicker.ImagePickerAsset,
  opts: { bucket: string; prefix: string },
): Promise<string> {
  const { ext, contentType } = resolveType(asset);
  const filename = `${opts.prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const body = await readFileBody(asset.uri);
  const { error } = await supabase.storage.from(opts.bucket).upload(filename, body, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(opts.bucket).getPublicUrl(filename);
  return data.publicUrl;
}

export async function pickAndUpload(opts: {
  bucket: "restaurant-media" | "menu-media" | "review-media" | "avatars";
  prefix: string;
  quality?: number;
  aspect?: [number, number];
  source?: "gallery" | "camera";
}): Promise<string | null> {
  let result: ImagePicker.ImagePickerResult;

  if (opts.source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: opts.quality ?? 0.8,
      allowsEditing: true,
      aspect: opts.aspect,
    });
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: opts.quality ?? 0.8,
      allowsEditing: true,
      aspect: opts.aspect,
    });
  }

  if (result.canceled || !result.assets[0]) return null;
  return uploadAsset(result.assets[0], opts);
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
    const { ext, contentType } = resolveType(asset);
    const filename = `${opts.prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const body = await readFileBody(asset.uri);
    const { error } = await supabase.storage.from(opts.bucket).upload(filename, body, {
      contentType,
    });
    if (error) continue;
    const { data } = supabase.storage.from(opts.bucket).getPublicUrl(filename);
    urls.push(data.publicUrl);
  }
  return urls;
}

import { Platform } from "react-native";
import { supabase } from "./supabase";

export const bgRemoveSupported = Platform.OS === "web";

type RemoveFn = (input: Blob, config?: object) => Promise<Blob>;

let cached: RemoveFn | null = null;

async function loadRemover(): Promise<RemoveFn> {
  if (cached) return cached;
  const dynamicImport = new Function("url", "return import(url)") as (
    url: string,
  ) => Promise<{ removeBackground: RemoveFn }>;
  const mod = await dynamicImport(
    "https://esm.sh/@imgly/background-removal@1.5.8",
  );
  cached = mod.removeBackground;
  return cached;
}

export async function removeBackground(
  imageUrl: string,
  bucket: string,
  prefix: string,
): Promise<string> {
  if (Platform.OS !== "web") {
    throw new Error("Background removal is only available on web");
  }

  const remove = await loadRemover();

  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const result = await remove(blob, {
    output: { format: "image/png", quality: 0.9 },
  });

  const arrayBuf = await result.arrayBuffer();
  const filename = `${prefix}/${Date.now()}-nobg.png`;
  const { error } = await supabase.storage.from(bucket).upload(filename, arrayBuf, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

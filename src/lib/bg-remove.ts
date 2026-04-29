import { supabase } from "./supabase";

export const bgRemoveSupported = true;

export async function removeBackground(
  imageUrl: string,
  bucket: string,
  prefix: string,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await supabase.functions.invoke("remove-bg", {
    body: { imageUrl, bucket, prefix },
  });

  if (res.error) throw new Error(res.error.message ?? "Background removal failed");

  const { url } = res.data as { url: string };
  if (!url) throw new Error("No URL returned from background removal");
  return url;
}

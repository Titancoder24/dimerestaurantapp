import { supabase } from "@/lib/supabase";
import type { MenuDesign } from "./types";

export type SavedDesign = {
  id: string;
  restaurant_id: string;
  template_id: string;
  name: string;
  data: MenuDesign;
  created_at: string;
  updated_at: string;
};

export async function loadDesigns(restaurantId: string): Promise<SavedDesign[]> {
  const { data, error } = await supabase
    .from("menu_designs")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({ ...d, data: d.data as MenuDesign }));
}

export async function saveDesign(
  restaurantId: string,
  templateId: string,
  name: string,
  design: MenuDesign,
  existingId?: string,
): Promise<{ id: string }> {
  if (existingId) {
    const { error } = await supabase
      .from("menu_designs")
      .update({ name, data: design as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
      .eq("id", existingId);
    if (error) throw error;
    return { id: existingId };
  }
  const { data, error } = await supabase
    .from("menu_designs")
    .insert({
      restaurant_id: restaurantId,
      template_id: templateId,
      name,
      data: design as unknown as Record<string, unknown>,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function deleteDesign(id: string): Promise<void> {
  const { error } = await supabase.from("menu_designs").delete().eq("id", id);
  if (error) throw error;
}

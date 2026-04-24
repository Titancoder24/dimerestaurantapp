import { supabase, type Tables } from "@/lib/supabase";
import type { MenuData } from "./types";

type RestaurantRow = Pick<Tables<"restaurants">, "id" | "name" | "description" | "logo_url">;

/**
 * Fetches the restaurant's live menu and assembles it into the shape
 * the template renderers expect. Filters to in-stock items only.
 */
export async function buildMenuData(restaurantId: string, override?: Partial<MenuData>): Promise<MenuData> {
  const [rRes, cRes, iRes] = await Promise.all([
    supabase.from("restaurants").select("id, name, description, logo_url").eq("id", restaurantId).maybeSingle(),
    supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).eq("is_active", true).order("sort_order"),
    supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_available", true).order("sort_order"),
  ]);

  const restaurant = rRes.data as RestaurantRow | null;
  const cats = (cRes.data ?? []) as Tables<"menu_categories">[];
  const items = (iRes.data ?? []) as Tables<"menu_items">[];

  const sections = cats
    .map((c) => ({
      title: c.name,
      items: items
        .filter((i) => i.category_id === c.id)
        .map((i) => ({
          name: i.name,
          description: i.description,
          price: Number(i.price),
          is_veg: i.is_veg,
          is_bestseller: i.is_bestseller,
          spice_level: i.spice_level,
        })),
    }))
    .filter((s) => s.items.length > 0);

  // Items without a category go into "More"
  const orphans = items.filter((i) => !i.category_id);
  if (orphans.length) {
    sections.push({
      title: "More",
      items: orphans.map((i) => ({
        name: i.name,
        description: i.description,
        price: Number(i.price),
        is_veg: i.is_veg,
        is_bestseller: i.is_bestseller,
        spice_level: i.spice_level,
      })),
    });
  }

  return {
    restaurantName: override?.restaurantName ?? restaurant?.name ?? "Your Restaurant",
    tagline: override?.tagline ?? restaurant?.description ?? "",
    footnote: override?.footnote ?? "All prices in INR. Inclusive of all taxes unless mentioned.",
    logoUrl: override?.logoUrl ?? restaurant?.logo_url ?? null,
    sections: override?.sections ?? sections,
  };
}

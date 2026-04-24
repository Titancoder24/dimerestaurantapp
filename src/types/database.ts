// Hand-maintained DB types — mirrors supabase/migrations/*.
// For production, regenerate with: npm run db:types
// (which shells out to `supabase gen types typescript --project-id ...`).

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type UserRole = "customer" | "owner" | "manager" | "host" | "chef" | "cashier" | "server" | "super_admin";
type LoyaltyTier = "silver" | "gold" | "platinum" | "diamond";
type RestaurantType = "fine_dine" | "qsr" | "cafe" | "bar" | "bakery" | "cloud_kitchen" | "food_court";
type RestaurantStatus = "pending" | "verified" | "suspended" | "banned";
type StaffRole = "owner" | "manager" | "host" | "chef" | "cashier" | "server";
type TableZone = "indoor" | "outdoor" | "rooftop" | "private" | "bar";
type TableStatus = "available" | "occupied" | "reserved" | "blocked";
type BookingStatus = "pending" | "confirmed" | "arrived" | "cancelled" | "no_show" | "completed";
type BookingSource = "app" | "walk_in" | "phone";
type SeatingPref = "any" | "indoor" | "outdoor" | "rooftop" | "private" | "bar";
type WaitlistStatus = "waiting" | "notified" | "seated" | "expired" | "cancelled";
type OrderType = "dine_in" | "takeaway" | "delivery";
type OrderStatus = "received" | "preparing" | "ready" | "served" | "paid" | "cancelled";
type PaymentStatus = "unpaid" | "paid";
type OrderItemStatus = "pending" | "preparing" | "ready" | "served";
type LoyaltyTxType = "earned_order" | "earned_review" | "earned_referral" | "earned_bonus" | "redeemed" | "expired" | "adjusted_admin";
type DiscountType = "percentage" | "flat" | "bogo" | "free_item";
type TargetAudience = "all" | "new_users" | "tier_gold" | "tier_platinum" | "tier_diamond";
type NotificationType = "order_update" | "booking_update" | "offer" | "loyalty" | "system";
type InventoryUnit = "kg" | "g" | "liter" | "ml" | "piece" | "dozen" | "packet";
type ExpenseCategory = "rent" | "salaries" | "utilities" | "ingredients" | "maintenance" | "marketing" | "licenses" | "misc";
type RecurringFreq = "monthly" | "weekly" | "yearly";
type TicketCategory = "order_issue" | "payment_issue" | "booking_issue" | "app_bug" | "restaurant_complaint" | "account_issue" | "feedback" | "other";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketStatus = "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; email: string; name: string | null; phone: string | null;
          role: UserRole; avatar_url: string | null; dob: string | null; gender: string | null;
          food_preferences: string[]; allergens: string[];
          loyalty_points: number; loyalty_tier: LoyaltyTier;
          referral_code: string | null; is_active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      restaurants: {
        Row: {
          id: string; owner_id: string; name: string; slug: string;
          description: string | null; type: RestaurantType; cuisines: string[];
          rating: number; review_count: number; price_range: number;
          address: string | null; city: string | null; lat: number | null; lng: number | null;
          phone: string | null; email: string | null; hours: Json; amenities: string[];
          fssai_number: string | null; gst_number: string | null;
          tax_rate: number; service_charge_rate: number;
          cover_image_url: string | null; gallery_images: string[];
          status: RestaurantStatus; featured: boolean;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["restaurants"]["Row"]> & { owner_id: string; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Row"]>;
      };
      staff: {
        Row: {
          id: string; restaurant_id: string; user_id: string | null;
          name: string; phone: string | null; role: StaffRole; pin: string;
          permissions: Record<string, boolean>; shift_start: string | null; shift_end: string | null;
          shift_days: number[]; is_active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & { restaurant_id: string; name: string; role: StaffRole; pin: string };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
      };
      tables: {
        Row: {
          id: string; restaurant_id: string; number: number; seats: number;
          zone: TableZone; status: TableStatus; assigned_server_id: string | null;
          qr_data: string; position_x: number; position_y: number;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tables"]["Row"]> & { restaurant_id: string; number: number };
        Update: Partial<Database["public"]["Tables"]["tables"]["Row"]>;
      };
      menu_categories: {
        Row: {
          id: string; restaurant_id: string; name: string; description: string | null;
          icon: string; sort_order: number; is_active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_categories"]["Row"]> & { restaurant_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["menu_categories"]["Row"]>;
      };
      menu_items: {
        Row: {
          id: string; restaurant_id: string; category_id: string | null;
          name: string; description: string | null; price: number;
          variants: Json; addons: Json; remove_options: string[];
          images: string[]; is_veg: boolean; is_bestseller: boolean;
          spice_level: number; allergens: string[]; prep_time_minutes: number;
          calories: number | null; is_available: boolean;
          available_from: string | null; available_until: string | null;
          sort_order: number; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_items"]["Row"]> & { restaurant_id: string; name: string; price: number };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
      };
      bookings: {
        Row: {
          id: string; user_id: string | null; restaurant_id: string; table_id: string | null;
          date: string; time: string; guests: number; seating_preference: SeatingPref;
          occasion: string | null; special_requests: string | null;
          status: BookingStatus; source: BookingSource; qr_code: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]> & { restaurant_id: string; date: string; time: string; guests: number };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
      };
      waitlist: {
        Row: {
          id: string; user_id: string | null; restaurant_id: string;
          name: string; phone: string | null; party_size: number;
          seating_preference: SeatingPref; position: number;
          estimated_wait_minutes: number; status: WaitlistStatus;
          notified_at: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["waitlist"]["Row"]> & { restaurant_id: string; name: string; party_size: number };
        Update: Partial<Database["public"]["Tables"]["waitlist"]["Row"]>;
      };
      orders: {
        Row: {
          id: string; order_number: string; user_id: string | null; restaurant_id: string;
          table_id: string | null; server_id: string | null; type: OrderType;
          subtotal: number; discount_amount: number; tax_amount: number;
          service_charge_amount: number; tip_amount: number; total_amount: number;
          promo_code: string | null; points_redeemed: number;
          status: OrderStatus; payment_status: PaymentStatus;
          customer_notes: string | null; internal_notes: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & { restaurant_id: string };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      order_items: {
        Row: {
          id: string; order_id: string; menu_item_id: string | null;
          name: string; unit_price: number; quantity: number; variant: string | null;
          addons: Json; removed_ingredients: string[]; special_instructions: string | null;
          line_total: number; status: OrderItemStatus;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & { order_id: string; name: string; unit_price: number; quantity: number; line_total: number };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
      };
      reviews: {
        Row: {
          id: string; user_id: string; restaurant_id: string; order_id: string | null;
          overall_rating: number; food_rating: number | null; service_rating: number | null;
          ambience_rating: number | null; value_rating: number | null;
          text: string | null; photos: string[]; dish_tags: string[];
          recommend: boolean; reply_text: string | null; reply_at: string | null;
          is_published: boolean; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & { user_id: string; restaurant_id: string; overall_rating: number };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
      loyalty_transactions: {
        Row: {
          id: string; user_id: string; type: LoyaltyTxType; points: number;
          reference_id: string | null; description: string | null;
          expires_at: string | null; created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loyalty_transactions"]["Row"]> & { user_id: string; type: LoyaltyTxType; points: number };
        Update: Partial<Database["public"]["Tables"]["loyalty_transactions"]["Row"]>;
      };
      offers: {
        Row: {
          id: string; restaurant_id: string | null; title: string; description: string | null;
          discount_type: DiscountType; discount_value: number;
          min_order_amount: number; max_discount_cap: number | null;
          promo_code: string | null; valid_from: string; valid_to: string;
          usage_limit_total: number | null; usage_limit_per_user: number;
          used_count: number; applicable_on: string[]; target_audience: TargetAudience;
          is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["offers"]["Row"]> & { title: string; discount_type: DiscountType; discount_value: number };
        Update: Partial<Database["public"]["Tables"]["offers"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string; user_id: string; type: NotificationType;
          title: string; message: string; data: Json; is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & { user_id: string; type: NotificationType; title: string; message: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      inventory: {
        Row: {
          id: string; restaurant_id: string; name: string;
          quantity: number; unit: InventoryUnit; price_per_unit: number;
          min_threshold: number; supplier_name: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["inventory"]["Row"]> & { restaurant_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["inventory"]["Row"]>;
      };
      expenses: {
        Row: {
          id: string; restaurant_id: string; amount: number; category: ExpenseCategory;
          date: string; description: string | null; receipt_url: string | null;
          is_recurring: boolean; recurring_frequency: RecurringFreq | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["expenses"]["Row"]> & { restaurant_id: string; amount: number; category: ExpenseCategory };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
      };
      support_tickets: {
        Row: {
          id: string; ticket_number: string; user_id: string | null;
          restaurant_id: string | null; order_id: string | null;
          category: TicketCategory; priority: TicketPriority;
          subject: string; status: TicketStatus; assigned_to: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]> & { subject: string };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
      };
      support_messages: {
        Row: {
          id: string; ticket_id: string; sender_type: "user" | "admin";
          sender_id: string | null; message: string; attachments: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_messages"]["Row"]> & { ticket_id: string; sender_type: "user" | "admin"; message: string };
        Update: Partial<Database["public"]["Tables"]["support_messages"]["Row"]>;
      };
      banners: {
        Row: {
          id: string; image_url: string; link_target: string | null; position: number;
          is_active: boolean; start_date: string; end_date: string;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["banners"]["Row"]> & { image_url: string };
        Update: Partial<Database["public"]["Tables"]["banners"]["Row"]>;
      };
      collections: {
        Row: {
          id: string; name: string; description: string | null;
          cover_image_url: string | null; restaurant_ids: string[];
          sort_order: number; is_active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["collections"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["collections"]["Row"]>;
      };
      audit_log: {
        Row: {
          id: string; actor_id: string | null; actor_role: string | null;
          action: string; entity_type: string; entity_id: string | null;
          metadata: Json; ip_address: string | null; created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & { action: string; entity_type: string };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      loyalty_tier: LoyaltyTier;
      restaurant_type: RestaurantType;
      restaurant_status: RestaurantStatus;
      staff_role: StaffRole;
      table_zone: TableZone;
      table_status: TableStatus;
      booking_status: BookingStatus;
      order_type: OrderType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
    };
  };
};

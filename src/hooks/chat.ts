// Real-time chat hooks — customer↔owner and owner↔super_admin threads.
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ChatThread = {
  id: string;
  restaurant_id: string | null;
  customer_id: string | null;
  kind: "customer_owner" | "owner_support";
  subject: string | null;
  status: string;
  last_message: string | null;
  last_message_at: string | null;
  customer_unread: number;
  owner_unread: number;
  admin_unread: number;
  created_at: string;
  updated_at: string;
  restaurant?: { name: string; cover_image_url: string | null } | null;
  customer?: { name: string | null; avatar_url: string | null; email: string } | null;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: "customer" | "owner" | "manager" | "super_admin";
  body: string;
  attachments: string[] | null;
  created_at: string;
};

/* ─── Threads list ─── */

export function useChatThreads(opts: {
  asCustomerId?: string;
  forRestaurantId?: string;
  asAdmin?: boolean;
}) {
  return useQuery({
    queryKey: ["chat-threads", opts],
    queryFn: async () => {
      let q = supabase
        .from("chat_threads")
        .select("*, restaurant:restaurants(name, cover_image_url), customer:users!chat_threads_customer_id_fkey(name, avatar_url, email)")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(100);
      if (opts.asCustomerId) q = q.eq("customer_id", opts.asCustomerId);
      if (opts.forRestaurantId) q = q.eq("restaurant_id", opts.forRestaurantId);
      if (opts.asAdmin) q = q.eq("kind", "owner_support");
      const { data, error } = await q;
      if (error) throw error;
      return data as ChatThread[];
    },
    refetchInterval: 30_000,
  });
}

export function useChatThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ["chat-thread", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("*, restaurant:restaurants(name, cover_image_url), customer:users!chat_threads_customer_id_fkey(name, avatar_url, email)")
        .eq("id", threadId!)
        .maybeSingle();
      if (error) throw error;
      return data as ChatThread | null;
    },
  });
}

/* ─── Messages list with realtime ─── */

export function useChatMessages(threadId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["chat-messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at");
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  useEffect(() => {
    if (!threadId) return;
    const ch = supabase
      .channel(`chat-msg-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
        () => qc.invalidateQueries({ queryKey: ["chat-messages", threadId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId, qc]);

  return query;
}

/* ─── Mutations ─── */

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      threadId: string;
      senderId: string;
      senderRole: ChatMessage["sender_role"];
      body: string;
    }) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          thread_id: params.threadId,
          sender_id: params.senderId,
          sender_role: params.senderRole,
          body: params.body,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", vars.threadId] });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      qc.invalidateQueries({ queryKey: ["chat-thread", vars.threadId] });
    },
  });
}

/**
 * Get or create a customer↔owner thread.
 * Idempotent — UNIQUE index on (restaurant_id, customer_id) where kind='customer_owner'.
 */
export function useEnsureCustomerThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { restaurantId: string; customerId: string }) => {
      // Try to fetch existing
      const { data: existing } = await supabase
        .from("chat_threads")
        .select("*")
        .eq("restaurant_id", params.restaurantId)
        .eq("customer_id", params.customerId)
        .eq("kind", "customer_owner")
        .maybeSingle();
      if (existing) return existing as ChatThread;
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({
          restaurant_id: params.restaurantId,
          customer_id: params.customerId,
          kind: "customer_owner",
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as ChatThread;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}

export function useEnsureSupportThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { restaurantId: string; subject?: string }) => {
      const { data: existing } = await supabase
        .from("chat_threads")
        .select("*")
        .eq("restaurant_id", params.restaurantId)
        .eq("kind", "owner_support")
        .eq("status", "open")
        .maybeSingle();
      if (existing) return existing as ChatThread;
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({
          restaurant_id: params.restaurantId,
          kind: "owner_support",
          subject: params.subject ?? "Support request",
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as ChatThread;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}

export function useMarkThreadRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { threadId: string; role: "customer" | "owner" | "admin" }) => {
      const patch: Record<string, number> = {};
      if (params.role === "customer") patch.customer_unread = 0;
      if (params.role === "owner") patch.owner_unread = 0;
      if (params.role === "admin") patch.admin_unread = 0;
      const { error } = await supabase.from("chat_threads").update(patch as never).eq("id", params.threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}

/* ─── Reviews submission ─── */

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      restaurantId: string;
      userId: string;
      overall: number;
      food?: number;
      beverages?: number;
      service?: number;
      text?: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          restaurant_id: params.restaurantId,
          user_id: params.userId,
          overall_rating: params.overall,
          food_rating: params.food ?? params.overall,
          beverages_rating: params.beverages ?? params.overall,
          service_rating: params.service ?? params.overall,
          text: params.text ?? null,
          is_published: true,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.restaurantId] });
      qc.invalidateQueries({ queryKey: ["review-breakdown", vars.restaurantId] });
    },
  });
}

// Customer ↔ Restaurant chat (and customer side of any thread).
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useChatThread } from "@/hooks/chat";
import { ChatThreadView } from "@/components/chat/ChatThreadView";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const { data: thread } = useChatThread(id);

  if (!profile?.id) return null;

  const isCustomer = thread?.customer_id === profile.id;
  const role = isCustomer ? "customer" : profile.role === "super_admin" ? "super_admin" : "owner";
  const title = isCustomer
    ? thread?.restaurant?.name ?? "Restaurant"
    : thread?.customer?.name ?? thread?.customer?.email ?? "Guest";
  const subtitle = thread?.kind === "owner_support" ? "DIME support team" : "Real-time chat";

  return (
    <Screen scroll={false} className="bg-[#F6F2EC]">
      <View style={{ flex: 1 }}>
        <ChatThreadView
          threadId={id!}
          myUserId={profile.id}
          myRole={role}
          title={title}
          subtitle={subtitle}
          onBack={() => router.back()}
          markReadAs={isCustomer ? "customer" : profile.role === "super_admin" ? "admin" : "owner"}
        />
      </View>
    </Screen>
  );
}

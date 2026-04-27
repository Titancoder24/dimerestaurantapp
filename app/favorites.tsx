import { EmptyState, Header, Screen } from "@/components/ui";
import { useRouter } from "expo-router";

export default function Favorites() {
  const router = useRouter();
  return (
    <Screen>
      <Header title="Favorites" back />
      <EmptyState
        icon="heart.fill"
        title="No favorites yet"
        message="Tap the heart on any restaurant to save it here."
        actionLabel="Browse restaurants"
        onAction={() => router.push("/discover")}
      />
    </Screen>
  );
}

import { Text, View } from "react-native";
import { Redirect } from "expo-router";
import { Header, Screen } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useTables } from "@/hooks/queries";

export default function Floor() {
  const staff = useAuth((s) => s.staff);
  const { data: tables } = useTables(staff?.restaurantId);
  if (!staff) return <Redirect href="/server/login" />;

  return (
    <Screen scroll={false}>
      <Header title="Floor Manager" subtitle={`${tables?.length ?? 0} tables`} />
      <View className="m-4 flex-1 overflow-hidden rounded-2xl border border-dime-border bg-white">
        <View className="relative h-[480px] w-full bg-dime-bg-2">
          {(tables ?? []).map((t) => {
            const tone = {
              available: "bg-emerald-500",
              occupied: "bg-dime-danger",
              reserved: "bg-amber-500",
              blocked: "bg-gray-400",
            }[t.status];
            return (
              <View
                key={t.id}
                className={`absolute h-12 w-12 items-center justify-center rounded-full ${tone}`}
                style={{ left: `${t.position_x}%`, top: `${t.position_y}%` }}
              >
                <Text className="text-[14px] font-bold text-white">#{t.number}</Text>
              </View>
            );
          })}
        </View>
        <View className="flex-row gap-3 border-t border-dime-border p-3">
          <Legend color="bg-emerald-500" label="Available" />
          <Legend color="bg-dime-danger" label="Occupied" />
          <Legend color="bg-amber-500" label="Reserved" />
          <Legend color="bg-gray-400" label="Blocked" />
        </View>
      </View>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-3 w-3 rounded-full ${color}`} />
      <Text className="text-[11px] text-dime-ink-2">{label}</Text>
    </View>
  );
}

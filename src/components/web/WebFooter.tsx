import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui";
import { surface } from "@/lib/visual";

const COMPANY = ["About Us", "DIME for Business", "Careers", "Team", "DIME One", "DIME Instamart", "DIME Dineout", "DIME Genie", "Minis", "Pyng"];
const CONTACT = ["Help & Support", "Partner with us", "Ride with us"];
const CITIES = ["Bangalore", "Gurgaon", "Hyderabad", "Delhi", "Mumbai", "Pune"];
const LIFE = ["Explore with DIME", "DIME News", "Snackables"];
const LEGAL = ["Terms", "Cookie Policy", "Privacy", "Investor Relations"];
const SOCIAL = [
  { icon: "link", label: "LinkedIn" },
  { icon: "camera.fill", label: "Instagram" },
  { icon: "f.square.fill", label: "Facebook" },
  { icon: "pin.fill", label: "Pinterest" },
  { icon: "bird.fill", label: "Twitter" },
];

function Column({ title, items, onItemPress }: { title: string; items: string[]; onItemPress?: (s: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: surface.ink, letterSpacing: 0.3 }}>{title}</Text>
      {items.map((it) => (
        <Pressable key={it} onPress={() => onItemPress?.(it)}>
          <Text style={{ fontSize: 13, color: surface.ink2 }}>{it}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function WebFooter() {
  const router = useRouter();
  const stub = () => router.push("/home");

  return (
    <View
      style={{
        marginTop: 32,
        paddingTop: 32,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: surface.hairline,
      }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 32 }}>
        {/* Logo column */}
        <View style={{ width: 220, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "#FC8019",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.5 }}>D</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: surface.ink, letterSpacing: -0.5 }}>DIME</Text>
          </View>
          <Text style={{ fontSize: 12, color: surface.ink3, lineHeight: 18 }}>
            © {new Date().getFullYear()} DIME Limited{"\n"}Made in Bengaluru
          </Text>
        </View>

        <Column title="Company" items={COMPANY} onItemPress={stub} />
        <Column title="Contact us" items={CONTACT} onItemPress={stub} />
        <Column title="Available in" items={CITIES} onItemPress={stub} />
        <Column title="Life at DIME" items={LIFE} onItemPress={stub} />
      </View>

      <View
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: surface.hairline,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {LEGAL.map((l) => (
            <Pressable key={l} onPress={stub}>
              <Text style={{ fontSize: 12, color: surface.ink3 }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 14 }}>
          {SOCIAL.map((s) => (
            <Pressable
              key={s.label}
              onPress={stub}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#F2F2F2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={s.icon} size={13} color={surface.ink2} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

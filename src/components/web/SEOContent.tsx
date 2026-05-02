import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { surface } from "@/lib/visual";

type Props = {
  city?: string;
};

export function SEOContent({ city = "Bangalore" }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View
      style={{
        marginTop: 32,
        backgroundColor: "#FAFAFA",
        borderRadius: 14,
        padding: 24,
        borderWidth: 1,
        borderColor: surface.hairline,
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: "700", color: surface.ink, letterSpacing: -0.3 }}>
        Discover Your Perfect Dining Experience in {city}
      </Text>
      <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 22, color: surface.ink2 }}>
        From neighbourhood gems to fine-dining destinations, DIME's Dineout covers the
        breadth of {city}'s culinary landscape. Each venue is hand-picked for the quality of
        its food, ambiance and service. Skilled chefs use the freshest ingredients to bring
        you authentic flavours across cuisines — North Indian, Italian, Japanese, Continental
        and more.
      </Text>
      {expanded ? (
        <Text style={{ marginTop: 12, fontSize: 14, lineHeight: 22, color: surface.ink2 }}>
          DIME members enjoy exclusive table-booking discounts, bank-card offers and
          cashback on every dining bill. Whether you're planning a romantic dinner, a
          family Sunday brunch, a business lunch or a celebratory night out with friends,
          DIME makes it effortless to find, reserve and pay — all in one place. Browse
          curated collections, read verified reviews from real diners, view full menus
          before you arrive, and skip the queue with priority seating at participating
          venues. Discover restaurants near you across {city}'s most iconic neighbourhoods
          — from Indiranagar and Koramangala to Whitefield and HSR Layout.
        </Text>
      ) : null}
      <Pressable onPress={() => setExpanded((v) => !v)} style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#FC8019" }}>
          {expanded ? "See less ↑" : "See more ↓"}
        </Text>
      </Pressable>
    </View>
  );
}

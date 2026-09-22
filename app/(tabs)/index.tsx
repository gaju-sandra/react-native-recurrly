import "@/global.css"
import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function App() {
  return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-xl font-bold text-success">
          Welcome to Nativewind!
        </Text>
          <Link href="/Onboarding" className="mt-4 rounded bg-primary text-white p-4">Go to Onboarding</Link>
          <Link href="/(auth)/sign-in" className="mt-4 rounded bg-primary text-white p-4">signIN</Link>
          <Link href="/(auth)/sign-up" className="mt-4 rounded bg-primary text-white p-4">Signup</Link>
          <Link href="/subscriptions">Spotify Subscription</Link>
     <Link
         href={{
             pathname: "/subscriptions/[id]",
             params: {id: "claude" },
         }}>
         Claude Max Subscription
     </Link>

      </View>
  );
}
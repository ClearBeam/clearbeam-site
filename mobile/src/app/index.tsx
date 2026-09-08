import { Redirect } from "expo-router";
import { useAuth } from "@/auth/auth-context";

/** Entry route: send the owner to the app or to login. */
export default function Index() {
  const { status } = useAuth();
  if (status === "loading") return null;
  return <Redirect href={status === "authenticated" ? "/(app)" : "/login"} />;
}

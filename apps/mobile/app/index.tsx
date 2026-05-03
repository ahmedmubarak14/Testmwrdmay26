import { Redirect } from "expo-router";

import { useAuth } from "@/lib/auth";

export default function Root() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)/" />;
}

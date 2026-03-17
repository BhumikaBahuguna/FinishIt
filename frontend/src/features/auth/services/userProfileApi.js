import { supabase } from "../../../services/supabase/client";

function deriveDisplayName(user) {
  const metadataName = user?.user_metadata?.name || user?.user_metadata?.full_name;

  if (metadataName && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "User";
}

export async function ensureUserProfile(authUser) {
  if (!supabase || !authUser?.id) {
    return { data: null, error: null };
  }

  return supabase
    .from("users")
    .upsert(
      {
        id: authUser.id,
        email: authUser.email,
        name: deriveDisplayName(authUser)
      },
      { onConflict: "id" }
    )
    .select("id")
    .single();
}

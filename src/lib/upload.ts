import { supabase } from "@/integrations/supabase/client";

const BUCKET = "documents";

/** Uploads a file into the signed-in user's private folder and returns its storage path. */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Please sign in again to upload files.");
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const path = `${userId}/${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error("That file could not be uploaded. Please try again.");
  return path;
}

/** Creates a temporary link so the owner can open a stored document. */
export async function openFile(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) throw new Error("That file could not be opened.");
  window.open(data.signedUrl, "_blank", "noopener");
}

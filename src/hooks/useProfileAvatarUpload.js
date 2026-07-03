import { useCallback, useEffect, useState } from "react";
import { uploadProfileAvatar } from "../lib/profile.js";

/**
 * @param {{
 *   avatarUrl?: string | null,
 *   onSave?: (patch: { avatarUrl: string }) => Promise<unknown>,
 * }} options
 */
export function useProfileAvatarUpload({ avatarUrl: initialUrl = "", onSave }) {
  const [avatarUrl, setAvatarUrl] = useState(initialUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAvatarUrl(initialUrl || "");
  }, [initialUrl]);

  const upload = useCallback(
    async (file) => {
      setIsUploading(true);
      setError("");
      try {
        const url = await uploadProfileAvatar(file);
        setAvatarUrl(url);
        if (onSave) {
          await onSave({ avatarUrl: url });
        }
        return url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not upload profile picture.");
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [onSave],
  );

  return { avatarUrl, isUploading, error, upload, setError };
}

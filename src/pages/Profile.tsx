
import { FolderDisplay } from "@/components/folder/FolderDisplay";

export function Profile() {
  return <FolderDisplay profileId="default" />;
}

// Re-export FolderDisplay for backward compatibility
export { FolderDisplay };

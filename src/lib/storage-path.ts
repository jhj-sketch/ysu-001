import path from "path";

/** On Vercel the filesystem is ephemeral; use /tmp for uploads. */
export function getUploadRoot() {
  if (process.env.VERCEL || process.env.UPLOAD_ROOT) {
    return process.env.UPLOAD_ROOT || path.join("/tmp", "uploads");
  }
  return path.join(process.cwd(), "uploads");
}

export function toRelativeUploadPath(...parts: string[]) {
  return path.join(...parts).replace(/\\/g, "/");
}

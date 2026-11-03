import { staticFile } from "remotion";

/**
 * Resolve a remote HTTP(S) asset URL as-is, or resolve a project public-dir path
 * through Remotion's staticFile helper.
 */
export const resolveAsset = (source: string): string =>
  /^https?:\/\//i.test(source) ? source : staticFile(source);

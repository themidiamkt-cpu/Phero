export const defaultPublicSiteUrl = "https://phebo.themidiamarketing.com.br";

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    defaultPublicSiteUrl
  ).replace(/\/$/, "");
}

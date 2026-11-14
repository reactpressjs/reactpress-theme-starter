import { previewUrl } from '@fecommunity/reactpress-content'

/** Public article URL. Drafts use `?preview=1`, which this theme renders without indexing. */
export function themePreviewUrl(siteUrl: string, articleId: string, status?: string): string {
  return previewUrl(siteUrl, articleId, { preview: status !== 'publish' })
}

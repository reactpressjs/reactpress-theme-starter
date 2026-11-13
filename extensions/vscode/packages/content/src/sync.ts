import * as fs from 'fs/promises';
import * as path from 'path';

import { ReactPressClient } from './client';
import {
  createNewArticleDocument,
  parseLocalDocument,
  remoteArticleToDocument,
  serializeLocalDocument,
  slugifyTitle,
} from './frontmatter';
import { deriveSummary, renderMarkdown } from './markdown';
import {
  ArticlePayload,
  ArticleStatus,
  LocalArticleDocument,
  RemoteArticle,
  SyncConflictError,
  SyncResult,
} from './types';

export interface PushOptions {
  force?: boolean;
  status?: ArticleStatus;
  /** Resolve relative cover paths against this directory (usually the md file dir). */
  baseDir?: string;
  /** Optional uploader for local cover files. */
  uploadLocalFile?: (absolutePath: string) => Promise<string>;
}

async function maybeUploadCover(
  cover: string | undefined,
  baseDir: string | undefined,
  uploadLocalFile?: (absolutePath: string) => Promise<string>
): Promise<string> {
  if (!cover) return '';
  if (/^https?:\/\//i.test(cover) || cover.startsWith('/')) {
    return cover;
  }
  if (!baseDir || !uploadLocalFile) {
    return cover;
  }
  const absolute = path.resolve(baseDir, cover);
  return uploadLocalFile(absolute);
}

export async function buildArticlePayload(
  doc: LocalArticleDocument,
  client: ReactPressClient,
  options: PushOptions = {}
): Promise<ArticlePayload> {
  const { html, toc } = renderMarkdown(doc.content);
  const summary = doc.frontmatter.summary?.trim() || deriveSummary(doc.content);
  const cover = await maybeUploadCover(doc.frontmatter.cover, options.baseDir, options.uploadLocalFile);
  const category = await client.resolveCategoryId(doc.frontmatter.category);
  const tags = await client.resolveTagIds(doc.frontmatter.tags ?? []);
  const status = options.status ?? doc.frontmatter.status;

  return {
    title: doc.frontmatter.title,
    content: doc.content,
    html,
    toc,
    summary,
    cover,
    status,
    category,
    tags,
    isRecommended: Boolean(doc.frontmatter.isRecommended),
    isCommentable: doc.frontmatter.isCommentable !== false,
    password: doc.frontmatter.password ?? '',
  };
}

function toApiBody(payload: ArticlePayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: payload.title,
    content: payload.content,
    html: payload.html,
    toc: payload.toc,
    summary: payload.summary,
    cover: payload.cover,
    status: payload.status,
    isRecommended: payload.isRecommended,
    isCommentable: payload.isCommentable,
    password: payload.password,
  };
  if (payload.category) body.category = payload.category;
  if (payload.tags !== undefined && payload.tags !== '') body.tags = payload.tags;
  return body;
}

export async function pushDocument(
  client: ReactPressClient,
  doc: LocalArticleDocument,
  options: PushOptions = {}
): Promise<SyncResult> {
  const payload = await buildArticlePayload(doc, client, options);
  const body = toApiBody(payload);

  let article: RemoteArticle;
  let created = false;

  if (doc.frontmatter.id) {
    const remote = await client.getArticle(doc.frontmatter.id);
    const remoteUpdated = remote.updateAt ? String(remote.updateAt) : undefined;
    const localUpdated = doc.frontmatter.updatedAt;

    if (!options.force && remoteUpdated) {
      if (!localUpdated) {
        throw new SyncConflictError(
          `Remote article has updateAt (${remoteUpdated}) but local frontmatter has no updatedAt. Pull first or use force.`,
          localUpdated,
          remoteUpdated
        );
      }
      const remoteTime = Date.parse(remoteUpdated);
      const localTime = Date.parse(localUpdated);
      if (!Number.isNaN(remoteTime) && !Number.isNaN(localTime) && remoteTime > localTime) {
        throw new SyncConflictError(
          `Remote article is newer (${remoteUpdated}) than local (${localUpdated}). Pull first or use force.`,
          localUpdated,
          remoteUpdated
        );
      }
    }

    article = await client.updateArticle(doc.frontmatter.id, body);
  } else {
    article = await client.createArticle(body);
    created = true;
  }

  const nextDoc = remoteArticleToDocument(article);
  // Keep local body if remote strips differently; prefer local content we just sent.
  nextDoc.content = doc.content;
  nextDoc.frontmatter.title = payload.title;
  nextDoc.frontmatter.status = payload.status;
  nextDoc.frontmatter.summary = payload.summary;
  nextDoc.frontmatter.cover = payload.cover || doc.frontmatter.cover;
  nextDoc.frontmatter.category = doc.frontmatter.category;
  nextDoc.frontmatter.tags = doc.frontmatter.tags;
  nextDoc.raw = serializeLocalDocument(nextDoc);

  return { article, document: nextDoc, created };
}

export async function pushFile(
  client: ReactPressClient,
  filePath: string,
  options: PushOptions = {}
): Promise<SyncResult & { filePath: string }> {
  const raw = await fs.readFile(filePath, 'utf8');
  const doc = parseLocalDocument(raw);
  const result = await pushDocument(client, doc, {
    ...options,
    baseDir: options.baseDir ?? path.dirname(filePath),
  });
  await fs.writeFile(filePath, result.document.raw, 'utf8');
  return { ...result, filePath };
}

export async function publishFile(
  client: ReactPressClient,
  filePath: string,
  options: Omit<PushOptions, 'status'> = {}
): Promise<SyncResult & { filePath: string }> {
  return pushFile(client, filePath, { ...options, status: 'publish' });
}

export async function pullArticleToFile(
  client: ReactPressClient,
  articleId: string,
  filePath: string
): Promise<{ article: RemoteArticle; filePath: string; document: LocalArticleDocument }> {
  const article = await client.getArticle(articleId);
  const document = remoteArticleToDocument(article);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, document.raw, 'utf8');
  return { article, filePath, document };
}

export async function createLocalArticleFile(
  contentDir: string,
  title: string
): Promise<{ filePath: string; document: LocalArticleDocument }> {
  const document = createNewArticleDocument({ title });
  const slug = slugifyTitle(title);
  await fs.mkdir(contentDir, { recursive: true });
  let filePath = path.join(contentDir, `${slug}.md`);
  let suffix = 1;
  while (true) {
    try {
      await fs.access(filePath);
      filePath = path.join(contentDir, `${slug}-${suffix}.md`);
      suffix += 1;
    } catch {
      break;
    }
  }
  await fs.writeFile(filePath, document.raw, 'utf8');
  return { filePath, document };
}

export function previewUrl(siteUrl: string, articleId: string): string {
  const base = siteUrl.replace(/\/+$/, '');
  return `${base}/article/${encodeURIComponent(articleId)}`;
}

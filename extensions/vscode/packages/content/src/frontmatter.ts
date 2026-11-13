import matter from 'gray-matter';
import {
  ArticleFrontmatter,
  ArticleStatus,
  LocalArticleDocument,
  RemoteArticle,
  TaxonomyItem,
} from './types';

function asStatus(value: unknown): ArticleStatus {
  return value === 'publish' ? 'publish' : 'draft';
}

function asStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [String(value)];
}

function normalizeFrontmatter(data: Record<string, unknown>): ArticleFrontmatter {
  const title = String(data.title ?? '').trim();
  if (!title) {
    throw new Error('Frontmatter requires a non-empty "title"');
  }

  return {
    id: data.id ? String(data.id) : undefined,
    title,
    status: asStatus(data.status),
    summary: data.summary !== undefined ? String(data.summary) : undefined,
    cover: data.cover !== undefined ? String(data.cover) : undefined,
    category: data.category !== undefined ? String(data.category) : undefined,
    tags: asStringArray(data.tags),
    isRecommended: Boolean(data.isRecommended),
    isCommentable: data.isCommentable === undefined ? true : Boolean(data.isCommentable),
    password: data.password !== undefined ? String(data.password) : undefined,
    updatedAt: data.updatedAt !== undefined ? String(data.updatedAt) : undefined,
  };
}

export function parseLocalDocument(raw: string): LocalArticleDocument {
  const parsed = matter(raw);
  const frontmatter = normalizeFrontmatter(parsed.data as Record<string, unknown>);
  return {
    frontmatter,
    content: parsed.content.replace(/^\n/, ''),
    raw,
  };
}

export function serializeLocalDocument(doc: Omit<LocalArticleDocument, 'raw'>): string {
  const data: Record<string, unknown> = {
    title: doc.frontmatter.title,
    status: doc.frontmatter.status,
  };

  if (doc.frontmatter.id) data.id = doc.frontmatter.id;
  if (doc.frontmatter.summary !== undefined) data.summary = doc.frontmatter.summary;
  if (doc.frontmatter.cover !== undefined) data.cover = doc.frontmatter.cover;
  if (doc.frontmatter.category !== undefined) data.category = doc.frontmatter.category;
  if (doc.frontmatter.tags?.length) data.tags = doc.frontmatter.tags;
  if (doc.frontmatter.isRecommended) data.isRecommended = true;
  data.isCommentable = doc.frontmatter.isCommentable ?? true;
  if (doc.frontmatter.password) data.password = doc.frontmatter.password;
  if (doc.frontmatter.updatedAt) data.updatedAt = doc.frontmatter.updatedAt;

  return matter.stringify(doc.content.replace(/^\n/, ''), data);
}

function taxonomyValue(item: TaxonomyItem | string | null | undefined): string | undefined {
  if (!item) return undefined;
  if (typeof item === 'string') return item;
  return item.value || item.label || item.id;
}

function taxonomyId(item: TaxonomyItem | string | null | undefined): string | undefined {
  if (item == null) return undefined;
  if (typeof item === 'string') return undefined;
  return item.id;
}

export function remoteArticleToDocument(article: RemoteArticle): LocalArticleDocument {
  const tags = Array.isArray(article.tags)
    ? article.tags
        .map((tag) => taxonomyValue(tag as TaxonomyItem))
        .filter((value): value is string => Boolean(value))
    : typeof article.tags === 'string'
      ? article.tags.split(',').map((part) => part.trim()).filter(Boolean)
      : undefined;

  const categoryRef = article.category as TaxonomyItem | string | null | undefined;
  const frontmatter: ArticleFrontmatter = {
    id: article.id,
    title: article.title,
    status: asStatus(article.status),
    summary: article.summary ?? undefined,
    cover: article.cover ?? undefined,
    category: taxonomyValue(categoryRef) ?? taxonomyId(categoryRef),
    tags,
    isRecommended: Boolean(article.isRecommended),
    isCommentable: article.isCommentable !== false,
    password: article.password ?? undefined,
    updatedAt: article.updateAt ? String(article.updateAt) : undefined,
  };

  return {
    frontmatter,
    content: article.content ?? '',
    raw: serializeLocalDocument({ frontmatter, content: article.content ?? '' }),
  };
}

export function createNewArticleDocument(input: {
  title: string;
  slug?: string;
}): LocalArticleDocument {
  const frontmatter: ArticleFrontmatter = {
    title: input.title,
    status: 'draft',
    summary: '',
    cover: '',
    tags: [],
    isRecommended: false,
    isCommentable: true,
  };
  const content = `# ${input.title}\n\n`;
  return {
    frontmatter,
    content,
    raw: serializeLocalDocument({ frontmatter, content }),
  };
}

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

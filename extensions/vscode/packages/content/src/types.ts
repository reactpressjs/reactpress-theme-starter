export type ArticleStatus = 'draft' | 'publish';

export interface ReactPressClientOptions {
  apiUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
  /** Per-request timeout in milliseconds (default 30000). */
  timeoutMs?: number;
}

export interface LoginCredentials {
  name: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: Record<string, unknown>;
}

export interface TaxonomyItem {
  id: string;
  label: string;
  value: string;
}

export interface RemoteArticle {
  id: string;
  title: string;
  cover?: string | null;
  summary?: string | null;
  content?: string | null;
  html?: string | null;
  toc?: string | null;
  status: ArticleStatus | string;
  category?: TaxonomyItem | string | null;
  tags?: Array<TaxonomyItem | string> | string | null;
  isRecommended?: boolean;
  isCommentable?: boolean;
  password?: string | null;
  publishAt?: string | null;
  createAt?: string | null;
  updateAt?: string | null;
  [key: string]: unknown;
}

export interface ArticleFrontmatter {
  id?: string;
  title: string;
  status: ArticleStatus;
  summary?: string;
  cover?: string;
  category?: string;
  tags?: string[];
  isRecommended?: boolean;
  isCommentable?: boolean;
  password?: string;
  updatedAt?: string;
}

export interface LocalArticleDocument {
  frontmatter: ArticleFrontmatter;
  content: string;
  raw: string;
}

export interface ArticlePayload {
  title: string;
  content: string;
  html: string;
  toc: string;
  summary: string;
  cover: string;
  status: ArticleStatus;
  category?: string;
  tags?: string; // comma-separated tag ids for ReactPress API
  isRecommended: boolean;
  isCommentable: boolean;
  password: string;
}

export interface SyncResult {
  article: RemoteArticle;
  document: LocalArticleDocument;
  created: boolean;
}

export class ReactPressApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ReactPressApiError';
  }
}

export class SyncConflictError extends Error {
  constructor(
    message: string,
    public localUpdatedAt?: string,
    public remoteUpdatedAt?: string
  ) {
    super(message);
    this.name = 'SyncConflictError';
  }
}

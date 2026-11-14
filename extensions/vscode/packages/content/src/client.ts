import { ReactPressHttp } from './http'
import {
  LoginCredentials,
  LoginResult,
  ReactPressClientOptions,
  RemoteArticle,
  TaxonomyItem,
} from './types'

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    if (data.length === 2 && Array.isArray(data[0]) && typeof data[1] === 'number') {
      return data[0] as T[]
    }
    return data as T[]
  }
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data
  }
  return []
}

export class ReactPressClient {
  readonly http: ReactPressHttp
  private categoriesCache?: Promise<TaxonomyItem[]>
  private tagsCache?: Promise<TaxonomyItem[]>

  constructor(options: ReactPressClientOptions) {
    this.http = new ReactPressHttp(options)
  }

  setToken(token?: string): void {
    this.http.setToken(token)
    this.clearTaxonomyCache()
  }

  clearTaxonomyCache(): void {
    this.categoriesCache = undefined
    this.tagsCache = undefined
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const data = await this.http.post<Record<string, unknown>>('/auth/login', credentials)
    const token =
      (typeof data.token === 'string' && data.token) ||
      (typeof (data as { accessToken?: string }).accessToken === 'string' &&
        (data as { accessToken: string }).accessToken) ||
      ''

    if (!token) {
      throw new Error('Login succeeded but no token was returned')
    }

    this.setToken(token)
    return {
      token,
      user: data,
    }
  }

  /** Confirms the current token with the admin API. Rejects when it is missing or invalid. */
  verifySession(): Promise<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>('/user')
  }

  listArticles(
    query: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<RemoteArticle[]> {
    return this.http
      .get<unknown>('/article', {
        status: query.status,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
      })
      .then(unwrapList<RemoteArticle>)
  }

  getArticle(id: string): Promise<RemoteArticle> {
    return this.http.get<RemoteArticle>(`/article/${encodeURIComponent(id)}`)
  }

  createArticle(body: Record<string, unknown>): Promise<RemoteArticle> {
    return this.http.post<RemoteArticle>('/article', body)
  }

  updateArticle(id: string, body: Record<string, unknown>): Promise<RemoteArticle> {
    return this.http.patch<RemoteArticle>(`/article/${encodeURIComponent(id)}`, body)
  }

  listCategories(): Promise<TaxonomyItem[]> {
    if (!this.categoriesCache) {
      this.categoriesCache = this.http
        .get<unknown>('/category')
        .then(unwrapList<TaxonomyItem>)
        .catch((error) => {
          this.categoriesCache = undefined
          throw error
        })
    }
    return this.categoriesCache
  }

  listTags(): Promise<TaxonomyItem[]> {
    if (!this.tagsCache) {
      this.tagsCache = this.http
        .get<unknown>('/tag')
        .then(unwrapList<TaxonomyItem>)
        .catch((error) => {
          this.tagsCache = undefined
          throw error
        })
    }
    return this.tagsCache
  }

  async resolveCategoryId(ref?: string): Promise<string | undefined> {
    const categories = await this.listCategories()
    if (ref) {
      const hit = categories.find(
        (item) => item.id === ref || item.value === ref || item.label === ref
      )
      if (hit) return hit.id
      // Server findById also accepts label/value; keep raw ref as fallback.
      return ref
    }
    // Creating without category often yields null relations; prefer first category when present.
    return categories[0]?.id
  }

  async resolveTagIds(refs: string[] = []): Promise<string | undefined> {
    if (!refs.length) return undefined
    const tags = await this.listTags()
    const ids = refs
      .map((ref) => {
        const hit = tags.find((item) => item.id === ref || item.value === ref || item.label === ref)
        return hit?.id ?? ref
      })
      .filter(Boolean)
    return ids.length ? ids.join(',') : undefined
  }

  async uploadFile(
    file: Blob | Buffer | Uint8Array,
    filename: string,
    unique = 0
  ): Promise<{ url: string; id?: string }> {
    const formData = new FormData()
    const bytes = file instanceof Blob ? file : new Blob([Uint8Array.from(file)])
    // Prefer File so multipart includes a filename in Node and browsers.
    const part =
      typeof File !== 'undefined'
        ? new File([bytes], filename)
        : Object.assign(bytes, { name: filename })
    formData.append('file', part as Blob, filename)
    const data = await this.http.postForm<Record<string, unknown>>('/file/upload', formData, {
      unique,
    })
    const url = String(data.url ?? data.path ?? '')
    if (!url) {
      throw new Error('Upload succeeded but no url was returned')
    }
    return { url, id: data.id ? String(data.id) : undefined }
  }
}

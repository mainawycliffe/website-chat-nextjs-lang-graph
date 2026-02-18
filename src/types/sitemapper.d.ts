declare module 'sitemapper' {
  export type SitemapperOptions = {
    url: string;
    timeout?: number;
    requestHeaders?: Record<string, string>;
  };

  export type SitemapperFetchResult = {
    sites: string[];
  };

  export default class Sitemapper {
    constructor(options: SitemapperOptions);
    fetch(): Promise<SitemapperFetchResult>;
  }
}

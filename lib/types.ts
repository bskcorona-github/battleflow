import { google } from "googleapis";

export type CustomSearchAPI = typeof google.customsearch;

export interface SearchParams {
  auth: string;
  cx: string;
  q: string;
  searchType: string;
  num: number;
  fileType?: string;
  safe?: string;
  start?: number;
  imgSize?: string;
  exactTerms?: string;
  rights?: string;
}

export interface SearchResult {
  data: {
    items?: Array<{
      link: string;
      title: string;
      snippet: string;
    }>;
  };
}

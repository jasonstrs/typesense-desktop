export interface CollectionField {
  name: string;
  type: string;
  facet?: boolean;
  optional?: boolean;
  index?: boolean;
  sort?: boolean;
  infix?: boolean;
  locale?: string;
  stem?: boolean;
}

export interface CollectionSchema {
  name: string;
  fields: CollectionField[];
  default_sorting_field?: string;
  enable_nested_fields?: boolean;
  token_separators?: string[];
  symbols_to_index?: string[];
}

export interface Collection {
  name: string;
  num_documents: number;
  created_at: number;
  fields: CollectionField[];
  default_sorting_field?: string;
  enable_nested_fields?: boolean;
  token_separators?: string[];
  symbols_to_index?: string[];
}

export interface CollectionCreateRequest {
  name: string;
  fields: CollectionField[];
  default_sorting_field?: string;
  enable_nested_fields?: boolean;
  token_separators?: string[];
  symbols_to_index?: string[];
}

export interface Document {
  [key: string]: any;
}

export interface SearchParameters {
  q: string;
  query_by: string;
  filter_by?: string;
  sort_by?: string;
  per_page?: number;
  page?: number;
}

export interface SearchResult<T = Document> {
  found: number;
  hits: Array<{
    document: T;
    highlights: any[];
    text_match: number;
  }>;
  out_of: number;
  page: number;
  request_params: SearchParameters;
  search_time_ms: number;
}

import { useQuery } from '@tanstack/react-query';
import { getClient } from '@/services/typesense';
import { DocumentSchema, type SearchResponse } from 'typesense/lib/Typesense/Documents';
import { type SearchParams } from 'typesense/lib/Typesense/Types';

export interface UseSearchParams {
  collectionName: string;
  searchQuery: string;
  queryBy: string[];
  filterBy?: string;
  sortBy?: string[];
  page?: number;
  perPage?: number;
  facetBy?: string[];
  enabled?: boolean;
  connectionId?: string | null;
}

export function useSearch({
  collectionName,
  searchQuery,
  queryBy,
  filterBy,
  sortBy,
  page = 1,
  perPage = 25,
  facetBy,
  enabled = true,
  connectionId,
}: UseSearchParams) {
  return useQuery({
    queryKey: [
      'search',
      connectionId,
      collectionName,
      searchQuery,
      queryBy,
      filterBy,
      sortBy,
      page,
      perPage,
      facetBy,
    ],
    queryFn: async (): Promise<SearchResponse<DocumentSchema>> => {
      const client = getClient();

      const searchParams: SearchParams<DocumentSchema> = {
        q: searchQuery || '*',
        query_by: queryBy.join(','),
        per_page: perPage,
        page,
      };

      if (filterBy) {
        searchParams.filter_by = filterBy;
      }

      if (sortBy && sortBy.length > 0) {
        searchParams.sort_by = sortBy.join(',');
      }

      if (facetBy && facetBy.length > 0) {
        searchParams.facet_by = facetBy.join(',');
      }

      const response = await client
        .collections<DocumentSchema>(collectionName)
        .documents()
        .search(searchParams);

      return response;
    },
    enabled: enabled && !!collectionName && queryBy.length > 0 && !!connectionId,
    retry: 1,
  });
}

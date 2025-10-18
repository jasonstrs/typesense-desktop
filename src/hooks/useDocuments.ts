import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@/services/typesense';
import { DocumentSchema, type SearchResponse } from 'typesense/lib/Typesense/Documents';

export function useDocuments(collectionName: string, page = 1, perPage = 25, enabled = true) {
  return useQuery({
    queryKey: ['documents', collectionName, page, perPage],
    queryFn: async (): Promise<SearchResponse<DocumentSchema>> => {
      const client = getClient();
      // Use wildcard search to get all documents
      const response = await client.collections<DocumentSchema>(collectionName).documents().search({
        q: '*',
        query_by: '',
        per_page: perPage,
        page,
      });
      return response;
    },
    enabled: enabled && !!collectionName,
    retry: 1,
  });
}

export function useDocument(collectionName: string, documentId: string) {
  return useQuery({
    queryKey: ['document', collectionName, documentId],
    queryFn: async (): Promise<DocumentSchema> => {
      const client = getClient();
      const response = await client
        .collections<DocumentSchema>(collectionName)
        .documents(documentId)
        .retrieve();
      return response;
    },
    enabled: !!collectionName && !!documentId,
  });
}

export function useCreateDocument(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: DocumentSchema) => {
      const client = getClient();
      return await client.collections(collectionName).documents().create(document);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', collectionName] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useUpdateDocument(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, document }: { id: string; document: DocumentSchema }) => {
      const client = getClient();
      return await client.collections(collectionName).documents(id).update(document);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', collectionName] });
      queryClient.invalidateQueries({ queryKey: ['document', collectionName, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteDocument(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const client = getClient();
      return await client.collections(collectionName).documents(documentId).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', collectionName] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

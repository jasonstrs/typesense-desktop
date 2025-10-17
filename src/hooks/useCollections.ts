import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@/services/typesense';
import type { Collection, CollectionCreateRequest } from '@/types/typesense';

export function useCollections(enabled = true) {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async (): Promise<Collection[]> => {
      const client = getClient();
      const response = await client.collections().retrieve();
      return response as Collection[];
    },
    enabled,
    retry: 1,
  });
}

export function useCollection(collectionName: string) {
  return useQuery({
    queryKey: ['collection', collectionName],
    queryFn: async (): Promise<Collection> => {
      const client = getClient();
      const response = await client.collections(collectionName).retrieve();
      return response as Collection;
    },
    enabled: !!collectionName,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schema: CollectionCreateRequest) => {
      const client = getClient();
      return await client.collections().create(schema as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionName: string) => {
      const client = getClient();
      return await client.collections(collectionName).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionName,
      schema,
    }: {
      collectionName: string;
      schema: Partial<CollectionCreateRequest>;
    }) => {
      const client = getClient();
      return await client.collections(collectionName).update(schema as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionName] });
    },
  });
}

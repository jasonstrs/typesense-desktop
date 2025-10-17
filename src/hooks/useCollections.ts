import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@/services/typesense';
import type { Collection, CollectionCreateRequest } from '@/types/typesense';

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async (): Promise<Collection[]> => {
      try {
        const client = getClient();
        console.log('Fetching collections...');
        const response = await client.collections().retrieve();
        console.log('Collections response:', response);
        return response as Collection[];
      } catch (error) {
        console.error('Failed to fetch collections:', error);
        throw error;
      }
    },
    enabled: true,
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
      return await client.collections().create(schema);
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
      return await client.collections(collectionName).update(schema);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionName] });
    },
  });
}

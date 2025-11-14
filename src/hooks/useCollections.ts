import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@/services/typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { CollectionSchema } from 'typesense/lib/Typesense/Collection';

export function useCollections(enabled = true, connectionId?: string | null) {
  return useQuery({
    queryKey: ['collections', connectionId],
    queryFn: async (): Promise<CollectionSchema[]> => {
      const client = getClient();
      const response = await client.collections().retrieve();
      return response;
    },
    enabled: enabled && !!connectionId,
    retry: 1,
  });
}

export function useCollection(collectionName: string) {
  return useQuery({
    queryKey: ['collection', collectionName],
    queryFn: async (): Promise<CollectionSchema> => {
      const client = getClient();
      const response = await client.collections(collectionName).retrieve();
      return response;
    },
    enabled: !!collectionName,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schema: CollectionCreateSchema) => {
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
      schema: Partial<CollectionCreateSchema>;
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

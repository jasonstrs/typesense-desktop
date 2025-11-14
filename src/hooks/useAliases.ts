import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@/services/typesense';

export interface CollectionAlias {
  name: string;
  collection_name: string;
}

export interface CollectionAliasesResponse {
  aliases: CollectionAlias[];
}

export function useAliases(enabled = true, connectionId?: string | null) {
  return useQuery({
    queryKey: ['aliases', connectionId],
    queryFn: async (): Promise<CollectionAlias[]> => {
      const client = getClient();
      const response = await client.aliases().retrieve();
      return (response as CollectionAliasesResponse).aliases;
    },
    enabled: enabled && !!connectionId,
    retry: 1,
  });
}

export function useAlias(aliasName: string) {
  return useQuery({
    queryKey: ['alias', aliasName],
    queryFn: async (): Promise<CollectionAlias> => {
      const client = getClient();
      const response = await client.aliases(aliasName).retrieve();
      return response as CollectionAlias;
    },
    enabled: !!aliasName,
  });
}

export function useCreateAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ aliasName, collectionName }: { aliasName: string; collectionName: string }) => {
      const client = getClient();
      return await client.aliases().upsert(aliasName, { collection_name: collectionName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aliases'] });
    },
  });
}

export function useDeleteAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aliasName: string) => {
      const client = getClient();
      return await client.aliases(aliasName).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aliases'] });
    },
  });
}

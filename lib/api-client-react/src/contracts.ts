import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface ContractStats {
  terms: number;
  privacy: number;
  distance_sales: number;
  marketing: number;
  location: number;
  total: number;
}

export interface Contract {
  id: number;
  key: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
}

export function useGetContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: () =>
      customFetch<{ success: boolean; contracts: Contract[] }>("/api/contracts"),
  });
}

export function useGetContract(key: string, enabled = true) {
  return useQuery({
    queryKey: ["contracts", key],
    queryFn: () =>
      customFetch<{ success: boolean; contract: Contract }>(`/api/contracts/${key}`),
    enabled,
  });
}

export function useGetContractStats() {
  return useQuery({
    queryKey: ["contracts", "stats"],
    queryFn: () =>
      customFetch<{ success: boolean; stats: ContractStats }>("/api/contracts/stats"),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, content, title }: { key: string; content?: string; title?: string }) =>
      customFetch<{ success: boolean; contract: Contract }>(`/api/contracts/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

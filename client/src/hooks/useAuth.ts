import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Agent } from "@shared/schema";

interface AuthResponse {
  agent: Agent;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery<Agent | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        console.log('Fetching auth status from /api/auth/me');
        const response = await apiRequest("GET", "/api/auth/me");
        const data = await response.json() as Agent;
        console.log('Auth check successful, agent:', data);
        return data;
      } catch (error) {
        console.log('Auth check failed:', error);
        // If authentication fails, return null (not authenticated)
        return null;
      }
    },
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Directly set auth query data to null to immediately trigger logout state
      queryClient.setQueryData(['/api/auth/me'], null);
      // Clear all cached data except auth query
      queryClient.removeQueries({ 
        predicate: (query) => {
          return !query.queryKey.includes('/api/auth/me');
        }
      });
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    agent,
    isAuthenticated: !!agent,
    isLoading,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}
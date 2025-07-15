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
        const response = await apiRequest("GET", "/api/auth/me");
        
        // Check if the response is ok
        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated
            return null;
          }
          throw new Error(`Auth check failed: ${response.status}`);
        }
        
        const data = await response.json();
        // Handle different response formats from backend
        if (data.agent) {
          return data.agent;
        } else if (data.id && data.username) {
          return data;
        }
        return data;
      } catch (error) {
        console.error("Auth check error:", error);
        // If authentication fails, return null (not authenticated)
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
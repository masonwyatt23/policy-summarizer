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
        const data = await response.json() as Agent;
        return data;
      } catch (error) {
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
      // Invalidate the auth query to trigger re-authentication
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      // Clear all other cached data
      queryClient.clear();
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
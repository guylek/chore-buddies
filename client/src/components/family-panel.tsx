import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Family, JoinRequestWithUser } from "@shared/schema";
import { Search, Plus, Users, UserPlus, Check, X, Clock } from "lucide-react";

export function FamilyPanel() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [familyName, setFamilyName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Family[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: pendingRequests } = useQuery<JoinRequestWithUser[]>({
    queryKey: ["/api/families", user?.family?.id, "requests"],
    enabled: !!user?.family && user.family.ownerId === user.id,
  });

  const { data: myPendingRequest } = useQuery<{ familyName: string } | null>({
    queryKey: ["/api/join-requests/my-pending"],
    enabled: !!user && !user.family,
  });

  const createFamilyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/families", { name });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Family created!",
        description: "Welcome to your new family hub.",
      });
      setFamilyName("");
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create family",
        variant: "destructive",
      });
    },
  });

  const joinRequestMutation = useMutation({
    mutationFn: async (familyId: number) => {
      const response = await apiRequest("POST", "/api/join-requests", { familyId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: "The family owner will review your request.",
      });
      setSearchResults([]);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/join-requests/my-pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send join request",
        variant: "destructive",
      });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/join-requests/${requestId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Member approved!",
        description: "They can now access the family hub.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      refreshUser();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/join-requests/${requestId}/reject`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request declined",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/families/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search families",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            Sign in to create or join a family
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user.family ? (
          <>
            <div className="p-4 rounded-xl bg-accent/50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold" data-testid="text-current-family-name">
                  {user.family.name}
                </h3>
                {user.family.ownerId === user.id && (
                  <Badge variant="secondary" className="text-xs">
                    Owner
                  </Badge>
                )}
              </div>
            </div>

            {user.family.ownerId === user.id && pendingRequests && pendingRequests.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Join Requests
                </h4>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`request-${request.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                          {request.user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{request.user.displayName}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={() => approveRequestMutation.mutate(request.id)}
                          disabled={approveRequestMutation.isPending}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => rejectRequestMutation.mutate(request.id)}
                          disabled={rejectRequestMutation.isPending}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {myPendingRequest ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-sm">Pending Request</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Waiting for approval to join{" "}
                  <span className="font-medium">{myPendingRequest.familyName}</span>
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Family
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. The Smith Family"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      data-testid="input-family-name"
                    />
                    <Button
                      onClick={() => createFamilyMutation.mutate(familyName)}
                      disabled={!familyName.trim() || createFamilyMutation.isPending}
                      data-testid="button-create-family"
                    >
                      Create
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Join Existing Family
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search family name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      data-testid="input-search-family"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSearch}
                      disabled={!searchQuery.trim() || isSearching}
                      data-testid="button-search-family"
                    >
                      Search
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {searchResults.map((family) => (
                        <div
                          key={family.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                          data-testid={`search-result-${family.id}`}
                        >
                          <div>
                            <span className="font-medium text-sm">{family.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => joinRequestMutation.mutate(family.id)}
                            disabled={joinRequestMutation.isPending}
                            data-testid={`button-join-${family.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

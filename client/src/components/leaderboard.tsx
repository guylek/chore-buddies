import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@shared/schema";
import { Trophy, Medal, Award, Star } from "lucide-react";

const rankIcons = [
  { icon: Trophy, className: "text-yellow-500" },
  { icon: Medal, className: "text-gray-400" },
  { icon: Award, className: "text-amber-600" },
];

export function Leaderboard() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery<User[]>({
    queryKey: ["/api/families", user?.family?.id, "leaderboard"],
    enabled: !!user?.family,
  });

  if (!user?.family) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Join or create a family to see the leaderboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.map((member, index) => {
              const RankIcon = rankIcons[index]?.icon || Star;
              const rankClass = rankIcons[index]?.className || "text-muted-foreground";
              const isCurrentUser = member.id === user.id;

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCurrentUser
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-accent/30"
                  }`}
                  data-testid={`leaderboard-${member.id}`}
                >
                  <div className="flex items-center justify-center w-8">
                    {index < 3 ? (
                      <RankIcon className={`h-5 w-5 ${rankClass}`} />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {member.displayName}
                      {isCurrentUser && (
                        <span className="text-xs text-primary ml-2">(You)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-secondary/50 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{member.points}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No family members yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

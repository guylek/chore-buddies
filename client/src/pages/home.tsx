import { Header } from "@/components/header";
import { AuthPanel } from "@/components/auth-panel";
import { FamilyPanel } from "@/components/family-panel";
import { MemberList } from "@/components/member-list";
import { TaskList } from "@/components/task-list";
import { ChatInterface } from "@/components/chat-interface";
import { Leaderboard } from "@/components/leaderboard";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header familyName={user?.family?.name} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          <div className="space-y-6">
            <AuthPanel />
            <FamilyPanel />
            {user?.family && <MemberList />}
            {user?.family && <Leaderboard />}
          </div>
          
          <div className="space-y-6">
            {user?.family ? (
              <>
                <TaskList />
                <ChatInterface />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-3">
                  Welcome to Chore Buddies!
                </h2>
                <p className="text-muted-foreground max-w-md mb-2">
                  The fun way for families to manage chores and stay connected.
                </p>
                <p className="text-sm text-muted-foreground">
                  {user 
                    ? "Create a new family or join an existing one to get started."
                    : "Sign in or create an account to get started."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

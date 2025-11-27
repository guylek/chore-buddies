import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "./notification-bell";

interface HeaderProps {
  familyName?: string;
}

export function Header({ familyName }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header 
      className="relative py-8 px-6 text-center text-white overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      {user && (
        <div className="absolute top-4 right-4 z-20">
          <NotificationBell />
        </div>
      )}
      
      <div className="relative z-10">
        <h1 
          className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide"
          style={{ textShadow: "3px 3px 15px rgba(0,0,0,0.4)" }}
          data-testid="text-app-title"
        >
          Chore Buddies
        </h1>
        <p 
          className="mt-3 text-lg md:text-xl font-medium opacity-95"
          data-testid="text-family-subtitle"
        >
          {familyName || (user?.family?.name) || "Your Family Hub"}
        </p>
      </div>
    </header>
  );
}

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MessageWithUser } from "@shared/schema";
import { MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";

export function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/families", user?.family?.id, "messages"],
    enabled: !!user?.family,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/families/${user?.family?.id}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/families", user?.family?.id, "messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const formatTime = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    return format(date, "h:mm a");
  };

  const formatDate = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return format(date, "MMM d");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user?.family) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Family Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Join or create a family to chat
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedMessages: { date: string; messages: MessageWithUser[] }[] = [];
  messages?.forEach((msg) => {
    const dateStr = formatDate(msg.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    }
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Family Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ScrollArea className="h-[380px] pr-4" ref={scrollRef}>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : ""}`}>
                  {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
                  <Skeleton className={`h-16 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-xl`} />
                </div>
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {groupedMessages.map((group, groupIdx) => (
                <div key={groupIdx}>
                  <div className="flex justify-center mb-4">
                    <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      {group.date}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.messages.map((msg) => {
                      const isMe = msg.userId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${isMe ? "justify-end" : ""}`}
                          data-testid={`message-${msg.id}`}
                        >
                          {!isMe && (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {getInitials(msg.user.displayName)}
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] p-3 rounded-xl ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-card border rounded-bl-sm"
                            }`}
                          >
                            {!isMe && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {msg.user.displayName}
                              </p>
                            )}
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Shared image"
                                className="max-w-full rounded-lg mb-2"
                              />
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground/70">
                Start the conversation!
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-[80px] resize-none"
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="self-end"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

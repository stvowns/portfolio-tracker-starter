"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Copy, Check, Trash2, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  actions?: any[];
}

interface ChatProps {
  className?: string;
}

export function Chat({ className }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || "I processed your request.",
        role: "assistant",
        timestamp: new Date(),
        actions: data.actions || [],
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success/error notifications for actions
      data.actions?.forEach((action: any, index: number) => {
        if (action.error) {
          toast.error(`Action ${index + 1} failed: ${action.error}`);
        } else {
          toast.success(`Successfully ${action.action} ${action.type}`);
        }
      });

    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I had trouble processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Message copied to clipboard");

      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const renderActionResult = (action: any) => {
    if (action.error) {
      return (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          Error: {action.error}
        </div>
      );
    }

    if (action.action === "listed") {
      if (action.type === "all") {
        return (
          <div className="mt-2 space-y-2">
            <div className="text-sm font-medium">Results:</div>
            {action.data.calendarEvents?.length > 0 && (
              <div className="text-sm">
                <strong>Events:</strong> {action.data.calendarEvents.length} found
              </div>
            )}
            {action.data.tasks?.length > 0 && (
              <div className="text-sm">
                <strong>Tasks:</strong> {action.data.tasks.length} found
              </div>
            )}
            {action.data.expenses?.length > 0 && (
              <div className="text-sm">
                <strong>Expenses:</strong> {action.data.expenses.length} found
              </div>
            )}
          </div>
        );
      }

      if (Array.isArray(action.data) && action.data.length > 0) {
        return (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800">
              Found {action.data.length} {action.type}(s):
            </div>
            <div className="mt-1 space-y-1">
              {action.data.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="text-xs text-green-700">
                  {item.title || item.name || `Item ${index + 1}`}
                </div>
              ))}
              {action.data.length > 3 && (
                <div className="text-xs text-green-600 italic">
                  ... and {action.data.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
          No {action.type}s found
        </div>
      );
    }

    if (action.data) {
      return (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          Successfully {action.action} {action.type}: {action.data.title || action.data.name || "Item"}
        </div>
      );
    }

    return (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
        Successfully {action.action} {action.type}
      </div>
    );
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Planning Assistant
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearChat}
          disabled={messages.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Hello! I'm your AI planning assistant.</p>
                <p className="text-sm mt-2">
                  I can help you manage calendar events, tasks, and expenses.
                  Try asking me to create, update, or list items.
                </p>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <p>• "Add a meeting tomorrow at 2pm"</p>
                  <p>• "Show me my upcoming tasks"</p>
                  <p>• "Create an expense for $50 lunch"</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg",
                    message.role === "user"
                      ? "bg-muted/50 ml-8"
                      : "bg-primary/5 mr-8"
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => handleCopyMessage(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    {message.actions && message.actions.length > 0 && (
                      <div className="space-y-2">
                        {message.actions.map((action, index) => (
                          <div key={index}>
                            {renderActionResult(action)}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3 p-3 rounded-lg bg-primary/5 mr-8">
                <div className="flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to help with your planning..."
            disabled={isLoading}
            className="flex-1"
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
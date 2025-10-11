import { Chat } from "@/components/custom/chat";

export default function ChatPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
      </div>
      <div className="h-[calc(100vh-12rem)]">
        <Chat className="h-full" />
      </div>
    </div>
  );
}
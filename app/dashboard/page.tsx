"use client";

import { Button } from "@/components/ui/button";
import { Bot, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog";
import { PortfolioDashboard } from "./portfolio-dashboard";

export default function Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portföy Dashboard</h1>
            <p className="text-muted-foreground">
              Yatırım portföyünüzü takip edin ve analiz edin
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddTransactionDialogDialogWithData />
            <Link href="/chat">
              <Button variant="outline" size="lg" className="gap-2">
                <Bot className="h-5 w-5" />
                <MessageSquare className="h-5 w-5" />
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>
        
        <PortfolioDashboard />
      </div>
    </div>
  )
}

// Wrapper component with refresh functionality
function AddTransactionDialogDialogWithData() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    // Force re-render of PortfolioDashboard by updating the key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <AddTransactionDialog onSuccess={handleSuccess} />
      <PortfolioDashboard key={refreshKey} />
    </>
  );
}

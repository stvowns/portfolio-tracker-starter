"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, DollarSign, Coins, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog";
import { PortfolioDashboard } from "./portfolio-dashboard";

export default function Page() {
  const [currency, setCurrency] = useState<"TRY" | "USD">("TRY");
  const { theme, setTheme } = useTheme();

  const toggleCurrency = () => {
    setCurrency(prev => prev === "TRY" ? "USD" : "TRY");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

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
            {/* Currency Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCurrency}
              className="gap-2"
            >
              {currency === "TRY" ? (
                <>
                  <Coins className="h-4 w-4" />
                  TRY
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  USD
                </>
              )}
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

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
        
        <PortfolioDashboard currency={currency} />
      </div>
    </div>
  )
}

function AddTransactionDialogDialogWithData() {
  const handleSuccess = () => {
    window.location.reload();
  };

  return <AddTransactionDialog onSuccess={handleSuccess} />;
}

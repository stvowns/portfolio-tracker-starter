import { ExpenseChart } from "@/components/custom/expense-chart"
import { DashboardWidgets } from "@/components/custom/dashboard-widgets"
import { SectionCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button"
import { Bot, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your calendar, tasks, and expenses with AI assistance
            </p>
          </div>
          <Link href="/chat">
            <Button size="lg" className="gap-2">
              <Bot className="h-5 w-5" />
              <MessageSquare className="h-5 w-5" />
              AI Assistant
            </Button>
          </Link>
        </div>
        <SectionCards />
        <div className="px-4 lg:px-6">
          <DashboardWidgets />
        </div>
        <div className="px-4 lg:px-6">
          <ExpenseChart />
        </div>
      </div>
    </div>
  )
}
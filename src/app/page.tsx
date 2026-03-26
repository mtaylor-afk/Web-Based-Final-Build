import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CameraIconIndicator } from "@/components/shared/camera-icon-indicator";
import {
  FileText,
  Receipt,
  Users,
  ClipboardCheck,
  Plus,
  BookOpen,
  Image,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

async function getDashboardData() {
  const [totalClients, totalQuotes, totalInvoices, totalSignOffs, recentQuotes, recentInvoices, recentClients] =
    await Promise.all([
      prisma.client.count(),
      prisma.quote.count(),
      prisma.invoice.count(),
      prisma.projectSignOff.count(),
      prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { fullName: true, companyName: true } } },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { fullName: true } } },
      }),
      prisma.client.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return { totalClients, totalQuotes, totalInvoices, totalSignOffs, recentQuotes, recentInvoices, recentClients };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const quickActions = [
    { href: "/quotes/new", label: "New Quote", icon: FileText, color: "bg-navy-800", desc: "Create a new client quote" },
    { href: "/quotes", label: "Saved Quotes", icon: FileText, color: "bg-navy-700", desc: "View all saved quotes" },
    { href: "/invoices/new", label: "New Invoice", icon: Receipt, color: "bg-amber-600", desc: "Create a standalone invoice" },
    { href: "/invoices", label: "Saved Invoices", icon: Receipt, color: "bg-amber-500", desc: "View all invoices" },
    { href: "/clients/new", label: "New Client", icon: Users, color: "bg-emerald-600", desc: "Add a new client record" },
    { href: "/clients", label: "Client Directory", icon: Users, color: "bg-emerald-700", desc: "Browse all clients" },
    { href: "/signoff", label: "Project Sign-Off", icon: ClipboardCheck, color: "bg-violet-600", desc: "Manage sign-off documents" },
    { href: "/visuals", label: "Visuals", icon: Image, color: "bg-rose-600", desc: "Inspiration boards & visualisations" },
    { href: "/rates", label: "Rates Library", icon: BookOpen, color: "bg-slate-600", desc: "Manage pricing and rates" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Good morning</h1>
          <p className="text-muted-foreground mt-1">
            WV Construction — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Button asChild className="bg-amber-500 hover:bg-amber-600">
          <Link href="/quotes/new">
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clients" value={data.totalClients} icon={Users} subtitle="Total clients on file" />
        <StatCard title="Quotes" value={data.totalQuotes} icon={FileText} subtitle="All time" />
        <StatCard title="Invoices" value={data.totalInvoices} icon={Receipt} subtitle="All time" />
        <StatCard title="Sign-Offs" value={data.totalSignOffs} icon={ClipboardCheck} subtitle="Completed projects" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition-all hover:shadow-md hover:border-amber-300"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-navy-900 group-hover:text-amber-600 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Quotes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/quotes" className="text-xs text-muted-foreground hover:text-navy-900">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentQuotes.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No quotes yet</p>
            )}
            {data.recentQuotes.map((q) => (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-semibold text-navy-900">{q.ref}</span>
                    <CameraIconIndicator hasImages={q.hasImages} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{q.client.fullName}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-semibold">{formatCurrency(Number(q.total))}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(q.date)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Invoices</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/invoices" className="text-xs text-muted-foreground hover:text-navy-900">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentInvoices.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
            )}
            {data.recentInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-semibold text-navy-900">{inv.ref}</span>
                    <CameraIconIndicator hasImages={inv.hasImages} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{inv.client.fullName}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-semibold">{formatCurrency(Number(inv.total))}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(inv.date)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Clients</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/clients" className="text-xs text-muted-foreground hover:text-navy-900">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentClients.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No clients yet</p>
            )}
            {data.recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-900 truncate">{client.fullName}</p>
                  {client.companyName && (
                    <p className="text-xs text-muted-foreground truncate">{client.companyName}</p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatDate(client.createdAt)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

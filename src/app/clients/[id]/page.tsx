import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CameraIconIndicator } from "@/components/shared/camera-icon-indicator";
import {
  Edit,
  FileText,
  Receipt,
  ClipboardCheck,
  Image,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      quotes: { orderBy: { createdAt: "desc" }, take: 10 },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      signOffs: { orderBy: { createdAt: "desc" }, take: 10 },
      visuals: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={client.fullName} description={client.companyName || undefined}>
        <Button variant="outline" asChild>
          <Link href={`/clients/${client.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Link>
        </Button>
        <Button asChild className="bg-navy-900 hover:bg-navy-800">
          <Link href={`/quotes/new?clientId=${client.id}`}>
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.companyName && (
              <div className="flex gap-2">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm">{client.companyName}</span>
              </div>
            )}
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-sm whitespace-pre-wrap">{client.address}</span>
            </div>
            {client.email && (
              <div className="flex gap-2">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <a href={`tel:${client.phone}`} className="text-sm">
                  {client.phone}
                </a>
              </div>
            )}
            {client.notes && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
            <div className="pt-3 border-t text-xs text-muted-foreground">
              Client since {formatDate(client.createdAt)}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/quotes/new?clientId=${client.id}`}>
                <FileText className="h-4 w-4 mr-2 text-navy-700" />
                New Quote for {client.fullName.split(" ")[0]}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/invoices/new?clientId=${client.id}`}>
                <Receipt className="h-4 w-4 mr-2 text-amber-600" />
                New Invoice for {client.fullName.split(" ")[0]}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/signoff/new?clientId=${client.id}`}>
                <ClipboardCheck className="h-4 w-4 mr-2 text-emerald-600" />
                Create Sign-Off
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/visuals/new?clientId=${client.id}`}>
                <Image className="h-4 w-4 mr-2 text-rose-500" />
                Generate Visual
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Summary counts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quotes</span>
              <Badge variant="outline">{client.quotes.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invoices</span>
              <Badge variant="outline">{client.invoices.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sign-Offs</span>
              <Badge variant="outline">{client.signOffs.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Visuals</span>
              <Badge variant="outline">{client.visuals.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quote History */}
      {client.quotes.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Quote History</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/quotes?clientId=${client.id}`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2 font-semibold text-navy-900">Reference</th>
                  <th className="text-left pb-2 font-semibold text-navy-900 hidden sm:table-cell">Address</th>
                  <th className="text-left pb-2 font-semibold text-navy-900">Date</th>
                  <th className="text-right pb-2 font-semibold text-navy-900">Total</th>
                  <th className="text-right pb-2 font-semibold text-navy-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {client.quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="py-2.5">
                      <Link href={`/quotes/${q.id}`} className="flex items-center gap-1 font-mono text-xs font-semibold text-navy-900 hover:text-amber-600">
                        {q.ref}
                        <CameraIconIndicator hasImages={q.hasImages} />
                      </Link>
                    </td>
                    <td className="py-2.5 hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[200px]">{q.address}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{formatDate(q.date)}</td>
                    <td className="py-2.5 text-right text-xs font-semibold">{formatCurrency(Number(q.total))}</td>
                    <td className="py-2.5 text-right">
                      <Badge variant={q.status as never} className="text-[10px]">{q.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Invoice History */}
      {client.invoices.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2 font-semibold text-navy-900">Reference</th>
                  <th className="text-left pb-2 font-semibold text-navy-900 hidden sm:table-cell">Address</th>
                  <th className="text-left pb-2 font-semibold text-navy-900">Date</th>
                  <th className="text-right pb-2 font-semibold text-navy-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {client.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="py-2.5">
                      <Link href={`/invoices/${inv.id}`} className="flex items-center gap-1 font-mono text-xs font-semibold text-navy-900 hover:text-amber-600">
                        {inv.ref}
                        <CameraIconIndicator hasImages={inv.hasImages} />
                      </Link>
                    </td>
                    <td className="py-2.5 hidden sm:table-cell text-xs text-muted-foreground truncate max-w-[200px]">{inv.address}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{formatDate(inv.date)}</td>
                    <td className="py-2.5 text-right text-xs font-semibold">{formatCurrency(Number(inv.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Sign-Off History */}
      {client.signOffs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Sign-Off History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {client.signOffs.map((s) => (
                <Link
                  key={s.id}
                  href={`/signoff/${s.id}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-navy-900">{s.ref}</span>
                    <CameraIconIndicator hasImages={s.hasImages} />
                    <span className="text-xs text-muted-foreground">{s.address}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {s.completionDate ? formatDate(s.completionDate) : formatDate(s.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visuals */}
      {client.visuals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Linked Visuals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {client.visuals.map((v) => (
                <Link
                  key={v.id}
                  href={`/visuals/${v.id}`}
                  className="group block rounded-lg border overflow-hidden hover:border-amber-400 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.imageUrl}
                    alt={v.title || v.type}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{v.title || v.type.replace("_", " ")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

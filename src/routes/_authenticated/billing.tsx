import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { useInvoices, useProfile, useSubscription } from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLANS, fcfa, formatDate, whatsappLink, SUPPORT_WA } from "@/lib/msn";
import { buildReport, downloadReport } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Facturation et abonnement — MSN Tracker" },
      { name: "description", content: "Gérez votre abonnement MSN Tracker et vos factures en FCFA." },
      { property: "og:title", content: "Facturation et abonnement — MSN Tracker" },
      { property: "og:description", content: "Gérez votre abonnement MSN Tracker et vos factures en FCFA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { data: subscription } = useSubscription();
  const { data: invoices = [] } = useInvoices();
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  async function choosePlan(key: keyof typeof PLANS) {
    const plan = PLANS[key];
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user!.id;
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: key, price_fcfa: plan.price, vehicle_limit: plan.vehicles, status: "active" })
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("invoices").insert({
      user_id: userId,
      number: `MSN-${Date.now().toString().slice(-8)}`,
      plan: key,
      amount_fcfa: plan.price,
      status: "pending",
    });
    toast.success(`Abonnement ${plan.label} activé — une facture a été générée.`);
    qc.invalidateQueries();
  }

  function invoicePdf(number: string, amount: number, plan: string, issued: string) {
    const doc = buildReport(
      { title: `Facture ${number}`, subtitle: `Abonnement ${plan}`, company: profile?.company ?? null },
      ["Désignation", "Période", "Montant"],
      [[`Abonnement MSN Tracker ${plan}`, formatDate(issued), fcfa(amount)]],
      [`Total à payer : ${fcfa(amount)}`, "Paiement mobile money : +225 05 07 34 86 85"],
    );
    downloadReport(doc, `${number}.pdf`);
  }

  return (
    <div>
      <PageHeader title="Facturation" description="Abonnements et factures en FCFA." />
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key) => {
          const plan = PLANS[key];
          const active = subscription?.plan === key;
          return (
            <Card key={key} className={active ? "border-primary" : ""}>
              <CardHeader><CardTitle>{plan.label}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="font-display text-2xl font-bold">{fcfa(plan.price)}<span className="text-sm text-muted-foreground">/mois</span></p>
                <p className="text-sm text-muted-foreground">Jusqu'à {plan.vehicles} véhicules</p>
                <Button className="w-full" variant={active ? "secondary" : "default"} onClick={() => choosePlan(key)}>
                  {active ? "Formule actuelle" : "Choisir"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Factures</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Formule</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.number}</TableCell>
                  <TableCell>{i.plan}</TableCell>
                  <TableCell>{fcfa(i.amount_fcfa)}</TableCell>
                  <TableCell>{i.status === "paid" ? "Payée" : "En attente"}</TableCell>
                  <TableCell className="text-xs">{formatDate(i.issued_at)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => invoicePdf(i.number, i.amount_fcfa, i.plan, i.issued_at)}>PDF</Button>
                    <a href={whatsappLink(SUPPORT_WA, `Bonjour, je souhaite régler la facture ${i.number} (${fcfa(i.amount_fcfa)}).`)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">Payer</Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {invoices.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucune facture.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

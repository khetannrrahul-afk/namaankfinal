import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAccount, type Account } from "@/lib/account";
import { getMyPricing } from "@/lib/billing.functions";
import { payForFullReportAsUser } from "@/lib/checkout";
import { PageHeader, Panel, Loading, btnPrimary, btnGhost } from "@/components/panel/Ui";

export const Route = createFileRoute("/pay")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    meta: [
      { title: "Full Report Payment — NAMAANK" },
      { name: "description", content: "Apne guide ke tay kiye price par NAMAANK full report unlock karein." },
      { property: "og:title", content: "Full Report Payment — NAMAANK" },
      { property: "og:description", content: "Surakshit payment ke baad full report turant unlock ho jaati hai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PayPage,
});

function PayPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Account | null>(null);
  const [pricing, setPricing] = useState<{ priceInr: number; subAdminName: string; gateways: string[] } | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string; txn?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const a = await getAccount();
      if (!a) return navigate({ to: "/auth" });
      setMe(a);
      const p = await getMyPricing();
      setPricing(p);
    })();
  }, [navigate]);

  if (!me || !pricing) return <Loading />;

  const paid = me.access.full_unlocked || result?.ok;

  const pay = async () => {
    setBusy(true);
    setResult(null);
    const res = await payForFullReportAsUser(setStage);
    setStage(null);
    setBusy(false);
    if (res.ok) {
      setResult({ ok: true, text: "Payment successful — full report unlock ho gayi!", txn: res.paymentId });
      const a = await getAccount();
      setMe(a);
    } else {
      setResult({ ok: false, text: res.message, ...(res.orderId ? { txn: res.orderId } : {}) });
    }
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <PageHeader
          title="Full Report Payment"
          sub="Payment successful hote hi report access apne aap update ho jaata hai."
          right={
            <Link to="/me" className={btnGhost}>
              Dashboard
            </Link>
          }
        />

        <Panel title="Aapka plan">
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Full report</span>
              <span className="font-semibold">₹{pricing.priceInr}</span>
            </p>
            <p className="flex justify-between text-xs">
              <span className="text-muted-foreground">Guide (Subadmin)</span>
              <span>{pricing.subAdminName || "—"}</span>
            </p>
            <p className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment method</span>
              <span>{pricing.gateways.length ? pricing.gateways.join(", ") : "abhi koi gateway enabled nahi"}</span>
            </p>
          </div>
        </Panel>

        <Panel title="Payment">
          {paid ? (
            <div className="space-y-3">
              <p className="text-sm text-primary">Payment ho chuka hai — full report unlocked ✓</p>
              <Link to="/report" search={{ id: undefined }} className={btnPrimary}>
                Full report kholein
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={pay} disabled={busy || pricing.gateways.length === 0} className={`${btnPrimary} w-full py-3`}>
                {busy ? (stage ?? "Ruko…") : `₹${pricing.priceInr} pay karein`}
              </button>
              {result && (
                <p className={`text-xs ${result.ok ? "text-primary" : "text-destructive"}`}>
                  {result.text}
                  {result.txn ? ` (Ref: ${result.txn})` : ""}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Payment surakshit gateway par hota hai. Verification ke baad hi report unlock hoti hai.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}

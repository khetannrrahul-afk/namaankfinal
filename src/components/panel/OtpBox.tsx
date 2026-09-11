import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { field, btnPrimary, btnGhost } from "@/components/panel/Ui";

/**
 * Email par bheja gaya 6-digit code verify karta hai (signup confirmation).
 * Verify hone par session ban jaata hai aur onDone() call hota hai.
 */
export function OtpBox({ email, onDone }: { email: string; onDone: () => void | Promise<void> }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const verify = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (error) setMsg({ kind: "error", text: error.message });
    else await onDone();
    setBusy(false);
  };

  const resend = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setMsg(error ? { kind: "error", text: error.message } : { kind: "ok", text: "Naya code bhej diya gaya." });
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs">
        <p className="font-medium text-primary">Email verify karein</p>
        <p className="mt-1 text-muted-foreground break-all">
          {email} par 6-digit code bheja gaya hai. Wahi code yahan daalein (ya email ka link kholein).
        </p>
      </div>
      <input
        className={`${field} tracking-[0.5em] text-center text-lg`}
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
      />
      {msg && <p className={`text-xs ${msg.kind === "error" ? "text-destructive" : "text-primary"}`}>{msg.text}</p>}
      <button type="button" disabled={busy || code.length < 6} className={`${btnPrimary} w-full py-3`} onClick={() => void verify()}>
        {busy ? "Ruko…" : "Verify karein"}
      </button>
      <button type="button" disabled={busy} className={`${btnGhost} w-full`} onClick={() => void resend()}>
        Code dobara bhejein
      </button>
    </div>
  );
}

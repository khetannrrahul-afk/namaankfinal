import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { relayToTelegram } from "@/lib/telegram.functions";

interface Msg {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  delivered_to_telegram: boolean;
}

export function Chat({
  meId,
  peerId,
  peerName,
}: {
  meId: string;
  peerId: string;
  peerName: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id,sender_id,recipient_id,body,created_at,delivered_to_telegram")
      .or(`and(sender_id.eq.${meId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${meId})`)
      .order("created_at", { ascending: true })
      .limit(200);
    setMsgs((data ?? []) as Msg[]);
  }, [meId, peerId]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`chat-${meId}-${peerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load, meId, peerId]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [msgs]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: meId, recipient_id: peerId, body })
      .select("id")
      .maybeSingle();
    if (!error && data) {
      setText("");
      void relayToTelegram({ data: { messageId: data.id } }).catch(() => undefined);
      await load();
    }
    setBusy(false);
  };

  return (
    <div className="surface flex h-[420px] flex-col p-3">
      <p className="mb-2 text-xs font-semibold text-primary">Chat — {peerName}</p>
      <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto pr-1">
        {msgs.length === 0 && <p className="text-xs text-muted-foreground">Abhi koi message nahi. Pehla message bhejein.</p>}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
              m.sender_id === meId ? "ml-auto bg-primary/15 text-foreground" : "bg-secondary text-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(m.created_at).toLocaleString("en-IN")}
              {m.sender_id === meId && m.delivered_to_telegram ? " · Telegram ✓" : ""}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          placeholder="Message likhein…"
          className="flex-1 rounded-xl border border-border bg-[var(--input)] px-3 py-2 text-sm"
        />
        <button
          onClick={() => void send()}
          disabled={busy}
          className="rounded-xl border border-primary/50 bg-primary/15 px-4 text-xs text-primary disabled:opacity-60"
        >
          Bhejein
        </button>
      </div>
    </div>
  );
}

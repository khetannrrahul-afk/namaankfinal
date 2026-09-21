import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DIRECTIONS = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
  "I don't know",
] as const;

export const FOCUS_AREAS = ["Career", "Relationship", "Health", "General"] as const;

export type Direction = (typeof DIRECTIONS)[number];
export type FocusArea = (typeof FOCUS_AREAS)[number];

export interface GeneratorInput {
  name: string;
  dob: string; // yyyy-mm-dd
  time?: string; // HH:mm | ""
  place: string;
  direction: Direction;
  focus: FocusArea;
  submissionId?: string;
}

export interface ReportSegments {
  numerology: string;
  astrology: string;
  vastu: string;
  guidance: string;
  affirmation: string;
}

export const DISCLAIMER =
  "Note: Ye report entertainment aur self-reflection ke liye hai, iska koi scientific proof nahi hai.";

const SEGMENT_KEYS: (keyof ReportSegments)[] = [
  "numerology",
  "astrology",
  "vastu",
  "guidance",
  "affirmation",
];

const ddmmyyyy = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}-${m}-${y}` : iso;
};

function buildPrompt(v: GeneratorInput) {
  const time = v.time ? v.time : "unknown (person ko birth time nahi pata)";
  return `Aap ek anubhavi Indian numerologist, jyotishi aur vastu consultant hain. Neeche diye vyakti ke liye ek personalised report likhiye.

Naam: ${v.name}
Janm tarikh: ${ddmmyyyy(v.dob)}
Janm samay: ${time}
Janm sthaan: ${v.place}
Ghar ke main gate/darwaze ki disha: ${v.direction}
Focus area: ${v.focus}

Report ke 5 hisse chahiye:
1. numerology — Life Path Number, Destiny Number aur Birth Day Number calculate karke short analysis (numbers explicitly likhein).
2. astrology — Rashi, Nakshatra (agar birth time nahi hai to approximate batakar clearly mention karein) aur current graha influence ka overview.
3. vastu — sirf di gayi main-door disha (${v.direction}) ke aadhar par vastu analysis aur practical remedies. Agar disha "I don't know" hai to general guidance dein aur disha check karne ka tarika batayein.
4. guidance — ${v.focus} par focused guidance, practical steps ke saath.
5. affirmation — ek chhota positive affirmation (1-2 lines).

Rules:
- Bhasha Hinglish (Roman script mein Hindi-English mix), tone warm, respectful aur professional.
- Har segment 120-200 shabd (affirmation chhota).
- Markdown headings ya bullets ka use na karein, saaf paragraphs likhein.
- Sirf valid JSON return karein, exactly in keys ke saath: {"numerology": "...", "astrology": "...", "vastu": "...", "guidance": "...", "affirmation": "..."}
- "affirmation" value ki last line exactly ye honi chahiye: ${DISCLAIMER}`;
}

async function callClaude(prompt: string): Promise<ReportSegments> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "Report generator abhi configure nahi hua hai. Kripya ANTHROPIC_API_KEY add karwayein.",
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[anthropic]", res.status, detail.slice(0, 500));
    if (res.status === 401 || res.status === 403) throw new Error("Report service ki key invalid hai.");
    if (res.status === 429) throw new Error("Abhi bahut requests aa rahi hain — thodi der baad try karein.");
    throw new Error("Report generate nahi ho payi, kripya dobara koshish karein.");
  }

  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (json.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");

  const raw = `{${text}`.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("Report ka format sahi nahi aaya, dobara try karein.");
  }

  const out = {} as ReportSegments;
  for (const k of SEGMENT_KEYS) {
    const value = typeof parsed[k] === "string" ? (parsed[k] as string).trim() : "";
    if (!value) throw new Error("Report adhoori aayi, dobara try karein.");
    out[k] = value;
  }
  if (!out.affirmation.includes(DISCLAIMER)) out.affirmation = `${out.affirmation}\n\n${DISCLAIMER}`;
  return out;
}

/** Report generator — sirf logged-in user ke liye, content server par banta hai. */
export const generateAiReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: GeneratorInput) => {
    if (!d?.name?.trim()) throw new Error("Naam zaroori hai");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.dob ?? "")) throw new Error("Janm tarikh zaroori hai");
    if (!d.place?.trim()) throw new Error("Janm sthaan zaroori hai");
    if (!DIRECTIONS.includes(d.direction)) throw new Error("Disha invalid hai");
    if (!FOCUS_AREAS.includes(d.focus)) throw new Error("Focus area invalid hai");
    return {
      name: d.name.trim().slice(0, 80),
      dob: d.dob,
      time: (d.time ?? "").trim().slice(0, 10),
      place: d.place.trim().slice(0, 120),
      direction: d.direction,
      focus: d.focus,
      ...(d.submissionId ? { submissionId: d.submissionId } : {}),
    } satisfies GeneratorInput;
  })
  .handler(async ({ data, context }) => {
    const segments = await callClaude(buildPrompt(data));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("ai_reports")
      .insert({
        user_id: context.userId,
        submission_id: data.submissionId ?? null,
        name: data.name,
        dob: data.dob,
        birth_time: data.time || null,
        place: data.place,
        direction: data.direction,
        focus: data.focus,
        segments,
      })
      .select("id,created_at")
      .single();

    return { id: row?.id ?? null, createdAt: row?.created_at ?? null, input: data, segments };
  });

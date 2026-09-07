import { useEffect, useState } from "react";
import type { BirthInput, Gender } from "@/lib/numerology";
import type { Lang } from "@/lib/langs/types";
import { LANG_LABELS } from "@/lib/langs";

interface Props {
  /** null = success, string = error message dikhao */
  onSubmit: (v: BirthInput) => Promise<string | null> | void;
}

interface Place {
  label: string;
  lat: number;
  lon: number;
  country: string;
}

const IST = "Asia/Kolkata";

const label = "block text-sm font-medium text-foreground/90 mb-1.5";
const field =
  "w-full rounded-xl border border-border bg-[var(--input)] px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/70";

export default function InputForm({ onSubmit }: Props) {
  const [lang, setLang] = useState<Lang>("hinglish");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [gender, setGender] = useState<Gender>("purush");
  const [place, setPlace] = useState("");
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (place.trim().length < 3 || coords.lat) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/public/geo?q=${encodeURIComponent(place)}`);
        setResults((await r.json()) as Place[]);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 500);
    return () => clearTimeout(t);
  }, [place, coords.lat]);

  const choose = (p: Place) => {
    setPlace(p.label);
    setCoords({ lat: p.lat, lon: p.lon });
    setResults([]);
  };

  const detect = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const r = await fetch(`/api/public/geo?q=${pos.coords.latitude},${pos.coords.longitude}`);
      const data = (await r.json()) as Place[];
      if (data[0]) choose(data[0]);
      else {
        setPlace(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob || !time || !place || !mobile || !email) {
      setError("Sabhi * wale fields bharna zaroori hai — analysis date, time aur place teeno par aadharit hai.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await onSubmit({ lang, name, dob, time, timezone: IST, gender, place, ...coords, mobile, email });
    if (res) setError(res);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} autoComplete="off" noValidate className="surface mx-auto w-full max-w-xl p-5 sm:p-7">
      <h2 className="mb-1 text-xl font-semibold glow-text">Apni Janm Jaankari Bharein</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Poora analysis aapke janm ki tarikh, samay aur sthaan — teeno ke hisaab se banta hai. Samay Indian Standard Time
        (IST, UTC+5:30) mein liya jaata hai.
      </p>

      <div className="space-y-4">
        <div>
          <label className={label} htmlFor="na-lang">
            Report Language / भाषा *
          </label>
          <select
            id="na-lang"
            name="namaank-lang"
            className={field}
            data-lpignore="true"
            data-form-type="other"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map((c) => (
              <option key={c} value={c}>
                {LANG_LABELS[c]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Poori report isi bhasha mein banegi (Hinglish / हिंदी / English).
          </p>
        </div>

        <div>
          <label className={label} htmlFor="na-name">
            Poora Naam *
          </label>
          <input
            id="na-name"
            name="namaank-fullname"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            className={field}
            data-lpignore="true"
            data-form-type="other"
            placeholder="Rahul Khetan"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="na-dob">
              Janm Tarikh *
            </label>
            <input
              id="na-dob"
              name="namaank-dob"
              type="date"
              autoComplete="off"
              className={field}
              data-lpignore="true"
              data-form-type="other"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="na-time">
              Janm Samay *
            </label>
            <input
              id="na-time"
              name="namaank-time"
              type="time"
              autoComplete="off"
              className={field}
              data-lpignore="true"
              data-form-type="other"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={label}>Time Zone</label>
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
            Indian Standard Time (IST) · UTC+5:30 · Asia/Kolkata
          </div>
        </div>

        <div>
          <label className={label}>Ling *</label>
          <div className="flex gap-2">
            {(["purush", "mahila"] as Gender[]).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm capitalize transition ${
                  gender === g
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-[var(--input)] text-muted-foreground"
                }`}
              >
                {g === "purush" ? "Purush" : "Mahila"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <label className={label} htmlFor="na-place">
            Janm Sthan *
          </label>
          <div className="flex gap-2">
            <input
              id="na-place"
              name="namaank-place"
              type="text"
              autoComplete="off"
              className={field}
              data-lpignore="true"
              data-form-type="other"
              placeholder="Dinhata, Cooch Behar, West Bengal, India"
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                setCoords({});
              }}
            />
            <button
              type="button"
              onClick={detect}
              className="shrink-0 rounded-xl border border-primary/50 bg-primary/15 px-3 text-xs text-primary"
            >
              Detect
            </button>
          </div>
          {searching && <p className="mt-1 text-xs text-muted-foreground">Dhoondh rahe hain…</p>}
          {results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-xl">
              {results.map((p) => (
                <li key={p.label}>
                  <button
                    type="button"
                    onClick={() => choose(p)}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-secondary"
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className={label} htmlFor="na-mobile">
            Mobile Number *
          </label>
          <input
            id="na-mobile"
            name="namaank-mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            className={field}
            data-lpignore="true"
            data-form-type="other"
            placeholder="98XXXXXXXX"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>

        <div>
          <label className={label} htmlFor="na-email">
            Email *
          </label>
          <input
            id="na-email"
            name="namaank-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            className={field}
            data-lpignore="true"
            data-form-type="other"
            placeholder="raahulkhetaan@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[image:var(--grad-accent)] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Save ho raha hai…" : "Mera Ank Rahasya Kholein"}
        </button>
      </div>
    </form>
  );
}

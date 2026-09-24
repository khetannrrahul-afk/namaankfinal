import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Hash, MoonStar, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/namaank/SiteChrome";
import { Button } from "@/components/ui/button";
import { CHALDEAN, digitSum, reduce1to9 } from "@/lib/numerology";
import { field } from "@/components/panel/Ui";

export const Route = createFileRoute("/calculator")({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: "Numerology & Zodiac Calculators — NAMAANK" },
    { name: "description", content: "Calculate your Life Path Number, Chaldean Name Number, mobile number and discover your Sun and approximate Moon sign." },
    { property: "og:title", content: "Mystic Calculators — NAMAANK" },
    { property: "og:description", content: "Life Path, Chaldean Name Numerology and Sun/Moon Sign Finder." },
    { property: "og:url", content: "https://namaankfinal.lovable.app/calculator" }, { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ], links:[{rel:"canonical",href:"https://namaankfinal.lovable.app/calculator"}] }), component: CalculatorPage,
});

type Tab="life"|"name"|"sign";
const meanings:Record<number,string>={1:"Independent leadership aur initiative",2:"Sensitivity, balance aur partnership",3:"Creativity, expression aur optimism",4:"Discipline, structure aur practical growth",5:"Freedom, adaptability aur communication",6:"Care, harmony aur responsibility",7:"Introspection, wisdom aur spiritual search",8:"Ambition, authority aur material mastery",9:"Compassion, courage aur completion"};
const zodiac=["Capricorn","Aquarius","Pisces","Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius"];
function getSun(dob:string){if(!dob)return "";const[,mm,dd]=dob.split("-").map(Number);const m=mm??1,d=dd??1;const cut=[20,19,21,20,21,21,23,23,23,23,22,22];const i=(m-1+(d>=(cut[m-1]??31)?1:0))%12;return zodiac[i]??""}
function approximateMoon(dob:string,time:string,place:string){if(!dob)return "";const days=Math.floor(new Date(`${dob}T${time||"12:00"}:00Z`).getTime()/86400000);const placeValue=[...place].reduce((a,c)=>a+c.charCodeAt(0),0);return zodiac[((days+Math.floor(placeValue/90))%12+12)%12]??""}

function CalculatorPage(){
 const[tab,setTab]=useState<Tab>("life");const[dob,setDob]=useState("");const[name,setName]=useState("");const[mobile,setMobile]=useState("");const[time,setTime]=useState("");const[place,setPlace]=useState("");
 const letters=useMemo(()=>name.toUpperCase().replace(/[^A-Z]/g,"").split("").map(ch=>({ch,v:CHALDEAN[ch]??0})),[name]);
 const nameTotal=letters.reduce((a,x)=>a+x.v,0);const mobileTotal=digitSum(mobile);const lifeTotal=dob?digitSum(dob):0;const life=reduce1to9(lifeTotal);const sun=getSun(dob);const moon=approximateMoon(dob,time,place);
 const tabs:[Tab,string,typeof Hash][]=[["life","Life Path",CalendarDays],["name","Name Numerology",Hash],["sign","Sun / Moon Sign",MoonStar]];
 return <SiteLayout><main>
  <section className="hero-grad border-b border-border px-4 py-12 text-center"><p className="text-xs uppercase tracking-[0.3em] text-accent">Har Ank ke Rahasye</p><h1 className="mt-3 text-4xl font-bold glow-text">NAMAANK</h1><p className="mx-auto mt-4 max-w-xl text-sm text-foreground/75">Numerology aur zodiac tools — ek dedicated space mein.</p></section>
  <section className="mx-auto max-w-4xl px-4 py-10">
   <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card/40 p-1">{tabs.map(([id,label,Icon])=><Button key={id} type="button" variant={tab===id?"default":"ghost"} className="h-auto min-h-12 gap-1 px-2 text-[10px] sm:text-xs" onClick={()=>setTab(id)}><Icon className="size-4 shrink-0"/><span>{label}</span></Button>)}</div>
   <div className="mt-6 surface p-5 sm:p-7">
    {tab==="life"&&<div><Heading icon={CalendarDays} title="Life Path Number Calculator" sub="Apni birth date se core life-path vibration dekhein."/><label className="mt-6 block text-xs" htmlFor="life-dob">Date of Birth</label><input id="life-dob" type="date" className={`${field} mt-2`} value={dob} onChange={e=>setDob(e.target.value)}/>{dob&&<Result title="Your Life Path Number" number={life} text={meanings[life]??""} formula={`${dob.split("-").reverse().join("-")} ke sabhi digits = ${lifeTotal} → ${life}`}/>}</div>}
    {tab==="name"&&<div><Heading icon={Hash} title="Name Numerology Calculator" sub="Chaldean system se name aur mobile vibration calculate karein."/><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><label className="block text-xs" htmlFor="name-input">Full Name</label><input id="name-input" className={`${field} mt-2`} value={name} onChange={e=>setName(e.target.value)} placeholder="Apna poora naam"/></div><div><label className="block text-xs" htmlFor="mobile-input">Mobile Number</label><input id="mobile-input" inputMode="numeric" className={`${field} mt-2`} value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,"").slice(0,15))} placeholder="Mobile number"/></div></div>{letters.length>0&&<div className="mt-6"><p className="text-xs font-semibold text-primary">Alphabet-wise Chaldean total</p><div className="mt-3 flex flex-wrap gap-2">{letters.map((x,i)=><span key={`${x.ch}-${i}`} className="flex size-10 flex-col items-center justify-center rounded-lg border border-border"><b className="text-xs">{x.ch}</b><small className="text-[9px] text-accent">{x.v}</small></span>)}</div><Result title="Name Number" number={reduce1to9(nameTotal)} text={meanings[reduce1to9(nameTotal)]??""} formula={`Compound total ${nameTotal} → single ${reduce1to9(nameTotal)}`}/></div>}{mobile&&<Result title="Mobile Number" number={reduce1to9(mobileTotal)} text={meanings[reduce1to9(mobileTotal)]??""} formula={`Digits total ${mobileTotal} → single ${reduce1to9(mobileTotal)}`}/>}</div>}
    {tab==="sign"&&<div><Heading icon={MoonStar} title="Sun / Moon Sign Finder" sub="Birth details se Western Sun sign aur approximate Moon sign dekhein."/><div className="mt-6 grid gap-4 sm:grid-cols-3"><div><label className="block text-xs" htmlFor="sign-dob">Date of Birth</label><input id="sign-dob" type="date" className={`${field} mt-2`} value={dob} onChange={e=>setDob(e.target.value)}/></div><div><label className="block text-xs" htmlFor="sign-time">Birth Time</label><input id="sign-time" type="time" className={`${field} mt-2`} value={time} onChange={e=>setTime(e.target.value)}/></div><div><label className="block text-xs" htmlFor="sign-place">Birth Place</label><input id="sign-place" className={`${field} mt-2`} value={place} onChange={e=>setPlace(e.target.value)} placeholder="City"/></div></div>{dob&&<div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2"><div className="bg-background p-6 text-center"><p className="text-xs text-muted-foreground">Sun Sign</p><p className="mt-2 text-2xl font-bold text-primary">{sun}</p></div><div className="bg-background p-6 text-center"><p className="text-xs text-muted-foreground">Approx. Moon Sign</p><p className="mt-2 text-2xl font-bold text-accent">{moon}</p></div></div>}<p className="mt-4 text-[10px] leading-5 text-muted-foreground">Moon sign yahan approximate hai. Exact Vedic Moon sign ke liye precise coordinates aur astronomical ephemeris ke saath detailed kundli calculation zaroori hoti hai.</p></div>}
   </div>
  </section>
 </main></SiteLayout>
}
function Heading({icon:Icon,title,sub}:{icon:typeof Sparkles;title:string;sub:string}){return <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-accent/40"><Icon className="size-5 text-accent"/></div><div><h2 className="text-lg font-semibold text-primary">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{sub}</p></div></div>}
function Result({title,number,text,formula}:{title:string;number:number;text:string;formula:string}){return <div className="mt-6 border-t border-border pt-6"><div className="grid gap-4 sm:grid-cols-[110px_1fr]"><div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-primary/40 bg-primary/10"><span className="text-4xl font-bold text-primary">{number}</span><span className="mt-1 text-[10px] text-muted-foreground">{title}</span></div><div className="flex flex-col justify-center"><p className="text-sm font-semibold text-foreground">{text}</p><p className="mt-2 text-xs text-muted-foreground">{formula}</p></div></div></div>}

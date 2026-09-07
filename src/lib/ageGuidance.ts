// Age-aware guidance: "kaise rich banega", "study/career kaise choose kare",
// "relationship kaisa rahega" — har user ki umar ke hisaab se, aur seed se
// alag-alag variation, taaki do users ka upay same na ho.

import type { Analysis } from "./numerology";
import { getPack, fmt } from "./langs";
import type { Lang } from "./langs/types";
import { Picker } from "./variation";
import HINDI_GUIDE from "./langs/hindi/guide";
import BENGALI_GUIDE from "./langs/bengali/guide";

export type AgeBucket = "child" | "teen" | "college" | "earlyCareer" | "growth" | "mature" | "senior";

export interface GuidanceTopic {
  key: "wealth" | "study" | "love";
  title: string;
  points: string[];
}

export interface Guidance {
  age: number;
  bucket: AgeBucket;
  stageLabel: string;
  intro: string;
  topics: GuidanceTopic[];
}

export function ageFromDob(dob: string, ref: Date = new Date()): number {
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return 0;
  let age = ref.getFullYear() - y;
  const beforeBirthday = ref.getMonth() + 1 < m || (ref.getMonth() + 1 === m && ref.getDate() < d);
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}

export function bucketOf(age: number): AgeBucket {
  if (age <= 12) return "child";
  if (age <= 17) return "teen";
  if (age <= 22) return "college";
  if (age <= 30) return "earlyCareer";
  if (age <= 45) return "growth";
  if (age <= 60) return "mature";
  return "senior";
}

interface BucketPack {
  label: string;
  intro: string;
  wealth: string[];
  study: string[];
  love: string[];
}

type LangGuide = {
  headings: { wealth: string; study: string; love: string; section: string; sectionSub: string };
  buckets: Record<AgeBucket, BucketPack>;
};

// ---------------------------------------------------------------- HINGLISH
const HINGLISH: LangGuide = {
  headings: {
    section: "Aapki Umar ke Hisaab se Upay — Paisa, Padhai, Rishte",
    sectionSub: "{age} saal ki umar ({stage}) ke liye {name} ka personal roadmap",
    wealth: "Paisa aur Ameeri — kaise badhega",
    study: "Padhai / Career — kya chunna hai",
    love: "Rishte aur Pyaar — kaisa rahega",
  },
  buckets: {
    child: {
      label: "Bachpan",
      intro: "{name} abhi {age} saal ka/ki hai — is umar mein aadat banti hai, kismat nahi. Driver {driver} ({dp}) ki energy ko sahi disha do.",
      wealth: [
        "Har mahine gullak/bank mein {luckyFirst}0 rupaye daalne ki aadat daaliye — paisa sambhalna sabse pehla dhan-yog hai.",
        "Jeb-kharch ka hisaab ek copy mein likhwaiye; {driver} number ke bacche ko ginti ka khel bahut suit karta hai.",
        "Ghar ke {dir1} kone mein padhai/piggy bank rakhein — is disha se {name} ki grahan-shakti badhti hai.",
        "Har week ek chhota kaam (paudha paani, kitab jamana) ke badle inaam dein — kamai aur mehnat ka rishta abhi baithta hai.",
        "{lc1} rang ki cheezein (bag, copy cover) rakhwaiye, {bc1} rang se door rakhein.",
        "Paise ke barey mein daraiye mat; 'sambhal kar kharch' sikhaiye — {dp} ki energy dar se dab jaati hai.",
      ],
      study: [
        "Abhi subject nahi, aadat chuniye — roz 40 minute ek hi samay par padhai.",
        "{driver} number wale bachche practical se seekhte hain: drawing, blocks, story-telling se concept clear kijiye.",
        "Ganit aur bhasha dono barabar rakhein; {conductor} conductor kehta hai ki expression strong hoga.",
        "Mobile screen 1 ghante se kam; {dp} ki energy screen se bikhar jaati hai.",
        "Ek hobby (sangeet / khel / art) zaroor jodein — aage yahi confidence banega.",
        "Padhai ki mez {dir1} disha mein rakhein aur roshni {lc1} tone ki rakhein.",
      ],
      love: [
        "Is umar mein 'rishta' matlab dosti aur ghar ka mahaul — {name} ko sunne ki aadat daaliye.",
        "Maa-baap ke saath roz 15 minute bina mobile baat — {conductor} conductor isi se santulit hota hai.",
        "Bhai-behen/dosto se ladai par daant nahi, samjhana kaam karega.",
        "Ghar mein zor se jhagda {name} ke emotional plane ko kamzor karta hai — dhyaan rakhein.",
        "Dadi-nani/bade buzurgon ka saath is number ke liye bahut shubh hai.",
        "Har hafte ek family outing rakhein — yaadein hi is umar ka sabse bada upay hai.",
      ],
    },
    teen: {
      label: "School / Board ke saal",
      intro: "{age} saal — board aur stream ka faisla saamne hai. Driver {driver} ({dp}) aur Conductor {conductor} milkar {name} ki disha batate hain.",
      wealth: [
        "Abhi kamaana nahi, skill banana hi ameeri ki neev hai — ek digital skill (design, coding, content) shuru kijiye.",
        "Pocket money ka 30% bachaana shuru karein; {luckyFirst} tareekh ko bachat daalna is number ko suit karta hai.",
        "Chhote freelance/tuition se pehli kamai {luckyFirst} number wale mahine mein try karein.",
        "Compound interest samjhiye — {driver} number ka dimag numbers se jaldi jud jaata hai.",
        "Fizool kharch aur show-off dosti se bachiye; {bc1} rang ke saath bade kharche bhi avoid.",
        "Ek 'money diary' banaiye: kya aaya, kya gaya — 3 mahine mein pattern khud dikhega.",
      ],
      study: [
        "Stream chunte waqt {careerD} ki taraf jhukav rakhein — Driver {driver} yahi kehta hai.",
        "Conductor {conductor} ke hisaab se {careerC} bhi strong backup line hai.",
        "10th ke baad decide karne ke liye 3 din ka test lijiye: jis kaam mein waqt pata na chale, wahi aapki line hai.",
        "Roz 2 ghante deep study + 1 ghanta revision; {dir1} disha mein muh karke padhein.",
        "Group study se zyada solo focus is number ko fayda deta hai; exam se pehle {lc1} rang ka pen/file rakhein.",
        "Board ke saal mein raat 11 ke baad jaagna {dp} ko kamzor karta hai — subah 5 ka slot behtar hai.",
      ],
      love: [
        "Is umar ka attraction natural hai, par {driver} number distraction se marks girata hai — balance rakhiye.",
        "Dosti aise logon se jo padhai mein saath khinche, na ki competition mein giraye.",
        "Ghar mein baat chhupane ki aadat mat daaliye — {conductor} conductor secrecy se stress banata hai.",
        "Emotional up-down ke liye roz 10 minute journal likhiye.",
        "Kisi ek mentor (teacher/rishtedaar) se monthly baat rakhiye.",
        "Social media par tulna karna band — yahi is umar ka sabse bada mansik nuksan hai.",
      ],
    },
    college: {
      label: "Graduation ke saal",
      intro: "{age} saal — degree ke saath skill aur pehli kamai ka samay. {name} ka Driver {driver} ({dp}) risk lene ki himmat deta hai.",
      wealth: [
        "Degree ke saath ek income skill zaroor: {careerD} se juda freelance kaam abhi shuru kijiye.",
        "Pehli salary/stipend ka 20% SIP mein — {luckyFirst} tareekh ko auto-debit lagaiye.",
        "Credit card se pehle emergency fund; {driver} number udhaar mein phansta hai.",
        "Internship ko paise se nahi, seekh se tolein — 2 saal baad yahi 3x salary banega.",
        "Ek 'side project' banaiye jo aapke naam se chale — {dp} ko apna brand suit karta hai.",
        "Kharche mein {bc1} rang ke din (jo bhi bhaari lage) bade faisle na lein.",
      ],
      study: [
        "Graduation ke baad ka rasta 3 hi hai: higher study, job, ya business — Driver {driver} ke hisaab se {careerD} sabse fit hai.",
        "Agar competitive exam soch rahe hain to {conductor} conductor kehta hai {careerC} wali field mein safalta jaldi milegi.",
        "Ek certification (data, design, finance, language) degree ke saath hi complete kijiye.",
        "Professor/senior ke saath ek research ya live project — resume yahin se strong hota hai.",
        "Padhai ki table {dir1} disha mein; exam se pehle {lc1} rang pehnein.",
        "Backlog ko halke mein na lein — {dp} ki energy adhoore kaam se bikharti hai.",
      ],
      love: [
        "Rishton mein abhi commitment se pehle clarity — {driver} number jaldbazi mein dil de deta hai.",
        "Partner wahi jo aapke career plan ko respect kare, warna {conductor} ka clash hota hai.",
        "Long-distance is number ke liye theek chalta hai agar baat roz ek fix time par ho.",
        "Ghar walon se rishte chhupane par baad mein tanav badhta hai — dheere-dheere batayein.",
        "Break-up ke baad padhai chhodna sabse bada nuksan — routine mat todiye.",
        "Dosto ka circle chhota par sacha rakhein; {lc1} rang aapke mood ko sambhalta hai.",
      ],
    },
    earlyCareer: {
      label: "Career ki shuruaat",
      intro: "{age} saal — job/business set karne ka sabse keemti dashak. Driver {driver} ({dp}) mehnat ka fal is umar mein tez deta hai.",
      wealth: [
        "Salary ka 30% rule: 20% invest, 10% skill — {luckyFirst} tareekh ko transfer fix kar dein.",
        "Ek income kaafi nahi: {careerD} se juda ek second income stream 6 mahine mein khada kijiye.",
        "Loan sirf asset ke liye; {driver} number ko personal loan bhaari padta hai.",
        "Har saal apni salary 20% badhane ka target — skill switch se, sirf appraisal se nahi.",
        "Paisa {dir1} disha wale locker/almirah mein rakhein, aur {lc1} rang ka purse shubh hai.",
        "Har mahine ek 'no-spend week' — {dp} ki energy discipline se hi dhan banati hai.",
      ],
      study: [
        "Ab degree nahi, specialisation chalega — {careerD} mein expert bano, generalist nahi.",
        "Agar switch soch rahe hain to Conductor {conductor} ke hisaab se {careerC} line safe aur fast hai.",
        "MBA/PG tabhi jab wo salary ya network dono badhaye, warna certification behtar.",
        "Roz 1 ghanta seekhne ka — 3 saal mein yahi aapko team lead banata hai.",
        "Ek mentor aur ek junior — dono rakhein; {driver} number sikhate hue tez badhta hai.",
        "Job mein {dir1} disha mein baithna aur {lc1} rang ki file rakhna focus badhata hai.",
      ],
      love: [
        "Shaadi/commitment ke faisle mein number match dekhein: aapka {driver} aur unka number mitra ho to jeevan aasaan.",
        "Career aur rishta dono ek saath — hafte mein ek din sirf partner ka rakhein.",
        "Ghar aur office ka gussa mix na karein; {conductor} conductor yahi galti karwata hai.",
        "Paise ki baat partner se khul kar — chhupana is number ke rishte todta hai.",
        "Family pressure mein jaldbazi ki shaadi se bachein, 3 mahine samajh lein.",
        "{lc1} rang ka koi tohfa/kapda rishton mein garmahat laata hai.",
      ],
    },
    growth: {
      label: "Grihasthi aur growth",
      intro: "{age} saal — zimmedari, bachche, EMI aur growth sab ek saath. {name} ka {dp} ab strategy maangta hai, sirf mehnat nahi.",
      wealth: [
        "Ab active se passive ki taraf: rent, dividend, royalty — koi ek {luckyFirst} saal mein khada kijiye.",
        "EMI kul income ke 40% se upar na jaaye, warna {driver} number tanav mein kaam kharab karta hai.",
        "Bachchon ke liye alag goal fund; {dir1} disha wale bank/branch se account shubh.",
        "Business mein partner chunte waqt uska number aapke mitra ank mein ho, sam bhi chalega — shatru nahi.",
        "Har saal ek nayi skill ya team — {dp} rukne par hi girta hai.",
        "Insurance + emergency fund pehle, luxury baad mein; {bc1} rang wale bade sauda soch kar.",
      ],
      study: [
        "Aapki padhai ab certification aur network hai — saal mein 2 course/2 conference.",
        "Bachchon ki stream ke liye unka apna number dekhein, apna sapna un par na daalein.",
        "Agar career badalna hai to 12 mahine ka bridge plan banaiye, ek jhatke mein nahi.",
        "{careerD} mein consulting/training shuru kijiye — is umar mein anubhav bikta hai.",
        "Padhne/likhne ka kaam {dir1} disha mein aur subah ke samay sabse phaldayak.",
        "Apna kaam likh kar document kijiye — {conductor} {conductor} wale ko system se laabh hai.",
      ],
      love: [
        "Rishton mein routine bore karta hai — mahine mein ek din 'sirf hum dono'.",
        "Bachchon se dosti rakhein, control nahi; {driver} number sakhti se door karta hai.",
        "Maa-baap ki sehat aur waqt dono par dhyaan — is dashak ka sabse bada punya.",
        "Gussa aur chuppi — dono is number ke rishte ke dushman hain; bol kar suljhaiye.",
        "Ghar ke {dir1} kone ko saaf aur halka rakhein, jhagde kam honge.",
        "Purane dosto se saal mein ek baar milna mansik bal deta hai.",
      ],
    },
    mature: {
      label: "Sthirta aur virasat",
      intro: "{age} saal — kamai se zyada surakshit aur transfer karne ka samay. {dp} ki energy ab margdarshak ki hai.",
      wealth: [
        "Retirement corpus ka number likh lijiye; {luckyFirst} se shuru hone wali SIP jaari rakhein.",
        "Risk kam, income steady — equity se debt ki taraf dheere shift.",
        "Property/will/nominee sab kagaz durust karein; {driver} number kagzi lapan se nuksan uthata hai.",
        "Ek passion ko paise mein badlein: {careerD} ki consulting, teaching ya writing.",
        "Bachchon ko paisa nahi, samajh dijiye — virasat wahi tikti hai.",
        "Bade nivesh {dir1} disha ki taraf mukh karke, subah ke samay finalize karein.",
      ],
      study: [
        "Seekhna band mat kijiye — technology aur health, do vishay is umar mein zaroori.",
        "Apna anubhav course/book/YouTube mein badlein; {conductor} {conductor} ko yash milega.",
        "Bachchon/juniors ko mentor karna aapke {dp} ko balwan karta hai.",
        "Ek nayi bhasha ya sangeet — dimag ki umar 10 saal ghat jaati hai.",
        "Sehat ki padhai: neend, sugar, BP ka data khud track kijiye.",
        "Padhai/likhai ke liye {lc1} rang ka mahaul rakhein.",
      ],
      love: [
        "Jeevansathi ke saath dobara dosti kijiye — bachche ab apni duniya mein hain.",
        "Bachchon ke faislon mein salah dijiye, aadesh nahi.",
        "Akelapan is umar ka sabse bada rog — hafte mein ek social kaam pakka.",
        "Purane gile-shikwe maaf kijiye; {driver} number bojh dhone se thakta hai.",
        "Seva/daan se rishte aur mann dono halke hote hain.",
        "{lc1} rang aur {dir1} disha ka dhyaan ghar ke mahaul ko madhur rakhta hai.",
      ],
    },
    senior: {
      label: "Anubhav aur ashirwad",
      intro: "{age} saal — ab dhan ka arth hai sehat, shanti aur sammaan. {name} ka {dp} margdarshan dene ke liye hai.",
      wealth: [
        "Paisa surakshit jagah: FD/SCSS/pension — nayi risky scheme se door rahiye.",
        "Medical cover aur emergency cash sabse pehle.",
        "Kisi bhi paper par jaldi sign nahi; {driver} number bharose mein aa jaata hai.",
        "Kharch ka hisaab har mahine kisi ek bharose ke saath share kijiye.",
        "Daan {luckyFirst} tareekh ko — mann aur bhagya dono halke hote hain.",
        "Apni virasat ka batwara jeete ji saaf kijiye, jhagde nahi honge.",
      ],
      study: [
        "Roz padhna/likhna — smriti ka sabse bada upay.",
        "Apne anubhav likh kar parivaar ke liye chhod jaiye.",
        "Nayi technology (phone, UPI, video call) seekhna akelepan ko kaatta hai.",
        "Dharmik/darshan adhyayan {dp} ko shanti deta hai.",
        "Bachchon-poton ko kahani sunaiye — yahi asli virasat hai.",
        "Subah {dir1} disha mein baith kar 20 minute paath/dhyan.",
      ],
      love: [
        "Parivaar se rozana sampark — chhoti baat bhi kijiye.",
        "Salah tabhi dijiye jab maangi jaaye; rishte mithe rahenge.",
        "Ek dost-mandali (satsang, park group) banaiye.",
        "Purane rishton ko maaf kar ke jodiye — {conductor} conductor shanti maangta hai.",
        "Sehat ka dhyaan hi parivaar ke liye sabse bada tohfa hai.",
        "{lc1} rang ke kapde aur halka sangeet mann prasann rakhta hai.",
      ],
    },
  },
};

// ---------------------------------------------------------------- ENGLISH
const ENGLISH: LangGuide = {
  headings: {
    section: "Age-Wise Remedies — Money, Study, Relationships",
    sectionSub: "A personal roadmap for {name} at {age} ({stage})",
    wealth: "Wealth — how the money will grow",
    study: "Study / Career — what to choose",
    love: "Relationships — how they will run",
  },
  buckets: {
    child: {
      label: "Childhood",
      intro: "{name} is {age} — at this age habits are built, not fate. Give Driver {driver} ({dp}) the right direction.",
      wealth: [
        "Start a monthly saving habit of {luckyFirst}0 rupees in a piggy bank — handling money is the first wealth yoga.",
        "Let the child write pocket-money accounts in a notebook; number {driver} loves counting games.",
        "Keep the study desk or savings box in the {dir1} corner of the home.",
        "Reward one small weekly chore — the link between effort and earning forms now.",
        "Use {lc1} coloured bags and covers; avoid {bc1}.",
        "Never scare the child about money; teach 'spend with care' — {dp} shrinks under fear.",
      ],
      study: [
        "Choose habits, not subjects — 40 focused minutes at the same time daily.",
        "Number {driver} children learn by doing: drawing, blocks and storytelling clear concepts fastest.",
        "Keep maths and language equally strong; Conductor {conductor} promises good expression.",
        "Screen time under one hour — {dp} energy scatters on screens.",
        "Add one hobby (music, sport, art); this becomes future confidence.",
        "Face the {dir1} direction while studying, with {lc1} toned light.",
      ],
      love: [
        "At this age 'relationship' means friendship and home climate — teach listening.",
        "Fifteen phone-free minutes with parents daily balances Conductor {conductor}.",
        "Explain rather than scold after fights with siblings or friends.",
        "Loud quarrels at home weaken the emotional plane — protect it.",
        "Time with grandparents is highly auspicious for this number.",
        "One family outing a week — memories are the best remedy at this age.",
      ],
    },
    teen: {
      label: "School / Board years",
      intro: "{age} years — board exams and stream choice are here. Driver {driver} ({dp}) with Conductor {conductor} shows the way.",
      wealth: [
        "Don't earn yet, build skill — start one digital skill (design, coding, content).",
        "Save 30% of pocket money; deposit on the {luckyFirst}th of the month.",
        "Try a first small freelance or tuition income in a {luckyFirst} month.",
        "Learn compound interest — number {driver} grasps numbers quickly.",
        "Avoid show-off spending and {bc1} coloured big purchases.",
        "Keep a money diary; the pattern shows itself within three months.",
      ],
      study: [
        "Lean towards {careerD} while choosing a stream — Driver {driver} says so.",
        "Conductor {conductor} makes {careerC} a strong backup line.",
        "Take a three-day test after class 10: the work where time disappears is your line.",
        "Two hours of deep study plus one hour revision, facing {dir1}.",
        "Solo focus beats group study for this number; keep a {lc1} pen or file in exams.",
        "Staying up past 11pm weakens {dp} — the 5am slot works better.",
      ],
      love: [
        "Attraction is natural, but number {driver} loses marks to distraction — balance it.",
        "Choose friends who pull you into study, not competition.",
        "Do not hide things at home — Conductor {conductor} converts secrecy into stress.",
        "Journal ten minutes daily for emotional swings.",
        "Keep one mentor (teacher or relative) for a monthly talk.",
        "Stop comparing on social media — the biggest mental loss of this age.",
      ],
    },
    college: {
      label: "Graduation years",
      intro: "{age} years — degree plus skill plus first income. {name}'s Driver {driver} ({dp}) gives courage to take risk.",
      wealth: [
        "Along with the degree, one income skill: start freelance work linked to {careerD}.",
        "Put 20% of the first stipend into an SIP, auto-debited on the {luckyFirst}th.",
        "Emergency fund before any credit card — number {driver} gets trapped in debt.",
        "Judge internships by learning, not pay; that becomes 3x salary in two years.",
        "Build one side project under your own name — {dp} suits a personal brand.",
        "Avoid big decisions on heavy {bc1} days.",
      ],
      study: [
        "After graduation there are three roads: higher study, job or business — {careerD} fits Driver {driver} best.",
        "For competitive exams, Conductor {conductor} points to quicker success in {careerC}.",
        "Finish one certification (data, design, finance, language) along with the degree.",
        "Do one research or live project with a professor or senior — the resume is built here.",
        "Study facing {dir1}; wear {lc1} before exams.",
        "Never take backlogs lightly — {dp} scatters on unfinished work.",
      ],
      love: [
        "Clarity before commitment — number {driver} gives its heart in a hurry.",
        "Choose a partner who respects your career plan, else Conductor {conductor} clashes.",
        "Long distance works for this number if you talk at one fixed time daily.",
        "Hiding the relationship from family builds tension later; reveal it gradually.",
        "Never drop studies after a break-up — do not break the routine.",
        "Keep the friend circle small but true; {lc1} steadies your mood.",
      ],
    },
    earlyCareer: {
      label: "Career launch",
      intro: "{age} years — the most valuable decade for setting job or business. Driver {driver} ({dp}) rewards effort fast now.",
      wealth: [
        "The 30% rule: 20% invested, 10% into skill — fix the transfer for the {luckyFirst}th.",
        "One income is not enough: build a second stream from {careerD} within six months.",
        "Borrow only for assets — personal loans weigh heavily on number {driver}.",
        "Target a 20% income rise yearly through skill switch, not appraisal alone.",
        "Keep cash in the {dir1} side locker; a {lc1} wallet is auspicious.",
        "One no-spend week a month — {dp} builds wealth only through discipline.",
      ],
      study: [
        "Specialisation beats degrees now — become an expert in {careerD}.",
        "If switching, Conductor {conductor} makes {careerC} a safe and fast line.",
        "Do an MBA/PG only if it raises both salary and network; otherwise certify.",
        "One learning hour daily makes you a team lead within three years.",
        "Keep one mentor and one junior — number {driver} grows while teaching.",
        "Sit facing {dir1} at work and keep a {lc1} file for focus.",
      ],
      love: [
        "Before marriage check number match: a friendly number to your {driver} makes life easy.",
        "Reserve one day a week purely for the partner.",
        "Do not mix office anger with home — Conductor {conductor} triggers exactly this.",
        "Talk money openly with the partner; hiding breaks this number's relationships.",
        "Avoid a rushed marriage under family pressure; take three months.",
        "A {lc1} gift brings warmth into the relationship.",
      ],
    },
    growth: {
      label: "Family and growth",
      intro: "{age} years — responsibility, children, EMIs and growth together. {dp} now demands strategy, not only effort.",
      wealth: [
        "Move from active to passive: rent, dividend or royalty — build one within {luckyFirst} years.",
        "Keep total EMI under 40% of income, else number {driver} works poorly under stress.",
        "Separate goal fund for children; a bank on the {dir1} side is auspicious.",
        "Pick business partners whose number is friendly or neutral to yours — never an enemy number.",
        "Add one new skill or team member yearly — {dp} falls only when it stops.",
        "Insurance and emergency fund first, luxury later.",
      ],
      study: [
        "Your study is now certification and network — two courses or conferences a year.",
        "For your children's stream, read their own numbers; do not impose your dream.",
        "For a career change build a 12-month bridge plan, never a single jump.",
        "Start consulting or training in {careerD} — experience sells at this age.",
        "Reading and writing work best facing {dir1} in the morning.",
        "Document your work into systems — Conductor {conductor} profits from structure.",
      ],
      love: [
        "Routine kills romance — keep one 'just us' day a month.",
        "Befriend your children instead of controlling — number {driver} pushes them away with strictness.",
        "Care for parents' health and time — the greatest merit of this decade.",
        "Anger and silence both harm this number's bonds; speak and resolve.",
        "Keep the {dir1} corner of the home clean and light to reduce quarrels.",
        "Meet old friends at least once a year for mental strength.",
      ],
    },
    mature: {
      label: "Stability and legacy",
      intro: "{age} years — time to secure and transfer rather than chase. {dp} energy is now a guide's energy.",
      wealth: [
        "Write your retirement corpus number; keep the SIP running from the {luckyFirst}th.",
        "Lower risk, steady income — shift slowly from equity to debt.",
        "Set property, will and nominee papers right — number {driver} suffers from paperwork neglect.",
        "Turn a passion into income: consulting, teaching or writing in {careerD}.",
        "Give children understanding, not only money — that legacy lasts.",
        "Finalise big investments in the morning, facing {dir1}.",
      ],
      study: [
        "Never stop learning — technology and health are the two must-study subjects now.",
        "Convert experience into a course, book or channel; Conductor {conductor} earns fame.",
        "Mentoring juniors strengthens your {dp}.",
        "A new language or instrument cuts a decade off your brain age.",
        "Track your own sleep, sugar and BP data.",
        "Keep a {lc1} toned space for reading and writing.",
      ],
      love: [
        "Befriend your spouse again — the children now have their own world.",
        "Advise your children; do not command them.",
        "Loneliness is the disease of this age — fix one social activity weekly.",
        "Forgive old grudges; number {driver} tires from carrying weight.",
        "Service and charity lighten both bonds and mind.",
        "{lc1} colours and the {dir1} direction keep the home mood sweet.",
      ],
    },
    senior: {
      label: "Experience and blessing",
      intro: "{age} years — wealth now means health, peace and respect. {name}'s {dp} is here to guide.",
      wealth: [
        "Keep money safe: FD, senior schemes, pension — avoid new risky offers.",
        "Medical cover and emergency cash come first.",
        "Never sign papers in a hurry — number {driver} trusts too easily.",
        "Share monthly accounts with one trusted person.",
        "Donate on the {luckyFirst}th — it lightens both mind and fortune.",
        "Settle inheritance clearly while alive to prevent disputes.",
      ],
      study: [
        "Read and write daily — the best remedy for memory.",
        "Write your experience down for the family.",
        "Learning new technology (phone, UPI, video calls) cuts loneliness.",
        "Spiritual or philosophical study gives {dp} peace.",
        "Tell stories to grandchildren — that is the real legacy.",
        "Sit facing {dir1} for twenty minutes of prayer or meditation each morning.",
      ],
      love: [
        "Contact family daily, even for small things.",
        "Advise only when asked; bonds stay sweet.",
        "Build a friend circle — satsang or a park group.",
        "Forgive and rejoin old relations — Conductor {conductor} seeks peace.",
        "Your health is the greatest gift you can give the family.",
        "{lc1} clothing and soft music keep the mind cheerful.",
      ],
    },
  },
};

export const GUIDES: Record<Lang, LangGuide> = {
  hinglish: HINGLISH,
  english: ENGLISH,
  hindi: HINDI_GUIDE,
  bengali: BENGALI_GUIDE,
};


export type { LangGuide, BucketPack };

/** Age-aware, seed-varied guidance for this exact person. */
export function buildGuidance(a: Analysis, ref: Date = new Date()): Guidance {
  const L = getPack(a.input.lang);
  const G = GUIDES[a.input.lang] ?? HINGLISH;
  const age = ageFromDob(a.input.dob, ref);
  const bucket = bucketOf(age);
  const pack = G.buckets[bucket];
  const D = L.numbers[a.driver]!;
  const C = L.numbers[a.conductor]!;

  const vars: Record<string, string | number | undefined> = {
    name: a.input.name.split(" ")[0] ?? a.input.name,
    age,
    stage: pack.label,
    driver: a.driver,
    conductor: a.conductor,
    dp: D.planet,
    cp: C.planet,
    careerD: D.career.slice(0, 2).join(" / "),
    careerC: C.career.slice(0, 2).join(" / "),
    luckyFirst: a.finalLucky[0] ?? a.driver,
    lc1: L.colors[a.luckyColors[0] ?? "golden"],
    bc1: L.colors[a.badColors[0] ?? "grey"],
    dir1: L.dirs[a.kuaDirs[0] ?? "N"],
  };

  // Seed shift per topic so the three lists never mirror each other.
  const r = (s: string) => fmt(s, vars);
  const pickFor = (offset: number, bank: string[]) => {
    const p = new Picker((a.seed ^ (offset * 0x9e3779b1)) >>> 0);
    return p.pick(bank, 5, r);
  };

  return {
    age,
    bucket,
    stageLabel: pack.label,
    intro: r(pack.intro),
    topics: [
      { key: "wealth", title: G.headings.wealth, points: pickFor(1, pack.wealth) },
      { key: "study", title: G.headings.study, points: pickFor(2, pack.study) },
      { key: "love", title: G.headings.love, points: pickFor(3, pack.love) },
    ],
  };
}

export function guidanceHeadings(lang: Lang, name: string, age: number, stage: string) {
  const G = GUIDES[lang] ?? HINGLISH;
  return {
    title: G.headings.section,
    sub: fmt(G.headings.sectionSub, { name: name.split(" ")[0] ?? name, age, stage }),
  };
}

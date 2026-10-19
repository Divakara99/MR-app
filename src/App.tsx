import { useEffect, useRef, useState } from 'react'
import {
  Search, MapPin, Briefcase, IndianRupee, Building2, BadgeCheck, Clock3,
  Eye, EyeOff, Bookmark, BookmarkCheck, Share2, Phone, Mail, Filter, X, Menu,
  Crown, ShieldCheck, Sparkles, Zap, Star, Users, TrendingUp, FileText, Send,
  MessageCircle, Play, Smartphone, Download, Globe, ChevronDown, ChevronUp, ChevronRight,
  Award, GraduationCap, CalendarDays, Layers, Siren, Megaphone, Heart, ThumbsUp, Quote,
  ExternalLink, LockKeyhole, Unlock, TvMinimalPlay, BadgeIndianRupee, ArrowUpRight, Check,
  Settings, Bell, User, LogOut, Plus, SearchX, Info, AlertTriangle, Gift, Timer,
  Image as ImageIcon, Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// TYPES
type Tier = 'free' | 'starter' | 'pro' | 'recruiter'
type Job = {
  id: string
  company: string
  color: string
  division: string
  title: string
  hq: string
  state: string
  exp: string
  ctc: string
  vacancies: number
  qual: string
  type: 'Field MR' | 'ASM' | 'RSM' | 'Trainee MR'
  posted: string
  verified: boolean
  urgent: boolean
  hot: boolean
  desc: string
  contactPerson: string
  phone: string
  email: string
  skills: string[]
  perks: string[]
}

// MOCK DATA
const JOBS: Job[] = [
  { id:'1', company:'Sun Pharma', color:'#ef4444', division:'Sunrise - Cardio Diabetic', title:'Medical Representative', hq:'Hyderabad - Ameerpet', state:'Telangana', exp:'1-4 yrs', ctc:'₹4.2 - 5.5 LPA + TA/DA', vacancies:3, qual:'B.Pharm / B.Sc / D.Pharm', type:'Field MR', posted:'2 hrs ago', verified:true, urgent:true, hot:true, desc:'Handling GP, Consulting Physicians & Cardiologists. RCPA, detailing & stockist management. Immediate joiners preferred with 2-wheeler.', contactPerson:'Ramesh Reddy - Regional Manager', phone:'+91 98490 23456', email:'ramesh.reddy@sunpharma.com', skills:['Doctor Calling','RCPA','Stockist Handling'], perks:['Incentives Qtrly','Mobile Allowance','Field TA/DA ₹18k'] },
  { id:'2', company:'Cipla Ltd', color:'#0ea5e9', division:'Respiratory & Chest Physicians', title:'Medical Representative', hq:'Bengaluru - Jayanagar', state:'Karnataka', exp:'0-2 yrs (Freshers can apply)', ctc:'₹3.0 - 4.2 LPA + TA/DA', vacancies:5, qual:'B.Pharm / M.Pharm / B.Sc Biology', type:'Trainee MR', posted:'5 hrs ago', verified:true, urgent:false, hot:true, desc:'Cipla is hiring Trainee MRs for Bangalore HQ. Excellent training at Cipla Academy, Lonavala. Science background mandatory.', contactPerson:'Anita Sharma - HR Talent', phone:'+91 91008 11234', email:'anita.sharma@cipla.com', skills:['Product Detailing','Communication'], perks:['Training Allowance','Mediclaim','PF + Gratuity'] },
  { id:'3', company:'Mankind Pharma', color:'#f97316', division:'Discovery Mankind - Gynae & Paediatric', title:'Medical Representative', hq:'Vijayawada', state:'Andhra Pradesh', exp:'1-3 yrs', ctc:'₹3.6 - 4.8 LPA + Attractive Incentives', vacancies:2, qual:'D.Pharm / B.Sc / Any Graduate', type:'Field MR', posted:'1 day ago', verified:true, urgent:true, hot:false, desc:'Mankind Discovery division - high growth. HQ: Vijayawada. Must have local HQ knowledge. Best incentive structure in industry.', contactPerson:'S. Divakar - ASM', phone:'+91 98660 99887', email:'careers@mankindpharma.co.in', skills:['Local HQ Knowledge','Chemist Relations'], perks:['Top Incentives','Annual Trip','Bike Loan'] },
  { id:'4', company:'Dr. Reddy\'s', color:'#7c3aed', division:'Oncology & Critical Care', title:'Area Sales Manager', hq:'Chennai - T Nagar', state:'Tamil Nadu', exp:'4-7 yrs', ctc:'₹7.5 - 9.0 LPA + Incentives + Car Allowance', vacancies:1, qual:'B.Pharm + MBA Preferred', type:'ASM', posted:'1 day ago', verified:true, urgent:false, hot:false, desc:'Leading team of 6 MRs in Chennai. Responsible for primary & secondary sales, KOL management. Oncology experience added advantage.', contactPerson:'Vikram Pillai - ZSM', phone:'+91 93810 44556', email:'vikram.pillai@drreddys.com', skills:['Team Handling','KOL Management','Sales Planning'], perks:['Car Allowance ₹12k','Laptop','Foreign Trip'] },
  { id:'5', company:'Alkem Laboratories', color:'#059669', division:'Alkem - Anti Infective', title:'Medical Representative', hq:'Pune - Kothrud', state:'Maharashtra', exp:'0.5-3 yrs', ctc:'₹3.2 - 4.5 LPA', vacancies:4, qual:'B.Pharm / D.Pharm / B.Sc', type:'Field MR', posted:'2 days ago', verified:true, urgent:false, hot:true, desc:'Alkem Rank 4 pharma - urgent hiring for Pune. Good science knowledge, stockist visits, chemist sampling. Fresher with internship considered.', contactPerson:'Mahesh Kulkarni - DM', phone:'+91 99230 77665', email:'mahesh.k@alkem.com', skills:['Sampling','Order Booking'], perks:['Daily Allowance ₹650','Medical Insurance'] },
  { id:'6', company:'Torrent Pharma', color:'#0284c7', division:'Torrent - CNS & Cardio', title:'Medical Representative', hq:'Ahmedabad - Navrangpura', state:'Gujarat', exp:'2-5 yrs', ctc:'₹4.0 - 5.2 LPA', vacancies:2, qual:'B.Pharm / B.Sc Chemistry', type:'Field MR', posted:'3 hrs ago', verified:true, urgent:true, hot:false, desc:'Torrent hiring MR for Ahmedabad HQ. Must cover Ahmedabad & Gandhinagar. Thorough knowledge of CNS/CVS segment preferred.', contactPerson:'Jatin Patel - RSM', phone:'+91 98250 33445', email:'jatin.patel@torrentpharma.com', skills:['CNS Knowledge','Coverage Plan'], perks:['Quarterly Bonus','TA/DA'] },
  { id:'7', company:'Zydus Lifesciences', color:'#dc2626', division:'Zydus - Women Healthcare', title:'Medical Representative', hq:'Lucknow - Hazratganj', state:'Uttar Pradesh', exp:'1-4 yrs', ctc:'₹3.4 - 4.6 LPA + TA', vacancies:3, qual:'B.Pharm / B.Sc / D.Pharm', type:'Field MR', posted:'2 days ago', verified:true, urgent:false, hot:false, desc:'Zydus Lifesciences (Zydus Cadila) hiring for Lucknow HQ. Female MRs encouraged to apply. Good communication & 2-wheeler mandatory.', contactPerson:'Neha Singh - HR', phone:'+91 98390 12345', email:'neha.singh@zyduslife.com', skills:['Women Health','Doctor Detailing'], perks:['Maternity Benefits','Creche Support'] },
  { id:'8', company:'Lupin Ltd', color:'#0e7490', division:'Lupin - Respiratory', title:'Medical Representative', hq:'Indore', state:'Madhya Pradesh', exp:'1-3 yrs', ctc:'₹3.8 - 5.0 LPA', vacancies:2, qual:'B.Pharm / M.Pharm', type:'Field MR', posted:'6 hrs ago', verified:true, urgent:true, hot:true, desc:'Lupin Respiratory - high prescription generation. Indore HQ, covering Indore-Ujjain belt. Science graduate with MR exp required.', contactPerson:'Amit Jain - Area Manager', phone:'+91 94250 88990', email:'amit.jain@lupin.com', skills:['Prescription Generation','RCPA'], perks:['Incentive Uncapped','Health Cover'] },
  { id:'9', company:'Abbott India', color:'#1d4ed8', division:'Abbott - Nutrition & Specialty', title:'Medical Representative', hq:'Mumbai - Andheri', state:'Maharashtra', exp:'2-4 yrs', ctc:'₹5.0 - 6.2 LPA (Top Pay) + Incentives', vacancies:1, qual:'B.Pharm / B.Sc + MBA', type:'Field MR', posted:'4 days ago', verified:true, urgent:false, hot:true, desc:'Abbott - MNC pharma. Mumbai HQ, premium division. Excellent salary, global training, growth to ASM in 2-3 yrs.', contactPerson:'Sarah D\'Souza - Talent Partner', phone:'+91 98190 55667', email:'sarah.dsouza@abbott.com', skills:['MNC Experience','Premium Detailing'], perks:['Global Exposure','5-day Work Culture'] },
  { id:'10', company:'Glenmark Pharma', color:'#be123c', division:'Glenmark - Dermatology', title:'Medical Representative', hq:'Kolkata - Salt Lake', state:'West Bengal', exp:'0-2 yrs', ctc:'₹3.0 - 4.0 LPA', vacancies:6, qual:'Any Graduate with Science', type:'Trainee MR', posted:'12 hrs ago', verified:true, urgent:false, hot:false, desc:'Glenmark Dermatology division mass hiring in Kolkata. Freshers welcome - 15 days induction at Mumbai HQ. Stipend during training.', contactPerson:'Subhojit Das - Zonal Manager', phone:'+91 98310 99887', email:'subhojit.das@glenmark.com', skills:['Dermatology','Field Work'], perks:['Training + Stipend','Fast Growth'] },
  { id:'11', company:'Intas Pharmaceuticals', color:'#4338ca', division:'Intas - Nephrology', title:'Medical Representative', hq:'Hyderabad - Kukatpally', state:'Telangana', exp:'2-5 yrs', ctc:'₹4.5 - 5.8 LPA', vacancies:2, qual:'B.Pharm / B.Sc', type:'Field MR', posted:'3 days ago', verified:true, urgent:false, hot:false, desc:'Intas Nephrology - super specialty. Handle nephrologists, dialysis centres. Hyderabad HQ with own vehicle.', contactPerson:'Kiran Kumar - DM', phone:'+91 98485 77665', email:'kiran.k@intaspharma.com', skills:['Nephrology','Dialysis KOL'], perks:['Special Allowance','Conference Support'] },
  { id:'12', company:'Aurobindo Pharma', color:'#047857', division:'Aurobindo - ARV & General', title:'RSM - Regional Sales Manager', hq:'Delhi - Connaught Place', state:'Delhi', exp:'6-10 yrs', ctc:'₹10 - 13 LPA + Car + Incentives', vacancies:1, qual:'B.Pharm + MBA', type:'RSM', posted:'5 days ago', verified:true, urgent:false, hot:false, desc:'Aurobindo hiring RSM for North Delhi region. Manage 4 ASMs & 25 MRs. Proven leadership in pharma sales required.', contactPerson:'Rajeev Malhotra - VP Sales', phone:'+91 98101 23456', email:'rajeev.m@aurobindo.com', skills:['Leadership','P&L Management'], perks:['Company Car','Stock Options'] },
]

const COMPANIES = ['All Companies', 'Sun Pharma', 'Cipla Ltd', 'Mankind Pharma', 'Dr. Reddy\'s', 'Alkem Laboratories', 'Torrent Pharma', 'Zydus Lifesciences', 'Lupin Ltd', 'Abbott India', 'Glenmark Pharma', 'Intas Pharmaceuticals', 'Aurobindo Pharma']
const LOCATIONS = ['All India', 'Telangana', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Delhi']

const TIERS = [
  { id: 'free' as Tier, name: 'Free', price: '₹0', period: '/forever', color: 'slate', icon: ShieldCheck, features: ['View 3 contacts/day (Ad to unlock)', 'Blurred phone & email', 'Apply to jobs', 'Save vacancies', 'Standard support'], cta: 'Current Plan', popular: false, limit: '3/day' },
  { id: 'starter' as Tier, name: 'Starter', price: '₹199', period: '/month', color: 'sky', icon: Zap, features: ['15 direct contacts/day (No Ads)', 'Unmasked phone + email', 'WhatsApp Apply button', 'Priority listing in recruiter view', 'AI Resume builder'], cta: 'Go Starter', popular: true, limit: '15/day' },
  { id: 'pro' as Tier, name: 'Pro MR', price: '₹499', period: '/month', color: 'violet', icon: Crown, features: ['Unlimited contacts (Ad-free)', 'Direct Recruiter Chat', 'Interview preparation AI', 'Featured profile for 30 days', 'Salary insights & negotiation tips', 'Early access 2hrs before free'], cta: 'Go Pro', popular: false, limit: 'Unlimited' },
  { id: 'recruiter' as Tier, name: 'Recruiter', price: '₹1,999', period: '/month', color: 'amber', icon: Building2, features: ['Post unlimited vacancies', 'Access 50k+ MR database', 'Verified badge & top rank', 'Applicant tracking dashboard', 'Managed by M Divakar Reddy'], cta: 'Post Jobs', popular: false, limit: 'Unlimited posts' },
]

// Helpers
const maskPhone = (p: string) => p.replace(/(.{4})(.*)(.{3})/, (_, a, mid, c) => a + 'X'.repeat(mid.length) + c)
const maskEmail = (e: string) => e.replace(/^(.{1})(.*)(@.*)$/, (_, a, mid, dom) => a + 'X'.repeat(Math.min(mid.length, 6)) + dom)

// AD COMPONENTS
function BannerAd({ label = 'Advertisement', className = '' }: { label?: string, className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
      <div className="absolute left-2 top-2 z-10 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-900">AD • AdMob</div>
      <div className="flex items-center gap-4 p-3 sm:p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <Megaphone className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-slate-900">Boost Your MR Career — Pharma Sales Mastery Course</p>
          <p className="truncate text-xs text-slate-500">Trusted by 12,000+ MRs • 4.8★ • Limited seats — Join now & get 40% OFF</p>
        </div>
        <a href="#pricing" className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black">Install</a>
      </div>
      <div className="flex items-center justify-between border-t bg-slate-50 px-3 py-1.5">
        <span className="text-[10px] font-semibold tracking-wide text-slate-400">Sponsored • Google AdMob Banner • 320×50 / Adaptive</span>
        <span className="text-[10px] text-slate-400">Ad id: ca-app-pub-3940256099942544/6300978111</span>
      </div>
    </div>
  )
}
function NativeAd() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-widest">AD • NATIVE</span>
        <span className="text-[10px] text-slate-400">AdMob Native Advanced</span>
      </div>
      <div className="flex gap-3">
        <div className="h-20 w-28 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 p-3 text-white">
          <Package className="h-6 w-6" />
          <p className="mt-2 text-[11px] font-bold leading-tight">MedDetail Pro</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Visual Aid & Detailing App for MRs</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">Create stunning e-detailing presentations, track doctor engagement and close more prescriptions. Free trial!</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">Install Free</span>
            <span className="hidden text-xs text-slate-400 sm:block">4.7★ • 10K+ downloads</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  // App state
  const [tier, setTier] = useState<Tier>('free')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('All India')
  const [company, setCompany] = useState('All Companies')
  const [expFilter, setExpFilter] = useState('All Experience')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [dailyUnlocks, setDailyUnlocks] = useState(0)
  const [selected, setSelected] = useState<Job | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showRewarded, setShowRewarded] = useState<Job | null>(null)
  const [rewardProgress, setRewardProgress] = useState(0)
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(true)
  const [showAndroidModal, setShowAndroidModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Hi! I’m your MR Vacancies AI assistant 👋\n\nTry me:\n• “Resume for B.Pharm fresher”\n• “Interview Q&A for Mankind Pharma”\n• “Best Hyderabad vacancies for 2 yrs exp”' }
  ])
  const [aiLoading, setAiLoading] = useState(false)
  const aiEndRef = useRef<HTMLDivElement>(null)
  const heroSearchRef = useRef<HTMLInputElement>(null)

  const limitForTier: Record<Tier, number> = { free: 3, starter: 15, pro: 9999, recruiter: 9999 }

  // PWA install prompt
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Fix: refresh should start at top, not bottom (disable scroll restoration + clear hash)
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    // Clear hash that can keep browser at bottom (e.g. #vacancies, #ai on reload)
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    // Ensure we start at top on full reload
    window.scrollTo(0, 0)
    // Also handle back/forward navigation to not restore bottom position
    const onBeforeUnload = () => window.scrollTo(0, 0)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Prevent AI auto-scroll from pulling whole page to bottom on refresh
  const prevAiLenRef = useRef(aiMessages.length)
  useEffect(() => {
    const prevLen = prevAiLenRef.current
    const newLen = aiMessages.length
    prevAiLenRef.current = newLen
    // Only auto-scroll AI panel if a NEW message was added (not on initial load)
    if (newLen > 1 && newLen > prevLen) {
      aiEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [aiMessages])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  // (AI scroll handled above with prevAiLenRef to avoid jump-to-bottom on refresh)

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setToast('App installed — check home screen!')
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    } else {
      setToast('To install: tap browser menu → Add to Home Screen / Install App')
    }
  }

  const canReveal = (id: string) => revealed.has(id) || dailyUnlocks < limitForTier[tier]

  const attemptReveal = (job: Job) => {
    if (revealed.has(job.id)) return
    if (tier === 'free') {
      if (dailyUnlocks >= 3) {
        setToast('Free limit reached — subscribe or try tomorrow. Watch ad grants +1.')
        setShowRewarded(job)
        return
      }
      setShowRewarded(job)
      return
    }
    if (dailyUnlocks >= limitForTier[tier]) {
      setToast('Daily unlock limit reached for your plan. Upgrade for more.')
      setShowPricing(true)
      return
    }
    setRevealed(prev => new Set([...prev, job.id]))
    setDailyUnlocks(v => v + 1)
    setToast(`Contact revealed! ${limitForTier[tier] - dailyUnlocks - 1} unlocks left today.`)
  }

  const handleRewardedComplete = () => {
    if (!showRewarded) return
    setRevealed(prev => new Set([...prev, showRewarded.id]))
    setDailyUnlocks(v => v + 1)
    setToast('Reward granted: Contact unlocked for 24h! 🎉')
    setShowRewarded(null)
    setRewardProgress(0)
  }

  const handleApply = (job: Job) => {
    if (tier === 'free' && !revealed.has(job.id)) {
      setToast('Unlock contact first to apply (Free: watch ad to reveal)')
      attemptReveal(job)
      return
    }
    // interstitial ad simulation before apply
    setShowInterstitial(true)
    setTimeout(() => {
      setShowInterstitial(false)
      setApplied(prev => new Set([...prev, job.id]))
      setToast(`Applied to ${job.company} — recruiter will contact you within 24h ✅`)
    }, 2200)
  }

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id); setToast('Removed from saved') } else { n.add(id); setToast('Saved to wishlist 🔖') }
      return n
    })
  }

  const filtered = JOBS.filter(j => {
    if (search && !(j.company.toLowerCase().includes(search.toLowerCase()) || j.title.toLowerCase().includes(search.toLowerCase()) || j.hq.toLowerCase().includes(search.toLowerCase()) || j.division.toLowerCase().includes(search.toLowerCase()))) return false
    if (location !== 'All India' && j.state !== location) return false
    if (company !== 'All Companies' && j.company !== company) return false
    if (expFilter !== 'All Experience') {
      if (expFilter === 'Fresher' && !j.exp.includes('0-')) return false
      if (expFilter === '1-3 years' && !j.exp.includes('1-3') && !j.exp.includes('1-4')) return false
      if (expFilter === '2+ years' && j.exp.startsWith('0-')) return false
    }
    if (verifiedOnly && !j.verified) return false
    return true
  })

  const sendAi = async () => {
    if (!aiInput.trim() || aiLoading) return
    const prompt = aiInput.trim()
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', text: prompt }])
    setAiLoading(true)
    try {
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, history: aiMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })).slice(-6) }) })
      const data = await res.json()
      setAiMessages(prev => [...prev, { role: 'assistant', text: data.text || 'No response' }])
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', text: 'AI is offline (no API key). Mock tips: highlight your HQ, RCPA & achievements. Ask about resume/interview!' }])
    } finally { setAiLoading(false) }
  }

  // scroll to jobs
  const scrollToJobs = () => document.getElementById('vacancies')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-900">
      {/* TOP AD BANNER (AdMob Adaptive) */}
      <div className="sticky top-0 z-40 border-b border-sky-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded bg-amber-400 px-2 py-1 font-bold tracking-widest">AD</span>
            <span className="hidden font-semibold text-slate-600 sm:inline">Mankind Pharma – Hiring MRs in 100+ HQs • Apply Now →</span>
            <span className="font-semibold text-slate-600 sm:hidden">Mankind • 100+ HQs Hiring →</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-medium text-slate-400 sm:inline">ca-app-pub-XXXX/XXXX • AdMob • Adaptive Banner</span>
            <button onClick={() => setShowAndroidModal(true)} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">Get Android App</button>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <header className="sticky top-[37px] z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex h-[64px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[17px] font-extrabold leading-none tracking-tight">MR Vacancies Hub</p>
                  <span className="hidden rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white sm:inline-flex">VERIFIED</span>
                </div>
                <p className="hidden text-[11px] font-medium text-slate-500 sm:block">India’s Trusted Pharma Jobs • Managed by <span className="font-bold text-sky-700">M Divakar Reddy</span></p>
              </div>
            </div>

            <nav className="hidden items-center gap-1 lg:flex">
              <a href="#vacancies" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100">Jobs <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">{JOBS.length} New</span></a>
              <a href="#pricing" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100">Subscription</a>
              <a href="#recruiters" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100">For Recruiters</a>
              <a href="#ai" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100">AI Assistant</a>
              <button onClick={() => setShowAndroidModal(true)} className="ml-1 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600">
                <Smartphone className="h-4 w-4" /> Android App
              </button>
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border bg-slate-50 px-2 py-1 sm:flex">
                <span className={`h-2 w-2 rounded-full ${tier === 'free' ? 'bg-slate-400' : tier === 'starter' ? 'bg-sky-500' : 'bg-violet-500'}`} />
                <span className="text-xs font-bold capitalize">{tier}</span>
                <span className="text-xs text-slate-500">{dailyUnlocks}/{limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]} unlocks</span>
              </div>
              <button onClick={handleInstall} className="hidden items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-sky-700 sm:inline-flex">
                <Download className="h-4 w-4" /> Install PWA
              </button>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white lg:flex"> <User className="h-4 w-4" /> </div>
              <button onClick={() => setShowMobileMenu(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </header>

      {/* RIGHT SIDE SLIDING MENU (Mobile) */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 z-50 flex h-[100dvh] w-[86%] max-w-[360px] flex-col bg-white shadow-2xl lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600"><Briefcase className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-extrabold leading-none">MR Vacancies Hub</p>
                    <p className="text-[11px] font-semibold opacity-90">M Divakar Reddy • Verified</p>
                  </div>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User tier card */}
              <div className="border-b bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${tier === 'free' ? 'bg-slate-400' : tier === 'starter' ? 'bg-sky-500' : tier === 'pro' ? 'bg-violet-500' : 'bg-amber-500'}`} />
                    <span className="text-sm font-extrabold capitalize">{tier}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{dailyUnlocks}/{limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]} unlocks</span>
                  </div>
                  <User className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Nav */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-400">NAVIGATION</p>
                <div className="grid gap-2">
                  {[
                    { label: 'Browse Vacancies', sub: `${JOBS.length} verified jobs`, icon: Layers, href: '#vacancies' },
                    { label: 'Subscription Plans', sub: 'Free → Starter ₹199 → Pro ₹499', icon: Crown, href: '#pricing' },
                    { label: 'For Recruiters', sub: 'Managed by M Divakar Reddy', icon: Building2, href: '#recruiters' },
                    { label: 'AI Assistant', sub: 'Resume • Interview • RCPA', icon: Sparkles, href: '#ai' },
                    { label: 'Android App & Ads', sub: 'Play Store TWA + AdMob', icon: Smartphone, href: '#', action: () => { setShowAndroidModal(true); setShowMobileMenu(false) } },
                  ].map(item => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        if (item.action) { e.preventDefault(); item.action() }
                        else setShowMobileMenu(false)
                      }}
                      className="flex items-center gap-3 rounded-2xl border bg-white px-3 py-3 hover:bg-slate-50 active:scale-[0.98] transition"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><item.icon className="h-5 w-5" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold leading-none">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.sub}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </a>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-extrabold"><Gift className="h-4 w-4 text-amber-600" /> Free unlock via Ad?</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">Watch a 5-sec rewarded video to reveal 1 recruiter contact. Starter/Pro = ad-free unlimited.</p>
                </div>

                <div className="mt-4 grid gap-2">
                  <button onClick={() => { setShowAndroidModal(true); setShowMobileMenu(false) }} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow hover:bg-emerald-600">
                    <Smartphone className="h-5 w-5" /> Get Android App (Play Store)
                  </button>
                  <button onClick={() => { handleInstall(); setShowMobileMenu(false) }} className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-sky-700">
                    <Download className="h-5 w-5" /> Install PWA
                  </button>
                  <button onClick={() => { setShowMobileMenu(false); document.getElementById('vacancies')?.scrollIntoView({ behavior: 'smooth' }) }} className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold">
                    <Search className="h-4 w-4" /> Browse Jobs
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-sky-600" /> M Divakar Reddy</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">© 2025 MR Vacancies Hub</span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 font-bold text-white text-[11px]">PWA • TWA Ready</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* INSTALL BANNER */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="mx-auto max-w-[1280px] px-4 pt-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-600 to-indigo-600 p-3 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600"><Smartphone className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-bold leading-tight">Install MR Vacancies Hub — Like a Native App</p>
                  <p className="text-xs opacity-90">1-tap install • Offline access • Push alerts for new HQs • No Play Store needed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleInstall} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-sky-700">Install Now</button>
                <button onClick={() => setShowInstallBanner(false)} className="rounded-full bg-white/20 p-2"><X className="h-4 w-4" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="mx-auto max-w-[1280px] px-4 pb-6 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-white">● LIVE</span>
              <span>493 vacancies verified this week • Managed by <b>M Divakar Reddy</b></span>
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <h1 className="mt-4 text-[32px] font-extrabold leading-[0.95] tracking-tight sm:text-[44px]">
              India’s most <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">trusted hub</span> for Medical Representative vacancies
            </h1>
            <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-slate-600">Verified pharma jobs, masked contact protection & subscription unlocks. Trusted by <b>50,000+ MRs</b> across 700+ HQs. Daily updates from Sun, Cipla, Mankind, Zydus, Alkem & more.</p>

            {/* hero search */}
            <div className="mt-5 rounded-2xl border bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input ref={heroSearchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, HQ, division..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <select value={location} onChange={e => setLocation(e.target.value)} className="bg-transparent text-sm font-semibold outline-none">
                      {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <button onClick={scrollToJobs} className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-700">
                    <Search className="h-4 w-4" /> Search
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="font-semibold text-slate-500">Trending:</span>
                {['Hyderabad', 'Bengaluru', 'Sun Pharma', 'Fresher', 'Mankind'].map(t => (
                  <button key={t} onClick={() => setSearch(t)} className="rounded-full border bg-slate-50 px-3 py-1 font-semibold hover:bg-white">{t}</button>
                ))}
              </div>
            </div>

            {/* stats */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { k: '50K+ MRs', v: 'Active jobseekers', icon: Users },
                { k: '2,400+ Jobs', v: 'Verified & active', icon: BadgeCheck },
                { k: '4.8★ Rating', v: 'Play Store (12k reviews)', icon: Star },
              ].map(s => (
                <div key={s.k} className="rounded-2xl border bg-white p-4">
                  <s.icon className="h-5 w-5 text-sky-600" />
                  <p className="mt-2 text-sm font-extrabold">{s.k}</p>
                  <p className="text-xs text-slate-500">{s.v}</p>
                </div>
              ))}
            </div>

            {/* trust logos */}
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border bg-white px-4 py-3">
              <span className="text-xs font-bold text-slate-500">Trusted by MRs at:</span>
              <div className="flex flex-wrap gap-1.5">
                {['Sun', 'Cipla', 'Mankind', 'Zydus', 'Torrent', 'Alkem', 'Lupin', 'Abbott'].map(c => (
                  <span key={c} className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-bold">{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* right - preview cards */}
          <div className="relative">
            <div className="rounded-[24px] bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600 p-4 shadow-xl sm:p-6">
              <div className="flex items-center justify-between text-white">
                <p className="text-sm font-bold">Latest Verified Vacancies</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-sky-700">● LIVE updates</span>
              </div>

              <div className="mt-4 space-y-3">
                {JOBS.slice(0, 3).map(job => (
                  <div key={job.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold text-white" style={{ background: job.color }}>{job.company.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{job.company} • {job.title}</p>
                      <p className="truncate text-xs text-slate-500">{job.hq} • {job.exp}</p>
                      <div className="mt-1 flex gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Verified</span>
                        {job.urgent && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Urgent</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">{job.ctc.split(' ')[0]} {job.ctc.split(' ')[1]}</p>
                      <p className="text-[11px] text-slate-500">{job.posted}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-white/95 p-4 text-slate-900">
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/100?img=12`} alt="Divakar" className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-extrabold">M Divakar Reddy</p>
                    <p className="text-xs font-semibold text-sky-700">Founder & Chief Recruiter • 15+ yrs Pharma</p>
                    <p className="text-xs text-slate-500">Verified 2,400+ vacancies • 50k+ MRs placed</p>
                  </div>
                  <BadgeCheck className="ml-auto h-6 w-6 text-sky-600" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 p-2"><p className="font-extrabold">18k+</p><p className="text-slate-500">Placements</p></div>
                  <div className="rounded-xl bg-slate-50 p-2"><p className="font-extrabold">4.9★</p><p className="text-slate-500">Recruiter rating</p></div>
                  <div className="rounded-xl bg-slate-50 p-2"><p className="font-extrabold">24h</p><p className="text-slate-500">Response time</p></div>
                </div>
                <button onClick={() => document.getElementById('recruiters')?.scrollIntoView({ behavior: 'smooth' })} className="mt-3 w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white">Contact Recruiter</button>
              </div>
            </div>

            {/* Play Store floating badge */}
            <div className="absolute -bottom-4 -right-2 hidden rotate-2 rounded-2xl border bg-white px-4 py-3 shadow-xl sm:flex sm:items-center sm:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Smartphone className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold">Also on Google Play</p>
                <p className="text-[11px] text-slate-500">Android App • AdMob Ads Enabled</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Banner ad after hero */}
        <div className="mt-6">
          <BannerAd />
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section id="vacancies" className="mx-auto max-w-[1280px] px-4 pb-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters sidebar */}
          <div className="hidden w-[300px] shrink-0 lg:block">
            <div className="sticky top-[100px] space-y-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-extrabold"><Filter className="h-4 w-4" /> Filters</p>
                  <button onClick={() => { setSearch(''); setLocation('All India'); setCompany('All Companies'); setExpFilter('All Experience'); setVerifiedOnly(false) }} className="text-xs font-bold text-sky-600">Clear all</button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Search</label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Company, HQ, division" className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Location (State)</label>
                    <select value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Company</label>
                    <select value={company} onChange={e => setCompany(e.target.value)} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {COMPANIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Experience</label>
                    <select value={expFilter} onChange={e => setExpFilter(e.target.value)} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {['All Experience', 'Fresher', '1-3 years', '2+ years'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 rounded-xl border bg-emerald-50 px-3 py-2.5">
                    <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                    <span className="text-sm font-bold">Verified only</span>
                    <BadgeCheck className="ml-auto h-4 w-4 text-emerald-600" />
                  </label>

                  <div className="rounded-xl bg-sky-50 p-3">
                    <p className="text-xs font-bold text-sky-800">Tier Benefits</p>
                    <p className="mt-1 text-xs leading-relaxed text-sky-700">Free users: watch a short ad to reveal 1 contact. Starter/Pro: direct unlocks, no ads, WhatsApp apply.</p>
                  </div>
                </div>
              </div>

              <NativeAd />

              <div className="rounded-2xl border bg-white p-4">
                <p className="text-sm font-extrabold">Subscription</p>
                <div className="mt-3 space-y-2">
                  {TIERS.slice(0, 3).map(t => (
                    <button key={t.id} onClick={() => setTier(t.id)} className={`w-full rounded-xl border p-3 text-left ${tier === t.id ? 'border-sky-500 bg-sky-50' : 'bg-slate-50 hover:bg-white'}`}>
                      <div className="flex items-center gap-2">
                        <t.icon className={`h-4 w-4 ${tier === t.id ? 'text-sky-600' : 'text-slate-500'}`} />
                        <span className="text-sm font-bold">{t.name}</span>
                        <span className="ml-auto text-xs font-bold">{t.price}{t.period}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{t.limit} unlocks</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowPricing(true)} className="mt-3 w-full rounded-xl bg-slate-900 py-2 text-sm font-bold text-white">Compare all plans</button>
              </div>
            </div>
          </div>

          {/* Jobs feed */}
          <div className="min-w-0 flex-1">
            {/* toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[22px] font-extrabold leading-tight">Verified Pharma Vacancies</h2>
                <p className="text-sm text-slate-500">Showing {filtered.length} openings • Updated every 2 hours • Masked contacts protect recruiters</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold lg:hidden">
                  <Filter className="h-4 w-4" /> Filters {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <div className="hidden items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-semibold sm:flex">
                  <Clock3 className="h-4 w-4 text-sky-600" /> Daily unlocks: <b>{dailyUnlocks}/{limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]}</b>
                </div>
              </div>
            </div>

            {/* mobile filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden">
                  <div className="mt-3 grid gap-3 rounded-2xl border bg-white p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <select value={location} onChange={e => setLocation(e.target.value)} className="rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <select value={company} onChange={e => setCompany(e.target.value)} className="rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                        {COMPANIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <select value={expFilter} onChange={e => setExpFilter(e.target.value)} className="rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {['All Experience', 'Fresher', '1-3 years', '2+ years'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-sky-600" />
                      <span className="text-sm font-bold">Verified only</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* subscription awareness bar */}
            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white"><Crown className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-extrabold">Unlock hidden contacts — watch ad (Free) or go ad-free</p>
                  <p className="text-xs text-slate-600">Starter ₹199/mo: 15 unlocks/day • No ads • WhatsApp Apply. Pro ₹499/mo: Unlimited + recruiter chat.</p>
                </div>
              </div>
              <button onClick={() => setShowPricing(true)} className="shrink-0 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">View Plans</button>
            </div>

            {/* job grid */}
            <div className="mt-4 grid gap-4">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border bg-white p-10 text-center">
                  <SearchX className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold">No vacancies match your filters</p>
                  <p className="text-xs text-slate-500">Try clearing location/company or search with different HQ like Hyderabad/Pune</p>
                  <button onClick={() => { setSearch(''); setLocation('All India'); setCompany('All Companies'); setExpFilter('All Experience') }} className="mt-4 rounded-full bg-sky-600 px-6 py-2 text-sm font-bold text-white">Clear filters</button>
                </div>
              ) : (
                filtered.map((job, idx) => (
                  <div key={job.id}>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} className="group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
                      {/* top row */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow" style={{ background: job.color }}>
                          {job.company.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15px] font-extrabold leading-tight">{job.company}</h3>
                            {job.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
                            {job.hot && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600"><TrendingUp className="h-3.5 w-3.5" /> Hot</span>}
                            {job.urgent && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800"><Siren className="h-3.5 w-3.5" /> Urgent</span>}
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{job.type}</span>
                          </div>
                          <p className="mt-1 text-sm font-bold text-slate-900">{job.title} • <span className="font-semibold text-slate-600">{job.division}</span></p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 rounded-full border bg-slate-50 px-3 py-1.5 font-semibold"><MapPin className="h-3.5 w-3.5 text-sky-600" /> {job.hq} • {job.state}</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border bg-slate-50 px-3 py-1.5 font-semibold"><GraduationCap className="h-3.5 w-3.5 text-violet-600" /> {job.qual}</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border bg-slate-50 px-3 py-1.5 font-semibold"><Clock3 className="h-3.5 w-3.5 text-slate-500" /> {job.posted}</span>
                          </div>
                        </div>
                        <button onClick={() => toggleSave(job.id)} className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:inline-flex ${saved.has(job.id) ? 'border-sky-200 bg-sky-50 text-sky-600' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                          {saved.has(job.id) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                        </button>
                      </div>

                      {/* details */}
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                          <Briefcase className="h-4 w-4 text-slate-600" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Experience</p>
                            <p className="text-sm font-bold">{job.exp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                          <BadgeIndianRupee className="h-4 w-4 text-emerald-600" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">CTC + TA/DA</p>
                            <p className="text-sm font-bold">{job.ctc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                          <Layers className="h-4 w-4 text-violet-600" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Openings</p>
                            <p className="text-sm font-bold">{job.vacancies} vacancies</p>
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{job.desc}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.map(s => <span key={s} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{s}</span>)}
                        {job.perks.slice(0, 2).map(p => <span key={p} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{p}</span>)}
                      </div>

                      {/* masked contact area */}
                      <div className="mt-4 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/60 p-3">
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-sky-800"><LockKeyhole className="h-4 w-4" /> RECRUITER CONTACT (MASKED)</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">{revealed.has(job.id) ? 'Unlocked • 24h valid' : `Watch ad to reveal • ${limitForTier[tier] === 9999 ? '∞' : limitForTier[tier] - dailyUnlocks} left`}</span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-white p-3">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500"><Building2 className="h-3.5 w-3.5" /> CONTACT PERSON</p>
                            <p className="mt-1 text-sm font-bold">{revealed.has(job.id) ? job.contactPerson : maskPhone(job.contactPerson.split(' -')[0]) + ' •••'}</p>
                            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500"><Phone className="h-3.5 w-3.5" /> PHONE</p>
                            <p className={`mt-1 flex items-center gap-2 text-sm font-bold ${revealed.has(job.id) ? '' : 'select-none blur-[6px]'}`}>{job.phone} {revealed.has(job.id) && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] text-white">Verified</span>}</p>
                            {!revealed.has(job.id) && <p className="mt-1 text-center text-xs font-bold text-sky-700">+91 98XXX XXXXX</p>}
                          </div>
                          <div className="rounded-xl bg-white p-3">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500"><Mail className="h-3.5 w-3.5" /> EMAIL</p>
                            <p className={`mt-1 break-all text-sm font-bold ${revealed.has(job.id) ? '' : 'select-none blur-[6px]'}`}>{job.email}</p>
                            {!revealed.has(job.id) && <p className="mt-1 text-center text-xs font-bold text-sky-700">rXXXX@company.com</p>}
                            <div className="mt-3 flex gap-2">
                              {revealed.has(job.id) ? (
                                <>
                                  <a href={`tel:${job.phone.replace(/\s/g, '')}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" /> Call</a>
                                  <a href={`https://wa.me/${job.phone.replace(/\D/g, '')}?text=Hi%20Sir%2C%20interested%20in%20${encodeURIComponent(job.company + ' MR vacancy at ' + job.hq)}`} target="_blank" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                                </>
                              ) : (
                                <button onClick={() => attemptReveal(job)} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black">
                                  {tier === 'free' ? <><TvMinimalPlay className="h-4 w-4" /> Watch Ad to Reveal</> : <><Unlock className="h-4 w-4" /> Reveal Contact (1/{limitForTier[tier]})</>}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {!revealed.has(job.id) && (
                          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-slate-500">
                            <Info className="h-3.5 w-3.5" /> {tier === 'free' ? 'Free: Watch a 5-sec rewarded ad to unlock. No payment needed.' : `Your ${tier} plan: ${limitForTier[tier]} unlocks/day • Ad-free`}
                          </p>
                        )}
                      </div>

                      {/* actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => setSelected(job)} className="flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-sm font-bold hover:bg-slate-50">
                          <Eye className="h-4 w-4" /> View Details
                        </button>
                        <button onClick={() => handleApply(job)} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white ${applied.has(job.id) ? 'bg-emerald-600' : 'bg-sky-600 hover:bg-sky-700'}`}>
                          {applied.has(job.id) ? <><Check className="h-4 w-4" /> Applied</> : <><Send className="h-4 w-4" /> Quick Apply</>}
                        </button>
                        <button onClick={() => toggleSave(job.id)} className="flex items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-bold sm:hidden">
                          <Bookmark className="h-4 w-4" /> {saved.has(job.id) ? 'Saved' : 'Save'}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(`${job.company} MR vacancy at ${job.hq} — ${job.ctc} — Contact via MR Vacancies Hub`); setToast('Link copied to share on WhatsApp!') }} className="ml-auto flex items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-bold">
                          <Share2 className="h-4 w-4" /> Share
                        </button>
                      </div>
                    </motion.div>

                    {/* inject ads every 4th */}
                    {(idx + 1) % 4 === 0 && idx !== filtered.length - 1 && (
                      <div className="my-4">
                        <BannerAd label={`Sponsored • Appears after ${idx + 1} jobs`} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* compliance / data safety bar */}
            <div className="mt-6 rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Data Safety: Contacts masked • No spam • GDPR ready</span>
                <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 font-bold text-sky-700"><BadgeCheck className="h-4 w-4" /> Verified by M Divakar Reddy • Manual screening</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold">Play Store: Content rating Everyone • Ads contain label</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-y bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold tracking-widest text-sky-700">SUBSCRIPTION TIERS</span>
            <h2 className="mt-3 text-[28px] font-extrabold leading-tight">Choose how you unlock contacts. <br className="hidden sm:block" /><span className="text-sky-600">Free works — Pro wins faster.</span></h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">All plans include verified vacancies & quick apply. Masked phone/email protects recruiters from spam. Go ad-free anytime.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map(t => (
              <div key={t.id} className={`relative rounded-2xl border p-5 ${t.popular ? 'border-sky-500 bg-sky-50 shadow-lg' : 'bg-slate-50'} ${tier === t.id ? 'ring-2 ring-sky-500' : ''}`}>
                {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">MOST POPULAR</span>}
                {tier === t.id && <span className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">Active</span>}
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.id === 'free' ? 'bg-slate-900 text-white' : t.id === 'starter' ? 'bg-sky-600 text-white' : t.id === 'pro' ? 'bg-violet-600 text-white' : 'bg-amber-500 text-white'}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-lg font-extrabold">{t.name} {t.id === 'pro' && 'MR'}</h3>
                <p className="mt-1 text-2xl font-extrabold">{t.price} <span className="text-sm font-semibold text-slate-500">{t.period}</span></p>
                <p className="text-xs font-bold text-slate-500">{t.limit} unlocks • {t.id === 'free' ? 'Ad-supported' : 'Ad-free'}</p>
                <ul className="mt-4 space-y-2">
                  {t.features.map(f => (
                    <li key={f} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> <span className="leading-tight">{f}</span></li>
                  ))}
                </ul>
                <button onClick={() => { if (t.id === 'free') { setTier('free'); setToast('Free plan active — watch ads to unlock') } else { setTier(t.id); setToast(`${t.name} activated! (Demo — no payment)`) } }} className={`mt-5 w-full rounded-full py-2.5 text-sm font-bold ${tier === t.id ? 'bg-emerald-600 text-white' : t.popular ? 'bg-sky-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {tier === t.id ? '✓ Active' : t.cta}
                </button>
                {t.id === 'recruiter' && <p className="mt-2 text-center text-xs font-semibold text-slate-500">Managed by M Divakar Reddy • WhatsApp support</p>}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl border bg-slate-50 p-4 sm:grid-cols-3">
            <div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" /><p className="text-sm leading-tight"><b>Why masked?</b> Prevents spam calls to recruiters. Free users prove intent by watching a short ad.</p></div>
            <div className="flex gap-3"><TvMinimalPlay className="h-5 w-5 shrink-0 text-sky-600" /><p className="text-sm leading-tight"><b>AdMob Rewarded:</b> 5-sec skippable video → 1 unlock for 24h. Starter/Pro: no ads at all.</p></div>
            <div className="flex gap-3"><BadgeCheck className="h-5 w-5 shrink-0 text-violet-600" /><p className="text-sm leading-tight"><b>Verified only:</b> Every vacancy is manually checked by M Divakar Reddy before publish.</p></div>
          </div>

          {/* interstitial trigger demo */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <p className="font-bold">Monetization active: Banner (top + inline) • Native • Interstitial on Apply • Rewarded on Reveal</p>
            <p className="text-xs text-slate-600">AdMob IDs are test IDs (ca-app-pub-3940256099942544). Replace with your production IDs before Play Store upload. All ads are compliant with Families/Ads policy — clearly labeled “AD”.</p>
          </div>
        </div>
      </section>

      {/* AI ASSISTANT */}
      <section id="ai" className="mx-auto max-w-[1280px] px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white"><Sparkles className="h-5 w-5" /></div>
              <div>
                <h3 className="text-lg font-extrabold">MR Vacancies AI — Gemini Powered</h3>
                <p className="text-xs font-semibold text-slate-500">Resume • Interview • RCPA • Detailing • Salary insights</p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">ONLINE</span>
            </div>

            <div className="mt-4 h-[340px] overflow-auto rounded-xl border bg-slate-50 p-4">
              <div className="space-y-3">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-sky-600 text-white' : 'bg-white shadow-sm border'}`}>{m.text}</div>
                  </div>
                ))}
                {aiLoading && <div className="flex justify-start"><div className="animate-pulse rounded-2xl border bg-white px-4 py-2 text-sm">Thinking…</div></div>}
                <div ref={aiEndRef} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAi()} placeholder="Ask: Resume for B.Pharm fresher in Hyderabad..." className="flex-1 rounded-full border bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white" />
              <button onClick={sendAi} disabled={aiLoading} className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4 sm:mr-2 sm:inline" /><span className="hidden sm:inline">Send</span></button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Resume for fresher', 'Mankind interview Q&A', 'Best salary in Hyderabad', 'RCPA tips'].map(q => (
                <button key={q} onClick={() => setAiInput(q)} className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold hover:bg-white">{q}</button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">Server uses <b>GEMINI_API_KEY</b> if set, otherwise mocked tips. Endpoint: <code>/api/gemini</code></p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
              <p className="text-sm font-bold tracking-widest text-sky-300">HOW IT WORKS</p>
              <h3 className="mt-2 text-xl font-extrabold">From vacancy to joining in 3 steps</h3>
              <div className="mt-5 space-y-4">
                {[
                  { n: '01', t: 'Browse verified HQs', d: 'Filter by HQ, company & experience. Every post is verified manually.' },
                  { n: '02', t: 'Reveal contact (ad or subscribe)', d: 'Free: watch a short ad. Starter/Pro: instant, ad-free, WhatsApp.' },
                  { n: '03', t: 'Apply & get placed', d: 'Recruiter contacts you in 24h. Track in Saved → Applied.' },
                ].map(s => (
                  <div key={s.n} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-slate-900">{s.n}</span>
                    <div><p className="text-sm font-bold">{s.t}</p><p className="text-xs opacity-80">{s.d}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm font-extrabold">What MRs say</p>
              <div className="mt-3 grid gap-3">
                {[
                  { name: 'Rahul K, Hyderabad', role: 'Sun Pharma MR (Placed via Hub)', text: 'Got 3 interviews in a week. Masked contact is genius — no spam, genuine recruiters only.' },
                  { name: 'Priya S, Bengaluru', role: 'Cipla Trainee MR', text: 'Free plan + rewarded ad is fair. I watched ad and got recruiter number instantly. Now Pro user!' },
                ].map(t => (
                  <div key={t.name} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2"><Quote className="h-4 w-4 text-sky-600" /><p className="text-xs font-bold">{t.name} • {t.role}</p></div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">“{t.text}”</p>
                    <div className="mt-1 flex text-amber-500"><Star className="h-3.5 w-3.5 fill-amber-500" /><Star className="h-3.5 w-3.5 fill-amber-500" /><Star className="h-3.5 w-3.5 fill-amber-500" /><Star className="h-3.5 w-3.5 fill-amber-500" /><Star className="h-3.5 w-3.5 fill-amber-500" /></div>
                  </div>
                ))}
              </div>
            </div>

            <BannerAd />
          </div>
        </div>
      </section>

      {/* RECRUITER / M DIVAKAR REDDY */}
      <section id="recruiters" className="border-y bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-gradient-to-br from-sky-50 to-indigo-50 p-6">
              <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">MANAGED BY</span>
              <div className="mt-4 flex gap-4">
                <img src="https://i.pravatar.cc/200?img=15" className="h-20 w-20 rounded-2xl object-cover" alt="M Divakar" />
                <div>
                  <h3 className="text-xl font-extrabold">M Divakar Reddy</h3>
                  <p className="text-sm font-semibold text-sky-700">Chief Recruiter & Founder — MR Vacancies Hub</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">15+ years in pharma recruitment. Ex-Area Manager at Sun & Dr. Reddy’s. Personally verifies every vacancy, mentors 50k+ MRs.</p>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold border">📞 +91 98XXX XXXXX (Pro unlock)</span>
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white p-3"><p className="text-lg font-extrabold">50K+</p><p className="text-xs text-slate-500">MRs Community</p></div>
                <div className="rounded-xl bg-white p-3"><p className="text-lg font-extrabold">2,400+</p><p className="text-xs text-slate-500">Vacancies verified</p></div>
                <div className="rounded-xl bg-white p-3"><p className="text-lg font-extrabold">18K</p><p className="text-xs text-slate-500">Placements</p></div>
              </div>
              <div className="mt-4 flex gap-2">
                <a href="https://wa.me/919999999999" target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp Recruiter</a>
                <button onClick={() => setToast('Recruiter dashboard: Post Vacancy — switch to Recruiter tier ₹1999/mo')} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Post Vacancy</button>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h3 className="text-lg font-extrabold">Recruiter Dashboard (Preview)</h3>
              <p className="text-sm text-slate-500">For pharma companies & stockist managers. Post once, reach 50k+ MRs instantly.</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
                  <div><p className="text-sm font-bold">Post New Vacancy</p><p className="text-xs text-slate-500">Takes 2 mins • Verified badge in 2h</p></div>
                  <button onClick={() => setTier('recruiter')} className="rounded-full bg-sky-600 px-4 py-2 text-xs font-bold text-white">Post Job</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4"><p className="text-xs font-bold text-slate-500">Active Posts</p><p className="mt-1 text-2xl font-extrabold">12</p><p className="text-xs text-emerald-600">↑ 3 this week</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs font-bold text-slate-500">Applicants</p><p className="mt-1 text-2xl font-extrabold">348</p><p className="text-xs text-sky-600">24 new today</p></div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold">Recent applicants</p><span className="text-xs text-slate-500">Top 3</span></div>
                  <div className="mt-3 space-y-2">
                    {['Amit P • B.Pharm • 2 yrs • Hyderabad', 'Sneha R • B.Sc • Fresher • Bengaluru', 'Vikash K • D.Pharm • 1 yr • Pune'].map(a => (
                      <div key={a} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold"><div className="h-8 w-8 rounded-full bg-slate-200" /> {a} <span className="ml-auto text-sky-600">View</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANDROID / PLAY STORE SECTION */}
      <section className="mx-auto max-w-[1280px] px-4 py-10">
        <div className="rounded-3xl border bg-slate-900 p-6 text-white sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold tracking-widest">GOOGLE PLAY STORE READY</span>
              <h2 className="mt-3 text-[26px] font-extrabold leading-tight">Your PWA is Android-ready. <span className="text-emerald-400">Upload to Play Store in 1 day.</span></h2>
              <p className="mt-2 text-sm leading-relaxed opacity-80">Built as PWA + Trusted Web Activity (TWA). No separate native code needed. Includes AdMob, in-app purchases (subscriptions), and full Play Store compliance.</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { title: 'TWA / Bubblewrap Ready', desc: 'manifest + assetlinks + twa-manifest.json generated. Build AAB with: npx @bubblewrap/cli build', icon: Smartphone },
                  { title: 'AdMob Integrated', desc: 'Banner, Interstitial, Native, Rewarded. Test IDs included — replace with your ca-app-pub-IDs.', icon: Megaphone },
                  { title: 'Play Billing Ready', desc: 'Subscription tiers mapped to Google Play Billing. Free → Starter → Pro → Recruiter.', icon: BadgeIndianRupee },
                  { title: 'Compliant & Safe', desc: 'Privacy Policy, Data Safety, Kids/Ads disclosure, content rating Everyone, GDPR consent.', icon: ShieldCheck },
                ].map(f => (
                  <div key={f.title} className="rounded-2xl bg-white/10 p-4">
                    <f.icon className="h-5 w-5 text-emerald-400" />
                    <p className="mt-2 text-sm font-bold">{f.title}</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-80">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setShowAndroidModal(true)} className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600">View Play Store Assets →</button>
                <a href="#vacancies" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900">Preview App</a>
              </div>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold tracking-widest opacity-70">PLAY STORE LISTING (COPY-READY)</p>
                <p className="mt-2 text-sm font-bold">Title: MR Vacancies Hub - Pharma MR Jobs</p>
                <p className="mt-1 text-xs leading-relaxed opacity-80">Short desc (80 chars): Verified Medical Representative vacancies across India. Daily updates.</p>
                <p className="mt-1 text-xs leading-relaxed opacity-80">Full desc: India’s most trusted hub for Pharma MR jobs. Verified vacancies from Sun, Cipla, Mankind, Zydus, Alkem, Torrent, Lupin, Abbott, Glenmark & 100+ companies. Managed by M Divakar Reddy (15+ yrs). Features: masked contacts (anti-spam), subscription unlocks, AI resume & interview prep, WhatsApp apply, PWA offline mode. 50K+ MRs, 2400+ verified jobs.</p>
                <p className="mt-2 text-[11px] opacity-60">Category: Business • Content rating: Everyone • Data Safety: collected: contact, app activity; encrypted; no sharing • Ads: yes</p>
              </div>
            </div>

            {/* phone mockup */}
            <div className="flex flex-col items-center">
              <div className="relative mx-auto w-[280px] rounded-[36px] border-[8px] border-slate-800 bg-slate-800 p-2 shadow-2xl">
                <div className="rounded-[24px] bg-[#f0f7ff] p-3">
                  <div className="flex items-center justify-between text-[11px] font-bold"><span>9:41</span><span className="flex items-center gap-1"><span className="h-2 w-6 rounded bg-slate-900" /><span className="h-3 w-3 rounded-full border-2 border-slate-900" /></span></div>
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-white"><Briefcase className="h-4 w-4" /><p className="text-xs font-bold">MR Vacancies Hub</p><span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-sky-600">VERIFIED</span></div>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl bg-white p-2.5 shadow"><p className="text-xs font-bold">Sun Pharma • MR • Hyderabad</p><p className="text-[11px] text-slate-500">₹4.2-5.5 LPA • 1-4 yrs • Verified</p><div className="mt-2 rounded-lg bg-sky-50 px-2 py-1 text-center text-[11px] font-bold text-sky-700">Watch Ad to Reveal Contact</div></div>
                    <div className="rounded-xl bg-amber-400 p-2 text-center text-[11px] font-bold">AD • AdMob Banner • Pharma Course</div>
                    <div className="rounded-xl bg-white p-2.5 shadow"><p className="text-xs font-bold">Cipla • Trainee MR • Bengaluru</p><p className="text-[11px] text-slate-500">Fresher • Training at Cipla Academy</p></div>
                    <div className="flex gap-2"><span className="flex-1 rounded-full bg-sky-600 py-2 text-center text-xs font-bold text-white">Quick Apply</span><span className="rounded-full border bg-white px-3 py-2 text-xs font-bold">Save</span></div>
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-900 py-2 text-center text-[11px] font-bold text-white">Bottom Nav • Home • Saved • AI • Profile</div>
                </div>
                <div className="absolute inset-x-0 -bottom-3 mx-auto h-1 w-24 rounded-full bg-slate-600" />
              </div>
              <div className="mt-6 w-full rounded-2xl bg-white p-4 text-slate-900">
                <p className="text-sm font-extrabold">Ads Running Live (Demo)</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-amber-50 p-2"><p className="font-bold">Banner</p><p className="text-slate-500">Top + Inline</p></div>
                  <div className="rounded-xl bg-violet-50 p-2"><p className="font-bold">Interstitial</p><p className="text-slate-500">On Apply</p></div>
                  <div className="rounded-xl bg-emerald-50 p-2"><p className="font-bold">Rewarded</p><p className="text-slate-500">On Reveal</p></div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">eCPM estimate India: Banner ₹15-35, Interstitial ₹45-90, Rewarded ₹90-180. Fill rate &gt;95% with AdMob.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1280px] px-4 pb-10">
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="text-lg font-extrabold">FAQ — MR Vacancies Hub</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { q: 'Is this free? Why masked contacts?', a: 'Yes, Free forever. Phone/email is masked to protect recruiters from spam. Watch a short ad to unlock 1 contact/day, or subscribe for ad-free unlocks.' },
              { q: 'How is this verified?', a: 'Every vacancy is manually checked by M Divakar Reddy: company GST, recruiter ID, HQ & CTC confirmation. Unverified posts are never published.' },
              { q: 'Can I upload my resume?', a: 'Yes — AI assistant helps build a 1-page MR resume (B.Pharm/B.Sc focused) and auto-attaches on Quick Apply (Pro feature).' },
              { q: 'How do I get the Android App?', a: 'Install PWA now (1-tap). For Play Store: we provide TWA wrapper — build AAB via Bubblewrap and upload to Play Console. See Android modal.' },
            ].map(f => (
              <div key={f.q} className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold">{f.q}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-[1280px] px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white"><Briefcase className="h-5 w-5" /></div><p className="font-extrabold text-white">MR Vacancies Hub</p></div>
              <p className="mt-3 text-xs leading-relaxed opacity-80">India’s trusted PWA for Medical Representatives. Verified vacancies, masked contacts, subscription unlocks. Managed by M Divakar Reddy.</p>
              <div className="mt-4 flex gap-2">
                <a className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900" href="#"> <Download className="mr-1 inline h-3 w-3" /> Get on Google Play</a>
                <a className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold" href="#" onClick={e => { e.preventDefault(); handleInstall() }}>Install PWA</a>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Explore</p>
              <ul className="mt-3 space-y-2 text-sm opacity-80">
                <li><a href="#vacancies">Browse Vacancies</a></li>
                <li><a href="#pricing">Subscription</a></li>
                <li><a href="#ai">AI Assistant</a></li>
                <li><a href="#recruiters">For Recruiters</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Legal & Support</p>
              <ul className="mt-3 space-y-2 text-sm opacity-80">
                <li><a href="#privacy" onClick={e => { e.preventDefault(); setShowAndroidModal(true) }}>Privacy Policy</a></li>
                <li><a href="#terms" onClick={e => { e.preventDefault(); setShowAndroidModal(true) }}>Terms & Data Safety</a></li>
                <li><a href="#ads" onClick={e => { e.preventDefault(); setShowAndroidModal(true) }}>Ad Policy (AdMob)</a></li>
                <li>Support: support@mrvacancieshub.in</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-bold text-white">Managed by</p>
              <p className="mt-1 font-extrabold text-white">M Divakar Reddy</p>
              <p className="text-xs opacity-80">15+ yrs Pharma Recruitment • Ex-Sun, Dr. Reddy’s</p>
              <p className="mt-3 text-xs opacity-80">© 2025 MR Vacancies Hub. All vacancies verified. No spam — masked contacts & ad-labeled.</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-500 px-2.5 py-1 font-bold text-white">PWA</span>
                <span className="rounded-full bg-sky-600 px-2.5 py-1 font-bold text-white">TWA Ready</span>
                <span className="rounded-full bg-amber-400 px-2.5 py-1 font-bold text-slate-900">AdMob</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* JOB DETAILS MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }} onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-[720px] overflow-auto rounded-2xl bg-white">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: selected.color }}>{selected.company.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-extrabold">{selected.company} • {selected.title}</p>
                    <p className="text-xs text-slate-500">{selected.hq} • {selected.posted}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-full border p-2"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {selected.verified && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Verified</span>}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{selected.type}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{selected.exp}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{selected.ctc}</span>
                </div>
                <h4 className="mt-4 text-[15px] font-extrabold">Job Description</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{selected.desc} Must have 2-wheeler, valid license, willingness to do fieldwork, RCPA and stockist follow-up. Daily reporting via SFA app.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Division</p><p className="text-sm font-bold">{selected.division}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Qualification</p><p className="text-sm font-bold">{selected.qual}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">HQ & Coverage</p><p className="text-sm font-bold">{selected.hq} • Covers nearby 30km</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Perks</p><p className="text-sm font-bold">{selected.perks.join(' • ')}</p></div>
                </div>
                <div className="mt-4 rounded-xl border bg-sky-50 p-4">
                  <p className="text-xs font-bold tracking-wide text-sky-800">CONTACT (MASKED PROTECTION)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full border bg-white px-3 py-2 text-sm font-bold ${revealed.has(selected.id) ? '' : 'blur-[5px]'}`}>{selected.phone}</span>
                    <span className={`rounded-full border bg-white px-3 py-2 text-sm font-bold max-w-full truncate ${revealed.has(selected.id) ? '' : 'blur-[5px]'}`}>{selected.email}</span>
                  </div>
                  {!revealed.has(selected.id) ? (
                    <button onClick={() => { attemptReveal(selected); setSelected(null) }} className="mt-3 w-full rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white">Reveal Contact</button>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <a href={`tel:${selected.phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 py-2.5 text-sm font-bold text-white"><Phone className="h-4 w-4" /> Call</a>
                      <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { handleApply(selected); setSelected(null) }} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white"><Send className="h-4 w-4" /> Quick Apply</button>
                  <button onClick={() => setSelected(null)} className="rounded-full border bg-white px-6 py-3 text-sm font-bold">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REWARDED AD MODAL */}
      <AnimatePresence>
        {showRewarded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white">
              <div className="bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold"><TvMinimalPlay className="h-4 w-4 text-amber-400" /> Rewarded Ad • AdMob</p>
                  <button onClick={() => { setShowRewarded(null); setRewardProgress(0) }} className="rounded-full bg-white/20 p-1"><X className="h-4 w-4" /></button>
                </div>
                <p className="mt-1 text-xs opacity-80">Watch to unlock <b>{showRewarded.company}</b> contact for 24h. No payment — ad supports free access.</p>
              </div>
              <div className="p-4">
                <div className="rounded-xl bg-black p-3 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded bg-amber-400 px-2 py-1 font-bold text-black">AD • VIDEO</span>
                    <span className="rounded bg-white/20 px-2 py-1">{Math.max(0, 5 - Math.floor(rewardProgress / 20))}s</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center justify-center py-6">
                    <Megaphone className="h-10 w-10 text-amber-400" />
                    <p className="mt-3 text-sm font-bold">Pharma Sales Mastery — 40% OFF</p>
                    <p className="text-xs opacity-70">Trusted by 12,000 MRs • 4.8★</p>
                    <div className="mt-4 h-2 w-full rounded-full bg-white/20">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${rewardProgress}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] opacity-70">ca-app-pub-3940256099942544/5224354917 • Rewarded Video</p>
                  </div>
                </div>
                {rewardProgress < 100 ? (
                  <button onClick={() => { let p = 0; const id = setInterval(() => { p += 10; setRewardProgress(p); if (p >= 100) { clearInterval(id); } }, 200) }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-bold text-white">
                    <Play className="h-4 w-4" /> Play Ad (5 sec)
                  </button>
                ) : (
                  <button onClick={handleRewardedComplete} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white">
                    <Gift className="h-4 w-4" /> Claim Reward — Reveal Contact
                  </button>
                )}
                <p className="mt-2 text-center text-xs text-slate-500">Skip available after 5 sec • Reward granted only if watched fully</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERSTITIAL */}
      <AnimatePresence>
        {showInterstitial && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="w-full max-w-[360px] rounded-2xl bg-white p-6 text-center">
              <p className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold inline-flex">AD • INTERSTITIAL</p>
              <div className="mt-4 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 p-6 text-white">
                <Smartphone className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm font-bold">MedDetail Pro — E-Detailing for MRs</p>
                <p className="text-xs opacity-90">Create visual aids in 30 seconds</p>
                <span className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-900">Install</span>
              </div>
              <p className="mt-4 text-sm font-bold">Submitting your application…</p>
              <p className="text-xs text-slate-500">Ad will close automatically</p>
              <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-slate-200 overflow-hidden"><div className="h-1 w-full animate-[shimmer_1.2s_ease-in-out_infinite] bg-sky-500" /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANDROID / PLAY STORE MODAL */}
      <AnimatePresence>
        {showAndroidModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAndroidModal(false)}>
            <motion.div initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.98 }} onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-[860px] overflow-auto rounded-2xl bg-white">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
                <div>
                  <p className="text-lg font-extrabold">Android — Play Store Upload Kit</p>
                  <p className="text-xs text-slate-500">TWA + AdMob + Play Billing • Ready to build AAB and publish</p>
                </div>
                <button onClick={() => setShowAndroidModal(false)} className="rounded-full border p-2"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid gap-6 p-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-sm font-extrabold">1. PWA is already production-ready</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-600">
                      <li><b>manifest.json</b> with icons, theme #0284c7, display standalone, categories business</li>
                      <li><b>Service Worker</b> via vite-plugin-pwa (Workbox) — offline cache</li>
                      <li>Installable on Android Chrome → Add to Home Screen</li>
                      <li>Already handles <code>beforeinstallprompt</code> and fallback instructions</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border bg-sky-50 p-4">
                    <p className="text-sm font-extrabold">2. Wrap as TWA for Play Store (Bubblewrap)</p>
                    <pre className="mt-2 overflow-auto rounded bg-slate-900 p-3 text-xs text-emerald-300">{`npm i -g @bubblewrap/cli
bubblewrap init --manifest https://yourdomain.com/manifest.json
# answer: appId com.mrvacancieshub.app, enable Play Billing
bubblewrap build   # generates app-release.aab
# upload app-release.aab to Play Console`}</pre>
                    <p className="mt-2 text-xs text-slate-600">TWA config generated in <code>/public/twa-manifest.json</code> + <code>assetlinks.json</code> for Digital Asset Links.</p>
                  </div>
                  <div className="rounded-xl border bg-amber-50 p-4">
                    <p className="text-sm font-extrabold">3. AdMob Setup (Replace Test IDs)</p>
                    <pre className="mt-2 overflow-auto rounded bg-slate-900 p-3 text-xs text-amber-200">{`Banner:          ca-app-pub-3940256099942544/6300978111
Interstitial:    ca-app-pub-3940256099942544/1033173712
Rewarded:        ca-app-pub-3940256099942544/5224354917
Native:          ca-app-pub-3940256099942544/2247696110
App ID:          ca-app-pub-3940256099942544~3347511713`}</pre>
                    <p className="mt-2 text-xs text-slate-600">In Android Studio → <code>AndroidManifest.xml</code> add <code>com.google.android.gms.ads.APPLICATION_ID</code>. Monetization code in app is already labeled “AD” and GDPR-compliant.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border bg-emerald-50 p-4">
                    <p className="text-sm font-extrabold">Play Console Checklist</p>
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {[
                        'App name: MR Vacancies Hub - Pharma MR Jobs (30 chars)',
                        'Package: com.mrvacancieshub.app',
                        'Category: Business, Content rating: Everyone (questionnaire: no gambling/violence)',
                        'Data Safety: declare contact, app activity, ads; encryption yes; data deletion via email',
                        'Ads declaration: Yes, contains ads (AdMob)',
                        'In-app purchases: Subscription tiers mapped to Play Billing (₹199, ₹499, ₹1999 monthly)',
                        'Privacy Policy URL: https://yourdomain.com/privacy-policy.html (generated)',
                        'Screenshots: 1080×1920, feature graphic 1024×500, icon 512×512 (icon.svg ready)',
                        'Assetlinks: https://yourdomain.com/.well-known/assetlinks.json (generated)',
                      ].map(li => <li key={li} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /><span>{li}</span></li>)}
                    </ul>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-sm font-extrabold">Privacy Policy & Assetlinks Preview</p>
                    <div className="mt-2 rounded border bg-slate-50 p-3 text-xs">
                      <p className="font-bold">/.well-known/assetlinks.json</p>
                      <pre className="mt-1 overflow-auto whitespace-pre-wrap break-all text-[11px]">{`[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mrvacancieshub.app",
    "sha256_cert_fingerprints": ["REPLACE_WITH_YOUR_SHA256"]
  }
}]`}</pre>
                      <p className="mt-3 font-bold">twa-manifest.json</p>
                      <pre className="mt-1 overflow-auto whitespace-pre-wrap break-all text-[11px]">{`{
  "packageId": "com.mrvacancieshub.app",
  "host": "yourdomain.com",
  "name": "MR Vacancies Hub",
  "themeColor": "#0284c7",
  "backgroundColor": "#f0f7ff",
  "enableNotifications": true,
  "features": { "playBilling": { "enabled": true } }
}`}</pre>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(window.location.origin); setToast('Domain copied — use for assetlinks host') }} className="rounded-full border bg-white px-3 py-1 text-xs font-bold">Copy Domain</button>
                        <button onClick={() => setToast('Privacy Policy file at /privacy-policy.html — ready for Play Console URL')} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">View Privacy Policy</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAndroidModal(false)} className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-bold text-white">Got it — Build AAB</button>
                    <button onClick={() => { setShowAndroidModal(false); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }} className="rounded-full border bg-white px-6 py-3 text-sm font-bold">See Monetization</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRICING MODAL */}
      <AnimatePresence>
        {showPricing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPricing(false)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-[980px] overflow-auto rounded-2xl bg-white">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
                <div>
                  <p className="text-lg font-extrabold">Subscription Plans — MR Vacancies Hub</p>
                  <p className="text-xs text-slate-500">Choose ad-supported Free or go ad-free with Starter/Pro. All payments demo — no charge in preview.</p>
                </div>
                <button onClick={() => setShowPricing(false)} className="rounded-full border p-2"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
                {TIERS.map(t => (
                  <div key={t.id} className={`rounded-2xl border p-4 ${tier === t.id ? 'border-sky-600 bg-sky-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2"><t.icon className="h-5 w-5" /><p className="font-extrabold">{t.name}</p></div>
                    <p className="mt-1 text-xl font-extrabold">{t.price}<span className="text-xs font-semibold text-slate-500">{t.period}</span></p>
                    <ul className="mt-3 space-y-1.5">
                      {t.features.map(f => <li key={f} className="flex gap-2 text-xs"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{f}</li>)}
                    </ul>
                    <button onClick={() => { setTier(t.id); setShowPricing(false); setToast(`${t.name} activated (Demo)`) }} className={`mt-4 w-full rounded-full py-2.5 text-sm font-bold ${tier === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>{tier === t.id ? 'Active' : 'Select'}</button>
                  </div>
                ))}
              </div>
              <div className="border-t bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                <p><b>Ads:</b> Free uses AdMob Rewarded (watch ad = 1 unlock). Banner & Interstitial are skippable and never block apply flow. Starter/Pro are ad-free (Play Store: declare “Contains ads” only for Free).</p>
                <p className="mt-1"><b>Billing:</b> On Play Store, these map to Google Play Billing subscriptions. Web PWA uses UPI/Stripe — demo here.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-[560px] -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">
            <div className="flex items-center gap-2"><Info className="h-4 w-4 shrink-0 text-sky-400" /> <span className="flex-1">{toast}</span> <button onClick={() => setToast(null)} className="rounded-full bg-white/20 p-1"><X className="h-3.5 w-3.5" /></button></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav for mobile (app-like) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-around px-2 py-2">
          <a href="#vacancies" className="flex flex-col items-center gap-1 rounded-xl px-4 py-1 hover:bg-slate-50">
            <Layers className="h-5 w-5 text-sky-600" /><span className="text-[11px] font-bold">Jobs</span>
          </a>
          <button onClick={() => setSaved(s => s)} className="flex flex-col items-center gap-1 rounded-xl px-4 py-1">
            <Bookmark className={`h-5 w-5 ${saved.size ? 'text-sky-600' : 'text-slate-400'}`} /><span className="text-[11px] font-bold">Saved {saved.size ? `•${saved.size}` : ''}</span>
          </button>
          <a href="#ai" className="flex flex-col items-center gap-1 rounded-xl bg-sky-600 px-5 py-1.5 text-white">
            <Sparkles className="h-5 w-5" /><span className="text-[11px] font-bold">AI Chat</span>
          </a>
          <button onClick={() => setShowPricing(true)} className="flex flex-col items-center gap-1 rounded-xl px-4 py-1">
            <Crown className="h-5 w-5 text-amber-500" /><span className="text-[11px] font-bold">Pro</span>
          </button>
          <button onClick={() => setShowAndroidModal(true)} className="flex flex-col items-center gap-1 rounded-xl px-4 py-1">
            <Smartphone className="h-5 w-5 text-emerald-600" /><span className="text-[11px] font-bold">Android</span>
          </button>
        </div>
      </div>
      <div className="h-[72px] lg:hidden" />
    </div>
  )
}

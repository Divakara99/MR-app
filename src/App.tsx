import { useEffect, useRef, useState } from 'react'
import {
  Search, MapPin, Briefcase, IndianRupee, Building2, BadgeCheck, Clock3,
  Eye, EyeOff, Bookmark, BookmarkCheck, Share2, Phone, Mail, Filter, X, Menu,
  Crown, ShieldCheck, Sparkles, Zap, Star, Users, TrendingUp, FileText, Send,
  MessageCircle, Play, Smartphone, ChevronDown, ChevronUp, ChevronRight, ArrowLeft,
  GraduationCap, Layers, Siren, Megaphone, Quote,
  LockKeyhole, Unlock, TvMinimalPlay, BadgeIndianRupee, Check,
  Settings, User, LogOut, LogIn, Plus, SearchX, Info, AlertTriangle, Gift, Trash2, LayoutDashboard, KeyRound, RotateCcw,
  Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { isSupabaseConfigured, supabase, type RemoteAccountRow, type RemoteCandidateRow } from './supabase'
import { LEGAL_POLICY_DATE, PRIVACY_SECTIONS, SUPPORT_EMAIL, SUPPORT_TICKET_REASONS, TERMS_SECTIONS } from './legalSupport'

// TYPES
type Tier = 'free' | 'starter' | 'pro'
type ExtraRevealField = 'company' | 'manager' | 'phone'
type SponsoredRevealAction = 'contact' | ExtraRevealField
type ExtraJobReveals = Partial<Record<ExtraRevealField, boolean>>
type StoredDailyJobAccess = {
  date: string
  revealed: string[]
  dailyUnlocks: number
  extraReveals: Record<string, ExtraJobReveals>
}
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
  type: 'Trainee MR' | 'Field MR' | 'Senior MR' | 'ASM' | 'RSM' | 'ZSM' | 'NSM'
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

type PendingJob = Job & { submittedAt: string; submittedBy: string }
type EntryRole = 'seeker' | 'recruiter'
type AppPage = 'welcome' | 'auth' | 'home' | 'jobs' | 'pricing' | 'recruiters' | 'candidates' | 'ai' | 'saved' | 'admin' | 'postjob' | 'profile' | 'legal'
type SeekerProfile = {
  experienceType: 'fresher' | 'experienced'
  desiredRole: string
  qualification: string
  passingYear: string
  totalExperience: string
  currentCompany: string
  currentRole: string
  currentPackage: string
  expectedPackage: string
  state: string
  city: string
  currentHq: string
  preferredHq: string
  noticePeriod: string
  twoWheeler: string
  skills: string
  updatedAt?: string
}
type CandidateProfileView = {
  id: string
  code: string
  source: 'registered' | 'sample'
  profile: SeekerProfile
}
type Account = { role: EntryRole; name: string; mobile: string; email: string; createdAt: string; profile?: SeekerProfile }
type AccountDeletionRequest = {
  id: string
  name: string
  mobile: string
  email: string
  accountCreatedAt: string
  reasonCategory: string
  reasonDetails: string
  status: 'pending' | 'rejected'
  requestedAt: string
  reviewedAt?: string
  adminNote?: string
}

type LegalTab = 'privacy' | 'terms' | 'support'
type SupportTicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed'
type SupportTicketSource = 'ai' | 'support'
type SupportTicket = {
  id: string
  ticketNo: string
  name: string
  mobile: string
  email: string
  role: EntryRole | 'guest' | 'admin'
  category: string
  subject: string
  details: string
  status: SupportTicketStatus
  source: SupportTicketSource
  createdAt: string
  updatedAt: string
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
  { id:'13', company:'Mankind Pharma', color:'#f97316', division:'Mankind - Cardio Diabetic', title:'Senior Medical Representative', hq:'Hyderabad - Banjara Hills', state:'Telangana', exp:'3-6 yrs', ctc:'₹5.5 - 7.0 LPA + Incentives', vacancies:2, qual:'B.Pharm / B.Sc', type:'Senior MR', posted:'4 hrs ago', verified:true, urgent:false, hot:true, desc:'Senior MR role for a high-value Hyderabad HQ. Own key doctors, KOL coverage, RCPA, chemist mapping and new-product launch execution. Strong cardio-diabetic territory performance preferred.', contactPerson:'Ramesh Reddy - ASM', phone:'+91 98491 44556', email:'careers@mankindpharma.co.in', skills:['KOL Coverage','RCPA','Territory Planning'], perks:['Top Incentives','Mobile Allowance','Field TA/DA'] },
  { id:'14', company:'Cipla Ltd', color:'#0ea5e9', division:'Cipla - Respiratory', title:'ZSM - Zonal Sales Manager', hq:'Bengaluru - Koramangala', state:'Karnataka', exp:'8-12 yrs', ctc:'₹14 - 18 LPA + Car + Incentives', vacancies:1, qual:'B.Pharm / B.Sc + MBA Preferred', type:'ZSM', posted:'1 day ago', verified:true, urgent:true, hot:false, desc:'Lead the South Zone field force through RSMs and ASMs. Responsible for zonal primary/secondary targets, launch execution, KOL strategy, team coaching and stockist performance.', contactPerson:'Anita Sharma - HR Talent', phone:'+91 91008 11234', email:'anita.sharma@cipla.com', skills:['Zonal Leadership','Team Coaching','Sales Strategy'], perks:['Company Car','Laptop','Leadership Bonus'] },
  { id:'15', company:'Abbott India', color:'#1d4ed8', division:'Abbott - Specialty Care', title:'NSM - National Sales Manager', hq:'Mumbai - BKC', state:'Maharashtra', exp:'12-18 yrs', ctc:'₹28 - 38 LPA + Car + Leadership Incentives', vacancies:1, qual:'B.Pharm / B.Sc + MBA', type:'NSM', posted:'2 days ago', verified:true, urgent:true, hot:true, desc:'Pan-India national sales leadership role. Own national targets, field-force productivity, ZSM/RSM coaching, launch planning, KOL engagement and cross-functional execution with marketing and medical teams.', contactPerson:'Sarah D\'Souza - Talent Partner', phone:'+91 98190 55667', email:'sarah.dsouza@abbott.com', skills:['National Sales Leadership','P&L Ownership','Launch Excellence'], perks:['Company Car','Leadership Incentives','Global Exposure'] },

]

const COMPANIES = ['All Companies', 'Sun Pharma', 'Cipla Ltd', 'Mankind Pharma', 'Dr. Reddy\'s', 'Alkem Laboratories', 'Torrent Pharma', 'Zydus Lifesciences', 'Lupin Ltd', 'Abbott India', 'Glenmark Pharma', 'Intas Pharmaceuticals', 'Aurobindo Pharma']
const LOCATIONS = ['All India', 'Telangana', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Delhi']
const CITIES_ALL = ['All Cities', ...Array.from(new Set(JOBS.map(j => j.hq.split(' - ')[0].trim())))]
const HQ_ALL = ['All HQs', ...JOBS.map(j => j.hq)]
const EXP_OPTIONS = ['All Experience', 'Fresher', 'Below 6 months', 'Above 6 months'] as const
const JOB_ROLES = ['Trainee MR', 'Field MR', 'Senior MR', 'ASM', 'RSM', 'ZSM', 'NSM'] as const
const ROLES = ['All Roles', ...JOB_ROLES] as const
const ROLE_LABELS: Record<string, string> = {
  'All Roles': 'All Roles (MR to NSM)',
  'Trainee MR': 'Trainee MR',
  'Field MR': 'Field MR (Medical Representative)',
  'Senior MR': 'Senior MR (Senior Medical Representative)',
  ASM: 'ASM (Area Sales Manager)',
  RSM: 'RSM (Regional Sales Manager)',
  ZSM: 'ZSM (Zonal Sales Manager)',
  NSM: 'NSM (National Sales Manager)',
}
const getRoleLabel = (roleName: string) => ROLE_LABELS[roleName] ?? roleName
const VACANCY_EXPERIENCE_OPTIONS = ['0-2 yrs (Freshers can apply)', '0.5-2 yrs', '1-3 yrs', '1-4 yrs', '2-5 yrs', '3-6 yrs', '4-7 yrs', '5-8 yrs', '6-10 yrs', '8-12 yrs', '10-15 yrs', '12-18 yrs', '15+ yrs']

// helper to get experience bucket from exp string like "0-2 yrs", "0.5-3 yrs", "1-4 yrs"
const getExpBucket = (exp: string): 'Fresher' | 'Below 6 months' | 'Above 6 months' => {
  const lower = parseFloat(exp.match(/^[0-9]*\.?[0-9]+/)?.[0] ?? '0')
  if (lower === 0) return 'Fresher'
  if (lower < 1) return 'Below 6 months' // 0.5 = 6 months
  return 'Above 6 months'
}

const TIERS = [
  { id: 'free' as Tier, name: 'Free', price: '₹0', period: '/forever', color: 'slate', icon: ShieldCheck, features: ['3 daily jobs — 15-sec ad reveals full contact', 'After 3 unlocks: 7 extra jobs open', 'Extra jobs: separate ads for company, manager & number', 'Apply Now plays a sponsored ad', 'Save vacancies', 'Standard support'], cta: 'Current Plan', popular: false, limit: '3 + 7 extra/day' },
  { id: 'starter' as Tier, name: 'Starter', price: '₹99', period: '/month', color: 'sky', icon: Zap, features: ['15 direct contacts/day — no reveal ads', 'No banner or native ads', 'Unmasked phone + email', 'Apply Now plays one sponsored ad per application', 'WhatsApp contact button', 'AI Resume builder'], cta: 'Go Starter — ₹99/mo', popular: true, limit: '15/day' },
  { id: 'pro' as Tier, name: 'Pro', price: '₹499', period: '/month', color: 'violet', icon: Crown, features: ['Unlimited direct contacts — no reveal ads', 'No banner or native ads', 'Apply Now plays one sponsored ad per application', 'Direct Recruiter Chat', 'Interview preparation AI', 'Featured profile for 30 days', 'Salary insights & negotiation tips'], cta: 'Go Pro', popular: false, limit: 'Unlimited' },
]

const SEEKER_AI_WELCOME = 'Hi! I’m your PharmaSales AI assistant 👋\n\nTry me:\n• “Resume for B.Pharm fresher”\n• “Interview Q&A for ASM/RSM roles”\n• “Best Hyderabad vacancies for 2 yrs exp”\n\nNeed help from Admin? Tap “Raise Support Ticket” below or type “raise support ticket”. Please give a proper reason so we can solve it quickly.'
const RECRUITER_AI_WELCOME = 'Hi! I’m your PharmaSales Jobs recruiter assistant 👋\n\nI can help you with:\n• Writing a clear vacancy description for any role from Trainee MR to NSM\n• Interview questions for MR to NSM candidates\n• Candidate screening & shortlist checklists\n• Improving response to your vacancy\n\nJob search and subscription plans are for Job Seekers only — your Recruiter account does not need a plan. Need Admin help? Tap “Raise Support Ticket” below.'
const getAiWelcomeMessages = (role?: EntryRole | null) => [{ role: 'assistant' as const, text: role === 'recruiter' ? RECRUITER_AI_WELCOME : SEEKER_AI_WELCOME }]

// Helpers
const maskPhone = (p: string) => p.replace(/(.{4})(.*)(.{3})/, (_, a, mid, c) => a + 'X'.repeat(mid.length) + c)
const maskEmail = (e: string) => e.replace(/^(.{1})(.*)(@.*)$/, (_, a, mid, dom) => a + 'X'.repeat(Math.min(mid.length, 6)) + dom)

// ADMIN (M Divakar Reddy)
const ADMIN_IDS = ['divakar', 'admin', 'admin@mrvacancieshub.in', 'divakar@mrvacancieshub.in']
const DEFAULT_ADMIN_PASSWORD = 'Divakar@2026'
const ADMIN_AUTH_KEY = 'mr-admin-auth-v1'
const ADMIN_PASS_KEY = 'mr-admin-pass-v1'
const ADMIN_JOBS_KEY = 'mr-admin-jobs-v1'
const ROLE_SEED_MIGRATION_KEY = 'mr-to-nsm-seed-jobs-v1'
const PENDING_JOBS_KEY = 'mr-pending-jobs-v1'
const ACCOUNTS_KEY = 'mr-accounts-v1'
const SESSION_KEY = 'mr-session-v1'
const DELETION_REQUESTS_KEY = 'mr-deletion-requests-v1'
const SUPPORT_TICKETS_KEY = 'mr-support-tickets-v1'
const DELETION_REASON_OPTIONS = [
  'I got a job and no longer need this account',
  'I want to use another mobile number',
  'I want to register as a Recruiter with this mobile',
  'I created this account by mistake',
  'Privacy / personal reasons',
  'Other proper reason',
]
const CANDIDATE_INTERESTS_KEY = 'mr-candidate-interests-v1'
const DAILY_JOB_ACCESS_KEY = 'mr-daily-job-access-v1'
const FREE_DAILY_JOB_LIMIT = 3
const FREE_EXTRA_JOB_LIMIT = 7
const getTodayKey = () => new Date().toLocaleDateString('en-CA')
const emptyDailyJobAccess = (): StoredDailyJobAccess => ({ date: getTodayKey(), revealed: [], dailyUnlocks: 0, extraReveals: {} })
const loadDailyJobAccess = (): StoredDailyJobAccess => {
  try {
    const raw = localStorage.getItem(DAILY_JOB_ACCESS_KEY)
    if (!raw) return emptyDailyJobAccess()
    const parsed = JSON.parse(raw) as Partial<StoredDailyJobAccess>
    if (parsed.date !== getTodayKey()) return emptyDailyJobAccess()
    return {
      date: getTodayKey(),
      revealed: Array.isArray(parsed.revealed) ? parsed.revealed.map(String) : [],
      dailyUnlocks: Number.isFinite(parsed.dailyUnlocks) ? Math.max(0, Math.floor(parsed.dailyUnlocks as number)) : 0,
      extraReveals: parsed.extraReveals && typeof parsed.extraReveals === 'object' && !Array.isArray(parsed.extraReveals) ? parsed.extraReveals : {},
    }
  } catch { return emptyDailyJobAccess() }
}
const loadInitialJobs = (): Job[] => {
  try {
    const raw = localStorage.getItem(ADMIN_JOBS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) {
        const storedJobs = parsed as Job[]
        if (localStorage.getItem(ROLE_SEED_MIGRATION_KEY) === '1') return storedJobs
        const existingIds = new Set(storedJobs.map(job => job.id))
        const roleSeedJobs = JOBS.filter(job => ['13', '14', '15'].includes(job.id) && !existingIds.has(job.id))
        try { localStorage.setItem(ROLE_SEED_MIGRATION_KEY, '1') } catch { /* ignore */ }
        return [...storedJobs, ...roleSeedJobs]
      }
    }
  } catch { /* ignore */ }
  return JOBS
}
const SEEKER_QUALIFICATIONS = ['B.Pharm', 'M.Pharm', 'D.Pharm', 'Pharm.D', 'B.Sc', 'M.Sc', 'B.Sc + MBA', 'Any Graduate', 'Other']
const SEEKER_EXPERIENCE_OPTIONS = ['0-6 months', '6 months - 1 year', '1-2 years', '2-4 years', '4-7 years', '7-10 years', '10-15 years', '15+ years']
const EMPTY_SEEKER_PROFILE: SeekerProfile = {
  experienceType: 'fresher',
  desiredRole: 'Trainee MR',
  qualification: '',
  passingYear: '',
  totalExperience: '',
  currentCompany: '',
  currentRole: '',
  currentPackage: '',
  expectedPackage: '',
  state: '',
  city: '',
  currentHq: '',
  preferredHq: '',
  noticePeriod: '',
  twoWheeler: '',
  skills: '',
}
const seekerProfileRequiredValues = (profile?: SeekerProfile): string[] => {
  if (!profile) return ['']
  const common = [profile.experienceType, profile.desiredRole, profile.qualification, profile.expectedPackage, profile.state, profile.city, profile.currentHq, profile.noticePeriod, profile.twoWheeler]
  return profile.experienceType === 'fresher'
    ? [...common, profile.passingYear]
    : [...common, profile.totalExperience, profile.currentCompany, profile.currentRole, profile.currentPackage]
}
const isSeekerProfileComplete = (profile?: SeekerProfile) => {
  if (!profile) return false
  if (!seekerProfileRequiredValues(profile).every(v => v.trim().length > 0)) return false
  if (profile.experienceType === 'fresher') {
    const year = Number(profile.passingYear)
    return /^\d{4}$/.test(profile.passingYear.trim()) && year >= 1990 && year <= 2026 && (profile.desiredRole === 'Trainee MR' || profile.desiredRole === 'Field MR')
  }
  return true
}
const seekerProfileProgress = (profile?: SeekerProfile) => {
  const values = seekerProfileRequiredValues(profile)
  if (!values.length) return 0
  return Math.round((values.filter(v => v.trim().length > 0).length / values.length) * 100)
}
const anonymousCandidateCode = (mobile: string) => {
  let hash = 0
  for (let i = 0; i < mobile.length; i++) hash = ((hash << 5) - hash + mobile.charCodeAt(i)) | 0
  return `MR-2026-${1000 + (Math.abs(hash) % 9000)}`
}
const SAMPLE_CANDIDATE_PROFILES: CandidateProfileView[] = [
  { id: 'sample-mr-2026-1011', code: 'MR-2026-1011', source: 'sample', profile: { experienceType: 'fresher', desiredRole: 'Trainee MR', qualification: 'B.Pharm', passingYear: '2026', totalExperience: 'Fresher (0 years)', currentCompany: 'Fresher — No current company', currentRole: 'Fresher', currentPackage: 'Not applicable', expectedPackage: '₹3.0 - 3.6 LPA', state: 'Telangana', city: 'Hyderabad', currentHq: 'Hyderabad - Ameerpet', preferredHq: 'Hyderabad', noticePeriod: 'Immediate', twoWheeler: 'Yes', skills: 'Communication, Product Knowledge, MS Excel' } },
  { id: 'sample-mr-2026-1042', code: 'MR-2026-1042', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'Senior MR', qualification: 'B.Pharm', passingYear: '', totalExperience: '2-4 years', currentCompany: 'Sun Pharma', currentRole: 'Field MR', currentPackage: '₹4.8 LPA', expectedPackage: '₹5.5 - 6.0 LPA', state: 'Karnataka', city: 'Bengaluru', currentHq: 'Bengaluru - Jayanagar', preferredHq: 'Bengaluru', noticePeriod: '30 days', twoWheeler: 'Yes', skills: 'RCPA, Doctor Calling, Stockist Handling' } },
  { id: 'sample-mr-2026-1075', code: 'MR-2026-1075', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'Field MR', qualification: 'D.Pharm', passingYear: '', totalExperience: '1-2 years', currentCompany: 'Mankind Pharma', currentRole: 'Field MR', currentPackage: '₹3.9 LPA', expectedPackage: '₹4.5 LPA', state: 'Andhra Pradesh', city: 'Vijayawada', currentHq: 'Vijayawada', preferredHq: 'Vijayawada / Guntur', noticePeriod: '15 days', twoWheeler: 'Yes', skills: 'Chemist Relations, Local HQ Knowledge, Order Booking' } },
  { id: 'sample-mr-2026-1108', code: 'MR-2026-1108', source: 'sample', profile: { experienceType: 'fresher', desiredRole: 'Field MR', qualification: 'B.Sc', passingYear: '2025', totalExperience: 'Fresher (0 years)', currentCompany: 'Fresher — No current company', currentRole: 'Fresher', currentPackage: 'Not applicable', expectedPackage: '₹2.8 - 3.4 LPA', state: 'Maharashtra', city: 'Pune', currentHq: 'Pune - Kothrud', preferredHq: 'Pune', noticePeriod: 'Immediate', twoWheeler: 'Will arrange', skills: 'Communication, Field Work, Hindi / Marathi / English' } },
  { id: 'sample-mr-2026-1136', code: 'MR-2026-1136', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'ASM', qualification: 'B.Sc + MBA', passingYear: '', totalExperience: '4-7 years', currentCompany: "Dr. Reddy's", currentRole: 'Field MR', currentPackage: '₹6.8 LPA', expectedPackage: '₹8.0 - 9.0 LPA', state: 'Tamil Nadu', city: 'Chennai', currentHq: 'Chennai - T Nagar', preferredHq: 'Chennai', noticePeriod: '30 days', twoWheeler: 'Yes', skills: 'Team Handling, KOL Management, Sales Planning' } },
  { id: 'sample-mr-2026-1164', code: 'MR-2026-1164', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'Field MR', qualification: 'B.Pharm', passingYear: '', totalExperience: '6 months - 1 year', currentCompany: 'Cipla Ltd', currentRole: 'Trainee MR', currentPackage: '₹3.2 LPA', expectedPackage: '₹3.8 - 4.2 LPA', state: 'Telangana', city: 'Hyderabad', currentHq: 'Hyderabad - Kukatpally', preferredHq: 'Hyderabad', noticePeriod: 'Immediate', twoWheeler: 'Yes', skills: 'Product Detailing, Sampling, SFA Reporting' } },
  { id: 'sample-mr-2026-1180', code: 'MR-2026-1180', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'RSM', qualification: 'B.Pharm + MBA', passingYear: '', totalExperience: '7-10 years', currentCompany: 'Alkem Laboratories', currentRole: 'ASM', currentPackage: '₹9.5 LPA', expectedPackage: '₹11 - 13 LPA', state: 'Maharashtra', city: 'Pune', currentHq: 'Pune - Kothrud', preferredHq: 'Maharashtra Region', noticePeriod: '45 days', twoWheeler: 'Yes / Car', skills: 'Area Leadership, Team Handling, Secondary Sales, Stockist Strategy' } },
  { id: 'sample-mr-2026-1192', code: 'MR-2026-1192', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'ASM', qualification: 'B.Pharm + MBA', passingYear: '', totalExperience: '4-7 years', currentCompany: 'Sun Pharma', currentRole: 'Senior MR', currentPackage: '₹6.5 LPA', expectedPackage: '₹7.5 - 8.5 LPA', state: 'Telangana', city: 'Hyderabad', currentHq: 'Hyderabad - Banjara Hills', preferredHq: 'Hyderabad', noticePeriod: '30 days', twoWheeler: 'Yes', skills: 'Territory Leadership, KOL Management, RCPA, Team Coaching' } },
  { id: 'sample-mr-2026-1220', code: 'MR-2026-1220', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'ZSM', qualification: 'B.Pharm + MBA', passingYear: '', totalExperience: '7-10 years', currentCompany: 'Cipla Ltd', currentRole: 'RSM', currentPackage: '₹13.0 LPA', expectedPackage: '₹16 - 18 LPA', state: 'Karnataka', city: 'Bengaluru', currentHq: 'Bengaluru - Koramangala', preferredHq: 'South Zone', noticePeriod: '45 days', twoWheeler: 'Yes / Car', skills: 'Regional Leadership, Sales Strategy, Launch Planning, P&L' } },
  { id: 'sample-mr-2026-1248', code: 'MR-2026-1248', source: 'sample', profile: { experienceType: 'experienced', desiredRole: 'NSM', qualification: 'B.Sc + MBA', passingYear: '', totalExperience: '10-15 years', currentCompany: 'Abbott India', currentRole: 'ZSM', currentPackage: '₹21.0 LPA', expectedPackage: '₹28 - 32 LPA', state: 'Maharashtra', city: 'Mumbai', currentHq: 'Mumbai - BKC', preferredHq: 'Pan India', noticePeriod: '60 days', twoWheeler: 'Yes / Car', skills: 'National Sales Leadership, Zonal Management, Launch Excellence, Team Building' } },

]
const normalizeMobile = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}
const isValidMobile = (value: string) => /^[6-9]\d{9}$/.test(normalizeMobile(value))
type EmailValidationResult = { error: string | null; suggestion?: string }
const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])
const GMAIL_TYPO_DOMAINS = new Set([
  'gamil.com', 'gmial.com', 'gmaill.com', 'gmai.com', 'gmal.com', 'gmali.com',
  'gamil.co', 'gmial.co', 'gmaill.co', 'googlemai.com', 'googlemial.com',
])
const isValidGmailUsername = (localPart: string) => {
  const [username, tag, ...extraParts] = localPart.split('+')
  if (extraParts.length > 0) return false
  if (tag !== undefined && !/^[a-z0-9.]+$/.test(tag)) return false
  return /^[a-z0-9.]{6,30}$/.test(username)
    && !username.startsWith('.')
    && !username.endsWith('.')
    && !username.includes('..')
}
const validateEmailAddress = (value: string): EmailValidationResult => {
  const email = value.trim().toLowerCase()
  if (!email) return { error: 'Enter your correct email ID.' }
  if (/\s/.test(email)) return { error: 'Email ID must not contain spaces.' }
  if (email.length > 254) return { error: 'Email ID is too long. Please check and enter it again.' }

  const parts = email.split('@')
  if (parts.length !== 2) return { error: 'Enter a correct email ID with one @ sign, e.g. yourname@gmail.com.' }
  const [localPart, domain] = parts
  if (!localPart || !domain) return { error: 'Enter a complete email ID, e.g. yourname@gmail.com.' }
  if (localPart.length > 64) return { error: 'The part before @ is too long. Please check your email ID.' }
  if (domain.length > 253 || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return { error: 'The email domain is not correct. Please check the part after @.' }
  }

  const domainLabels = domain.split('.')
  if (domainLabels.length < 2) return { error: 'Enter the complete email domain, e.g. @gmail.com.' }
  if (domainLabels.some(label => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    return { error: 'The email domain is not correct. Please check the spelling after @.' }
  }
  const topLevelDomain = domainLabels[domainLabels.length - 1]
  if (!/^[a-z]{2,}$/.test(topLevelDomain) && !/^xn--[a-z0-9-]+$/.test(topLevelDomain)) {
    return { error: 'The ending of the email domain is not correct. Please check it carefully.' }
  }

  const looksLikeGmailTypo = !GMAIL_DOMAINS.has(domain)
    && (domain.startsWith('gmail.') || domain.startsWith('googlemail.') || GMAIL_TYPO_DOMAINS.has(domain))
  if (looksLikeGmailTypo) {
    const suggestion = isValidGmailUsername(localPart) ? `${localPart}@gmail.com` : undefined
    return { error: 'Gmail IDs must end with @gmail.com. Please correct the domain spelling.', suggestion }
  }

  if (GMAIL_DOMAINS.has(domain)) {
    if (!isValidGmailUsername(localPart)) {
      return { error: 'Enter a correct Gmail ID. A Gmail username has 6–30 letters, numbers or dots; it cannot start/end with a dot or contain double dots, underscores or hyphens.' }
    }
    return { error: null }
  }

  const validLocalPart = /^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*$/.test(localPart)
  if (!validLocalPart) return { error: 'The part before @ is not correct. Please check your email ID.' }
  return { error: null }
}
const getEmailValidationError = (value: string) => {
  const result = validateEmailAddress(value)
  if (!result.error) return null
  return result.suggestion ? `${result.error} Did you mean ${result.suggestion}?` : result.error
}
const isValidEmail = (value: string) => validateEmailAddress(value).error === null
const loadAccounts = (): Account[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as Account[]).filter(a => a && (a.role === 'seeker' || a.role === 'recruiter') && a.name && a.mobile && a.email)
  } catch { return [] }
}
const loadStoredSession = (): { role: EntryRole; mobile: string } | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { role: EntryRole; mobile: string }
    if ((parsed.role !== 'seeker' && parsed.role !== 'recruiter') || !isValidMobile(parsed.mobile)) return null
    return { role: parsed.role, mobile: normalizeMobile(parsed.mobile) }
  } catch { return null }
}
const loadSessionAccount = (): Account | null => {
  const session = loadStoredSession()
  if (!session) return null
  const allAccounts = loadAccounts()
  const account = allAccounts.find(a => a.role === session.role && a.mobile === session.mobile) || null
  if (!account || !isValidEmail(account.email)) return null
  // Standing rule: a Recruiter account on this mobile blocks the Job Seeker session.
  if (account.role === 'seeker' && allAccounts.some(a => a.role === 'recruiter' && a.mobile === account.mobile)) return null
  return account
}
const getAccountDestination = (account: Account): AppPage => {
  if (account.role === 'recruiter') return 'recruiters'
  return isSeekerProfileComplete(account.profile) ? 'home' : 'profile'
}
const getInitialPage = (): AppPage => {
  const account = loadSessionAccount()
  return account ? getAccountDestination(account) : 'welcome'
}
const normalizeSeekerProfile = (profile?: Record<string, unknown> | null): SeekerProfile | undefined => {
  if (!profile || Object.keys(profile).length === 0) return undefined
  return { ...EMPTY_SEEKER_PROFILE, ...(profile as Partial<SeekerProfile>) }
}
const accountFromRemoteRow = (row: RemoteAccountRow): Account => {
  const profile = normalizeSeekerProfile(row.profile)
  return {
    role: row.role,
    name: row.name,
    mobile: normalizeMobile(row.mobile),
    email: row.email,
    createdAt: row.created_at || new Date().toISOString(),
    profile,
  }
}
const loadDeletionRequests = (): AccountDeletionRequest[] => {
  try {
    const raw = localStorage.getItem(DELETION_REQUESTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as AccountDeletionRequest[]).filter(r => r && r.id && r.mobile && r.reasonCategory && r.reasonDetails && (r.status === 'pending' || r.status === 'rejected'))
  } catch { return [] }
}

const loadSupportTickets = (): SupportTicket[] => {
  try {
    const raw = localStorage.getItem(SUPPORT_TICKETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as SupportTicket[]).filter(ticket => ticket && ticket.id && ticket.ticketNo && ticket.name && ticket.mobile && ticket.email && ticket.category && ticket.subject && ticket.details && ['open', 'in-progress', 'resolved', 'closed'].includes(ticket.status)).map(ticket => ({
      ...ticket,
      role: ticket.role === 'seeker' || ticket.role === 'recruiter' || ticket.role === 'admin' ? ticket.role : 'guest',
      source: ticket.source === 'support' ? 'support' : 'ai',
      updatedAt: ticket.updatedAt || ticket.createdAt,
    }))
  } catch { return [] }
}

// AD COMPONENTS
function BannerAd({ label = 'Advertisement', className = '' }: { label?: string, className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
      <div className="absolute left-2 top-2 z-10 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-900">AD</div>
      <div className="flex items-center gap-4 p-3 sm:p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <Megaphone className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-slate-900">Boost Your MR Career — Pharma Sales Mastery Course</p>
          <p className="truncate text-xs text-slate-500">Trusted by 12,000+ MRs • 4.8★ • Limited seats — Join now & get 40% OFF</p>
        </div>
        <a href="#pricing" className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black">Learn More</a>
      </div>
      <div className="flex items-center justify-between border-t bg-slate-50 px-3 py-1.5">
        <span className="text-[10px] font-semibold tracking-wide text-slate-400">Sponsored</span>
        <span className="text-[10px] text-slate-400">Advertisement</span>
      </div>
    </div>
  )
}
function NativeAd() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-widest">SPONSORED</span>
        <span className="text-[10px] text-slate-400">Sponsored</span>
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
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">Learn More</span>
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
  const [city, setCity] = useState('All Cities')
  const [hq, setHq] = useState('All HQs')
  const [company, setCompany] = useState('All Companies')
  const [role, setRole] = useState<typeof ROLES[number]>('All Roles')
  const [expFilter, setExpFilter] = useState<typeof EXP_OPTIONS[number]>('All Experience')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set(loadDailyJobAccess().revealed))
  const [dailyUnlocks, setDailyUnlocks] = useState(() => loadDailyJobAccess().dailyUnlocks)
  const [extraReveals, setExtraReveals] = useState<Record<string, ExtraJobReveals>>(() => loadDailyJobAccess().extraReveals)
  const [selected, setSelected] = useState<Job | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showRewarded, setShowRewarded] = useState<Job | null>(null)
  const [rewardAction, setRewardAction] = useState<SponsoredRevealAction>('contact')
  const [rewardProgress, setRewardProgress] = useState(0)
  const [applyAdJob, setApplyAdJob] = useState<Job | null>(null)
  const [applyAdProgress, setApplyAdProgress] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [page, setPage] = useState<AppPage>(() => getInitialPage())
  const [pageHistory, setPageHistory] = useState<AppPage[]>([])
  const [entryRole, setEntryRole] = useState<EntryRole | null>(() => loadSessionAccount()?.role ?? null)
  const [toast, setToast] = useState<string | null>(null)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>(() => getAiWelcomeMessages(loadSessionAccount()?.role))
  const [aiLoading, setAiLoading] = useState(false)
  // Jobs are now state (Admin can post/delete; saved on this device)
  const [jobs, setJobs] = useState<Job[]>(() => loadInitialJobs())
  useEffect(() => { try { localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(jobs)) } catch { /* ignore */ } }, [jobs])
  // Admin auth (M Divakar Reddy only)
  const [isAdmin, setIsAdmin] = useState(() => { try { return localStorage.getItem(ADMIN_AUTH_KEY) === '1' } catch { return false } })
  const [adminId, setAdminId] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminTab, setAdminTab] = useState<'overview' | 'post' | 'approvals' | 'accounts' | 'support' | 'manage' | 'settings'>('overview')
  const [newJob, setNewJob] = useState({ company: '', title: 'Medical Representative', division: '', state: 'Telangana', city: 'Hyderabad', area: '', type: 'Field MR' as Job['type'], exp: '0-2 yrs (Freshers can apply)', ctc: '', vacancies: '1', qual: 'B.Pharm / B.Sc / D.Pharm', desc: '', contactPerson: 'M Divakar Reddy', phone: '', email: '', urgent: false })
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' })
  // Recruiter-submitted vacancies — LIVE only after Admin approval
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>(() => {
    try { const raw = localStorage.getItem(PENDING_JOBS_KEY); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed as PendingJob[] } } catch { /* ignore */ }
    return []
  })
  useEffect(() => { try { localStorage.setItem(PENDING_JOBS_KEY, JSON.stringify(pendingJobs)) } catch { /* ignore */ } }, [pendingJobs])
  const [recruiterJob, setRecruiterJob] = useState({ company: '', title: 'Medical Representative', division: '', state: 'Telangana', city: 'Hyderabad', area: '', type: 'Field MR' as Job['type'], exp: '0-2 yrs (Freshers can apply)', ctc: '', vacancies: '1', qual: 'B.Pharm / B.Sc / D.Pharm', desc: '', contactPerson: '', phone: '', email: '', urgent: false })
  const [recruiterSubmitted, setRecruiterSubmitted] = useState(false)
  // User accounts (Job Seeker / Recruiter) — register once, then mobile-only login (no password)
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts())
  const [currentUser, setCurrentUser] = useState<Account | null>(() => loadSessionAccount())
  const [hasAuthenticated, setHasAuthenticated] = useState(() => Boolean(loadSessionAccount()))
  const [authStep, setAuthStep] = useState<'mobile' | 'register'>('mobile')
  const [authForm, setAuthForm] = useState({ name: '', mobile: '', email: '' })
  const [authError, setAuthError] = useState('')
  const [authEmailTouched, setAuthEmailTouched] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false)
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>(() => loadDeletionRequests())
  const [showDeletionRequestModal, setShowDeletionRequestModal] = useState(false)
  const [deletionRequestForm, setDeletionRequestForm] = useState({ category: '', details: '' })
  const [deletionRequestError, setDeletionRequestError] = useState('')
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy')
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => loadSupportTickets())
  const [showSupportTicketModal, setShowSupportTicketModal] = useState(false)
  const [supportTicketSource, setSupportTicketSource] = useState<SupportTicketSource>('ai')
  const [supportTicketForm, setSupportTicketForm] = useState({ name: '', mobile: '', email: '', category: '', subject: '', details: '' })
  const [supportTicketError, setSupportTicketError] = useState('')
  const [createdSupportTicket, setCreatedSupportTicket] = useState<SupportTicket | null>(null)
  const [seekerProfileForm, setSeekerProfileForm] = useState<SeekerProfile>(() => loadSessionAccount()?.profile ?? EMPTY_SEEKER_PROFILE)
  const [seekerProfileError, setSeekerProfileError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateRoleFilter, setCandidateRoleFilter] = useState('All Roles')
  const [candidateExperienceFilter, setCandidateExperienceFilter] = useState('All Candidates')
  const [candidateStateFilter, setCandidateStateFilter] = useState('All India')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfileView | null>(null)
  const [remoteCandidateProfiles, setRemoteCandidateProfiles] = useState<CandidateProfileView[]>([])
  const [requestedCandidates, setRequestedCandidates] = useState<Set<string>>(() => {
    try { const raw = localStorage.getItem(CANDIDATE_INTERESTS_KEY); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return new Set(parsed as string[]) } } catch { /* ignore */ }
    return new Set<string>()
  })
  useEffect(() => { try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)) } catch { /* ignore */ } }, [accounts])
  useEffect(() => { try { localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(deletionRequests)) } catch { /* ignore */ } }, [deletionRequests])
  useEffect(() => { try { localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(supportTickets)) } catch { /* ignore */ } }, [supportTickets])
  useEffect(() => { try { localStorage.setItem(CANDIDATE_INTERESTS_KEY, JSON.stringify(Array.from(requestedCandidates))) } catch { /* ignore */ } }, [requestedCandidates])
  useEffect(() => {
    try { localStorage.setItem(DAILY_JOB_ACCESS_KEY, JSON.stringify({ date: getTodayKey(), revealed: Array.from(revealed), dailyUnlocks, extraReveals })) } catch { /* ignore */ }
  }, [revealed, dailyUnlocks, extraReveals])
  useEffect(() => {
    if (currentUser?.role === 'seeker') setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
  }, [currentUser])
  useEffect(() => {
    if (currentUser?.role === 'recruiter') {
      setRecruiterJob(prev => ({ ...prev, contactPerson: currentUser.name, phone: `+91 ${currentUser.mobile}`, email: currentUser.email }))
    }
  }, [currentUser])
  const aiEndRef = useRef<HTMLDivElement>(null)
  const heroSearchRef = useRef<HTMLInputElement>(null)
  const secretTapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null })
  const remoteSessionRefreshRef = useRef(false)
  const authLookupMobileRef = useRef('')
  const rewardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const limitForTier: Record<Tier, number> = { free: FREE_DAILY_JOB_LIMIT, starter: 15, pro: 9999 }
  const isRecruiterUser = hasAuthenticated && currentUser?.role === 'recruiter'
  const shouldHideJobSeekerExperience = isRecruiterUser && !isAdmin
  const isAdFree = isAdmin || isRecruiterUser || tier !== 'free' // Admin/Recruiter/paid: no Job Seeker browsing or contact-reveal ads. Apply ad is Job Seeker-only.
  const isAdminLoginPage = page === 'admin' && !isAdmin
  // Welcome, Auth, both Admin states, and guest Legal are isolated screens.
  // They must not expose the normal Jobs/Home/Recruiter navigation shell.
  const isIsolatedShellPage = page === 'welcome' || page === 'auth' || page === 'admin' || (page === 'legal' && !hasAuthenticated && !isAdmin)
  const welcomeSelectedRole: EntryRole | null = entryRole

  // Cascading filters: City depends on State, HQ depends on State+City, Role independent but shown after HQ
  const availableCities = (() => {
    if (location === 'All India') return ['All Cities', ...Array.from(new Set(jobs.map(j => j.hq.split(' - ')[0].trim())))]
    const cities = Array.from(new Set(jobs.filter(j => j.state === location).map(j => j.hq.split(' - ')[0].trim())))
    return ['All Cities', ...cities]
  })()
  const availableHQs = (() => {
    let list = jobs
    if (location !== 'All India') list = list.filter(j => j.state === location)
    if (city !== 'All Cities') list = list.filter(j => j.hq.split(' - ')[0].trim() === city)
    const hqs = list.map(j => j.hq)
    return ['All HQs', ...Array.from(new Set(hqs))]
  })()
  const companyOptions = ['All Companies', ...Array.from(new Set(jobs.map(j => j.company)))]

  // Auto-reset downstream when upstream changes (cascading)
  useEffect(() => {
    if (!availableCities.includes(city)) setCity('All Cities')
  }, [location])
  useEffect(() => {
    if (!availableHQs.includes(hq)) setHq('All HQs')
  }, [location, city])

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

  const navigate = (p: typeof page, options: { fromBack?: boolean; resetHistory?: boolean } = {}) => {
    const jobSeekerOnlyPages: AppPage[] = ['home', 'jobs', 'pricing', 'saved', 'profile']
    let destination: AppPage = p
    let blockedToast: string | null = null

    if (shouldHideJobSeekerExperience && jobSeekerOnlyPages.includes(p)) {
      destination = 'recruiters'
      blockedToast = 'Recruiter view: job search, Apply Now and Job Seeker plans are hidden. Post a vacancy or open Candidates List.'
      setSelected(null)
      setShowPricing(false)
    } else if (p === 'candidates' && currentUser && currentUser.role === 'seeker' && !isAdmin) {
      destination = getAccountDestination(currentUser)
      blockedToast = 'Candidates List is only for Recruiters and Admin. Job Seeker accounts stay in the Job Seeker view.'
    }

    if (options.resetHistory) {
      setPageHistory([])
    } else if (!options.fromBack && destination !== page) {
      setPageHistory(prev => (prev[prev.length - 1] === page ? prev.slice(-30) : [...prev.slice(-30), page]))
    }

    setPage(destination)
    setShowMobileMenu(false)
    setShowAccountMenu(false)
    setSelectedCandidate(null)
    if (blockedToast) setToast(blockedToast)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---- ADMIN: M Divakar Reddy ----
  const storedAdminPassword = () => { try { return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN_PASSWORD } catch { return DEFAULT_ADMIN_PASSWORD } }
  const openAdmin = (tab: typeof adminTab = 'overview') => {
    setAdminTab(tab)
    setSelected(null)
    setSelectedCandidate(null)
    setShowPricing(false)
    setShowRewarded(null)
    setRewardProgress(0)
    setApplyAdJob(null)
    setApplyAdProgress(0)
    setShowSupportTicketModal(false)
    setShowDeletionRequestModal(false)
    setShowDeleteAccountConfirm(false)
    setShowAccountMenu(false)
    setShowMobileMenu(false)
    navigate('admin')
  }
  // SECRET: Admin Login opens only after tapping the logo or Divakar Reddy's photo 5 times quickly
  const handleSecretTap = (): boolean => {
    const s = secretTapRef.current
    s.count += 1
    if (s.timer) clearTimeout(s.timer)
    s.timer = setTimeout(() => { s.count = 0 }, 2500)
    if (s.count >= 5) {
      s.count = 0
      if (s.timer) clearTimeout(s.timer)
      openAdmin()
      setToast(isAdmin ? '👑 Admin Dashboard — M Divakar Reddy' : '🔐 Admin Login — only for M Divakar Reddy')
      return true
    }
    if (s.count === 3) setToast('2 more taps…')
    if (s.count === 4) setToast('1 more tap…')
    return false
  }
  const getSafeHomeDestination = (): typeof page => {
    if (isAdmin) return 'admin'
    if (hasAuthenticated && currentUser) return getAccountDestination(currentUser)
    return 'welcome'
  }
  const handleBrandLogoClick = () => {
    if (page === 'admin') {
      if (isAdmin) openAdmin('overview')
      else handleSecretTap()
      return
    }
    if (handleSecretTap()) return
    if (isAdmin) { openAdmin('overview'); return }
    navigate(getSafeHomeDestination())
  }
  const isBackDestinationAllowed = (destination: AppPage): boolean => {
    if (destination === page) return false
    if (destination === 'welcome' || destination === 'auth') return !hasAuthenticated && !isAdmin
    if (destination === 'admin') return isAdmin || !hasAuthenticated
    if (shouldHideJobSeekerExperience && ['home', 'jobs', 'pricing', 'saved', 'profile'].includes(destination)) return false
    if (destination === 'candidates') return isAdmin || (hasAuthenticated && currentUser?.role === 'recruiter')
    if (destination === 'profile') return isAdmin || currentUser?.role === 'seeker'
    return true
  }
  const getFallbackBackDestination = (): AppPage | null => {
    if (page === 'welcome' || page === 'admin') return null
    if (page === 'auth') return 'welcome'
    if (page === 'candidates' || page === 'postjob') return 'recruiters'
    if (page === 'saved' || page === 'pricing') return 'jobs'
    if (page === 'jobs') return 'home'
    if (page === 'profile') return currentUser?.role === 'seeker' && isSeekerProfileComplete(currentUser.profile) ? 'home' : 'jobs'
    if (page === 'legal') {
      if (isAdmin) return 'admin'
      if (hasAuthenticated && currentUser) return getAccountDestination(currentUser)
      return entryRole ? 'auth' : 'welcome'
    }
    if (page === 'ai') {
      if (isAdmin) return 'admin'
      if (hasAuthenticated && currentUser) return getAccountDestination(currentUser)
      return 'welcome'
    }
    if (page === 'recruiters') {
      if (isAdmin) return 'admin'
      if (hasAuthenticated && currentUser?.role === 'recruiter') return null
      if (hasAuthenticated && currentUser?.role === 'seeker') return 'home'
      return 'welcome'
    }
    if (page === 'home') {
      if (isAdmin) return 'admin'
      return hasAuthenticated ? null : 'welcome'
    }
    return null
  }
  const getBackDestination = (): AppPage | null => {
    for (let i = pageHistory.length - 1; i >= 0; i -= 1) {
      const destination = pageHistory[i]
      if (isBackDestinationAllowed(destination)) return destination
    }
    const fallback = getFallbackBackDestination()
    return fallback && isBackDestinationAllowed(fallback) ? fallback : null
  }
  const backDestination = getBackDestination()
  const canGoBack = Boolean(backDestination || (page === 'auth' && authStep === 'register') || (page === 'admin' && isAdmin && adminTab !== 'overview'))
  const handlePageBack = () => {
    if (showMobileMenu) { setShowMobileMenu(false); return }
    if (showAccountMenu) { setShowAccountMenu(false); return }
    if (selectedCandidate) { setSelectedCandidate(null); return }
    if (selected) { setSelected(null); return }
    if (page === 'auth' && authStep === 'register') {
      setAuthStep('mobile')
      setAuthError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (page === 'admin' && isAdmin && adminTab !== 'overview') {
      setAdminTab('overview')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const remainingHistory = [...pageHistory]
    let destination: AppPage | null = null
    while (remainingHistory.length > 0) {
      const candidate = remainingHistory.pop()
      if (candidate && isBackDestinationAllowed(candidate)) {
        destination = candidate
        break
      }
    }
    if (!destination) {
      const fallback = getFallbackBackDestination()
      destination = fallback && isBackDestinationAllowed(fallback) ? fallback : null
    }
    setPageHistory(remainingHistory)
    if (destination) navigate(destination, { fromBack: true })
  }
  const showGlobalPageBack = canGoBack && page !== 'welcome' && page !== 'auth' && page !== 'candidates' && !isAdminLoginPage
  const handleExitAdminLogin = () => {
    setAdminError('')
    setAdminPass('')
    setShowAdminPass(false)
    navigate(hasAuthenticated && currentUser ? getAccountDestination(currentUser) : entryRole ? 'auth' : 'welcome', { resetHistory: true })
  }
  const destinationForRole = (r: EntryRole): typeof page => r === 'recruiter' ? 'recruiters' : 'home'
  const writeAccounts = (nextAccounts: Account[]) => {
    setAccounts(nextAccounts)
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts)) } catch { /* ignore */ }
    return nextAccounts
  }
  const mergeAccountsForMobileState = (mobile: string, incoming: Account[]) => {
    setAccounts(prev => {
      const next = [...prev.filter(a => a.mobile !== mobile), ...incoming]
      try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }
  const fetchRemoteAccountsByMobile = async (mobile: string): Promise<Account[] | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('find_app_accounts_by_mobile', { p_mobile: mobile })
    if (error) throw error
    return ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow)
  }
  const fetchRemoteCandidateProfiles = async () => {
    if (!supabase) return
    const { data, error } = await supabase.rpc('list_anonymous_candidate_profiles')
    if (error) throw error
    const mapped = ((data ?? []) as RemoteCandidateRow[]).map(row => ({
      id: `supabase-${row.candidate_id}`,
      code: row.candidate_code,
      source: 'registered' as const,
      profile: normalizeSeekerProfile(row.profile) ?? EMPTY_SEEKER_PROFILE,
    }))
    setRemoteCandidateProfiles(mapped)
  }
  const deleteRemoteAccount = async (role: EntryRole, mobile: string) => {
    if (!supabase) return
    const { error } = await supabase.rpc('delete_app_account', { p_role: role, p_mobile: mobile })
    if (error) throw error
  }
  const completeUserAuth = (account: Account, isNewAccount: boolean) => {
    setSelected(null)
    setShowPricing(false)
    setShowRewarded(null)
    setApplyAdJob(null)
    setApplyAdProgress(0)
    setRewardProgress(0)
    setAiMessages(getAiWelcomeMessages(account.role))
    setCurrentUser(account)
    setHasAuthenticated(true)
    setEntryRole(account.role)
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ role: account.role, mobile: account.mobile })) } catch { /* ignore */ }
    setAuthError('')
    setAuthStep('mobile')
    if (account.role === 'seeker' && !isSeekerProfileComplete(account.profile)) {
      setSeekerProfileForm(account.profile ?? EMPTY_SEEKER_PROFILE)
      setSeekerProfileError('')
      setToast(isNewAccount ? `Account created ✅ Welcome, ${account.name}! Complete your required job profile to apply.` : `Welcome back, ${account.name}! Please complete your required job profile to apply.`)
      navigate('profile', { resetHistory: true })
      return
    }
    setToast(isNewAccount ? `Account created ✅ Welcome, ${account.name}!` : `Welcome back, ${account.name}! You will stay logged in until you logout ✅`)
    navigate(destinationForRole(account.role), { resetHistory: true })
  }
  const enterAs = (r: EntryRole) => {
    setEntryRole(r)
    const existingForRole = currentUser?.role === r ? currentUser : (currentUser ? accounts.find(a => a.role === r && a.mobile === currentUser.mobile) : undefined)
    const blockedByRecruiter = r === 'seeker' && existingForRole ? accounts.some(a => a.role === 'recruiter' && a.mobile === existingForRole.mobile) : false
    if (hasAuthenticated && existingForRole && !blockedByRecruiter) { completeUserAuth(existingForRole, false); return }
    setAuthStep('mobile')
    setAuthError('')
    setAuthEmailTouched(false)
    if (existingForRole) {
      setAuthForm(prev => ({ name: prev.name || existingForRole.name, mobile: existingForRole.mobile, email: prev.email || existingForRole.email }))
    } else if (currentUser && currentUser.role !== r) {
      setAuthForm(prev => ({ name: prev.name || currentUser.name, mobile: currentUser.mobile, email: prev.email || currentUser.email }))
    }
    navigate('auth')
  }
  const handleWelcomeRoleSelect = (r: EntryRole) => {
    // Welcome is a two-step flow: tap a role to select it and reveal its
    // Login / Register button; tap the selected role again to unselect it.
    setEntryRole(prev => (prev === r ? null : r))
    setAuthStep('mobile')
    setAuthError('')
    setAuthEmailTouched(false)
  }
  const handleMobileContinue = async () => {
    if (authLoading) return
    const selectedRole = entryRole ?? 'seeker'
    const mobile = normalizeMobile(authForm.mobile)
    if (!isValidMobile(mobile)) { setAuthError('Enter a correct 10-digit Indian mobile number (starting with 6, 7, 8 or 9).'); return }
    setAuthLoading(true)
    setAuthError('')
    try {
      let availableAccounts = accounts
      const remoteAccounts = await fetchRemoteAccountsByMobile(mobile)
      if (remoteAccounts) {
        availableAccounts = [...accounts.filter(a => a.mobile !== mobile), ...remoteAccounts]
        writeAccounts(availableAccounts)
      }
      if (selectedRole === 'seeker') {
        const recruiterAccount = availableAccounts.find(a => a.role === 'recruiter' && a.mobile === mobile)
        if (recruiterAccount) { setAuthError(`This mobile is registered as a Recruiter account (${recruiterAccount.name}). Job Seeker login is blocked. Login as Recruiter and delete that account first.`); return }
      }
      const existing = availableAccounts.find(a => a.role === selectedRole && a.mobile === mobile)
      if (existing) {
        const existingEmailValidation = validateEmailAddress(existing.email)
        if (!existingEmailValidation.error) { completeUserAuth(existing, false); return }
        setAuthForm({ name: existing.name, mobile, email: existingEmailValidation.suggestion ?? existing.email })
        setAuthEmailTouched(true)
        setAuthStep('register')
        setAuthError(`Your saved email ID (${existing.email}) is not correct. ${existingEmailValidation.error} Please correct it to continue.`)
        setToast('Please correct your email ID to continue.')
        return
      }
      const otherRoleAccount = availableAccounts.find(a => a.mobile === mobile)
      setAuthForm(prev => ({ name: prev.name || otherRoleAccount?.name || '', mobile, email: prev.email || otherRoleAccount?.email || '' }))
      setAuthEmailTouched(false)
      setAuthStep('register')
      setToast(otherRoleAccount ? 'Mobile found — create your account for this role to continue.' : 'New account — please enter your name and correct email ID.')
    } catch {
      setAuthError('Unable to check your account right now. Please check your internet connection and try again.')
    } finally {
      setAuthLoading(false)
    }
  }
  const handleRegister = async () => {
    if (authLoading) return
    const selectedRole = entryRole ?? 'seeker'
    const mobile = normalizeMobile(authForm.mobile)
    const name = authForm.name.trim().replace(/\s+/g, ' ')
    const email = authForm.email.trim().toLowerCase()
    if (!isValidMobile(mobile)) { setAuthError('Enter a correct 10-digit Indian mobile number.'); return }
    if (name.length < 3) { setAuthError('Enter your full name (minimum 3 letters).'); return }
    const emailError = getEmailValidationError(email)
    if (emailError) { setAuthEmailTouched(true); setAuthError(emailError); return }
    setAuthLoading(true)
    setAuthError('')
    try {
      let availableAccounts = accounts
      const remoteAccounts = await fetchRemoteAccountsByMobile(mobile)
      if (remoteAccounts) {
        availableAccounts = [...accounts.filter(a => a.mobile !== mobile), ...remoteAccounts]
        writeAccounts(availableAccounts)
      }
      if (selectedRole === 'seeker') {
        const recruiterAccount = availableAccounts.find(a => a.role === 'recruiter' && a.mobile === mobile)
        if (recruiterAccount) { setAuthError(`This mobile is registered as a Recruiter account (${recruiterAccount.name}). Job Seeker registration is blocked until that Recruiter account is deleted.`); return }
      }
      const existing = availableAccounts.find(a => a.role === selectedRole && a.mobile === mobile)
      if (existing) {
        if (isValidEmail(existing.email)) { completeUserAuth(existing, false); return }
        let correctedAccount: Account = { ...existing, name, email }
        if (supabase) {
          const { data, error } = await supabase.rpc('update_app_account_email', {
            p_role: selectedRole,
            p_name: name,
            p_mobile: mobile,
            p_email: email,
          })
          if (error) throw error
          const updated = ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === selectedRole && a.mobile === mobile)
          if (!updated) throw new Error('Corrected account was not returned')
          correctedAccount = updated
        }
        const correctedAccounts = availableAccounts.map(a => a.role === selectedRole && a.mobile === mobile ? correctedAccount : a)
        writeAccounts(correctedAccounts)
        completeUserAuth(correctedAccount, false)
        return
      }

      let account: Account
      if (supabase) {
        const { data, error } = await supabase.rpc('register_app_account', {
          p_role: selectedRole,
          p_name: name,
          p_mobile: mobile,
          p_email: email,
        })
        if (error) throw error
        const created = ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === selectedRole && a.mobile === mobile)
        if (!created) throw new Error('Account was not returned')
        account = created
      } else {
        account = { role: selectedRole, name, mobile, email, createdAt: new Date().toISOString() }
      }
      const updatedAccounts = [...availableAccounts.filter(a => !(a.role === selectedRole && a.mobile === mobile)), account]
      writeAccounts(updatedAccounts)
      completeUserAuth(account, true)
    } catch {
      setAuthError('Unable to create your account right now. Please check your internet connection and try again.')
    } finally {
      setAuthLoading(false)
    }
  }
  const openSeekerProfile = () => {
    if (!currentUser || currentUser.role !== 'seeker') return
    setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
    setSeekerProfileError('')
    setShowMobileMenu(false)
    setShowAccountMenu(false)
    navigate('profile')
  }
  const updateSeekerProfileField = (field: keyof SeekerProfile, value: string) => {
    setSeekerProfileForm(prev => {
      const next = { ...prev, [field]: value } as SeekerProfile
      if (field === 'experienceType' && value === 'fresher' && (next.desiredRole === 'ASM' || next.desiredRole === 'RSM')) next.desiredRole = 'Trainee MR'
      return next
    })
    setSeekerProfileError('')
  }
  const requireCompletedSeekerProfile = () => {
    if (isAdmin) return true
    if (currentUser?.role === 'seeker' && !isSeekerProfileComplete(currentUser.profile)) {
      setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
      setSeekerProfileError('')
      setToast('Complete your required Job Seeker profile before applying or revealing recruiter contacts.')
      navigate('profile')
      return false
    }
    return true
  }
  const blockRecruiterJobSearch = () => {
    if (!shouldHideJobSeekerExperience) return false
    setSelected(null)
    setShowPricing(false)
    setShowRewarded(null)
    setApplyAdJob(null)
    setApplyAdProgress(0)
    setToast('You are logged in as a Recruiter. Job search, Apply Now, saved jobs and Job Seeker plans are not for Recruiter accounts.')
    navigate('recruiters')
    return true
  }
  const handleSaveSeekerProfile = async () => {
    if (!currentUser || currentUser.role !== 'seeker' || profileSaving) return
    const clean = (value: string) => value.trim().replace(/\s+/g, ' ')
    const profile: SeekerProfile = {
      ...seekerProfileForm,
      desiredRole: clean(seekerProfileForm.desiredRole),
      qualification: clean(seekerProfileForm.qualification),
      passingYear: clean(seekerProfileForm.passingYear),
      totalExperience: clean(seekerProfileForm.totalExperience),
      currentCompany: clean(seekerProfileForm.currentCompany),
      currentRole: clean(seekerProfileForm.currentRole),
      currentPackage: clean(seekerProfileForm.currentPackage),
      expectedPackage: clean(seekerProfileForm.expectedPackage),
      state: clean(seekerProfileForm.state),
      city: clean(seekerProfileForm.city),
      currentHq: clean(seekerProfileForm.currentHq),
      preferredHq: clean(seekerProfileForm.preferredHq),
      noticePeriod: clean(seekerProfileForm.noticePeriod),
      twoWheeler: clean(seekerProfileForm.twoWheeler),
      skills: clean(seekerProfileForm.skills),
      updatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    }
    if (!profile.qualification) { setSeekerProfileError('Please select your qualification.'); return }
    if (!profile.desiredRole) { setSeekerProfileError('Please select the role you are looking for.'); return }
    if (profile.experienceType === 'fresher') {
      const year = Number(profile.passingYear)
      if (!/^\d{4}$/.test(profile.passingYear) || year < 1990 || year > 2026) { setSeekerProfileError('Freshers: please enter a correct passing year, for example 2025 or 2026.'); return }
      if (profile.desiredRole !== 'Trainee MR' && profile.desiredRole !== 'Field MR') { setSeekerProfileError('Freshers can apply for Trainee MR or Field MR roles. Senior MR, ASM, RSM, ZSM and NSM roles require experience.'); return }
      profile.totalExperience = 'Fresher (0 years)'
      profile.currentCompany = 'Fresher — No current company'
      profile.currentRole = 'Fresher'
      profile.currentPackage = 'Not applicable'
    } else {
      if (!profile.totalExperience) { setSeekerProfileError('Experienced candidates: please select your total pharma experience.'); return }
      if (profile.currentCompany.length < 2) { setSeekerProfileError('Experienced candidates: please enter your current company name.'); return }
      if (!profile.currentRole) { setSeekerProfileError('Experienced candidates: please select your current role.'); return }
      if (profile.currentPackage.length < 3) { setSeekerProfileError('Experienced candidates: please enter your current package, for example ₹4.5 LPA.'); return }
      profile.passingYear = ''
    }
    if (profile.expectedPackage.length < 3) { setSeekerProfileError('Please enter your expected package, for example ₹4.0 - 4.5 LPA.'); return }
    if (!profile.state) { setSeekerProfileError('Please select your current state.'); return }
    if (profile.city.length < 2) { setSeekerProfileError('Please enter your current city.'); return }
    if (profile.currentHq.length < 2) { setSeekerProfileError('Please enter your current HQ / work location.'); return }
    if (!profile.noticePeriod) { setSeekerProfileError('Please select your notice period / joining availability.'); return }
    if (!profile.twoWheeler) { setSeekerProfileError('Please confirm whether you have a two-wheeler.'); return }
    setProfileSaving(true)
    try {
      let updatedAccount: Account = { ...currentUser, profile }
      if (supabase) {
        const { data, error } = await supabase.rpc('update_seeker_profile', {
          p_mobile: currentUser.mobile,
          p_profile: profile,
        })
        if (error) throw error
        const remoteAccount = ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === 'seeker' && a.mobile === currentUser.mobile)
        if (!remoteAccount) throw new Error('Profile was not returned')
        updatedAccount = remoteAccount
      }
      const updatedAccounts = accounts.map(a => a.role === 'seeker' && a.mobile === currentUser.mobile ? updatedAccount : a)
      writeAccounts(updatedAccounts)
      setCurrentUser(updatedAccount)
      setSeekerProfileForm(updatedAccount.profile ?? profile)
      setSeekerProfileError('')
      if (supabase) void fetchRemoteCandidateProfiles().catch(() => undefined)
      setToast('Job Seeker profile saved ✅ You can now apply for jobs.')
      navigate('jobs')
    } catch {
      setSeekerProfileError('Unable to save your profile right now. Please check your internet connection and try again.')
    } finally {
      setProfileSaving(false)
    }
  }
  const handleRequestCandidateContact = (candidate: CandidateProfileView) => {
    if (!isAdmin && currentUser?.role !== 'recruiter') { setToast('Only registered Recruiters can request candidate contact through Admin.'); return }
    setRequestedCandidates(prev => new Set([...prev, candidate.id]))
    setToast(`Request sent to Admin Divakar Reddy for Candidate ${candidate.code}. Contact will be shared only after candidate consent.`)
  }
  const openLegal = (tab: LegalTab = 'privacy') => {
    setLegalTab(tab)
    navigate('legal')
  }
  const openCandidateProfiles = () => {
    setShowAccountMenu(false)
    setShowMobileMenu(false)
    setSelectedCandidate(null)
    navigate('candidates')
  }
  const buildSupportMailto = (ticket?: SupportTicket) => {
    const subject = ticket ? `PharmaSales Jobs Support Ticket ${ticket.ticketNo} — ${ticket.subject}` : 'PharmaSales Jobs Support Request'
    const body = ticket
      ? ['Hello PharmaSales Jobs Support,', '', `Ticket No: ${ticket.ticketNo}`, `Name: ${ticket.name}`, `Registered Mobile: +91 ${ticket.mobile}`, `Email: ${ticket.email}`, `Reason: ${ticket.category}`, `Subject: ${ticket.subject}`, '', 'Problem Details:', ticket.details, '', 'Please help me with this request.'].join('\n')
      : ['Hello PharmaSales Jobs Support,', '', 'Name:', 'Registered Mobile:', 'Reason:', 'Problem Details:', '', 'Please help me with this request.'].join('\n')
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  const buildAdminReplyMailto = (ticket: SupportTicket) => {
    const subject = `Update on your PharmaSales Jobs support ticket ${ticket.ticketNo}`
    const body = [`Hi ${ticket.name},`, '', `This is regarding your support ticket ${ticket.ticketNo} (${ticket.category}).`, '', 'Regards,', 'M Divakar Reddy', 'App Founder — PharmaSales Jobs'].join('\n')
    return `mailto:${ticket.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  const openSupportTicket = (source: SupportTicketSource = 'ai') => {
    setSupportTicketSource(source)
    setCreatedSupportTicket(null)
    setSupportTicketError('')
    setSupportTicketForm(prev => ({
      ...prev,
      name: currentUser?.name ?? prev.name,
      mobile: currentUser?.mobile ?? prev.mobile,
      email: currentUser?.email ?? prev.email,
      subject: '',
      details: '',
    }))
    setShowMobileMenu(false)
    setShowSupportTicketModal(true)
  }
  const handleSubmitSupportTicket = () => {
    const name = supportTicketForm.name.trim().replace(/\s+/g, ' ')
    const mobile = normalizeMobile(supportTicketForm.mobile)
    const email = supportTicketForm.email.trim().toLowerCase()
    const category = supportTicketForm.category.trim()
    const subject = supportTicketForm.subject.trim().replace(/\s+/g, ' ')
    const details = supportTicketForm.details.trim().replace(/\s+/g, ' ')
    if (name.length < 3) { setSupportTicketError('Please enter your full name.'); return }
    if (!isValidMobile(mobile)) { setSupportTicketError('Please enter a correct 10-digit mobile number.'); return }
    const emailError = getEmailValidationError(email)
    if (emailError) { setSupportTicketError(emailError); return }
    if (!category) { setSupportTicketError('Please select a proper reason for raising this support ticket.'); return }
    if (subject.length < 5) { setSupportTicketError('Please write a clear subject with at least 5 characters.'); return }
    if (details.length < 20) { setSupportTicketError('Please explain your issue with a proper reason in at least 20 characters so Admin can understand it clearly.'); return }
    if (details.length > 1000) { setSupportTicketError('Please keep the issue details within 1000 characters.'); return }
    const now = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    const ticket: SupportTicket = {
      id: `support-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ticketNo: `MR-SUP-2026-${String(Date.now()).slice(-6)}`,
      name,
      mobile,
      email,
      role: isAdmin ? 'admin' : currentUser?.role ?? 'guest',
      category,
      subject,
      details,
      status: 'open',
      source: supportTicketSource,
      createdAt: now,
      updatedAt: now,
    }
    setSupportTickets(prev => [ticket, ...prev])
    setCreatedSupportTicket(ticket)
    setSupportTicketError('')
    if (supportTicketSource === 'ai') {
      setAiMessages(prev => [...prev, { role: 'assistant', text: `✅ Your support ticket ${ticket.ticketNo} has been raised successfully.\n\nReason: ${ticket.category}\nSubject: ${ticket.subject}\nStatus: Open\n\nAdmin will review it. For urgent help, email ${SUPPORT_EMAIL} and mention your ticket number.` }])
    }
    setToast(`Support ticket ${ticket.ticketNo} raised successfully ✅`)
  }
  const handleSupportTicketStatus = (ticketId: string, status: SupportTicketStatus) => {
    const updatedAt = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    setSupportTickets(prev => prev.map(ticket => ticket.id === ticketId ? { ...ticket, status, updatedAt } : ticket))
    setToast('Support ticket status updated')
  }
  const handleUserLogout = () => {
    setShowAccountMenu(false)
    setSelectedCandidate(null)
    setSelected(null)
    setShowPricing(false)
    setShowRewarded(null)
    setApplyAdJob(null)
    setApplyAdProgress(0)
    setRewardProgress(0)
    setAiMessages(getAiWelcomeMessages())
    setCurrentUser(null)
    setHasAuthenticated(false)
    setEntryRole(null)
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    setAuthForm({ name: '', mobile: '', email: '' })
    setAuthStep('mobile')
    setAuthError('')
    setAuthEmailTouched(false)
    setShowMobileMenu(false)
    setToast('Logged out successfully')
    navigate('welcome', { resetHistory: true })
  }
  const handleDeleteRecruiterAccount = async () => {
    if (!currentUser || currentUser.role !== 'recruiter') return
    const deletedAccount = currentUser
    try {
      await deleteRemoteAccount('recruiter', deletedAccount.mobile)
    } catch {
      setToast('Unable to delete this Recruiter account right now. Please try again.')
      return
    }
    const updatedAccounts = accounts.filter(a => !(a.role === 'recruiter' && a.mobile === deletedAccount.mobile))
    writeAccounts(updatedAccounts)
    setPendingJobs(prev => prev.filter(job => normalizeMobile(job.phone) !== deletedAccount.mobile))
    setRecruiterJob(prev => ({ ...prev, contactPerson: '', phone: '', email: '' }))
    setRecruiterSubmitted(false)
    setCurrentUser(null)
    setHasAuthenticated(false)
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    setEntryRole(null)
    setAuthForm({ name: deletedAccount.name, mobile: deletedAccount.mobile, email: deletedAccount.email })
    setAuthStep('mobile')
    setAuthError('')
    setAuthEmailTouched(false)
    setShowDeleteAccountConfirm(false)
    setShowMobileMenu(false)
    setToast('Recruiter account deleted. This mobile can now be used as a Job Seeker.')
    navigate('welcome', { resetHistory: true })
  }
  const openDeletionRequest = () => {
    if (!currentUser || currentUser.role !== 'seeker') return
    setDeletionRequestError('')
    setShowMobileMenu(false)
    setShowAccountMenu(false)
    setShowDeletionRequestModal(true)
  }
  const handleSubmitDeletionRequest = () => {
    if (!currentUser || currentUser.role !== 'seeker') return
    const reasonCategory = deletionRequestForm.category.trim()
    const reasonDetails = deletionRequestForm.details.trim().replace(/\s+/g, ' ')
    if (!reasonCategory) { setDeletionRequestError('Please select a reason for deleting your Job Seeker account.'); return }
    if (reasonDetails.length < 20) { setDeletionRequestError('Please write a proper reason in at least 20 characters so Admin can understand and review it.'); return }
    if (reasonDetails.length > 500) { setDeletionRequestError('Please keep the reason within 500 characters.'); return }
    if (deletionRequests.some(r => r.mobile === currentUser.mobile && r.status === 'pending')) {
      setDeletionRequestError('Your previous deletion request is already pending with Admin.')
      return
    }
    const request: AccountDeletionRequest = {
      id: 'delete-request-' + Date.now(),
      name: currentUser.name,
      mobile: currentUser.mobile,
      email: currentUser.email,
      accountCreatedAt: currentUser.createdAt,
      reasonCategory,
      reasonDetails,
      status: 'pending',
      requestedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    }
    const updatedRequests = [request, ...deletionRequests.filter(r => !(r.mobile === currentUser.mobile && r.status === 'rejected'))]
    setDeletionRequests(updatedRequests)
    try { localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updatedRequests)) } catch { /* ignore */ }
    setDeletionRequestForm({ category: '', details: '' })
    setDeletionRequestError('')
    setShowDeletionRequestModal(false)
    setToast('Account deletion request submitted. Admin Divakar Reddy will review your reason.')
  }
  const handleWithdrawDeletionRequest = () => {
    if (!currentUser || currentUser.role !== 'seeker') return
    const updatedRequests = deletionRequests.filter(r => !(r.mobile === currentUser.mobile && r.status === 'pending'))
    setDeletionRequests(updatedRequests)
    try { localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updatedRequests)) } catch { /* ignore */ }
    setShowDeletionRequestModal(false)
    setToast('Your account deletion request has been withdrawn.')
  }
  const handleApproveDeletionRequest = async (request: AccountDeletionRequest) => {
    if (!isAdmin) return
    try {
      await deleteRemoteAccount('seeker', request.mobile)
    } catch {
      setToast('Unable to delete this Job Seeker account right now. Please try again.')
      return
    }
    const updatedAccounts = accounts.filter(a => !(a.role === 'seeker' && a.mobile === request.mobile))
    writeAccounts(updatedAccounts)
    if (supabase) void fetchRemoteCandidateProfiles().catch(() => undefined)
    const updatedRequests = deletionRequests.filter(r => r.id !== request.id)
    setDeletionRequests(updatedRequests)
    try { localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updatedRequests)) } catch { /* ignore */ }
    if (currentUser?.role === 'seeker' && currentUser.mobile === request.mobile) {
      setCurrentUser(null)
      setHasAuthenticated(false)
      try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
      setSaved(new Set())
      setApplied(new Set())
      setRevealed(new Set())
      setDailyUnlocks(0)
      setTier('free')
      setShowDeletionRequestModal(false)
    }
    setToast(`Job Seeker account deleted for ${request.name}. Mobile +91 ${request.mobile} is now free.`)
  }
  const handleRejectDeletionRequest = (request: AccountDeletionRequest) => {
    if (!isAdmin) return
    const updatedRequests = deletionRequests.map(r => r.id === request.id ? {
      ...r,
      status: 'rejected' as const,
      reviewedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      adminNote: 'Admin did not find this reason sufficient. You may raise a new request with a proper, clear reason.',
    } : r)
    setDeletionRequests(updatedRequests)
    try { localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updatedRequests)) } catch { /* ignore */ }
    setToast(`Deletion request rejected for ${request.name}. The Job Seeker account remains active.`)
  }
  const handleAdminLogin = () => {
    const idOk = ADMIN_IDS.includes(adminId.trim().toLowerCase())
    if (idOk && adminPass === storedAdminPassword()) {
      setIsAdmin(true)
      setPageHistory([])
      try { localStorage.setItem(ADMIN_AUTH_KEY, '1') } catch { /* ignore */ }
      setAdminError(''); setAdminPass('')
      setToast('Welcome back, M Divakar Reddy! 👑 Admin dashboard unlocked')
    } else {
      setAdminError('Wrong Admin ID or Password. Admin ID is "divakar" — please try again.')
    }
  }
  const handleAdminLogout = () => {
    const destination = hasAuthenticated && currentUser ? getAccountDestination(currentUser) : entryRole ? 'auth' : 'welcome'
    setIsAdmin(false)
    try { localStorage.removeItem(ADMIN_AUTH_KEY) } catch { /* ignore */ }
    setAdminPass('')
    setAdminError('')
    setShowAdminPass(false)
    setSelected(null)
    setSelectedCandidate(null)
    setShowPricing(false)
    setShowRewarded(null)
    setRewardProgress(0)
    setApplyAdJob(null)
    setApplyAdProgress(0)
    setShowSupportTicketModal(false)
    setShowDeletionRequestModal(false)
    setShowDeleteAccountConfirm(false)
    setShowAccountMenu(false)
    setShowMobileMenu(false)
    setToast('Admin logged out. See you soon, Divakar Reddy!')
    navigate(destination, { resetHistory: true })
  }
  const handlePostJob = () => {
    if (!newJob.company.trim() || !newJob.ctc.trim() || !newJob.phone.trim()) { setToast('Please fill Company, CTC and Contact Phone to publish'); return }
    const contactEmailError = newJob.email.trim() ? getEmailValidationError(newJob.email) : null
    if (contactEmailError) { setToast(contactEmailError); return }
    const cityName = newJob.city.trim() || 'Hyderabad'
    const job: Job = {
      id: 'admin-' + Date.now(),
      company: newJob.company.trim(),
      color: '#0284c7',
      division: newJob.division.trim() || (newJob.company.trim() + ' — General Division'),
      title: newJob.title.trim() || 'Medical Representative',
      hq: newJob.area.trim() ? `${cityName} - ${newJob.area.trim()}` : cityName,
      state: newJob.state,
      exp: newJob.exp,
      ctc: newJob.ctc.trim(),
      vacancies: Math.max(1, parseInt(newJob.vacancies) || 1),
      qual: newJob.qual.trim() || 'B.Pharm / B.Sc',
      type: newJob.type,
      posted: 'Just now',
      verified: true,
      urgent: newJob.urgent,
      hot: true,
      desc: newJob.desc.trim() || `Urgent opening at ${newJob.company.trim()} for ${cityName} HQ. Verified personally by M Divakar Reddy. Immediate joiners preferred.`,
      contactPerson: newJob.contactPerson.trim() || 'M Divakar Reddy',
      phone: newJob.phone.trim(),
      email: newJob.email.trim() || 'hr@mrvacancieshub.in',
      skills: ['Doctor Calling', 'RCPA', 'Stockist Handling'],
      perks: ['TA/DA', 'Incentives', 'Mobile Allowance'],
    }
    setJobs(prev => [job, ...prev])
    setNewJob({ company: '', title: 'Medical Representative', division: '', state: 'Telangana', city: 'Hyderabad', area: '', type: 'Field MR', exp: '0-2 yrs (Freshers can apply)', ctc: '', vacancies: '1', qual: 'B.Pharm / B.Sc / D.Pharm', desc: '', contactPerson: 'M Divakar Reddy', phone: '', email: '', urgent: false })
    setToast(`Vacancy published! ${job.company} • ${job.hq} is now LIVE on Jobs page ✅`)
    setAdminTab('manage')
  }
  const handleDeleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id))
    setSaved(prev => { const n = new Set(prev); n.delete(id); return n })
    setToast('Vacancy deleted by Admin')
  }
  const handleResetJobs = () => {
    setJobs(JOBS)
    try { localStorage.removeItem(ADMIN_JOBS_KEY) } catch { /* ignore */ }
    setToast('Vacancies reset to the default 12 verified jobs')
  }
  const handleChangePassword = () => {
    if (passForm.current !== storedAdminPassword()) { setToast('Current password is wrong'); return }
    if (passForm.next.length < 6) { setToast('New password must be at least 6 characters'); return }
    if (passForm.next !== passForm.confirm) { setToast('New password and confirm password do not match'); return }
    try { localStorage.setItem(ADMIN_PASS_KEY, passForm.next) } catch { /* ignore */ }
    setPassForm({ current: '', next: '', confirm: '' })
    setToast('Admin password changed successfully 🔐 Use it from next login')
  }
  // ---- RECRUITER SUBMISSION -> ADMIN APPROVAL ----
  const handleRecruiterSubmit = () => {
    if (!recruiterJob.company.trim() || !recruiterJob.ctc.trim() || !recruiterJob.phone.trim() || !recruiterJob.contactPerson.trim()) { setToast('Please fill Company, CTC, Your Name and Mobile Number'); return }
    const contactEmailError = recruiterJob.email.trim() ? getEmailValidationError(recruiterJob.email) : null
    if (contactEmailError) { setToast(contactEmailError); return }
    const cityName = recruiterJob.city.trim() || 'Hyderabad'
    const pending: PendingJob = {
      id: 'pending-' + Date.now(),
      company: recruiterJob.company.trim(),
      color: '#0284c7',
      division: recruiterJob.division.trim() || (recruiterJob.company.trim() + ' — General Division'),
      title: recruiterJob.title.trim() || 'Medical Representative',
      hq: recruiterJob.area.trim() ? `${cityName} - ${recruiterJob.area.trim()}` : cityName,
      state: recruiterJob.state,
      exp: recruiterJob.exp,
      ctc: recruiterJob.ctc.trim(),
      vacancies: Math.max(1, parseInt(recruiterJob.vacancies) || 1),
      qual: recruiterJob.qual.trim() || 'B.Pharm / B.Sc',
      type: recruiterJob.type,
      posted: 'Pending approval',
      verified: false,
      urgent: recruiterJob.urgent,
      hot: false,
      desc: recruiterJob.desc.trim() || `Opening at ${recruiterJob.company.trim()} for ${cityName} HQ. Submitted by recruiter — under verification by M Divakar Reddy.`,
      contactPerson: recruiterJob.contactPerson.trim(),
      phone: recruiterJob.phone.trim(),
      email: recruiterJob.email.trim() || 'hr@mrvacancieshub.in',
      skills: ['Doctor Calling', 'RCPA', 'Stockist Handling'],
      perks: ['TA/DA', 'Incentives', 'Mobile Allowance'],
      submittedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      submittedBy: recruiterJob.contactPerson.trim(),
    }
    setPendingJobs(prev => [pending, ...prev])
    setRecruiterSubmitted(true)
    setToast('Vacancy submitted! It will go LIVE after Admin (Divakar Reddy) approval ✅')
  }
  const resetRecruiterForm = () => {
    setRecruiterJob({ company: '', title: 'Medical Representative', division: '', state: 'Telangana', city: 'Hyderabad', area: '', type: 'Field MR', exp: '0-2 yrs (Freshers can apply)', ctc: '', vacancies: '1', qual: 'B.Pharm / B.Sc / D.Pharm', desc: '', contactPerson: currentUser?.role === 'recruiter' ? currentUser.name : '', phone: currentUser?.role === 'recruiter' ? `+91 ${currentUser.mobile}` : '', email: currentUser?.role === 'recruiter' ? currentUser.email : '', urgent: false })
    setRecruiterSubmitted(false)
  }
  const handleApproveJob = (pend: PendingJob) => {
    const { submittedAt, submittedBy, ...rest } = pend
    const job: Job = { ...rest, id: 'job-' + Date.now(), posted: 'Just now', verified: true, hot: true }
    setJobs(prev => [job, ...prev])
    setPendingJobs(prev => prev.filter(x => x.id !== pend.id))
    setToast(`Approved & LIVE ✅ ${job.company} • ${job.hq} is now visible to all job seekers`)
  }
  const handleRejectJob = (id: string) => {
    setPendingJobs(prev => prev.filter(x => x.id !== id))
    setToast('Vacancy rejected by Admin — it will not go live')
  }
  useEffect(() => {
    if (page !== 'jobs') setShowFilters(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  useEffect(() => {
    if (!supabase || remoteSessionRefreshRef.current) return
    remoteSessionRefreshRef.current = true
    const storedSession = loadStoredSession()
    if (!storedSession) return
    let cancelled = false
    ;(async () => {
      try {
        const remoteAccounts = await fetchRemoteAccountsByMobile(storedSession.mobile)
        if (cancelled || !remoteAccounts) return
        mergeAccountsForMobileState(storedSession.mobile, remoteAccounts)
        const account = remoteAccounts.find(a => a.role === storedSession.role)
        const blockedByRecruiter = storedSession.role === 'seeker' && remoteAccounts.some(a => a.role === 'recruiter' && a.mobile === storedSession.mobile)
        if (!account || blockedByRecruiter || !isValidEmail(account.email)) {
          try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
          setCurrentUser(null)
          setHasAuthenticated(false)
          setEntryRole(storedSession.role)
          navigate('welcome', { resetHistory: true })
          return
        }
        setCurrentUser(account)
        setHasAuthenticated(true)
        setEntryRole(account.role)
        if (page === 'welcome') navigate(getAccountDestination(account), { resetHistory: true })
      } catch {
        // Keep the locally saved login when the device is offline.
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!supabase) return
    void fetchRemoteCandidateProfiles().catch(() => undefined)
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  // (AI scroll handled above with prevAiLenRef to avoid jump-to-bottom on refresh)

  const freeDailyUnlockedCount = jobs.slice(0, FREE_DAILY_JOB_LIMIT).filter(job => revealed.has(job.id)).length
  const freeDailyLimitComplete = freeDailyUnlockedCount >= FREE_DAILY_JOB_LIMIT
  const displayedDailyUnlocks = tier === 'free' ? freeDailyUnlockedCount : dailyUnlocks
  const getJobAccessKind = (job: Job): 'standard' | 'extra' | 'hidden' => {
    if (isAdmin || tier !== 'free') return 'standard'
    const index = jobs.findIndex(j => j.id === job.id)
    if (index >= 0 && index < FREE_DAILY_JOB_LIMIT) return 'standard'
    if (index >= FREE_DAILY_JOB_LIMIT && index < FREE_DAILY_JOB_LIMIT + FREE_EXTRA_JOB_LIMIT) {
      return freeDailyLimitComplete ? 'extra' : 'hidden'
    }
    return 'hidden'
  }
  const isExtraJob = (job: Job) => getJobAccessKind(job) === 'extra'
  const isCompanyVisible = (job: Job) => !isExtraJob(job) || revealed.has(job.id) || !!extraReveals[job.id]?.company
  const isManagerVisible = (job: Job) => revealed.has(job.id) || !!extraReveals[job.id]?.manager
  const isPhoneVisible = (job: Job) => revealed.has(job.id) || !!extraReveals[job.id]?.phone
  const isEmailVisible = (job: Job) => isPhoneVisible(job)
  const getDisplayCompany = (job: Job) => isCompanyVisible(job) ? job.company : 'Hidden Pharma Company'
  const getCompanyInitials = (job: Job) => isCompanyVisible(job) ? job.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const getSafeJobText = (job: Job, text: string) => {
    if (isCompanyVisible(job)) return text
    const firstToken = job.company.split(' ')[0] || ''
    const terms = Array.from(new Set([job.company, firstToken, firstToken.replace(/'s$/i, '')].filter(term => term.length >= 3))).sort((a, b) => b.length - a.length)
    return terms.reduce((safe, term) => safe.split(term).join('Verified pharma company'), text)
  }
  const getExtraRevealCount = (job: Job) => [isCompanyVisible(job), isManagerVisible(job), isPhoneVisible(job)].filter(Boolean).length
  const clearRewardTimer = () => {
    if (rewardTimerRef.current) {
      clearInterval(rewardTimerRef.current)
      rewardTimerRef.current = null
    }
  }
  const closeSponsoredReveal = (openPricing = false) => {
    clearRewardTimer()
    setShowRewarded(null)
    setRewardAction('contact')
    setRewardProgress(0)
    if (openPricing) setShowPricing(true)
  }
  const openSponsoredReveal = (job: Job, action: SponsoredRevealAction) => {
    clearRewardTimer()
    setRewardAction(action)
    setRewardProgress(0)
    setShowRewarded(job)
  }
  const startRewardedAd = () => {
    if (rewardTimerRef.current || rewardProgress > 0) return
    let progress = 0
    rewardTimerRef.current = setInterval(() => {
      progress += 1
      setRewardProgress(Math.min(progress, 100))
      if (progress >= 100) clearRewardTimer()
    }, 150)
  }
  const markExtraReveal = (job: Job, field: ExtraRevealField) => {
    setExtraReveals(prev => ({ ...prev, [job.id]: { ...(prev[job.id] ?? {}), [field]: true } }))
  }

  const attemptReveal = (job: Job) => {
    if (blockRecruiterJobSearch()) return
    if (!requireCompletedSeekerProfile()) return
    if (revealed.has(job.id)) return
    if (isExtraJob(job)) {
      setToast('Extra job: company, manager name and contact number unlock with separate sponsored ads.')
      return
    }
    if (getJobAccessKind(job) === 'hidden') {
      setToast('Complete today’s 3 Free unlocks to open the 7 extra jobs.')
      return
    }
    if (isAdmin) { setRevealed(prev => new Set([...prev, job.id])); setToast('👑 Admin access: contact revealed (no ad, no unlock used)'); return }
    if (tier === 'free') {
      if (freeDailyLimitComplete) {
        setToast('Today’s 3 Free full-contact unlocks are complete — 7 extra jobs are now open below.')
        return
      }
      openSponsoredReveal(job, 'contact')
      return
    }
    if (dailyUnlocks >= limitForTier[tier]) {
      setToast('Daily unlock limit reached for your plan. Upgrade for more.')
      setShowPricing(true)
      return
    }
    setRevealed(prev => new Set([...prev, job.id]))
    const nextUnlocks = dailyUnlocks + 1
    setDailyUnlocks(nextUnlocks)
    setToast(`Contact revealed! ${limitForTier[tier] === 9999 ? 'Unlimited unlocks' : `${limitForTier[tier] - nextUnlocks} unlocks left today`}.`)
  }

  const attemptExtraReveal = (job: Job, field: ExtraRevealField) => {
    if (blockRecruiterJobSearch()) return
    if (!requireCompletedSeekerProfile()) return
    if (field === 'company' && isCompanyVisible(job)) return
    if (field === 'manager' && isManagerVisible(job)) return
    if (field === 'phone' && isPhoneVisible(job)) return
    if (isAdmin || tier !== 'free') {
      markExtraReveal(job, field)
      setToast(field === 'company' ? 'Company name revealed.' : field === 'manager' ? 'Manager name revealed.' : 'Contact number revealed.')
      return
    }
    if (getJobAccessKind(job) === 'hidden') {
      setToast('Complete today’s 3 Free unlocks to open the 7 extra jobs.')
      return
    }
    openSponsoredReveal(job, field)
  }

  const handleRewardedComplete = () => {
    if (!showRewarded) return
    clearRewardTimer()
    const job = showRewarded
    if (rewardAction === 'contact') {
      setRevealed(prev => new Set([...prev, job.id]))
      const nextUnlocks = dailyUnlocks + 1
      const nextFreeDailyUnlockedCount = Math.min(FREE_DAILY_JOB_LIMIT, freeDailyUnlockedCount + 1)
      setDailyUnlocks(nextUnlocks)
      setToast(nextFreeDailyUnlockedCount >= FREE_DAILY_JOB_LIMIT
        ? 'Contact unlocked 🎉 Today’s 3 Free unlocks are complete — 7 extra jobs are now open!'
        : `Contact unlocked 🎉 ${FREE_DAILY_JOB_LIMIT - nextFreeDailyUnlockedCount} Free full-contact unlock${FREE_DAILY_JOB_LIMIT - nextFreeDailyUnlockedCount === 1 ? '' : 's'} left today.`)
    } else {
      markExtraReveal(job, rewardAction)
      setToast(rewardAction === 'company'
        ? `Company revealed: ${job.company}`
        : rewardAction === 'manager'
          ? 'Manager name revealed.'
          : 'Contact number and email revealed.')
    }
    setShowRewarded(null)
    setRewardAction('contact')
    setRewardProgress(0)
  }

  const finishApply = (job: Job) => {
    setApplied(prev => new Set([...prev, job.id]))
    setToast(`Applied successfully ✅ ${isCompanyVisible(job) ? job.company : `${job.title} • ${job.hq}`} — recruiter will contact you within 24h.`)
  }

  useEffect(() => {
    if (!applyAdJob) return
    if (shouldHideJobSeekerExperience) { setApplyAdJob(null); setApplyAdProgress(0); return }
    let progress = 0
    setApplyAdProgress(0)
    const id = setInterval(() => {
      progress += 1
      setApplyAdProgress(Math.min(progress, 100))
      if (progress >= 100) {
        clearInterval(id)
        const job = applyAdJob
        setApplyAdJob(null)
        setApplyAdProgress(0)
        finishApply(job)
      }
    }, 150)
    return () => clearInterval(id)
  }, [applyAdJob])

  const handleApply = (job: Job) => {
    if (blockRecruiterJobSearch()) return
    if (!requireCompletedSeekerProfile()) return
    if (applied.has(job.id)) { setToast('You have already applied to this vacancy ✅'); return }
    if (applyAdJob) return
    if (getJobAccessKind(job) === 'hidden') {
      setToast('This job opens after today’s Free access step is complete.')
      return
    }
    if (isAdmin) { finishApply(job); return }
    // New rule: Apply Now plays one sponsored ad for Free, Starter and Pro users.
    setApplyAdProgress(0)
    setApplyAdJob(job)
  }

  const toggleSave = (id: string) => {
    if (blockRecruiterJobSearch()) return
    setSaved(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id); setToast('Removed from saved') } else { n.add(id); setToast('Saved to wishlist 🔖') }
      return n
    })
  }

  const filtered = jobs.filter(j => {
    const searchableText = `${isCompanyVisible(j) ? j.company : ''} ${j.title} ${j.hq} ${getSafeJobText(j, j.division)}`.toLowerCase()
    if (search && !searchableText.includes(search.toLowerCase())) return false
    if (location !== 'All India' && j.state !== location) return false
    const jCity = j.hq.split(' - ')[0].trim()
    if (city !== 'All Cities' && jCity !== city) return false
    if (hq !== 'All HQs' && j.hq !== hq) return false
    if (company !== 'All Companies' && j.company !== company) return false
    if (role !== 'All Roles' && j.type !== role) return false
    if (expFilter !== 'All Experience' && getExpBucket(j.exp) !== expFilter) return false
    if (verifiedOnly && !j.verified) return false
    return true
  })

  const visibleFiltered = filtered.filter(job => {
    if (getJobAccessKind(job) === 'hidden') return false
    // A selected company filter must not indirectly reveal a locked extra-job company.
    if (company !== 'All Companies' && isExtraJob(job) && !isCompanyVisible(job)) return false
    return true
  })
  const hiddenFilteredCount = filtered.length - visibleFiltered.length

  const sendAi = async () => {
    if (!aiInput.trim() || aiLoading) return
    const prompt = aiInput.trim()
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', text: prompt }])
    const lowerPrompt = prompt.toLowerCase()
    if (lowerPrompt.includes('raise support ticket') || lowerPrompt.includes('raise a ticket') || lowerPrompt.includes('support ticket') || lowerPrompt.includes('raise ticket')) {
      setAiMessages(prev => [...prev, { role: 'assistant', text: 'Sure — I am opening the support ticket form. Please select a proper reason and explain the issue clearly with your registered mobile number so Admin can help quickly.' }])
      openSupportTicket('ai')
      return
    }
    if (lowerPrompt.includes('contact support') || lowerPrompt.includes('support email') || lowerPrompt === 'support') {
      setAiMessages(prev => [...prev, { role: 'assistant', text: `You can contact PharmaSales Jobs Support at ${SUPPORT_EMAIL}. For faster tracking, tap “Raise Support Ticket” below and give a proper reason. I am opening the ticket form for you.` }])
      openSupportTicket('ai')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, audience: shouldHideJobSeekerExperience ? 'recruiter' : isAdmin ? 'admin' : currentUser?.role ?? 'guest', history: aiMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })).slice(-6) }) })
      const data = await res.json()
      setAiMessages(prev => [...prev, { role: 'assistant', text: data.text || 'No response' }])
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', text: shouldHideJobSeekerExperience ? 'I could not connect right now. Quick recruiter tip: mention HQ, experience, qualification, CTC and joining timeline clearly in your vacancy. Please try again in a moment.' : 'I could not connect right now. Quick tip: highlight your HQ, RCPA & achievements. Please try again in a moment.' }])
    } finally { setAiLoading(false) }
  }

  const normalizedAuthMobile = normalizeMobile(authForm.mobile)
  const authRecruiterBlockAccount = entryRole === 'seeker' ? accounts.find(a => a.role === 'recruiter' && a.mobile === normalizedAuthMobile) : undefined
  const authOtherRoleAccount = entryRole ? accounts.find(a => a.role !== entryRole && a.mobile === normalizedAuthMobile) : undefined
  const authExistingAccount = entryRole && !authRecruiterBlockAccount ? accounts.find(a => a.role === entryRole && a.mobile === normalizedAuthMobile) : undefined
  const authExistingEmailValidation = authExistingAccount ? validateEmailAddress(authExistingAccount.email) : null
  const authExistingEmailError = authExistingEmailValidation?.error ?? null
  const authEmailValidation = validateEmailAddress(authForm.email)
  const showAuthEmailError = authEmailTouched && Boolean(authEmailValidation.error)
  const showAuthEmailSuccess = authEmailTouched && Boolean(authForm.email.trim()) && !authEmailValidation.error
  const myDeletionRequest = currentUser?.role === 'seeker' ? deletionRequests.find(r => r.mobile === currentUser.mobile) : undefined
  const pendingDeletionRequests = deletionRequests.filter(r => r.status === 'pending')
  const rejectedDeletionRequests = deletionRequests.filter(r => r.status === 'rejected')
  const openSupportTickets = supportTickets.filter(ticket => ticket.status === 'open' || ticket.status === 'in-progress')
  const mySupportTickets = isAdmin ? supportTickets : currentUser ? supportTickets.filter(ticket => ticket.mobile === currentUser.mobile) : supportTickets.filter(ticket => ticket.role === 'guest')
  const localRegisteredCandidateProfiles: CandidateProfileView[] = accounts
    .filter(a => a.role === 'seeker' && isSeekerProfileComplete(a.profile))
    .map((a, index) => ({ id: `registered-${index}-${anonymousCandidateCode(a.mobile)}`, code: anonymousCandidateCode(a.mobile), source: 'registered' as const, profile: a.profile as SeekerProfile }))
  const registeredCandidateProfiles: CandidateProfileView[] = isSupabaseConfigured ? remoteCandidateProfiles : localRegisteredCandidateProfiles
  // Sample profiles help preview the directory before a backend is connected.
  // Once Supabase is configured, only real registered Job Seeker profiles are shown.
  const candidateProfiles: CandidateProfileView[] = isSupabaseConfigured ? registeredCandidateProfiles : [...registeredCandidateProfiles, ...SAMPLE_CANDIDATE_PROFILES]
  const candidateStates = ['All India', ...Array.from(new Set(candidateProfiles.map(c => c.profile.state).filter(Boolean)))]
  const filteredCandidateProfiles = candidateProfiles.filter(c => {
    const p = c.profile
    if (candidateRoleFilter !== 'All Roles' && p.desiredRole !== candidateRoleFilter) return false
    if (candidateExperienceFilter === 'Freshers' && p.experienceType !== 'fresher') return false
    if (candidateExperienceFilter === 'Experienced' && p.experienceType !== 'experienced') return false
    if (candidateStateFilter !== 'All India' && p.state !== candidateStateFilter) return false
    if (candidateSearch) {
      const hay = `${c.code} ${p.desiredRole} ${p.qualification} ${p.currentCompany} ${p.currentRole} ${p.currentHq} ${p.preferredHq} ${p.city} ${p.state} ${p.skills}`.toLowerCase()
      if (!hay.includes(candidateSearch.toLowerCase())) return false
    }
    return true
  })
  const canViewCandidateProfiles = isAdmin || (hasAuthenticated && currentUser?.role === 'recruiter')

  // When a full mobile is typed on the login screen, refresh that mobile's
  // account state from Supabase so existing-account/blocker messages are current.
  useEffect(() => {
    if (!supabase || page !== 'auth' || !isValidMobile(normalizedAuthMobile)) return
    if (authLookupMobileRef.current === normalizedAuthMobile) return
    authLookupMobileRef.current = normalizedAuthMobile
    let cancelled = false
    ;(async () => {
      try {
        const remoteAccounts = await fetchRemoteAccountsByMobile(normalizedAuthMobile)
        if (!cancelled && remoteAccounts) mergeAccountsForMobileState(normalizedAuthMobile, remoteAccounts)
      } catch {
        // The submit action will show a connection message if lookup still fails.
      }
    })()
    return () => { cancelled = true }
  }, [normalizedAuthMobile, page])

  // scroll to jobs
  const scrollToJobs = () => navigate('jobs')

  const renderCandidateListItem = (candidate: CandidateProfileView) => {
    const profile = candidate.profile
    const isFresher = profile.experienceType === 'fresher'
    const isSelected = selectedCandidate?.id === candidate.id
    return (
      <button key={candidate.id} type="button" onClick={() => setSelectedCandidate(candidate)} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-sky-50 active:bg-sky-100 ${isSelected ? 'bg-sky-50' : 'bg-white'}`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><User className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-extrabold text-slate-900">Candidate {candidate.code}</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${isFresher ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>{isFresher ? 'FRESHER' : 'EXPERIENCED'}</span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-extrabold text-sky-700">{candidate.source === 'registered' ? 'REGISTERED' : 'SAMPLE'}</span>
          </span>
          <span className="mt-1 block truncate text-xs font-bold text-slate-700">{profile.desiredRole ? getRoleLabel(profile.desiredRole) : 'Role not filled'} • {profile.qualification || 'Qualification not filled'}{isFresher && profile.passingYear ? ` • ${profile.passingYear}` : ''}</span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">{isFresher ? 'Fresher' : (profile.totalExperience || 'Experience not filled')} • {profile.currentHq || profile.city || 'HQ not filled'}{profile.state ? `, ${profile.state}` : ''}</span>
        </span>
        <span className="hidden shrink-0 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-extrabold text-white sm:block">View Details</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-sky-600" />
      </button>
    )
  }

  const renderAnonymousCandidateCard = (candidate: CandidateProfileView) => {
    const profile = candidate.profile
    const isFresher = profile.experienceType === 'fresher'
    const requested = requestedCandidates.has(candidate.id)
    const detailItems = [
      { label: 'Experience', value: isFresher ? 'Fresher (0 years)' : (profile.totalExperience || 'Not filled') },
      { label: 'Current Company', value: isFresher ? 'Fresher — No current company' : (profile.currentCompany || 'Not filled') },
      { label: 'Current Role', value: isFresher ? 'Fresher' : (profile.currentRole ? getRoleLabel(profile.currentRole) : 'Not filled') },
      { label: 'Current Package', value: isFresher ? 'Not applicable' : (profile.currentPackage || 'Not filled') },
      { label: 'Expected Package', value: profile.expectedPackage || 'Not filled' },
      { label: 'Qualification', value: profile.qualification ? (isFresher && profile.passingYear ? `${profile.qualification} • ${profile.passingYear}` : profile.qualification) : 'Not filled' },
      { label: 'Current HQ', value: profile.currentHq || 'Not filled' },
      { label: 'Preferred HQ', value: profile.preferredHq || profile.currentHq || 'Not filled' },
      { label: 'Notice / Joining', value: profile.noticePeriod || 'Not filled' },
      { label: 'Two-Wheeler', value: profile.twoWheeler || 'Not filled' },
    ]
    const skillList = profile.skills.split(',').map(v => v.trim()).filter(Boolean)
    return (
      <article key={candidate.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white"><User className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">Candidate {candidate.code}</p>
            <p className="truncate text-xs font-semibold text-slate-500">{profile.desiredRole ? getRoleLabel(profile.desiredRole) : 'Role not filled'} • {profile.city || 'City not filled'}{profile.state ? `, ${profile.state}` : ''}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isFresher ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>{isFresher ? 'FRESHER' : 'EXPERIENCED'}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold text-sky-700">{candidate.source === 'registered' ? 'REGISTERED JOB SEEKER' : 'SAMPLE PROFILE'}</span>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-600"><EyeOff className="h-3 w-3" /> Name • Mobile • Email hidden</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {detailItems.map(item => (
            <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-extrabold tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-0.5 break-words text-xs font-bold leading-snug text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
        {skillList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skillList.slice(0, 5).map(skill => <span key={skill} className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">{skill}</span>)}
          </div>
        )}
        {requested ? (
          <button disabled className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-bold text-white opacity-90"><Check className="h-4 w-4" /> Contact Requested via Admin</button>
        ) : (
          <button onClick={() => handleRequestCandidateContact(candidate)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800"><LockKeyhole className="h-4 w-4" /> Request Contact via Admin</button>
        )}
      </article>
    )
  }

  const supportTicketStatusLabel = (status: SupportTicketStatus) => status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)
  const renderSupportTicketSummary = (ticket: SupportTicket) => (
    <article key={ticket.id} className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-left">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">{ticket.ticketNo}</span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${ticket.status === 'open' ? 'bg-amber-100 text-amber-800' : ticket.status === 'in-progress' ? 'bg-sky-100 text-sky-800' : ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{supportTicketStatusLabel(ticket.status)}</span>
        <span className="ml-auto text-[10px] font-semibold text-slate-500">{ticket.createdAt}</span>
      </div>
      <p className="mt-2 text-[11px] font-extrabold uppercase tracking-wide text-sky-700">{ticket.category}</p>
      <p className="mt-0.5 text-sm font-extrabold leading-snug text-slate-900">{ticket.subject}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{ticket.details}</p>
      <a href={buildSupportMailto(ticket)} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-sky-700 shadow-sm hover:text-sky-900"><Mail className="h-3.5 w-3.5" /> Email this ticket to Support</a>
    </article>
  )

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-900">
      {/* Sponsored banner — hidden for ad-free plans */}
      {!isIsolatedShellPage && !isAdFree && (
      <div className="sticky top-0 z-40 border-b border-sky-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded bg-amber-400 px-2 py-1 font-bold tracking-widest">AD</span>
            <span className="hidden font-semibold text-slate-600 sm:inline">Mankind Pharma – Hiring MRs in 100+ HQs • Apply Now →</span>
            <span className="font-semibold text-slate-600 sm:hidden">Mankind • 100+ HQs Hiring →</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('pricing')} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">Skip Reveal Ads</button>
          </div>
        </div>
      </div>
      )}

      {/* NAVBAR */}
      {!isIsolatedShellPage && (
      <header className={`sticky ${isAdFree ? 'top-0' : 'top-[37px]'} z-30 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80`}>
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex h-[64px] items-center justify-between gap-4">
            <button onClick={handleBrandLogoClick} aria-label="PharmaSales Jobs — The MR to NSM Jobs Network" className="flex min-w-0 select-none items-center gap-1.5 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-1.5 py-1.5 text-left shadow-sm min-[380px]:gap-2 min-[380px]:px-2 sm:gap-2.5 sm:px-2.5">
              <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-8 w-8 shrink-0 rounded-full bg-white ring-1 ring-sky-100 object-cover shadow-md min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="whitespace-nowrap text-[16px] font-extrabold leading-none tracking-tight text-slate-900 min-[380px]:text-[17px] sm:text-[20px]">PharmaSales Jobs</p>
                  <span className="hidden rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white xl:inline-flex">VERIFIED</span>
                </div>
                <p className="mt-0.5 whitespace-nowrap text-[7.5px] font-semibold leading-none tracking-wide text-sky-700 min-[380px]:text-[8px] sm:text-[10px]">The MR to NSM Jobs Network</p>
              </div>
            </button>

            <nav className="hidden items-center gap-1 lg:flex">
              {!shouldHideJobSeekerExperience && (
                <>
                  <button onClick={() => navigate('home')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 ${page==='home'?'bg-slate-900 text-white hover:bg-slate-800':''}`}>Home</button>
                  <button onClick={() => navigate('jobs')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 ${page==='jobs'?'bg-slate-900 text-white hover:bg-slate-800':''}`}>Jobs <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${page==='jobs'?'bg-white text-slate-900':'bg-sky-100 text-sky-700'}`}>{jobs.length} New</span></button>
                  <button onClick={() => navigate('pricing')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 ${page==='pricing'?'bg-slate-900 text-white hover:bg-slate-800':''}`}>Subscription</button>
                </>
              )}
              <button onClick={() => navigate('recruiters')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 ${page==='recruiters'?'bg-slate-900 text-white hover:bg-slate-800':''}`}>For Recruiters</button>
              {hasAuthenticated && currentUser?.role === 'recruiter' && <button onClick={openCandidateProfiles} className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 xl:inline-flex ${page==='candidates'?'bg-slate-900 text-white hover:bg-slate-800':''}`}><Users className="h-4 w-4" /> Candidates List</button>}
              {shouldHideJobSeekerExperience && <button onClick={() => navigate('postjob')} className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 xl:inline-flex ${page==='postjob'?'bg-slate-900 text-white hover:bg-slate-800':''}`}><Plus className="h-4 w-4" /> Post Vacancy</button>}
              <button onClick={() => navigate('ai')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 ${page==='ai'?'bg-slate-900 text-white hover:bg-slate-800':''}`}>AI Assistant</button>
              <button onClick={() => openLegal('support')} className={`hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100 xl:block ${page==='legal'?'bg-slate-900 text-white hover:bg-slate-800':''}`}>Legal &amp; Support</button>
              {isAdmin && (
              <button onClick={() => openAdmin()} className="ml-1 flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">
                <LayoutDashboard className="h-4 w-4" /> Dashboard <span className="h-2 w-2 rounded-full bg-emerald-400" />{(pendingJobs.length + pendingDeletionRequests.length + openSupportTickets.length) > 0 && <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-900">{pendingJobs.length + pendingDeletionRequests.length + openSupportTickets.length} pending</span>}
              </button>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {shouldHideJobSeekerExperience ? (
                <div className="hidden items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 2xl:flex">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <span className="text-xs font-extrabold">Recruiter</span>
                  <span className="text-xs font-semibold text-sky-700">No plan needed</span>
                </div>
              ) : (
                <div className="hidden items-center gap-2 rounded-full border bg-slate-50 px-2 py-1 2xl:flex">
                  <span className={`h-2 w-2 rounded-full ${tier === 'free' ? 'bg-slate-400' : tier === 'starter' ? 'bg-sky-500' : 'bg-violet-500'}`} />
                  <span className="text-xs font-bold capitalize">{isAdmin ? '👑 Admin' : tier}</span>
                  <span className="text-xs text-slate-500">{isAdmin ? 'Unlimited access' : `${Math.min(displayedDailyUnlocks, limitForTier[tier])}/${limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]} unlocks`}</span>
                </div>
              )}
              {currentUser && hasAuthenticated && (
                <div className="relative hidden lg:block">
                  <button type="button" onClick={() => setShowAccountMenu(prev => !prev)} aria-expanded={showAccountMenu} title="My Account" className="flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 py-1 pl-1 pr-2 shadow-sm transition hover:bg-sky-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-extrabold text-white">{currentUser.name.trim().charAt(0).toUpperCase()}</span>
                    <span className="hidden min-w-0 max-w-[135px] text-left 2xl:block">
                      <span className="block truncate text-[11px] font-extrabold leading-tight">{currentUser.name}</span>
                      <span className="block truncate text-[10px] leading-tight text-slate-500">{currentUser.role === 'recruiter' ? 'Recruiter Account' : 'Job Seeker Account'}</span>
                    </span>
                    <span className="text-xs font-extrabold text-slate-700 2xl:hidden">Account</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${showAccountMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showAccountMenu && (
                    <>
                      <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => setShowAccountMenu(false)} className="fixed inset-0 z-40 cursor-default" />
                      <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[304px] overflow-hidden rounded-3xl border bg-white text-left shadow-2xl">
                        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-4 text-white">
                          <p className="text-[10px] font-extrabold tracking-widest text-sky-100">MY ACCOUNT</p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-sky-700 shadow">{currentUser.name.trim().charAt(0).toUpperCase()}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-extrabold">{currentUser.name}</p>
                              <p className="text-xs font-semibold text-sky-100">{currentUser.role === 'recruiter' ? 'Recruiter' : 'Job Seeker'} • +91 {currentUser.mobile}</p>
                              <p className="truncate text-[11px] text-sky-100/90">{currentUser.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 p-2">
                          {currentUser.role === 'seeker' ? (
                            <>
                              <button type="button" onClick={openSeekerProfile} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><User className="h-4 w-4 text-sky-600" /><span className="flex-1">{isSeekerProfileComplete(currentUser.profile) ? 'My Job Profile' : 'Complete Job Profile'}</span>{!isSeekerProfileComplete(currentUser.profile) && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">{seekerProfileProgress(currentUser.profile)}%</span>}</button>
                              <button type="button" onClick={() => navigate('saved')} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><Bookmark className="h-4 w-4 text-sky-600" /><span className="flex-1">Saved Vacancies</span>{saved.size > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">{saved.size}</span>}</button>
                              <button type="button" onClick={openDeletionRequest} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-amber-700 hover:bg-amber-50"><FileText className="h-4 w-4" /><span className="flex-1">{myDeletionRequest?.status === 'pending' ? 'Account Deletion Request Pending' : 'Request Account Deletion'}</span></button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={openCandidateProfiles} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><Users className="h-4 w-4 text-sky-600" /><span className="flex-1">Candidates List</span></button>
                              <button type="button" onClick={() => navigate('postjob')} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><Plus className="h-4 w-4 text-sky-600" /><span className="flex-1">Post Vacancy</span></button>
                              <button type="button" onClick={() => { setShowAccountMenu(false); setShowDeleteAccountConfirm(true) }} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /><span className="flex-1">Delete Recruiter Account</span></button>
                            </>
                          )}
                          <button type="button" onClick={() => navigate('ai')} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-violet-50"><MessageCircle className="h-4 w-4 text-violet-600" /><span className="flex-1">AI Chat &amp; Support Tickets</span></button>
                        </div>
                        <div className="border-t bg-slate-50 p-2">
                          <button type="button" onClick={handleUserLogout} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-white hover:text-red-600"><LogOut className="h-4 w-4" /> Logout</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={() => handleSecretTap()} title="M Divakar Reddy — Founder" className="relative shrink-0 select-none">
                <img src="/divakar-reddy-circle-100.jpg" alt="Admin — M Divakar Reddy" className="h-10 w-10 aspect-square rounded-full object-cover object-center border-2 border-sky-600 shadow" />
                {isAdmin && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
              </button>
              <button onClick={() => setShowMobileMenu(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </header>
      )}

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
              <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-4 text-white">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/25 bg-white/15 px-2.5 py-2 shadow-sm backdrop-blur min-[380px]:gap-3 min-[380px]:px-3">
                  <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-10 w-10 shrink-0 rounded-full bg-white ring-1 ring-sky-100 object-cover shadow min-[380px]:h-11 min-[380px]:w-11" />
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-extrabold leading-none min-[380px]:text-[17px]">PharmaSales Jobs</p>
                    <p className="mt-1 truncate text-[8.5px] font-semibold leading-none tracking-wide text-sky-50 min-[380px]:text-[9px]">The MR to NSM Jobs Network</p>
                  </div>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User tier/account card — account actions stay in the menu */}
              <div className="border-b bg-slate-50 px-4 py-3">
                <p className="mb-2 text-[10px] font-extrabold tracking-widest text-slate-400">{shouldHideJobSeekerExperience ? 'MY RECRUITER ACCOUNT' : 'MY ACCOUNT & PLAN'}</p>
                {shouldHideJobSeekerExperience ? (
                  <div className="flex items-center justify-between rounded-xl border border-sky-100 bg-white px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <span className="text-sm font-extrabold">Recruiter</span>
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">No plan needed</span>
                    </div>
                    <Building2 className="h-4 w-4 text-sky-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${tier === 'free' ? 'bg-slate-400' : tier === 'starter' ? 'bg-sky-500' : tier === 'pro' ? 'bg-violet-500' : 'bg-amber-500'}`} />
                      <span className="text-sm font-extrabold capitalize">{isAdmin ? '👑 Admin' : tier}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{isAdmin ? 'Unlimited access' : `${Math.min(displayedDailyUnlocks, limitForTier[tier])}/${limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]} unlocks`}</span>
                    </div>
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                )}
                {currentUser && hasAuthenticated && (
                  <div className="mt-2 rounded-xl border border-sky-100 bg-white px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-extrabold text-white">{currentUser.name.trim().charAt(0).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold leading-tight">{currentUser.name}</p>
                        <p className="text-[11px] font-bold text-sky-700">{currentUser.role === 'recruiter' ? 'Recruiter' : 'Job Seeker'} • +91 {currentUser.mobile}</p>
                        <p className="truncate text-[11px] text-slate-500">{currentUser.email}</p>
                      </div>
                    </div>
                    {currentUser.role === 'seeker' && (
                      <button onClick={openSeekerProfile} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-sky-600 py-2 text-[11px] font-extrabold text-white"><User className="h-3.5 w-3.5" /> {isSeekerProfileComplete(currentUser.profile) ? 'My Job Profile • Complete' : `Complete Job Profile • ${seekerProfileProgress(currentUser.profile)}%`}</button>
                    )}
                  </div>
                )}
              </div>

              {/* Nav */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-400">NAVIGATION</p>
                <div className="grid gap-2">
                  {[
                    { label: 'Home', sub: 'Overview & featured jobs', icon: Layers, page: 'home' as const },
                    { label: 'Browse Jobs', sub: `${jobs.length} verified jobs`, icon: Layers, page: 'jobs' as const },
                    { label: 'Subscription Plans', sub: 'Free → Starter ₹99 → Pro ₹499', icon: Crown, page: 'pricing' as const },
                    { label: 'For Recruiters', sub: 'Managed by M Divakar Reddy', icon: Building2, page: 'recruiters' as const },
                    { label: 'Candidates List', sub: 'Recruiter only • Tap candidate for details', icon: Users, page: 'candidates' as const },
                    { label: 'Post a Vacancy', sub: 'Recruiters • Live after Admin approval', icon: Plus, page: 'postjob' as const },
                    { label: 'AI Assistant', sub: shouldHideJobSeekerExperience ? 'Hiring help • Support tickets' : 'Resume • Interview • RCPA', icon: Sparkles, page: 'ai' as const },
                    { label: 'Legal & Support', sub: 'Privacy • Terms • Support ticket', icon: FileText, page: 'legal' as const },
                    { label: 'Admin Dashboard', sub: 'Only for M Divakar Reddy (Admin)', icon: LayoutDashboard, page: 'admin' as const },
                  ].filter(item => (isAdmin || item.page !== 'admin') && (canViewCandidateProfiles || item.page !== 'candidates') && (!shouldHideJobSeekerExperience || !['home', 'jobs', 'pricing'].includes(item.page))).map(item => (
                    <button
                      key={item.label}
                      onClick={() => item.page === 'admin' ? openAdmin() : navigate(item.page)}
                      className="flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-3 text-left hover:bg-slate-50 active:scale-[0.98] transition"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><item.icon className="h-5 w-5" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold leading-none">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.sub}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>

                {currentUser && hasAuthenticated && (
                  <>
                    <p className="mb-2 mt-5 text-[11px] font-bold tracking-widest text-slate-400">ACCOUNT ACTIONS</p>
                    <div className="grid gap-2">
                      {currentUser.role === 'seeker' ? (
                        <button type="button" onClick={openDeletionRequest} className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-left transition hover:bg-amber-100/70 active:scale-[0.98]">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm"><FileText className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold leading-tight text-amber-900">{myDeletionRequest?.status === 'pending' ? 'Deletion Request Pending' : myDeletionRequest?.status === 'rejected' ? 'Request Account Deletion Again' : 'Request Account Deletion'}</span>
                            <span className="block text-xs text-amber-700">Admin approval is required</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-amber-500" />
                        </button>
                      ) : (
                        <button type="button" onClick={() => { setShowMobileMenu(false); setShowDeleteAccountConfirm(true) }} className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-left transition hover:bg-red-100/70 active:scale-[0.98]">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm"><Trash2 className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold leading-tight text-red-700">Delete Recruiter Account</span>
                            <span className="block text-xs text-red-500">Permanently delete this account</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-red-400" />
                        </button>
                      )}
                      <button type="button" onClick={handleUserLogout} className="flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-3 text-left transition hover:bg-red-50 active:scale-[0.98]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><LogOut className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold leading-tight text-slate-700">Logout</span>
                          <span className="block text-xs text-slate-500">Sign out from this account</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    </div>
                  </>
                )}

                {shouldHideJobSeekerExperience ? (
                  <>
                    <div className="mt-5 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-extrabold"><Building2 className="h-4 w-4 text-sky-600" /> Recruiter Access</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">No subscription plan is needed for Recruiters. Post vacancies free for Admin approval and shortlist candidates from the Candidates List.</p>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <button onClick={() => navigate('postjob')} className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-extrabold text-white shadow hover:bg-sky-700">
                        <Plus className="h-4 w-4" /> Post a Vacancy
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-5 rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-extrabold"><Gift className="h-4 w-4 text-amber-600" /> Free unlock via Ad?</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">Free: 3 daily full-contact unlocks, then 7 extra jobs with separate company, manager and number ads. Apply Now plays a sponsored ad on every plan.</p>
                    </div>
                  </>
                )}

                <div className="mt-5 flex items-center justify-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-sky-600" /> M Divakar Reddy</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">© 2026 PharmaSales Jobs • Since 2026</span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 font-bold text-white text-[11px]">Verified Jobs</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global top-left back arrow: Auth, Candidates and Admin Login place
          the same icon-only control at the top-left of their own screens. */}
      {showGlobalPageBack && (
        <div className="mx-auto max-w-[1280px] px-4 pt-3">
          <button type="button" onClick={handlePageBack} aria-label="Go back" title="Go back" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95">
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {page === 'jobs' && currentUser?.role === 'seeker' && hasAuthenticated && !isSeekerProfileComplete(currentUser.profile) && (
        <div className="mx-auto max-w-[1280px] px-4 pt-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-900"><AlertTriangle className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-amber-900">Complete your required Job Seeker profile ({seekerProfileProgress(currentUser.profile)}%)</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">Freshers and experienced pharma professionals must fill role, experience, qualification, package and HQ details before applying.</p>
            </div>
            <button onClick={openSeekerProfile} className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"><User className="h-4 w-4" /> Complete Profile</button>
          </div>
        </div>
      )}

      {/* WELCOME / MAIN SCREEN — first screen when app opens */}
      {page === 'welcome' && (
        <section className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-sky-700 via-sky-600 to-indigo-800 px-4 py-10">
          <div className="w-full max-w-md">
            <div className="rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex w-full items-center gap-2.5 rounded-[22px] border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-2.5 text-left shadow-sm min-[420px]:gap-3 min-[420px]:p-3 sm:gap-4 sm:p-4">
                <button onClick={() => handleSecretTap()} aria-label="PharmaSales Jobs" className="block shrink-0 select-none transition active:scale-95">
                  <img src="/icon-192.png" alt="PharmaSales Jobs — The MR to NSM Jobs Network" className="h-14 w-14 rounded-full bg-white ring-1 ring-sky-100 object-cover shadow-lg min-[420px]:h-16 min-[420px]:w-16 sm:h-[72px] sm:w-[72px]" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="whitespace-nowrap text-[19px] font-extrabold leading-none tracking-tight text-slate-900 min-[420px]:text-[23px] sm:text-[28px]">PharmaSales Jobs</h1>
                  <p className="mt-1.5 whitespace-nowrap text-[9px] font-semibold leading-none tracking-wide text-sky-700 min-[420px]:text-[10px] sm:text-xs">The MR to NSM Jobs Network</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">VERIFIED</span>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-extrabold text-sky-700">SINCE 2026</span>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-sm font-extrabold">Continue as</p>
              {/* Two separate role choices. Tap to select and reveal Login /
                  Register; tap the selected role again to unselect it. */}
              <div className="mt-3 space-y-4" role="group" aria-label="Continue as">
                <button type="button" aria-pressed={welcomeSelectedRole === 'seeker'} onClick={() => handleWelcomeRoleSelect('seeker')} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-300 active:scale-[0.99] ${welcomeSelectedRole === 'seeker' ? 'border-sky-600 bg-sky-600 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50'}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${welcomeSelectedRole === 'seeker' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'}`}><User className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold leading-tight">I am Job seeker</span>
                    <span className={`mt-0.5 block text-[11px] font-extrabold uppercase tracking-wide transition-colors duration-300 ${welcomeSelectedRole === 'seeker' ? 'text-sky-50' : 'text-sky-700'}`}>MR, ASM, RSM, ZSM, NSM</span>
                  </span>
                  {welcomeSelectedRole === 'seeker' ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 shadow" aria-label="Selected"><Check className="h-4 w-4" /></span>
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>
                <button type="button" aria-pressed={welcomeSelectedRole === 'recruiter'} onClick={() => handleWelcomeRoleSelect('recruiter')} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-300 active:scale-[0.99] ${welcomeSelectedRole === 'recruiter' ? 'border-sky-600 bg-sky-600 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50'}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${welcomeSelectedRole === 'recruiter' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'}`}><Building2 className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold leading-tight">I am a Recruiter</span>
                    <span className={`mt-0.5 block text-[11px] font-extrabold tracking-wide transition-colors duration-300 ${welcomeSelectedRole === 'recruiter' ? 'text-sky-50' : 'text-amber-700'}`}>Hire MR to NSM Talent Faster</span>
                  </span>
                  {welcomeSelectedRole === 'recruiter' ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 shadow" aria-label="Selected"><Check className="h-4 w-4" /></span>
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Fixed-height slot: hiding Login/Register must not move the content below. */}
              <div className="mt-4 h-12 shrink-0">
                <AnimatePresence initial={false}>
                  {welcomeSelectedRole && (
                    <motion.button
                      key="welcome-login-register"
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      onClick={() => enterAs(welcomeSelectedRole)}
                      className="flex h-full w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-slate-800 active:scale-[0.99]"
                    >
                      <LogIn className="h-4 w-4 shrink-0" />
                      <span>{welcomeSelectedRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} Login / Register</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Clear separator and double gap: the Founder card stands alone. */}
              <div className="my-10 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 px-3 py-2.5 text-left shadow-sm">
                <button onClick={() => handleSecretTap()} aria-label="M Divakar Reddy — Founder" className="shrink-0 select-none transition active:scale-95">
                  <img src="/divakar-reddy-circle-200.jpg" alt="M Divakar Reddy — Founder" className="h-11 w-11 aspect-square rounded-full object-cover object-center border-2 border-white shadow" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[13px] font-extrabold leading-none"><span className="truncate">M Divakar Reddy</span> <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" /></p>
                  <p className="mt-1 truncate text-[10px] font-bold leading-none text-sky-700">Managed by • App Founder — PharmaSales Jobs</p>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-[1.2] text-slate-600">9+ Years Pharma Experience • Ex-Employee (Business Development Manager), Wallace Pharmaceuticals Pvt. Ltd.</p>
                </div>
              </div>

              <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-slate-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Stay logged in until logout • After logout, login with mobile only • No password</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-extrabold text-sky-700">
                <button type="button" onClick={() => openLegal('privacy')} className="hover:text-sky-900 hover:underline">Privacy Policy</button><span className="text-slate-300">•</span>
                <button type="button" onClick={() => openLegal('terms')} className="hover:text-sky-900 hover:underline">Terms &amp; Privacy</button><span className="text-slate-300">•</span>
                <button type="button" onClick={() => openLegal('support')} className="hover:text-sky-900 hover:underline">Contact Support</button>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] font-semibold text-white/70">© 2026 PharmaSales Jobs • Since 2026 • Managed by M Divakar Reddy</p>
          </div>
        </section>
      )}
      {/* USER LOGIN / REGISTER — first time: name + mobile + email; after that: mobile only (no password) */}
      {page === 'auth' && (
        <section className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-sky-700 via-sky-600 to-indigo-800 px-4 py-10">
          <div className="w-full max-w-md">
            <div className="rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
              <button type="button" onClick={handlePageBack} aria-label="Go back" title="Go back" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"><ArrowLeft className="h-5 w-5" strokeWidth={2.5} /></button>
              <div className="mt-3">
                <div className="flex items-center gap-2.5 rounded-[20px] border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-2.5 text-left shadow-sm min-[420px]:gap-3 min-[420px]:p-3">
                  <button onClick={() => handleSecretTap()} aria-label="PharmaSales Jobs" className="block shrink-0 select-none transition active:scale-95">
                    <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-12 w-12 rounded-full bg-white ring-1 ring-sky-100 object-cover shadow-lg min-[420px]:h-14 min-[420px]:w-14" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-nowrap text-[18px] font-extrabold leading-none tracking-tight text-slate-900 min-[420px]:text-[20px]">PharmaSales Jobs</p>
                    <p className="mt-1 whitespace-nowrap text-[9px] font-semibold leading-none tracking-wide text-sky-700 min-[420px]:text-[10px]">The MR to NSM Jobs Network</p>
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="mt-5 text-[22px] font-extrabold leading-tight">{entryRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} Login / Register</h1>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{authStep === 'mobile' ? 'Enter your mobile number. Existing users open directly. Name and email are asked only for a new account.' : 'Create your account once. You will stay logged in until you logout; after logout, login with mobile only.'}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> No password needed</span>
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-2 rounded-full bg-slate-100 p-1" role="radiogroup" aria-label="Select account type">
                <span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow transition-transform duration-300 ease-out ${entryRole === 'recruiter' ? 'translate-x-full' : 'translate-x-0'}`} />
                <button type="button" role="radio" aria-checked={entryRole !== 'recruiter'} onClick={() => { setEntryRole('seeker'); setAuthStep('mobile'); setAuthError(''); setAuthEmailTouched(false) }} className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-extrabold transition-colors duration-300 ${entryRole !== 'recruiter' ? 'text-slate-900' : 'text-slate-500'}`}><User className="h-3.5 w-3.5" /> Job Seeker{entryRole !== 'recruiter' && <Check className="h-3.5 w-3.5 text-sky-700" />}</button>
                <button type="button" role="radio" aria-checked={entryRole === 'recruiter'} onClick={() => { setEntryRole('recruiter'); setAuthStep('mobile'); setAuthError(''); setAuthEmailTouched(false) }} className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-extrabold transition-colors duration-300 ${entryRole === 'recruiter' ? 'text-slate-900' : 'text-slate-500'}`}><Building2 className="h-3.5 w-3.5" /> Recruiter{entryRole === 'recruiter' && <Check className="h-3.5 w-3.5 text-sky-700" />}</button>
              </div>

              {authStep === 'mobile' ? (
                <form className="mt-5" onSubmit={e => { e.preventDefault(); handleMobileContinue() }}>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Mobile Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">+91</span>
                    <input value={authForm.mobile} onChange={e => { setAuthForm(prev => ({ ...prev, mobile: e.target.value })); setAuthError('') }} type="tel" inputMode="numeric" autoComplete="tel" placeholder="Enter 10-digit mobile number" className="w-full rounded-xl border bg-white py-3 pl-14 pr-3 text-sm font-semibold outline-none focus:border-sky-500" />
                  </div>
                  {authRecruiterBlockAccount ? (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left">
                      <div className="flex gap-2.5">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-extrabold text-amber-900">This mobile is registered as Recruiter</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800"><b>{authRecruiterBlockAccount.name}</b> uses this mobile for a Recruiter account. Job Seeker login is blocked until that Recruiter account is deleted.</p>
                          <button type="button" onClick={() => { setEntryRole('recruiter'); setAuthStep('mobile'); setAuthError('') }} className="mt-2 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white">Login as Recruiter to delete account</button>
                        </div>
                      </div>
                    </div>
                  ) : authExistingAccount && authExistingEmailError ? (
                    <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-left">
                      <div className="flex gap-2.5">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-red-900">Email correction needed</p>
                          <p className="mt-0.5 break-all text-[11px] leading-relaxed text-red-800">The saved email ID <b>{authExistingAccount.email}</b> is not correct. {authExistingEmailError}{authExistingEmailValidation?.suggestion ? <> Did you mean <b>{authExistingEmailValidation.suggestion}</b>?</> : null}</p>
                        </div>
                      </div>
                    </div>
                  ) : authExistingAccount ? (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 text-left">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white">{authExistingAccount.name.trim().charAt(0).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">Welcome back, {authExistingAccount.name}!</p>
                        <p className="truncate text-[11px] text-slate-600">{entryRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} account found • {authExistingAccount.email}</p>
                      </div>
                      <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">First time? After entering your mobile, we will ask only your <b>name</b> and <b>correct email ID</b> to create your account.</p>
                  )}
                  {authError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{authError}</p>}
                  <button type="submit" disabled={!!authRecruiterBlockAccount || authLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"><LogIn className="h-4 w-4" /> {authLoading ? 'Checking Account...' : authRecruiterBlockAccount ? 'Job Seeker Login Blocked' : authExistingEmailError ? 'Correct Email ID' : authExistingAccount ? 'Login & Continue' : 'Continue with Mobile'}</button>
                </form>
              ) : (
                <form className="mt-5" onSubmit={e => { e.preventDefault(); handleRegister() }}>
                  <div className="rounded-2xl bg-sky-50 p-3 text-center">
                    <p className="text-sm font-extrabold text-sky-900">{authExistingEmailError ? 'Correct Your Email ID' : `New ${entryRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} Account`}</p>
                    <p className="text-[11px] font-medium text-sky-700">{authExistingEmailError ? 'Your account was saved earlier with an incorrect email format. Correct it to continue.' : 'Register once — no password. Stay logged in until you logout.'}</p>
                  </div>
                  {authRecruiterBlockAccount && (
                    <div className="mt-3 flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <p className="text-[11px] leading-relaxed text-amber-800"><b>Job Seeker registration is blocked for this mobile.</b> It belongs to the Recruiter account of <b>{authRecruiterBlockAccount.name}</b>. Select <b>Recruiter</b> above, login, and delete that Recruiter account first.</p>
                    </div>
                  )}
                  {entryRole === 'recruiter' && authOtherRoleAccount && (
                    <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-left">
                      <p className="text-[11px] leading-relaxed text-sky-800">This mobile also has a Job Seeker account. After Recruiter registration, <b>Job Seeker login with this mobile will be blocked</b> until the Recruiter account is deleted.</p>
                    </div>
                  )}
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Full Name *</label>
                      <input value={authForm.name} onChange={e => { setAuthForm(prev => ({ ...prev, name: e.target.value })); setAuthError('') }} autoComplete="name" placeholder="Enter your full name" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Mobile Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">+91</span>
                        <input value={authForm.mobile} onChange={e => { setAuthForm(prev => ({ ...prev, mobile: e.target.value })); setAuthError('') }} type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" className="w-full rounded-xl border bg-white py-3 pl-14 pr-3 text-sm font-semibold outline-none focus:border-sky-500" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Correct Email ID *</label>
                      <input value={authForm.email} onChange={e => { setAuthForm(prev => ({ ...prev, email: e.target.value })); setAuthError('') }} onBlur={() => setAuthEmailTouched(true)} type="email" autoComplete="email" placeholder="yourname@gmail.com" aria-invalid={showAuthEmailError} aria-describedby="auth-email-message" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none ${showAuthEmailError ? 'border-red-400 focus:border-red-500' : showAuthEmailSuccess ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                      {showAuthEmailError ? (
                        <p id="auth-email-message" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-relaxed text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{authEmailValidation.error}{authEmailValidation.suggestion ? <> Did you mean <button type="button" onClick={() => { setAuthForm(prev => ({ ...prev, email: authEmailValidation.suggestion ?? prev.email })); setAuthError(''); setAuthEmailTouched(true) }} className="font-extrabold text-sky-700 underline">{authEmailValidation.suggestion}</button>?</> : null}</span></p>
                      ) : showAuthEmailSuccess ? (
                        <p id="auth-email-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Email format is correct.</p>
                      ) : (
                        <p id="auth-email-message" className="mt-1 text-[11px] font-medium text-slate-400">Gmail IDs must end with @gmail.com.</p>
                      )}
                    </div>
                  </div>
                  {authError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{authError}</p>}
                  <button type="submit" disabled={!!authRecruiterBlockAccount || authLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4" /> {authLoading ? (authExistingEmailError ? 'Saving Correction...' : 'Creating Account...') : authRecruiterBlockAccount ? 'Job Seeker Registration Blocked' : authExistingEmailError ? 'Correct Email & Continue' : 'Register & Continue'}</button>
                  <button type="button" onClick={() => { setAuthStep('mobile'); setAuthError(''); setAuthEmailTouched(false) }} className="mt-2 w-full rounded-full border py-2.5 text-xs font-bold text-slate-600">Use another mobile number</button>
                </form>
              )}

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-slate-400">
                <span>Step 1: Mobile</span><span>→</span><span>Step 2: Register</span><span>→</span><span>Step 3: Job Profile (Seekers)</span>
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">By continuing, you agree to our <button type="button" onClick={() => openLegal('terms')} className="font-extrabold text-sky-700 hover:underline">Terms &amp; Privacy</button> and <button type="button" onClick={() => openLegal('privacy')} className="font-extrabold text-sky-700 hover:underline">Privacy Policy</button>. Need help? <button type="button" onClick={() => openLegal('support')} className="font-extrabold text-sky-700 hover:underline">Contact Support</button></p>
            </div>
            <p className="mt-4 text-center text-[11px] font-semibold text-white/70">PharmaSales Jobs • Since 2026 • Managed by M Divakar Reddy</p>
          </div>
        </section>
      )}
      {/* JOB SEEKER PROFILE — required job data; Recruiters see it anonymously */}
      {page === 'profile' && (
        <section className="mx-auto max-w-[1120px] px-4 py-8">
          {!currentUser || !hasAuthenticated ? (
            <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600"><User className="h-7 w-7" /></span>
              <h2 className="mt-3 text-xl font-extrabold">Job Seeker Login Required</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Login or register as a Job Seeker to complete your required job profile.</p>
              <button onClick={() => enterAs('seeker')} className="mt-5 rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white">Continue as Job Seeker</button>
            </div>
          ) : currentUser.role !== 'seeker' ? (
            <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600"><Building2 className="h-7 w-7" /></span>
              <h2 className="mt-3 text-xl font-extrabold">This Profile is for Job Seekers</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Recruiters can browse completed Job Seeker profiles anonymously from the Recruiters page. Candidate name, mobile number and email ID are hidden.</p>
              <button onClick={openCandidateProfiles} className="mt-5 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white">Open Candidates List</button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white shadow-lg sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold tracking-widest text-sky-700">JOB SEEKER PROFILE</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold tracking-widest">SINCE 2026</span>
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-extrabold tracking-widest text-slate-900">REQUIRED TO APPLY</span>
                  </div>
                  <h2 className="mt-3 text-[26px] font-extrabold leading-tight">Complete your job profile</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed opacity-90">Fill the required data once. Freshers choose the Fresher option. Experienced candidates add current company, current role and current package.</p>
                </div>
                <div className="w-full shrink-0 rounded-2xl bg-white/15 p-4 sm:w-[220px]">
                  <div className="flex items-center justify-between text-xs font-bold"><span>Profile completion</span><span>{seekerProfileProgress(seekerProfileForm)}%</span></div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${seekerProfileProgress(seekerProfileForm)}%` }} /></div>
                  <p className="mt-2 text-[11px] font-semibold opacity-90">{isSeekerProfileComplete(seekerProfileForm) ? '✅ Ready to save and apply' : 'Fill all fields marked *'}</p>
                </div>
              </div>

              <div className="mx-auto mt-5 max-w-3xl">
                <form onSubmit={e => { e.preventDefault(); handleSaveSeekerProfile() }} className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                    <p className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-sky-700"><LockKeyhole className="h-4 w-4" /> ACCOUNT DETAILS</p>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded-xl bg-white px-3 py-2"><p className="text-[10px] font-bold text-slate-400">NAME</p><p className="truncate font-extrabold">{currentUser.name}</p></div>
                      <div className="rounded-xl bg-white px-3 py-2"><p className="text-[10px] font-bold text-slate-400">MOBILE</p><p className="font-extrabold">+91 {currentUser.mobile}</p></div>
                      <div className="rounded-xl bg-white px-3 py-2"><p className="text-[10px] font-bold text-slate-400">EMAIL</p><p className="truncate font-extrabold">{currentUser.email}</p></div>
                    </div>
                  </div>

                  <p className="mt-6 text-sm font-extrabold">1. Are you a Fresher or Experienced? *</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => updateSeekerProfileField('experienceType', 'fresher')} className={`rounded-2xl border-2 p-4 text-left transition ${seekerProfileForm.experienceType === 'fresher' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <GraduationCap className={`h-6 w-6 ${seekerProfileForm.experienceType === 'fresher' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="mt-2 block text-sm font-extrabold">Fresher</span>
                      <span className="block text-xs text-slate-500">No pharma field-force experience</span>
                    </button>
                    <button type="button" onClick={() => updateSeekerProfileField('experienceType', 'experienced')} className={`rounded-2xl border-2 p-4 text-left transition ${seekerProfileForm.experienceType === 'experienced' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <Briefcase className={`h-6 w-6 ${seekerProfileForm.experienceType === 'experienced' ? 'text-violet-600' : 'text-slate-400'}`} />
                      <span className="mt-2 block text-sm font-extrabold">Experienced</span>
                      <span className="block text-xs text-slate-500">Currently / previously working</span>
                    </button>
                  </div>

                  <p className="mt-6 text-sm font-extrabold">2. Required job details</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Qualification *</label>
                      <select value={seekerProfileForm.qualification} onChange={e => updateSeekerProfileField('qualification', e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                        <option value="">Select qualification</option>
                        {SEEKER_QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Role You Are Looking For *</label>
                      <select value={seekerProfileForm.desiredRole} onChange={e => updateSeekerProfileField('desiredRole', e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                        {(seekerProfileForm.experienceType === 'fresher' ? ['Trainee MR', 'Field MR'] : JOB_ROLES).map(roleName => <option key={roleName} value={roleName}>{getRoleLabel(roleName)}</option>)}
                      </select>
                    </div>

                    {seekerProfileForm.experienceType === 'fresher' ? (
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600">Passing Year *</label>
                        <input value={seekerProfileForm.passingYear} onChange={e => updateSeekerProfileField('passingYear', e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="e.g. 2026" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                        <p className="mt-1 text-[11px] font-semibold text-emerald-700">Fresher selected — current company & current package are not required.</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">Total Pharma Experience *</label>
                          <select value={seekerProfileForm.totalExperience} onChange={e => updateSeekerProfileField('totalExperience', e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                            <option value="">Select experience</option>
                            {SEEKER_EXPERIENCE_OPTIONS.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">Current Company *</label>
                          <input value={seekerProfileForm.currentCompany} onChange={e => updateSeekerProfileField('currentCompany', e.target.value)} placeholder="e.g. Sun Pharma" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">Current Role *</label>
                          <select value={seekerProfileForm.currentRole} onChange={e => updateSeekerProfileField('currentRole', e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                            <option value="">Select current role</option>
                            {[...JOB_ROLES, 'Other Pharma Role'].map(roleName => <option key={roleName} value={roleName}>{getRoleLabel(roleName)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-600">Current Package ( CTC ) *</label>
                          <input value={seekerProfileForm.currentPackage} onChange={e => updateSeekerProfileField('currentPackage', e.target.value)} placeholder="e.g. ₹4.5 LPA" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Expected Package *</label>
                      <input value={seekerProfileForm.expectedPackage} onChange={e => updateSeekerProfileField('expectedPackage', e.target.value)} placeholder="e.g. ₹4.0 - 4.5 LPA" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Current State *</label>
                      <select value={seekerProfileForm.state} onChange={e => updateSeekerProfileField('state', e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                        <option value="">Select state</option>
                        {LOCATIONS.slice(1).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Current City *</label>
                      <input value={seekerProfileForm.city} onChange={e => updateSeekerProfileField('city', e.target.value)} placeholder="e.g. Hyderabad" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Current HQ / Work Location *</label>
                      <input value={seekerProfileForm.currentHq} onChange={e => updateSeekerProfileField('currentHq', e.target.value)} placeholder="e.g. Hyderabad - Ameerpet" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Preferred HQ (Optional)</label>
                      <input value={seekerProfileForm.preferredHq} onChange={e => updateSeekerProfileField('preferredHq', e.target.value)} placeholder="e.g. Hyderabad / Bengaluru" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Notice Period / Joining *</label>
                      <select value={seekerProfileForm.noticePeriod} onChange={e => updateSeekerProfileField('noticePeriod', e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                        <option value="">Select availability</option>
                        {['Immediate', '15 days', '30 days', '45 days', '60 days'].map(np => <option key={np} value={np}>{np}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Two-Wheeler Available? *</label>
                      <select value={seekerProfileForm.twoWheeler} onChange={e => updateSeekerProfileField('twoWheeler', e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                        <option value="">Select option</option>
                        {['Yes', 'No', 'Will arrange'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold text-slate-600">Skills (Optional, comma separated)</label>
                      <input value={seekerProfileForm.skills} onChange={e => updateSeekerProfileField('skills', e.target.value)} placeholder="e.g. RCPA, Doctor Calling, Stockist Handling" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                  </div>

                  {seekerProfileError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{seekerProfileError}</p>}

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button type="submit" disabled={profileSaving} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-extrabold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"><Check className="h-4 w-4" /> {profileSaving ? 'Saving Profile...' : 'Save Profile & Browse Jobs'}</button>
                    <button type="button" onClick={() => navigate('jobs')} className="rounded-full border px-6 py-3 text-sm font-bold">Browse Jobs</button>
                  </div>
                  <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">You can browse jobs, but Apply Now and contact reveal unlock only after this required profile is saved.</p>
                </form>

              </div>
            </>
          )}
        </section>
      )}
      {shouldHideJobSeekerExperience && ['home', 'jobs', 'pricing', 'saved'].includes(page) && (
        <section className="mx-auto max-w-[900px] px-4 py-10">
          <div className="rounded-[28px] border border-sky-100 bg-white p-6 text-center shadow-xl sm:p-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-600"><Building2 className="h-8 w-8" /></span>
            <p className="mt-4 text-xs font-extrabold tracking-widest text-sky-700">RECRUITER VIEW</p>
            <h2 className="mt-2 text-[26px] font-extrabold leading-tight">You give jobs — you don’t need Job Seeker plans</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Job search, vacancy details, Saved Jobs, Apply Now, contact unlocks and Free/Starter/Pro plans are only for Job Seekers. Your Recruiter account is for posting vacancies and shortlisting candidates. <b>No Recruiter plan is needed.</b></p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => navigate('postjob')} className="flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow hover:bg-sky-700"><Plus className="h-4 w-4" /> Post Vacancy</button>
              <button onClick={openCandidateProfiles} className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow hover:bg-slate-800"><Users className="h-4 w-4" /> Candidates List</button>
              <button onClick={() => navigate('recruiters')} className="rounded-full border px-6 py-3 text-sm font-extrabold">Recruiter Home</button>
            </div>
          </div>
        </section>
      )}

      {page === 'home' && !shouldHideJobSeekerExperience && (
      <>
      {/* HERO */}
      <section className="mx-auto max-w-[1280px] px-4 pb-6 pt-6">
        <div className="mx-auto max-w-[920px]">
          {/* left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-white">● LIVE</span>
              <span>493 vacancies verified this week • Managed by <b>M Divakar Reddy</b></span>
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <h1 className="mt-4 text-[32px] font-extrabold leading-[0.95] tracking-tight sm:text-[44px]">
              India’s most <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">trusted jobs network</span> for pharma vacancies from MR to NSM
            </h1>
            <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-slate-600">Verified vacancies for Trainee MR, Field MR, Senior MR, ASM, RSM, ZSM and NSM roles, with masked contact protection & subscription unlocks. Trusted by <b>50,000+ pharma professionals</b> across 700+ HQs and territories. Daily updates from Sun, Cipla, Mankind, Zydus, Alkem & more.</p>

            {/* hero search */}
            <div className="mt-5 rounded-2xl border bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input ref={heroSearchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, HQ, division..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <select value={location} onChange={e => setLocation(e.target.value)} className="bg-transparent text-sm font-semibold outline-none">
                      {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  {location !== 'All India' && (
                    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm animate-in fade-in">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      <select value={city} onChange={e => setCity(e.target.value)} className="bg-transparent text-sm font-semibold outline-none">
                        {availableCities.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  {city !== 'All Cities' && (
                    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm animate-in fade-in">
                      <Building2 className="h-4 w-4 text-violet-600" />
                      <select value={hq} onChange={e => setHq(e.target.value)} className="bg-transparent text-sm font-semibold outline-none">
                        {availableHQs.map(h => <option key={h}>{h}</option>)}
                      </select>
                    </div>
                  )}
                  {hq !== 'All HQs' && (
                    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm animate-in fade-in">
                      <Briefcase className="h-4 w-4 text-amber-600" />
                      <select value={role} onChange={e => setRole(e.target.value as any)} className="bg-transparent text-sm font-semibold outline-none">
                        {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                      </select>
                    </div>
                  )}
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
                { k: '50K+', v: 'Pharma professionals', icon: Users },
                { k: '2,400+ Jobs', v: 'Verified & active', icon: BadgeCheck },
                { k: '18K+ Placements', v: 'MR career support', icon: Star },
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
              <span className="text-xs font-bold text-slate-500">Trusted by pharma professionals at:</span>
              <div className="flex flex-wrap gap-1.5">
                {['Sun', 'Cipla', 'Mankind', 'Zydus', 'Torrent', 'Alkem', 'Lupin', 'Abbott'].map(c => (
                  <span key={c} className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-bold">{c}</span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Banner ad after hero */}
        {!isAdFree && (
        <div className="mt-6">
          <BannerAd />
        </div>
        )}
      </section>
      </>
      )}

      {/* HOME Featured Preview - required data only on home */}
      {page === 'home' && !shouldHideJobSeekerExperience && (
        <section className="mx-auto max-w-[1280px] px-4 pb-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[22px] font-extrabold">Featured Verified Vacancies</h2>
              <p className="text-sm text-slate-500">Preview of {filtered.length} openings — filters State, City, HQ on Jobs page</p>
            </div>
            <button onClick={() => navigate('jobs')} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">View All Jobs →</button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {visibleFiltered.slice(0, 4).map((job) => (
              <div key={job.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ background: isCompanyVisible(job) ? job.color : '#475569' }}>{getCompanyInitials(job)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{getDisplayCompany(job)} • {job.title}</p>
                    <p className="text-xs text-slate-500">{job.hq} • {job.exp} • {job.ctc}</p>
                  </div>
                  {job.verified && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">Verified</span>}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{getSafeJobText(job, job.desc)}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setSelected(job)} className="flex-1 rounded-full border bg-white py-2 text-sm font-bold">View Details</button>
                  <button onClick={() => handleApply(job)} className={`flex-1 rounded-full py-2 text-sm font-bold text-white ${applied.has(job.id) ? 'bg-emerald-600' : 'bg-sky-600'}`}>{applied.has(job.id) ? 'Applied' : applyAdJob?.id === job.id ? 'Ad Playing…' : 'Apply Now'}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* JOBS PAGE */}
      {page === 'jobs' && !shouldHideJobSeekerExperience && (
      <section id="vacancies" className="mx-auto max-w-[1280px] px-4 pb-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters sidebar */}
          <div className="hidden w-[300px] shrink-0 lg:block">
            <div className="sticky top-[100px] space-y-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-extrabold"><Filter className="h-4 w-4" /> Filters</p>
                  <button onClick={() => { setSearch(''); setLocation('All India'); setCity('All Cities'); setHq('All HQs'); setCompany('All Companies'); setRole('All Roles'); setExpFilter('All Experience'); setVerifiedOnly(false) }} className="text-xs font-bold text-sky-600">Clear all</button>
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
                    <label className="text-xs font-bold text-slate-700">1. Filter — State</label>
                    <select value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className={`${location === 'All India' ? 'opacity-40' : ''}`}>
                    <label className="text-xs font-bold text-slate-700">2. Filter — City {location !== 'All India' ? <span className="font-normal text-sky-600">• {availableCities.length-1} cities in {location}</span> : <span className="font-normal text-slate-400">• Select State first</span>}</label>
                    <select value={city} onChange={e => setCity(e.target.value)} disabled={location === 'All India'} className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold ${location === 'All India' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}>
                      {availableCities.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className={`${city === 'All Cities' ? 'opacity-40' : ''}`}>
                    <label className="text-xs font-bold text-slate-700">3. Filter — HQ <span className="font-normal text-slate-400">exact from vacancy</span> {city !== 'All Cities' ? <span className="font-normal text-sky-600">• {availableHQs.length-1} HQs in {city}</span> : <span className="font-normal text-slate-400">• Select City first</span>}</label>
                    <select value={hq} onChange={e => setHq(e.target.value)} disabled={city === 'All Cities'} className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold ${city === 'All Cities' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}>
                      {availableHQs.map(h => <option key={h}>{h}</option>)}
                    </select>
                    <p className="mt-1 text-[11px] leading-tight text-slate-500">HQs are exactly as shown in vacancy cards: e.g. “Hyderabad - Ameerpet”</p>
                  </div>

                  <div className={`${hq === 'All HQs' ? 'opacity-40' : ''}`}>
                    <label className="text-xs font-bold text-slate-700">4. Filter — Role {hq !== 'All HQs' ? <span className="font-normal text-sky-600">• for {hq}</span> : <span className="font-normal text-slate-400">• Select HQ first</span>}</label>
                    <select value={role} onChange={e => setRole(e.target.value as any)} disabled={hq === 'All HQs'} className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold ${hq === 'All HQs' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}>
                      {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Filter — Company</label>
                    <select value={company} onChange={e => setCompany(e.target.value)} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {companyOptions.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Filter — Experience</label>
                    <select value={expFilter} onChange={e => setExpFilter(e.target.value as any)} className="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {EXP_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <p className="mt-1 text-[11px] leading-tight text-slate-500">Fresher = 0 yrs • Below 6 months = 0.5 yrs (6 mo) • Above 6 months = 1+ yrs</p>
                  </div>

                  <label className="flex items-center gap-2 rounded-xl border bg-emerald-50 px-3 py-2.5">
                    <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                    <span className="text-sm font-bold">Verified only</span>
                    <BadgeCheck className="ml-auto h-4 w-4 text-emerald-600" />
                  </label>

                  <div className="rounded-xl bg-sky-50 p-3">
                    <p className="text-xs font-bold text-sky-800">Tier Benefits</p>
                    <p className="mt-1 text-xs leading-relaxed text-sky-700">Free: 3 daily full-contact unlocks open 7 extra jobs. Extra jobs use separate ads for company, manager and number. Starter/Pro reveal contacts directly; Apply Now still plays one sponsored ad.</p>
                  </div>
                </div>
              </div>

              {!isAdFree && <NativeAd />}

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
                <p className="text-sm text-slate-500">Showing {visibleFiltered.length} of {filtered.length} openings • Updated every 2 hours • Masked contacts protect recruiters</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold lg:hidden">
                  <Filter className="h-4 w-4" /> Filters {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <div className="hidden items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-semibold sm:flex">
                  <Clock3 className="h-4 w-4 text-sky-600" /> Daily unlocks: <b>{Math.min(displayedDailyUnlocks, limitForTier[tier])}/{limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]}</b>{tier === 'free' && <span className="font-bold text-amber-700">{freeDailyLimitComplete ? '• +7 extra open' : '• +7 extra locked'}</span>}
                </div>
              </div>
            </div>

            {/* mobile filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden">
                  <div className="mt-3 grid gap-3 rounded-2xl border bg-white p-4">
                    <select value={location} onChange={e => setLocation(e.target.value)} className="rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                      {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <select value={city} onChange={e => setCity(e.target.value)} disabled={location==='All India'} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${location==='All India' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}>
                      {availableCities.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={hq} onChange={e => setHq(e.target.value)} disabled={city==='All Cities'} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${city==='All Cities' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}>
                      {availableHQs.map(h => <option key={h}>{h}</option>)}
                    </select>
                    <select value={role} onChange={e => setRole(e.target.value as any)} disabled={hq==='All HQs'} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${hq==='All HQs' ? 'bg-slate-100 text-slate-400' : 'bg-slate-50'}`}>
                      {ROLES.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={company} onChange={e => setCompany(e.target.value)} className="rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                        {companyOptions.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <select value={expFilter} onChange={e => setExpFilter(e.target.value as any)} className="rounded-xl border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
                        {EXP_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-sky-600" />
                        <span className="text-sm font-bold">Verified only</span>
                      </label>
                      <button onClick={() => { setSearch(''); setLocation('All India'); setCity('All Cities'); setHq('All HQs'); setCompany('All Companies'); setRole('All Roles'); setExpFilter('All Experience'); setVerifiedOnly(false) }} className="text-xs font-bold text-sky-600">Clear all</button>
                    </div>
                    <p className="text-[11px] text-slate-500">HQ list = exactly as shown in vacancy cards (e.g. “Hyderabad - Ameerpet”). Exp: Fresher = 0 yrs, Below 6 months = 0.5 yrs, Above 6 months = 1+ yrs</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* active filter chips */}
            {(location !== 'All India' || city !== 'All Cities' || hq !== 'All HQs' || company !== 'All Companies' || role !== 'All Roles' || expFilter !== 'All Experience' || verifiedOnly) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {location !== 'All India' && <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white">State: {location} <button onClick={() => setLocation('All India')} className="rounded-full bg-white/20 p-0.5"><X className="h-3 w-3" /></button></span>}
                {city !== 'All Cities' && <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">City: {city} <button onClick={() => setCity('All Cities')} className="rounded-full bg-white/20 p-0.5"><X className="h-3 w-3" /></button></span>}
                {hq !== 'All HQs' && <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-bold text-white">HQ: {hq} <button onClick={() => setHq('All HQs')} className="rounded-full bg-white/20 p-0.5"><X className="h-3 w-3" /></button></span>}
                {company !== 'All Companies' && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">{company} <button onClick={() => setCompany('All Companies')} className="rounded-full bg-white/20 p-0.5"><X className="h-3 w-3" /></button></span>}
                {role !== 'All Roles' && <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">Role: {getRoleLabel(role)} <button onClick={() => setRole('All Roles')} className="rounded-full bg-white/20 p-0.5"><X className="h-3 w-3" /></button></span>}
                {expFilter !== 'All Experience' && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">{expFilter} <button onClick={() => setExpFilter('All Experience')} className="rounded-full bg-white/20 p-0.5"><X className="h-3 w-3" /></button></span>}
                {verifiedOnly && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Verified only <button onClick={() => setVerifiedOnly(false)} className="rounded-full bg-white/20 p-0.5"><X className="h-3 w-3" /></button></span>}
                <button onClick={() => { setLocation('All India'); setCity('All Cities'); setHq('All HQs'); setCompany('All Companies'); setRole('All Roles'); setExpFilter('All Experience'); setVerifiedOnly(false); setSearch('') }} className="rounded-full border bg-white px-3 py-1.5 text-xs font-bold">Clear all ✕</button>
              </div>
            )}

            {/* subscription awareness bar */}
            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white"><Crown className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-extrabold">{tier === 'free' ? (freeDailyLimitComplete ? '7 extra jobs are open — each detail has its own sponsored reveal' : `Today’s Free progress: ${freeDailyUnlockedCount}/${FREE_DAILY_JOB_LIMIT} full-contact unlocks`) : 'Direct contact reveals are included with your plan'}</p>
                  <p className="text-xs text-slate-600">{tier === 'free' ? (freeDailyLimitComplete ? 'On extra jobs, watch separate sponsored ads for company, manager name and contact number. Apply Now also plays a sponsored ad.' : 'Complete all 3 Free full-contact unlocks to open 7 extra jobs. Apply Now plays a sponsored ad before submission.') : 'No banner/native or contact-reveal ads. Apply Now still plays one sponsored ad per application.'}</p>
                </div>
              </div>
              <button onClick={() => setShowPricing(true)} className="shrink-0 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">View Plans</button>
            </div>

            {/* job grid */}
            <div className="mt-4 grid gap-4">
              {visibleFiltered.length === 0 ? (
                <div className="rounded-2xl border bg-white p-10 text-center">
                  <SearchX className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold">{filtered.length === 0 ? 'No vacancies match your filters' : 'No vacancies are available in today’s Free access for these filters'}</p>
                  <p className="text-xs text-slate-500">{filtered.length === 0 ? 'Try clearing location/company or search with different HQ like Hyderabad/Pune' : 'Free shows today’s first 3 jobs, then 7 extra jobs after all 3 unlocks. Clear filters or view Starter/Pro for every matching job.'}</p>
                  <button onClick={() => { setSearch(''); setLocation('All India'); setCity('All Cities'); setHq('All HQs'); setCompany('All Companies'); setRole('All Roles'); setExpFilter('All Experience'); setVerifiedOnly(false) }} className="mt-4 rounded-full bg-sky-600 px-6 py-2 text-sm font-bold text-white">Clear filters</button>
                </div>
              ) : (
                visibleFiltered.map((job, idx) => (
                  <div key={job.id}>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} className="group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
                      {/* top row */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow" style={{ background: isCompanyVisible(job) ? job.color : '#475569' }}>
                          {getCompanyInitials(job)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15px] font-extrabold leading-tight">{getDisplayCompany(job)}</h3>
                            {job.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
                            {job.hot && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600"><TrendingUp className="h-3.5 w-3.5" /> Hot</span>}
                            {job.urgent && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800"><Siren className="h-3.5 w-3.5" /> Urgent</span>}
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{job.type}</span>
                            {isExtraJob(job) && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-800"><TvMinimalPlay className="h-3.5 w-3.5" /> Extra Job • Separate Ads</span>}
                          </div>
                          <p className="mt-1 text-sm font-bold text-slate-900">{job.title} • <span className="font-semibold text-slate-600">{getSafeJobText(job, job.division)}</span></p>
                          {isExtraJob(job) && !isCompanyVisible(job) && (
                            <button onClick={() => attemptExtraReveal(job, 'company')} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-white shadow hover:bg-amber-600"><TvMinimalPlay className="h-3.5 w-3.5" /> Watch Ad to Reveal Company</button>
                          )}
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

                      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{getSafeJobText(job, job.desc)}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.map(s => <span key={s} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{s}</span>)}
                        {job.perks.slice(0, 2).map(p => <span key={p} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{p}</span>)}
                      </div>

                      {/* masked contact area */}
                      <div className="mt-4 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/60 p-3">
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-sky-800"><LockKeyhole className="h-4 w-4" /> RECRUITER CONTACT (MASKED)</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">{isExtraJob(job) ? `Extra details • ${getExtraRevealCount(job)}/3 revealed` : revealed.has(job.id) ? 'Unlocked • 24h valid' : tier === 'free' ? `Full-contact ad • ${Math.max(0, FREE_DAILY_JOB_LIMIT - freeDailyUnlockedCount)} left` : `Direct reveal • ${limitForTier[tier] === 9999 ? '∞' : Math.max(0, limitForTier[tier] - dailyUnlocks)} left`}</span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-white p-3">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500"><Building2 className="h-3.5 w-3.5" /> MANAGER / CONTACT PERSON</p>
                            <p className="mt-1 text-sm font-bold">{isManagerVisible(job) ? job.contactPerson : isExtraJob(job) ? 'Hidden Manager •••' : maskPhone(job.contactPerson.split(' -')[0]) + ' •••'}</p>
                            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500"><Phone className="h-3.5 w-3.5" /> PHONE</p>
                            <p className="mt-1 flex items-center gap-2 text-sm font-bold">{isPhoneVisible(job) ? job.phone : '+91 ••••• •••••'} {isPhoneVisible(job) && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] text-white">Verified</span>}</p>
                            {!isPhoneVisible(job) && <p className="mt-1 text-xs font-bold text-sky-700">Contact number hidden</p>}
                          </div>
                          <div className="rounded-xl bg-white p-3">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500"><Mail className="h-3.5 w-3.5" /> EMAIL</p>
                            <p className="mt-1 break-all text-sm font-bold">{isEmailVisible(job) ? job.email : '••••@company.com'}</p>
                            {!isEmailVisible(job) && <p className="mt-1 text-xs font-bold text-sky-700">Email hidden</p>}
                            <div className="mt-3 flex flex-col gap-2">
                              {isExtraJob(job) ? (
                                <>
                                  {!isManagerVisible(job) && (
                                    <button onClick={() => attemptExtraReveal(job, 'manager')} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black"><TvMinimalPlay className="h-4 w-4" /> Watch Ad — Reveal Manager Name</button>
                                  )}
                                  {!isPhoneVisible(job) && (
                                    <button onClick={() => attemptExtraReveal(job, 'phone')} className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-800"><TvMinimalPlay className="h-4 w-4" /> Watch Ad — Reveal Contact Number</button>
                                  )}
                                  {isPhoneVisible(job) && (
                                    <div className="flex gap-2">
                                      <a href={`tel:${job.phone.replace(/\s/g, '')}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" /> Call</a>
                                      <a href={`https://wa.me/${job.phone.replace(/\D/g, '')}?text=Hi%20Sir%2C%20interested%20in%20${encodeURIComponent(getDisplayCompany(job) + ' ' + job.type + ' vacancy at ' + job.hq)}`} target="_blank" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                                    </div>
                                  )}
                                </>
                              ) : revealed.has(job.id) ? (
                                <div className="flex gap-2">
                                  <a href={`tel:${job.phone.replace(/\s/g, '')}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" /> Call</a>
                                  <a href={`https://wa.me/${job.phone.replace(/\D/g, '')}?text=Hi%20Sir%2C%20interested%20in%20${encodeURIComponent(getDisplayCompany(job) + ' ' + job.type + ' vacancy at ' + job.hq)}`} target="_blank" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                                </div>
                              ) : (
                                <button onClick={() => attemptReveal(job)} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-black">
                                  {tier === 'free' ? <><TvMinimalPlay className="h-4 w-4" /> Watch Ad — Reveal Full Contact</> : <><Unlock className="h-4 w-4" /> Reveal Contact (1/{limitForTier[tier]})</>}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {!revealed.has(job.id) && getExtraRevealCount(job) < 3 && (
                          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-slate-500">
                            <Info className="h-3.5 w-3.5 shrink-0" /> <span>{isExtraJob(job) ? 'Extra Free job: separate 15-sec ads reveal company, manager name and contact number. Apply Now also plays a sponsored ad.' : tier === 'free' ? 'Free daily job: one 15-sec ad reveals manager, contact number and email. Apply Now also plays a sponsored ad.' : `Your ${tier} plan: direct contact reveals included. Apply Now plays one sponsored ad.`}</span>
                          </p>
                        )}
                      </div>

                      {/* actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => setSelected(job)} className="flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-sm font-bold hover:bg-slate-50">
                          <Eye className="h-4 w-4" /> View Details
                        </button>
                        <button onClick={() => handleApply(job)} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white ${applied.has(job.id) ? 'bg-emerald-600' : 'bg-sky-600 hover:bg-sky-700'}`}>
                          {applied.has(job.id) ? <><Check className="h-4 w-4" /> Applied</> : applyAdJob?.id === job.id ? <><TvMinimalPlay className="h-4 w-4" /> Ad Playing…</> : <><Send className="h-4 w-4" /> Apply Now</>}
                        </button>
                        <button onClick={() => toggleSave(job.id)} className="flex items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-bold sm:hidden">
                          <Bookmark className="h-4 w-4" /> {saved.has(job.id) ? 'Saved' : 'Save'}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(`${getDisplayCompany(job)} ${job.type} vacancy at ${job.hq} — ${job.ctc} — Contact via PharmaSales Jobs`); setToast('Link copied to share on WhatsApp!') }} className="ml-auto flex items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-bold">
                          <Share2 className="h-4 w-4" /> Share
                        </button>
                      </div>
                    </motion.div>

                    {/* inject ads every 4th */}
                    {!isAdFree && (idx + 1) % 4 === 0 && idx !== visibleFiltered.length - 1 && (
                      <div className="my-4">
                        <BannerAd label={`Sponsored • Appears after ${idx + 1} jobs`} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {tier === 'free' && hiddenFilteredCount > 0 && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><LockKeyhole className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{freeDailyLimitComplete ? 'Today’s Free 3 + 7 job access is complete' : '7 extra jobs are locked for now'}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{freeDailyLimitComplete ? `${hiddenFilteredCount} more matching ${hiddenFilteredCount === 1 ? 'job is' : 'jobs are'} outside today’s Free access. They open tomorrow, or immediately with Starter/Pro.` : `Complete all 3 Free full-contact unlocks (${freeDailyUnlockedCount}/${FREE_DAILY_JOB_LIMIT}) to open the next 7 jobs. Extra jobs use separate sponsored ads for company, manager name, contact number and Apply Now.`}</p>
                </div>
                <button onClick={() => setShowPricing(true)} className="shrink-0 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">View Plans</button>
              </div>
            )}

            {/* compliance / data safety bar */}
            <div className="mt-6 rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Privacy Protected: Contacts masked • No spam</span>
                <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 font-bold text-sky-700"><BadgeCheck className="h-4 w-4" /> Verified by M Divakar Reddy • Manual screening</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold">Candidate name, mobile & email hidden from Recruiters</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
      {/* PRICING PAGE */}
      {page === 'pricing' && !shouldHideJobSeekerExperience && (
      <section id="pricing" className="border-y bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold tracking-widest text-sky-700">JOB SEEKER SUBSCRIPTION TIERS</span>
            <h2 className="mt-3 text-[28px] font-extrabold leading-tight">Choose how you unlock contacts. <br className="hidden sm:block" /><span className="text-sky-600">Free works — Pro wins faster.</span></h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">All plans include verified vacancies. Apply Now plays one sponsored ad on every plan; Starter/Pro remove browsing and contact-reveal ads.</p>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            {TIERS.map(t => (
              <div key={t.id} className={`relative rounded-2xl border p-5 ${t.popular ? 'border-sky-500 bg-sky-50 shadow-lg' : 'bg-slate-50'} ${tier === t.id ? 'ring-2 ring-sky-500' : ''}`}>
                {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">MOST POPULAR</span>}
                {tier === t.id && <span className="absolute -top-3 right-4 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">Active</span>}
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.id === 'free' ? 'bg-slate-900 text-white' : t.id === 'starter' ? 'bg-sky-600 text-white' : t.id === 'pro' ? 'bg-violet-600 text-white' : 'bg-amber-500 text-white'}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-lg font-extrabold">{t.name} {t.id === 'pro' && 'MR'}</h3>
                <p className="mt-1 text-2xl font-extrabold">{t.price} <span className="text-sm font-semibold text-slate-500">{t.period}</span></p>
                <p className="text-xs font-bold text-slate-500">{t.limit} unlocks • {t.id === 'free' ? 'Ad-supported' : 'No reveal ads'}</p>
                <ul className="mt-4 space-y-2">
                  {t.features.map(f => (
                    <li key={f} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> <span className="leading-tight">{f}</span></li>
                  ))}
                </ul>
                <button onClick={() => { if (t.id === 'free') { setTier('free'); setToast('Free plan active — watch ads to unlock') } else { setTier(t.id); setToast(`${t.name} plan selected`) } }} className={`mt-5 w-full rounded-full py-2.5 text-sm font-bold ${tier === t.id ? 'bg-emerald-600 text-white' : t.popular ? 'bg-sky-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {tier === t.id ? '✓ Active' : t.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-5 flex max-w-5xl items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <p className="text-sm leading-relaxed text-emerald-900"><b>Recruiter plan removed:</b> Recruiters do not need a paid subscription plan. Register free, post vacancies for Admin approval, and browse anonymous Job Seeker job profiles without names or contact details.</p>
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl border bg-slate-50 p-4 sm:grid-cols-3">
            <div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" /><p className="text-sm leading-tight"><b>Why masked?</b> Prevents spam calls to recruiters. Free users prove intent by watching a short ad.</p></div>
            <div className="flex gap-3"><TvMinimalPlay className="h-5 w-5 shrink-0 text-sky-600" /><p className="text-sm leading-tight"><b>Sponsored video:</b> Free has 3 daily full-contact unlocks, then 7 extra jobs with separate company, manager and number ads. Starter/Pro reveal directly; Apply Now still plays one sponsored ad.</p></div>
            <div className="flex gap-3"><BadgeCheck className="h-5 w-5 shrink-0 text-violet-600" /><p className="text-sm leading-tight"><b>Verified only:</b> Every vacancy is manually checked by M Divakar Reddy before publish.</p></div>
          </div>

        </div>
      </section>
      )}
      {/* AI PAGE */}
      {page === 'ai' && (
      <section id="ai" className="mx-auto max-w-[1280px] px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white"><Sparkles className="h-5 w-5" /></div>
              <div>
                <h3 className="text-lg font-extrabold">PharmaSales AI Assistant</h3>
                <p className="text-xs font-semibold text-slate-500">{shouldHideJobSeekerExperience ? 'Vacancy writing • Interview questions • Shortlisting • Support tickets' : 'Resume • Interview • RCPA • Salary • Support tickets'}</p>
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
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAi()} placeholder={shouldHideJobSeekerExperience ? "Ask: Write an ASM vacancy for Hyderabad HQ..." : "Ask: Resume for B.Pharm fresher in Hyderabad..."} className="flex-1 rounded-full border bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white" />
              <button onClick={sendAi} disabled={aiLoading} className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4 sm:mr-2 sm:inline" /><span className="hidden sm:inline">Send</span></button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => openSupportTicket('ai')} className="flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-extrabold text-white shadow hover:bg-sky-700"><FileText className="h-3.5 w-3.5" /> Raise Support Ticket</button>
              {(shouldHideJobSeekerExperience ? ['Write MR to NSM vacancy JD', 'Interview questions for ASM', 'Candidate shortlist checklist', 'Improve vacancy response'] : ['Resume for fresher', 'Mankind interview Q&A', 'Best salary in Hyderabad', 'RCPA tips']).map(q => (
                <button key={q} onClick={() => setAiInput(q)} className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold hover:bg-white">{q}</button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow"><MessageCircle className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-extrabold text-slate-900">Need help from Admin? Raise a support ticket</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">Select a <b>proper reason</b>, write your registered mobile and issue clearly. Support email: <a href={buildSupportMailto()} className="font-extrabold text-sky-700 hover:underline">{SUPPORT_EMAIL}</a></p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button onClick={() => openSupportTicket('ai')} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold text-white shadow hover:bg-slate-800">Raise Ticket</button>
                  <button onClick={() => openLegal('support')} className="rounded-full border bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm">Contact Support</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-extrabold">My Support Tickets</p>
                  <p className="text-xs text-slate-500">Track tickets raised through AI Chat or Contact Support.</p>
                </div>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-extrabold text-sky-700">{mySupportTickets.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {mySupportTickets.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-center text-xs font-semibold leading-relaxed text-slate-500">{shouldHideJobSeekerExperience ? 'No support ticket raised yet. For login, vacancy approval, candidates or technical help, raise a ticket with a proper reason.' : 'No support ticket raised yet. For login, profile, vacancy, plan or technical help, raise a ticket with a proper reason.'}</p>
                ) : mySupportTickets.slice(0, 3).map(ticket => renderSupportTicketSummary(ticket))}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openSupportTicket('ai')} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sky-600 py-2.5 text-xs font-extrabold text-white shadow hover:bg-sky-700"><Plus className="h-3.5 w-3.5" /> New Ticket</button>
                <a href={buildSupportMailto()} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-xs font-extrabold text-slate-700"><Mail className="h-3.5 w-3.5" /> Email Support</a>
              </div>
              {isAdmin && <button onClick={() => openAdmin('support')} className="mt-2 w-full rounded-full bg-slate-900 py-2.5 text-xs font-extrabold text-white">Open Admin Support Tickets ({openSupportTickets.length} open)</button>}
            </div>

            {shouldHideJobSeekerExperience ? (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-sky-700 to-indigo-700 p-6 text-white shadow-lg">
                  <p className="text-sm font-bold tracking-widest text-sky-200">RECRUITER FLOW</p>
                  <h3 className="mt-2 text-xl font-extrabold">Post, approve &amp; shortlist</h3>
                  <div className="mt-5 space-y-4">
                    {[
                      { n: '01', t: 'Post a vacancy free', d: 'Fill the recruiter form. No Job Seeker subscription plan is needed.' },
                      { n: '02', t: 'Admin verifies', d: 'M Divakar Reddy reviews the vacancy before it goes LIVE for Job Seekers.' },
                      { n: '03', t: 'Open Candidates List', d: 'Tap a candidate to slide open anonymous details, then request contact through Admin.' },
                    ].map(s => (
                      <div key={s.n} className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-sky-700">{s.n}</span>
                        <div><p className="text-sm font-bold">{s.t}</p><p className="text-xs opacity-85">{s.d}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button onClick={() => navigate('postjob')} className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-900 shadow">Post Vacancy</button>
                    <button onClick={openCandidateProfiles} className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 shadow">Candidates List</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-900"><ShieldCheck className="h-4 w-4" /> Candidate privacy</p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-800">Candidate name, mobile number and email ID stay hidden. Contact is shared only through Admin after candidate consent.</p>
                </div>
              </>
            ) : (
              <>
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
              <p className="text-sm font-bold tracking-widest text-sky-300">HOW IT WORKS</p>
              <h3 className="mt-2 text-xl font-extrabold">From vacancy to joining in 3 steps</h3>
              <div className="mt-5 space-y-4">
                {[
                  { n: '01', t: 'Browse verified HQs', d: 'Filter by HQ, company & experience. Every post is verified manually.' },
                  { n: '02', t: 'Reveal the details you need', d: 'Free daily jobs use one full-contact ad. Extra jobs use separate company, manager and number ads. Starter/Pro reveal directly.' },
                  { n: '03', t: 'Apply & get placed', d: 'Apply Now plays one sponsored ad on Free, Starter and Pro, then submits your application.' },
                ].map(s => (
                  <div key={s.n} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-slate-900">{s.n}</span>
                    <div><p className="text-sm font-bold">{s.t}</p><p className="text-xs opacity-80">{s.d}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm font-extrabold">What pharma professionals say</p>
              <div className="mt-3 grid gap-3">
                {[
                  { name: 'Rahul K, Hyderabad', role: 'Sun Pharma MR (Placed via PharmaSales Jobs)', text: 'Got 3 interviews in a week. Masked contact is genius — no spam, genuine recruiters only.' },
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

              </>
            )}

            {!isAdFree && <BannerAd />}
          </div>
        </div>
      </section>
      )}
      {/* CANDIDATES LIST — Recruiter/Admin menu page; full details slide in after selecting a candidate */}
      {page === 'candidates' && (
        <section className="mx-auto max-w-[1100px] px-4 py-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={handlePageBack} aria-label="Go back" title="Go back" className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"><ArrowLeft className="h-5 w-5" strokeWidth={2.5} /></button>
            <button onClick={() => navigate('postjob')} className="flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-xs font-extrabold text-white shadow hover:bg-sky-700"><Plus className="h-4 w-4" /> Post Vacancy</button>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-[#f8fbff] p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-extrabold tracking-widest text-white">RECRUITER ONLY</span>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-extrabold tracking-widest text-sky-700">SINCE 2026</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold tracking-widest text-emerald-700">NO RECRUITER PLAN NEEDED</span>
                </div>
                <h3 className="mt-3 text-[24px] font-extrabold leading-tight">Candidates List</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">This list shows only basic shortlist details. Tap any candidate row to slide open the full anonymous profile with experience, company, package, HQ and skills.</p>
              </div>
              <div className="flex shrink-0 items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                <EyeOff className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Name, mobile number & email ID are hidden</span>
              </div>
            </div>

            {!canViewCandidateProfiles ? (
              <div className="mt-5 rounded-3xl border bg-white p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700"><LockKeyhole className="h-7 w-7" /></span>
                <h4 className="mt-3 text-lg font-extrabold">Login as a Recruiter to view candidate job profiles</h4>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">For candidate privacy, profiles are visible only to registered Recruiters. Even after login, candidate name, contact number and email ID will not be displayed.</p>
                <button onClick={() => enterAs('recruiter')} className="mt-5 rounded-full bg-sky-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-sky-700">Recruiter Login / Register</button>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border bg-white p-4"><p className="text-[11px] font-extrabold tracking-wide text-slate-400">PROFILES SHOWN</p><p className="mt-1 text-2xl font-extrabold">{filteredCandidateProfiles.length}</p><p className="text-xs text-slate-500">After filters</p></div>
                  <div className="rounded-2xl border bg-white p-4"><p className="text-[11px] font-extrabold tracking-wide text-slate-400">REGISTERED CANDIDATES</p><p className="mt-1 text-2xl font-extrabold">{registeredCandidateProfiles.length}</p><p className="text-xs text-slate-500">Completed seeker profiles</p></div>
                  <div className="rounded-2xl border bg-white p-4"><p className="text-[11px] font-extrabold tracking-wide text-slate-400">FRESHER PROFILES</p><p className="mt-1 text-2xl font-extrabold">{candidateProfiles.filter(c => c.profile.experienceType === 'fresher').length}</p><p className="text-xs text-slate-500">Ready for Trainee & Field MR roles</p></div>
                </div>

                <div className="mt-4 grid gap-2 rounded-2xl border bg-white p-3 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
                  <div className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                    <input value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} placeholder="Search company, HQ, qualification, skill..." className="w-full bg-transparent text-sm outline-none" />
                  </div>
                  <select value={candidateRoleFilter} onChange={e => setCandidateRoleFilter(e.target.value)} className="rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500">
                    {ROLES.map(roleName => <option key={roleName} value={roleName}>{getRoleLabel(roleName)}</option>)}
                  </select>
                  <select value={candidateExperienceFilter} onChange={e => setCandidateExperienceFilter(e.target.value)} className="rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500">
                    {['All Candidates', 'Freshers', 'Experienced'].map(expType => <option key={expType} value={expType}>{expType}</option>)}
                  </select>
                  <select value={candidateStateFilter} onChange={e => setCandidateStateFilter(e.target.value)} className="rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500">
                    {candidateStates.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Only completed Job Seeker profiles are shown{!isSupabaseConfigured ? ' • Sample profiles are clearly labelled' : ''}</span>
                  <span>•</span><span>Contact only through Admin after candidate consent</span>
                </div>

                {filteredCandidateProfiles.length === 0 ? (
                  <div className="mt-5 rounded-3xl border bg-white p-10 text-center">
                    <SearchX className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-extrabold">No candidate profiles match these filters</p>
                    <p className="mt-1 text-xs text-slate-500">Try another role, state, company or HQ.</p>
                    <button onClick={() => { setCandidateSearch(''); setCandidateRoleFilter('All Roles'); setCandidateExperienceFilter('All Candidates'); setCandidateStateFilter('All India') }} className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">Clear Filters</button>
                  </div>
                ) : (
                  <>
                    <p className="mt-5 flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-xs font-bold text-sky-800"><Users className="h-4 w-4 shrink-0" /> Tap a candidate row — the full anonymous details will slide in from the side.</p>
                    <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      {filteredCandidateProfiles.map(candidate => renderCandidateListItem(candidate))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

        </section>
      )}

      {/* RECRUITERS PAGE */}
      {page === 'recruiters' && (
      <section id="recruiters" className="border-y bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-10">
          <div className="mb-6 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-center text-white shadow-xl sm:flex-row sm:text-left">
            <div className="flex-1">
              <p className="text-[22px] font-extrabold leading-tight">Hiring Pharma Field-Force Talent?</p>
              <p className="mt-1 text-sm opacity-90">Post FREE for Trainee MR to NSM roles, reach 50K+ pharma professionals, and shortlist anonymous Job Seeker profiles by experience, company, package, role & HQ. Vacancies go LIVE after Admin verification.</p>
            </div>
            <button onClick={() => navigate('postjob')} className="flex shrink-0 items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-lg font-extrabold text-slate-900 shadow-lg transition hover:bg-amber-300 active:scale-95">
              <Plus className="h-6 w-6" /> Post Vacancy
            </button>
          </div>
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-sky-100 bg-[#f8fbff] p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow"><Users className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-extrabold tracking-widest text-white">RECRUITER ONLY</span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold tracking-wide text-emerald-700"><EyeOff className="h-3 w-3" /> Name • Mobile • Email hidden</span>
              </div>
              <h3 className="mt-2 text-[22px] font-extrabold leading-tight">Candidates List</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Candidate profiles are not shown on this page. Open <b>Candidates List</b> from the menu, then tap a candidate to slide open the full anonymous details.</p>
            </div>
            {canViewCandidateProfiles ? (
              <button onClick={openCandidateProfiles} className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow hover:bg-slate-800"><Users className="h-4 w-4" /> Open Candidates List</button>
            ) : (
              <button onClick={() => enterAs('recruiter')} className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-extrabold text-white shadow hover:bg-sky-700"><LockKeyhole className="h-4 w-4" /> Recruiter Login</button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-gradient-to-br from-sky-50 to-indigo-50 p-6">
              <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">MANAGED BY</span>
              <div className="mt-4 flex gap-4">
                <img onClick={() => handleSecretTap()} src="/divakar-reddy-circle-400.jpg" className="h-20 w-20 shrink-0 cursor-pointer select-none aspect-square rounded-full object-cover object-center bg-[#e8e8e8] border-2 border-white shadow" alt="M Divakar Reddy" />
                <div>
                  <h3 className="text-xl font-extrabold">M Divakar Reddy</h3>
                  <p className="text-sm font-semibold text-sky-700">App Founder — PharmaSales Jobs</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">9+ years of pharma experience. Ex-Employee (Business Development Manager) at Wallace Pharmaceuticals Pvt. Ltd. Personally verifies every vacancy, mentors 50K+ pharma professionals.</p>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold border">{shouldHideJobSeekerExperience ? 'Candidate contact via Admin only' : '📞 +91 98XXX XXXXX (Pro unlock)'}</span>
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white p-3"><p className="text-lg font-extrabold">50K+</p><p className="text-xs text-slate-500">Field-Force Community</p></div>
                <div className="rounded-xl bg-white p-3"><p className="text-lg font-extrabold">2,400+</p><p className="text-xs text-slate-500">Vacancies verified</p></div>
                <div className="rounded-xl bg-white p-3"><p className="text-lg font-extrabold">18K</p><p className="text-xs text-slate-500">Placements</p></div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button onClick={() => navigate('postjob')} className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-sky-600 py-3.5 text-[15px] font-extrabold text-white shadow-lg transition hover:bg-sky-700 active:scale-[0.99]"><Plus className="h-5 w-5" /> Post Vacancy</button>
                <a href="https://wa.me/919999999999" target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp Recruiter</a>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h3 className="text-lg font-extrabold">Recruiter Dashboard</h3>
              <p className="text-sm text-slate-500">For pharma companies & stockist managers. Post once, reach 50k+ pharma professionals instantly.</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
                  <div><p className="text-sm font-bold">Post New Vacancy</p><p className="text-xs text-slate-500">Takes 2 mins • Goes LIVE after Admin approval</p></div>
                  <button onClick={() => navigate('postjob')} className="flex items-center gap-1.5 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-extrabold text-white shadow transition hover:bg-sky-700"><Plus className="h-4 w-4" /> Post Job</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4"><p className="text-xs font-bold text-slate-500">Active Posts</p><p className="mt-1 text-2xl font-extrabold">{jobs.length}</p><p className="text-xs text-emerald-600">↑ 3 this week</p></div>
                  <div className="rounded-xl border p-4"><p className="text-xs font-bold text-slate-500">Candidate Privacy</p><p className="mt-1 text-2xl font-extrabold">100%</p><p className="text-xs text-sky-600">Name • Mobile • Email hidden</p></div>
                </div>
                <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-extrabold"><Users className="h-4 w-4 text-sky-600" /> Candidates List</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-sky-700 shadow-sm">MENU ONLY</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">Profiles are kept inside the Candidates List page. Select a candidate there to slide open the full anonymous details.</p>
                  {canViewCandidateProfiles ? (
                    <button onClick={openCandidateProfiles} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800"><Users className="h-4 w-4" /> Open Candidates List</button>
                  ) : (
                    <button onClick={() => enterAs('recruiter')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-2.5 text-sm font-extrabold text-white hover:bg-sky-700"><LockKeyhole className="h-4 w-4" /> Recruiter Login to View</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
      {/* SAVED PAGE */}
      {page === 'saved' && !shouldHideJobSeekerExperience && (
        <section className="mx-auto max-w-[1280px] px-4 py-10">
          <h2 className="text-[22px] font-extrabold">Saved Vacancies</h2>
          <p className="text-sm text-slate-500">{saved.size} jobs saved</p>
          <div className="mt-4 grid gap-4">
            {Array.from(saved).length===0 ? (
              <div className="rounded-2xl border bg-white p-10 text-center">
                <Bookmark className="mx-auto h-10 w-10 text-slate-300"/>
                <p className="mt-2 text-sm font-bold">No saved jobs yet</p>
                <button onClick={() => navigate('jobs')} className="mt-3 rounded-full bg-sky-600 px-5 py-2 text-sm font-bold text-white">Browse Jobs</button>
              </div>
            ) : (
              jobs.filter(j=>saved.has(j.id)).map(job=>(
                <div key={job.id} className="rounded-2xl border bg-white p-4">
                  <p className="font-bold">{getDisplayCompany(job)} • {job.title}</p>
                  <p className="text-sm text-slate-500">{job.hq} • {job.ctc}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={()=>setSelected(job)} className="flex-1 rounded-full border py-2 text-sm font-bold">View</button>
                    <button onClick={()=>handleApply(job)} className={`flex-1 rounded-full py-2 text-sm font-bold text-white ${applied.has(job.id) ? 'bg-emerald-600' : 'bg-sky-600'}`}>{applied.has(job.id) ? 'Applied' : applyAdJob?.id === job.id ? 'Ad Playing…' : 'Apply Now'}</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
      {/* POST A VACANCY PAGE — Recruiters submit, Admin approves before LIVE */}
      {page === 'postjob' && (
        <section className="mx-auto max-w-[1280px] px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">FOR RECRUITERS</span>
              <h2 className="mt-3 text-[26px] font-extrabold leading-tight">Post a Vacancy</h2>
              <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-slate-600">Free to submit. Your vacancy goes <b>LIVE only after verification &amp; approval by M Divakar Reddy (Admin)</b> — usually within 2 hours.</p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border bg-white p-3"><p className="text-lg font-extrabold text-sky-600">1</p><p className="text-xs font-bold">Fill the Form</p><p className="text-[11px] text-slate-500">Takes 2 minutes</p></div>
              <div className="rounded-2xl border bg-white p-3"><p className="text-lg font-extrabold text-amber-500">2</p><p className="text-xs font-bold">Admin Verifies</p><p className="text-[11px] text-slate-500">Divakar Reddy calls you</p></div>
              <div className="rounded-2xl border bg-white p-3"><p className="text-lg font-extrabold text-emerald-600">3</p><p className="text-xs font-bold">Goes LIVE ✅</p><p className="text-[11px] text-slate-500">Visible to 50K+ professionals</p></div>
            </div>

            {recruiterSubmitted ? (
              <div className="mt-5 rounded-3xl border bg-white p-8 text-center shadow-lg">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"><Check className="h-8 w-8 text-emerald-600" /></div>
                <h3 className="mt-3 text-xl font-extrabold">Submitted Successfully! 🎉</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">Your <b>{recruiterJob.company}</b> vacancy is now <b className="text-amber-600">⏳ Pending Admin Approval</b>. It is <b>not live yet</b>.</p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-600">M Divakar Reddy will call <b>{recruiterJob.contactPerson}</b> on <b>{recruiterJob.phone}</b> to verify. After approval, it appears on the Jobs page with a Verified badge.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button onClick={resetRecruiterForm} className="flex items-center gap-1.5 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Post Another Vacancy</button>
                  {shouldHideJobSeekerExperience ? (
                    <button onClick={openCandidateProfiles} className="rounded-full border px-5 py-2.5 text-sm font-bold">Open Candidates List</button>
                  ) : (
                    <button onClick={() => navigate('jobs')} className="rounded-full border px-5 py-2.5 text-sm font-bold">See Live Jobs</button>
                  )}
                </div>
              </div>
            ) : (
              <form className="mt-5 rounded-3xl border bg-white p-5 shadow-lg sm:p-6" onSubmit={e => { e.preventDefault(); handleRecruiterSubmit() }}>
                <p className="text-sm font-extrabold text-slate-900">📋 Vacancy Details</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Company Name *</label><input value={recruiterJob.company} onChange={e => setRecruiterJob({ ...recruiterJob, company: e.target.value })} placeholder="e.g. Sun Pharma" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Job Title</label><input value={recruiterJob.title} onChange={e => setRecruiterJob({ ...recruiterJob, title: e.target.value })} placeholder="Medical Representative" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Division</label><input value={recruiterJob.division} onChange={e => setRecruiterJob({ ...recruiterJob, division: e.target.value })} placeholder="e.g. Cardio Diabetic" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Role</label><select value={recruiterJob.type} onChange={e => setRecruiterJob({ ...recruiterJob, type: e.target.value as Job['type'] })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">{JOB_ROLES.map(roleName => <option key={roleName} value={roleName}>{getRoleLabel(roleName)}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">State</label><select value={recruiterJob.state} onChange={e => setRecruiterJob({ ...recruiterJob, state: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">{LOCATIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">City (HQ)</label><input value={recruiterJob.city} onChange={e => setRecruiterJob({ ...recruiterJob, city: e.target.value })} placeholder="e.g. Hyderabad" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">HQ Area (optional)</label><input value={recruiterJob.area} onChange={e => setRecruiterJob({ ...recruiterJob, area: e.target.value })} placeholder="e.g. Ameerpet → Hyderabad - Ameerpet" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Experience Required</label><select value={recruiterJob.exp} onChange={e => setRecruiterJob({ ...recruiterJob, exp: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">{VACANCY_EXPERIENCE_OPTIONS.map(expOption => <option key={expOption} value={expOption}>{expOption}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">CTC / Salary *</label><input value={recruiterJob.ctc} onChange={e => setRecruiterJob({ ...recruiterJob, ctc: e.target.value })} placeholder="e.g. ₹3.5 - 4.5 LPA + TA/DA" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">No. of Openings</label><input type="number" min="1" value={recruiterJob.vacancies} onChange={e => setRecruiterJob({ ...recruiterJob, vacancies: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div className="sm:col-span-2"><label className="mb-1 block text-xs font-bold text-slate-600">Qualification</label><input value={recruiterJob.qual} onChange={e => setRecruiterJob({ ...recruiterJob, qual: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div className="sm:col-span-2"><label className="mb-1 block text-xs font-bold text-slate-600">Job Description</label><textarea value={recruiterJob.desc} onChange={e => setRecruiterJob({ ...recruiterJob, desc: e.target.value })} rows={3} placeholder="Role details, HQ coverage, requirements..." className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2"><input type="checkbox" checked={recruiterJob.urgent} onChange={e => setRecruiterJob({ ...recruiterJob, urgent: e.target.checked })} className="h-4 w-4" /> Mark as Urgent Hiring</label>
                </div>
                <p className="mt-5 text-sm font-extrabold text-slate-900">👤 Your Contact Details <span className="text-xs font-semibold text-slate-500">(Admin will call to verify • shown to candidates only after they unlock)</span></p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Your Name &amp; Designation *</label><input value={recruiterJob.contactPerson} onChange={e => setRecruiterJob({ ...recruiterJob, contactPerson: e.target.value })} placeholder="e.g. Ramesh Reddy - Regional Manager" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Mobile Number *</label><input value={recruiterJob.phone} onChange={e => setRecruiterJob({ ...recruiterJob, phone: e.target.value })} placeholder="+91 98XXX XXXXX" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div className="sm:col-span-2"><label className="mb-1 block text-xs font-bold text-slate-600">Email</label><input value={recruiterJob.email} onChange={e => setRecruiterJob({ ...recruiterJob, email: e.target.value })} placeholder="hr@company.com" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                </div>
                <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white shadow hover:bg-sky-700"><Send className="h-4 w-4" /> Submit for Admin Approval</button>
                <p className="mt-2 text-center text-xs text-slate-500">By submitting, you confirm this is a genuine vacancy. Fake/duplicate posts are rejected by Admin.</p>
              </form>
            )}

            <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-white p-4">
              <img onClick={() => handleSecretTap()} src="/divakar-reddy-circle-100.jpg" alt="M Divakar Reddy" className="h-11 w-11 shrink-0 cursor-pointer select-none aspect-square rounded-full object-cover object-center border-2 border-white shadow" />
              <p className="text-xs leading-relaxed text-slate-600"><b className="text-slate-900">Every vacancy is personally verified by M Divakar Reddy</b> (App Founder • 9+ Years Pharma Experience) before it goes live — that is why 50K+ pharma professionals trust PharmaSales Jobs.</p>
              <BadgeCheck className="ml-auto h-6 w-6 shrink-0 text-sky-600" />
            </div>
          </div>
        </section>
      )}
      {/* LEGAL & SUPPORT — Privacy Policy, Terms & Privacy and Contact Support inside the app */}
      {page === 'legal' && (
        <section className="mx-auto max-w-[1100px] px-4 py-8">
          <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold tracking-widest text-sky-700">LEGAL &amp; SUPPORT</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold tracking-widest">SINCE 2026</span>
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-extrabold tracking-widest text-slate-900">UPDATED {LEGAL_POLICY_DATE}</span>
                </div>
                <h2 className="mt-3 text-[28px] font-extrabold leading-tight sm:text-[34px]">Privacy, Terms &amp; User Support</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-sky-50">Read the complete Privacy Policy and Terms &amp; Privacy inside the app. For account, profile, vacancy, subscription or technical help, contact support or raise a ticket from AI Assistant with a proper reason.</p>
                <a href={buildSupportMailto()} className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-sky-700 shadow hover:bg-sky-50"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{SUPPORT_EMAIL}</span></a>
              </div>
              <div className="shrink-0 rounded-3xl bg-white/15 p-4 backdrop-blur lg:w-[280px]">
                <div className="flex items-center gap-3">
                  <img src="/divakar-reddy-circle-100.jpg" alt="M Divakar Reddy" className="h-12 w-12 aspect-square rounded-full border-2 border-white object-cover object-center shadow" />
                  <div>
                    <p className="text-[10px] font-extrabold tracking-widest text-sky-100">SUPPORT ADMIN</p>
                    <p className="text-sm font-extrabold">M Divakar Reddy</p>
                    <p className="text-xs text-sky-100">App Founder — PharmaSales Jobs</p>
                  </div>
                </div>
                <button onClick={() => { if (isAdmin) openAdmin('support'); else navigate(currentUser ? getAccountDestination(currentUser) : entryRole ? 'auth' : 'welcome') }} className="mt-4 w-full rounded-full bg-slate-900 py-2.5 text-xs font-extrabold text-white shadow hover:bg-slate-800">{isAdmin ? 'Open Admin Support' : currentUser ? 'Open My App' : entryRole ? 'Open Login' : 'Open Welcome'}</button>
              </div>
            </div>
          </div>

          <div className={`sticky ${isIsolatedShellPage ? 'top-3' : isAdFree ? 'top-[72px]' : 'top-[109px]'} z-10 mt-5 grid grid-cols-3 gap-1 rounded-full border bg-white p-1 shadow-sm`}>
            <button onClick={() => setLegalTab('privacy')} className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-xs font-extrabold sm:text-sm ${legalTab === 'privacy' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><ShieldCheck className="hidden h-4 w-4 sm:block" /> Privacy Policy</button>
            <button onClick={() => setLegalTab('terms')} className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-xs font-extrabold sm:text-sm ${legalTab === 'terms' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><FileText className="hidden h-4 w-4 sm:block" /> Terms &amp; Privacy</button>
            <button onClick={() => setLegalTab('support')} className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-xs font-extrabold sm:text-sm ${legalTab === 'support' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><MessageCircle className="hidden h-4 w-4 sm:block" /> Contact Support</button>
          </div>

          {legalTab !== 'support' ? (
            <article className="mt-5 rounded-[28px] border bg-white p-5 shadow-sm sm:p-8">
              <div className="border-b pb-5">
                <p className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-sky-700">{legalTab === 'privacy' ? <ShieldCheck className="h-4 w-4" /> : <FileText className="h-4 w-4" />} PHARMASALES JOBS • THE MR TO NSM JOBS NETWORK</p>
                <h3 className="mt-2 text-[26px] font-extrabold leading-tight">{legalTab === 'privacy' ? 'Privacy Policy' : 'Terms & Privacy'}</h3>
                <p className="mt-1 text-sm text-slate-500">Effective from {LEGAL_POLICY_DATE} • Managed by M Divakar Reddy, App Founder — PharmaSales Jobs</p>
                <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-relaxed text-sky-900">
                  {legalTab === 'privacy'
                    ? 'Your privacy matters. This policy explains what information PharmaSales Jobs collects, how it is used, when it is shared and how you can contact support for correction, privacy or account-deletion help.'
                    : 'Please read these terms carefully. They explain account rules, Job Seeker and Recruiter responsibilities, Admin approval, sponsored ads, AI Assistant use, support tickets, prohibited activity and account deletion.'}
                </div>
              </div>
              <div className="divide-y">
                {(legalTab === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS).map(section => (
                  <section key={section.title} className="py-5 first:pt-6 last:pb-0">
                    <h4 className="text-base font-extrabold text-slate-900">{section.title}</h4>
                    {section.intro && <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.intro}</p>}
                    <ul className="mt-3 space-y-2.5">
                      {section.bullets.map(point => (
                        <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-slate-700"><Check className="mt-1 h-4 w-4 shrink-0 text-sky-600" /><span>{point}</span></li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-slate-900 p-5 text-white sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-sm font-extrabold">Have a question about {legalTab === 'privacy' ? 'privacy' : 'these terms'}?</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">Raise a support ticket from AI Assistant with a proper reason or email {SUPPORT_EMAIL}.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button onClick={() => { navigate('ai'); openSupportTicket('ai') }} className="rounded-full bg-sky-500 px-4 py-2.5 text-xs font-extrabold text-white shadow hover:bg-sky-400">Raise Ticket in AI Chat</button>
                  <button onClick={() => setLegalTab('support')} className="rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-slate-900 shadow">Contact Support</button>
                </div>
              </div>
            </article>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div className="rounded-[28px] border bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow"><Mail className="h-6 w-6" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold tracking-widest text-sky-700">OFFICIAL SUPPORT EMAIL</p>
                      <a href={buildSupportMailto()} className="mt-1 block break-all text-lg font-extrabold text-slate-900 hover:text-sky-700">{SUPPORT_EMAIL}</a>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">For account, profile, job application, recruiter approval, subscription/ad, privacy or technical support. Mention your registered mobile number and ticket number for faster help.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <a href={buildSupportMailto()} className="flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-3 text-xs font-extrabold text-white shadow hover:bg-slate-800"><Mail className="h-4 w-4" /> Email Support</a>
                    <button onClick={() => { navigate('ai'); openSupportTicket('ai') }} className="flex items-center justify-center gap-1.5 rounded-full bg-sky-600 px-4 py-3 text-xs font-extrabold text-white shadow hover:bg-sky-700"><Sparkles className="h-4 w-4" /> Ticket in AI Chat</button>
                    <button onClick={() => openSupportTicket('support')} className="flex items-center justify-center gap-1.5 rounded-full border px-4 py-3 text-xs font-extrabold text-slate-700"><FileText className="h-4 w-4" /> Raise Ticket Now</button>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
                    <p className="rounded-xl bg-slate-50 p-3"><b className="block text-slate-900">Support Admin</b>M Divakar Reddy</p>
                    <p className="rounded-xl bg-slate-50 p-3"><b className="block text-slate-900">Ticket Tracking</b>AI Assistant → My Support Tickets</p>
                    <p className="rounded-xl bg-slate-50 p-3"><b className="block text-slate-900">Response Aim</b>Usually within 24–48 hours</p>
                  </div>
                </div>

                <div className="rounded-[28px] border bg-white p-6 shadow-sm">
                  <p className="text-base font-extrabold">How to raise a proper support ticket</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { n: '1', t: 'Open AI Assistant', d: 'Tap AI Assistant, then tap Raise Support Ticket. You can also type “raise support ticket” in AI Chat.' },
                      { n: '2', t: 'Select the correct proper reason', d: 'Choose login, profile, application, recruiter approval, subscription/ad, wrong vacancy, privacy or technical issue.' },
                      { n: '3', t: 'Explain clearly', d: 'Write your registered mobile, job/company/HQ or screen name, what happened and what help you need.' },
                      { n: '4', t: 'Save your ticket number', d: 'Use the ticket number in follow-up emails to akhildivakara@gmail.com so Admin can find your request quickly.' },
                    ].map(step => (
                      <div key={step.n} className="flex gap-3 rounded-2xl bg-sky-50/70 p-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-extrabold text-white">{step.n}</span>
                        <div><p className="text-sm font-extrabold">{step.t}</p><p className="mt-0.5 text-xs leading-relaxed text-slate-600">{step.d}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                    <p className="flex items-center gap-2 font-extrabold"><AlertTriangle className="h-4 w-4" /> Safety reminder</p>
                    <p className="mt-1">Never share OTPs, passwords, bank details or unnecessary original documents. Never pay money to anyone promising a job. Report suspicious vacancies immediately through a support ticket.</p>
                  </div>
                  <div className="mt-5 border-t pt-5">
                    <p className="text-sm font-extrabold">Frequently Asked Questions</p>
                    <div className="mt-3 space-y-2">
                      {[
                        { q: 'Where are my account options?', a: 'Use the Account menu in the top menu bar on desktop, or My Account & Plan in the mobile menu. Job profile, account deletion and logout are kept there so the main pages stay clean.' },
                        { q: 'Is the Free plan really free?', a: 'Yes. Free gives 3 daily full-contact unlocks. After those, 7 extra jobs open with separate sponsored reveals for company, manager name and contact number. Apply Now plays a sponsored ad on Free, Starter and Pro.' },
                        { q: 'How are vacancies verified?', a: 'Recruiter-submitted vacancies are reviewed by Admin M Divakar Reddy before they go LIVE. Still verify the company, role, CTC and interview details before joining, and never pay money for a job.' },
                        { q: 'How can AI Assistant help me?', a: 'Open AI Assistant from the menu for resume wording, interview preparation, RCPA and salary guidance. You can also raise a support ticket there with a proper reason.' },
                        { q: 'Will I stay logged in?', a: 'Yes. The app opens directly to your account until you logout. After logout, enter your mobile number: existing accounts open directly, and new users are asked for name and email.' },
                      ].map(f => (
                        <div key={f.q} className="rounded-2xl bg-slate-50 p-3.5">
                          <p className="text-sm font-extrabold">{f.q}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{f.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-extrabold">My Support Tickets</p>
                    <p className="text-xs leading-relaxed text-slate-500">{currentUser ? `Showing tickets for +91 ${currentUser.mobile}.` : 'Tickets raised on this device are shown here.'}</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">{mySupportTickets.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {mySupportTickets.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center">
                      <MessageCircle className="mx-auto h-9 w-9 text-slate-400" />
                      <p className="mt-2 text-sm font-extrabold">No support tickets yet</p>
                      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">Raise your first ticket from AI Chat with a proper reason and Admin will review it.</p>
                      <button onClick={() => { navigate('ai'); openSupportTicket('ai') }} className="mt-4 rounded-full bg-sky-600 px-5 py-2.5 text-xs font-extrabold text-white shadow hover:bg-sky-700">Raise Ticket in AI Chat</button>
                    </div>
                  ) : mySupportTickets.map(ticket => renderSupportTicketSummary(ticket))}
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                  <p><b className="text-slate-900">Common reasons:</b> Login issue, Job Seeker profile issue, Apply Now problem, recruiter vacancy approval, subscription/ad issue, wrong vacancy, account deletion help, privacy request or technical problem.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ADMIN PAGE — M Divakar Reddy */}
      {page === 'admin' && (
        <section className="mx-auto max-w-[1280px] px-4 py-10">
          {!isAdmin ? (
            <div className="mx-auto max-w-md">
              <div className="mb-4 flex items-center gap-3">
                <button type="button" onClick={handleExitAdminLogin} aria-label="Go back" title="Go back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"><ArrowLeft className="h-5 w-5" strokeWidth={2.5} /></button>
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-sky-100 bg-white px-2.5 py-2 shadow-sm min-[420px]:gap-3 min-[420px]:px-3" aria-label="PharmaSales Jobs — The MR to NSM Jobs Network">
                  <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-10 w-10 shrink-0 rounded-full bg-white ring-1 ring-sky-100 object-cover shadow min-[420px]:h-11 min-[420px]:w-11" />
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-extrabold leading-none tracking-tight text-slate-900 min-[420px]:text-[18px]">PharmaSales Jobs</p>
                    <p className="mt-1 truncate text-[8px] font-semibold leading-none tracking-wide text-sky-700 min-[420px]:text-[9px]">The MR to NSM Jobs Network</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-white p-6 shadow-xl">
                <div className="text-center">
                  <img onClick={() => handleSecretTap()} src="/divakar-reddy-circle-200.jpg" alt="M Divakar Reddy — Admin" className="mx-auto h-24 w-24 cursor-pointer select-none aspect-square rounded-full object-cover object-center border-4 border-sky-100 shadow" />
                  <span className="mt-3 inline-block rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold tracking-wide text-slate-900">👑 ADMIN ONLY</span>
                  <h2 className="mt-2 text-2xl font-extrabold">Admin Login</h2>
                  <p className="text-sm font-semibold text-sky-700">M Divakar Reddy</p>
                  <p className="text-xs text-slate-500">App Founder — PharmaSales Jobs • Admin</p>
                </div>
                <form className="mt-5 space-y-3" onSubmit={e => { e.preventDefault(); handleAdminLogin() }}>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Admin ID</label>
                    <input value={adminId} onChange={e => setAdminId(e.target.value)} placeholder="divakar" autoCapitalize="none" autoComplete="username" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Password</label>
                    <div className="relative">
                      <input type={showAdminPass ? 'text' : 'password'} value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Enter admin password" autoComplete="current-password" className="w-full rounded-xl border bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:border-sky-500" />
                      <button type="button" onClick={() => setShowAdminPass(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:bg-slate-100">{showAdminPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  {adminError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{adminError}</p>}
                  <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white shadow hover:bg-sky-700"><LogIn className="h-4 w-4" /> Login to Dashboard</button>
                </form>
                {storedAdminPassword() === DEFAULT_ADMIN_PASSWORD && (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-center text-xs leading-relaxed text-slate-700">
                    <p className="font-extrabold">First-time login (default)</p>
                    <p>Use your private Admin ID and password.</p>
                    <p className="text-slate-500">After login, change it in Dashboard → Settings.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-extrabold">How to login? (3 steps)</p>
                <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
                  <li><b>1.</b> Tap the <b>logo or Divakar Reddy’s photo 5 times</b> quickly (secret — no button is shown)</li>
                  <li><b>2.</b> Enter Admin ID <b>divakar</b> and your password</li>
                  <li><b>3.</b> Your <b>Admin Dashboard</b> opens — post &amp; manage vacancies</li>
                </ol>
                <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Only Divakar Reddy is the Admin. Job Seekers and Recruiters stay logged in until logout; after logout they login with their mobile number.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button onClick={() => openAdmin('overview')} aria-label="PharmaSales Jobs Admin overview" className="flex min-w-0 items-center gap-3 rounded-2xl border border-sky-100 bg-white px-3 py-2 text-left shadow-sm">
                  <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-11 w-11 shrink-0 rounded-full bg-white ring-1 ring-sky-100 object-cover shadow" />
                  <span className="min-w-0">
                    <span className="block truncate text-[18px] font-extrabold leading-none tracking-tight text-slate-900">PharmaSales Jobs</span>
                    <span className="mt-1 block truncate text-[9px] font-semibold leading-none tracking-wide text-sky-700">The MR to NSM Jobs Network</span>
                  </span>
                </button>
                <span className="ml-auto rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-extrabold tracking-widest text-white">ADMIN WORKSPACE</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 p-5 text-white shadow-lg">
                <img src="/divakar-reddy-circle-200.jpg" alt="M Divakar Reddy — Admin" className="h-16 w-16 shrink-0 aspect-square rounded-full object-cover object-center border-2 border-white shadow" />
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold">M Divakar Reddy</h2>
                    <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-900">👑 ADMIN</span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">App Founder</span>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold"><span className="h-1.5 w-1.5 rounded-full bg-white" /> Logged in</span>
                  </div>
                  <p className="mt-1 text-sm opacity-90">Admin Dashboard — you have full access: post vacancies, delete jobs, unlimited contact reveal.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('home')} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900">Preview Job Seeker Website</button>
                  <button onClick={handleAdminLogout} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"><LogOut className="h-3.5 w-3.5" /> Logout</button>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setAdminTab('overview')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${adminTab==='overview' ? 'bg-slate-900 text-white' : 'border bg-white'}`}><LayoutDashboard className="h-4 w-4" /> Overview</button>
                <button onClick={() => setAdminTab('post')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${adminTab==='post' ? 'bg-slate-900 text-white' : 'border bg-white'}`}><Plus className="h-4 w-4" /> Post Vacancy</button>
                <button onClick={() => setAdminTab('approvals')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${adminTab==='approvals' ? 'bg-slate-900 text-white' : 'border bg-white'}`}><Clock3 className="h-4 w-4" /> Approvals{pendingJobs.length > 0 && <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-900">{pendingJobs.length}</span>}</button>
                <button onClick={() => setAdminTab('accounts')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${adminTab==='accounts' ? 'bg-slate-900 text-white' : 'border bg-white'}`}><FileText className="h-4 w-4" /> Account Requests{pendingDeletionRequests.length > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{pendingDeletionRequests.length}</span>}</button>
                <button onClick={() => setAdminTab('support')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${adminTab==='support' ? 'bg-slate-900 text-white' : 'border bg-white'}`}><MessageCircle className="h-4 w-4" /> Support Tickets{openSupportTickets.length > 0 && <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{openSupportTickets.length}</span>}</button>
                <button onClick={() => setAdminTab('manage')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${adminTab==='manage' ? 'bg-slate-900 text-white' : 'border bg-white'}`}><Briefcase className="h-4 w-4" /> Manage Vacancies ({jobs.length})</button>
                <button onClick={() => setAdminTab('settings')} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${adminTab==='settings' ? 'bg-slate-900 text-white' : 'border bg-white'}`}><Settings className="h-4 w-4" /> Settings</button>
              </div>

              {adminTab === 'overview' && (
                <div>
                  {pendingJobs.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                      <Clock3 className="h-6 w-6 shrink-0 text-amber-600" />
                      <p className="flex-1 text-sm"><b>{pendingJobs.length} recruiter {pendingJobs.length === 1 ? 'vacancy is' : 'vacancies are'} waiting for your approval.</b> <span className="text-slate-600">They are NOT live yet — approve to publish.</span></p>
                      <button onClick={() => setAdminTab('approvals')} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">Review Now</button>
                    </div>
                  )}
                  {pendingDeletionRequests.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <FileText className="h-6 w-6 shrink-0 text-red-500" />
                      <p className="flex-1 text-sm"><b>{pendingDeletionRequests.length} Job Seeker account-deletion {pendingDeletionRequests.length === 1 ? 'request is' : 'requests are'} waiting.</b> <span className="text-slate-600">Delete an account only if the user has given a proper reason.</span></p>
                      <button onClick={() => setAdminTab('accounts')} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">Review Requests</button>
                    </div>
                  )}
                  {openSupportTickets.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <MessageCircle className="h-6 w-6 shrink-0 text-sky-600" />
                      <p className="flex-1 text-sm"><b>{openSupportTickets.length} user support {openSupportTickets.length === 1 ? 'ticket needs' : 'tickets need'} attention.</b> <span className="text-slate-600">Users raise tickets from AI Chat with a proper reason.</span></p>
                      <button onClick={() => setAdminTab('support')} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">Review Tickets</button>
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold text-slate-500">Live Vacancies</p><p className="mt-1 text-3xl font-extrabold">{jobs.length}</p><p className="text-xs font-semibold text-emerald-600">Showing on Jobs page</p></div>
                    <div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold text-slate-500">Companies</p><p className="mt-1 text-3xl font-extrabold">{Array.from(new Set(jobs.map(j => j.company))).length}</p><p className="text-xs font-semibold text-sky-600">Pharma companies</p></div>
                    <div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold text-slate-500">Cities / HQs</p><p className="mt-1 text-3xl font-extrabold">{Array.from(new Set(jobs.map(j => j.hq))).length}</p><p className="text-xs font-semibold text-sky-600">{Array.from(new Set(jobs.map(j => j.state))).length} states covered</p></div>
                    <div className="rounded-2xl border bg-white p-4"><p className="text-xs font-bold text-slate-500">Applications</p><p className="mt-1 text-3xl font-extrabold">{applied.size}</p><p className="text-xs font-semibold text-slate-500">Current session</p></div>
                  </div>
                  <div className="mt-4 rounded-2xl border bg-white p-5">
                    <p className="text-sm font-extrabold">👑 Your Admin Powers (active now)</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Post a new vacancy — goes LIVE instantly</p>
                      <p className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Unlimited contact reveal — no ad, no unlock limit</p>
                      <p className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Delete / remove any vacancy</p>
                      <p className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Approve / reject recruiter-submitted vacancies</p>
                      <p className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Review Job Seeker account-deletion requests</p>
                      <p className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Review &amp; update AI Chat support tickets</p>
                      <p className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Change admin password anytime</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => setAdminTab('post')} className="flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Post New Vacancy</button>
                      <button onClick={() => setAdminTab('manage')} className="rounded-full border px-4 py-2 text-sm font-bold">Manage Vacancies</button>
                      <button onClick={() => navigate('jobs')} className="rounded-full border px-4 py-2 text-sm font-bold">See Jobs Page</button>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border bg-white p-5">
                    <p className="text-sm font-extrabold">Latest Vacancies</p>
                    <div className="mt-3 space-y-2">
                      {jobs.slice(0, 5).map(job => (
                        <div key={job.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white" style={{ background: job.color }}>{job.company.slice(0, 2).toUpperCase()}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{job.company} • {job.title} {job.id.startsWith('admin-') && <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Posted by you</span>}</p>
                            <p className="truncate text-xs text-slate-500">{job.hq} • {job.ctc} • {job.posted}</p>
                          </div>
                          <button onClick={() => setSelected(job)} className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-bold">View</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'post' && (
                <form className="mt-4 rounded-2xl border bg-white p-5" onSubmit={e => { e.preventDefault(); handlePostJob() }}>
                  <p className="text-base font-extrabold">Post New Vacancy</p>
                  <p className="text-xs text-slate-500">Fields marked * are required. As ADMIN, your vacancy goes LIVE instantly (recruiters' vacancies come to the Approvals tab first).</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Company Name *</label><input value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} placeholder="e.g. Sun Pharma" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Job Title</label><input value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} placeholder="Medical Representative" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Division</label><input value={newJob.division} onChange={e => setNewJob({ ...newJob, division: e.target.value })} placeholder="e.g. Cardio Diabetic" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Role</label><select value={newJob.type} onChange={e => setNewJob({ ...newJob, type: e.target.value as Job['type'] })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">{JOB_ROLES.map(roleName => <option key={roleName} value={roleName}>{getRoleLabel(roleName)}</option>)}</select></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">State</label><select value={newJob.state} onChange={e => setNewJob({ ...newJob, state: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">{LOCATIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">City</label><input value={newJob.city} onChange={e => setNewJob({ ...newJob, city: e.target.value })} placeholder="e.g. Hyderabad" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">HQ Area (optional)</label><input value={newJob.area} onChange={e => setNewJob({ ...newJob, area: e.target.value })} placeholder="e.g. Ameerpet → HQ becomes Hyderabad - Ameerpet" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Experience</label><select value={newJob.exp} onChange={e => setNewJob({ ...newJob, exp: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500">{VACANCY_EXPERIENCE_OPTIONS.map(expOption => <option key={expOption} value={expOption}>{expOption}</option>)}</select></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">CTC / Salary *</label><input value={newJob.ctc} onChange={e => setNewJob({ ...newJob, ctc: e.target.value })} placeholder="e.g. ₹3.5 - 4.5 LPA + TA/DA" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">No. of Openings</label><input type="number" min="1" value={newJob.vacancies} onChange={e => setNewJob({ ...newJob, vacancies: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Qualification</label><input value={newJob.qual} onChange={e => setNewJob({ ...newJob, qual: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Person</label><input value={newJob.contactPerson} onChange={e => setNewJob({ ...newJob, contactPerson: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Phone *</label><input value={newJob.phone} onChange={e => setNewJob({ ...newJob, phone: e.target.value })} placeholder="+91 98XXX XXXXX" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Email</label><input value={newJob.email} onChange={e => setNewJob({ ...newJob, email: e.target.value })} placeholder="hr@company.com" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-xs font-bold text-slate-600">Job Description</label><textarea value={newJob.desc} onChange={e => setNewJob({ ...newJob, desc: e.target.value })} rows={3} placeholder="Write about the role, HQ coverage, requirements..." className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2"><input type="checkbox" checked={newJob.urgent} onChange={e => setNewJob({ ...newJob, urgent: e.target.checked })} className="h-4 w-4" /> Mark as Urgent Hiring</label>
                  </div>
                  <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white shadow hover:bg-sky-700"><Plus className="h-4 w-4" /> Publish Vacancy (Go Live)</button>
                </form>
              )}

              {adminTab === 'approvals' && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <p className="flex items-center gap-2 text-base font-extrabold"><Clock3 className="h-5 w-5 text-amber-600" /> Pending Approvals ({pendingJobs.length})</p>
                  <p className="mt-1 text-xs text-slate-500">Recruiters submitted these vacancies. They are <b>NOT live</b> and job seekers cannot see them. Verify the recruiter (call/WhatsApp), then <b>Approve &amp; Publish</b> to make it live — or Reject.</p>
                  <div className="mt-4 space-y-3">
                    {pendingJobs.length === 0 && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <BadgeCheck className="mx-auto h-9 w-9 text-emerald-500" />
                        <p className="mt-2 text-sm font-bold">No pending vacancies</p>
                        <p className="text-xs text-slate-500">When a recruiter posts a vacancy, it will appear here for your approval.</p>
                      </div>
                    )}
                    {pendingJobs.map(job => (
                      <div key={job.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white" style={{ background: job.color }}>{job.company.slice(0, 2).toUpperCase()}</div>
                          <div className="min-w-[220px] flex-1">
                            <p className="text-sm font-extrabold">{job.company} • {job.title} <span className="ml-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-900">⏳ PENDING</span>{job.urgent && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Urgent</span>}</p>
                            <p className="text-xs text-slate-600">{job.division} • {job.hq} ({job.state}) • {job.type} • {job.exp}</p>
                            <p className="text-xs font-semibold text-slate-700">{job.ctc} • {job.vacancies} opening{job.vacancies > 1 ? 's' : ''} • {job.qual}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">{job.desc}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs">
                          <span><b>Submitted by:</b> {job.submittedBy}</span><span className="text-slate-300">|</span>
                          <span><b>Phone:</b> {job.phone}</span><span className="text-slate-300">|</span>
                          <span><b>Email:</b> {job.email}</span><span className="text-slate-300">|</span>
                          <span className="text-slate-500">{job.submittedAt}</span>
                          <span className="ml-auto flex gap-2">
                            <a href={`tel:${job.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 font-bold text-white"><Phone className="h-3 w-3" /> Call to Verify</a>
                            <a href={`https://wa.me/${job.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I am M Divakar Reddy from PharmaSales Jobs. Verifying your ' + job.company + ' vacancy at ' + job.hq)}`} target="_blank" className="flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 font-bold text-white"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button onClick={() => setSelected(job)} className="rounded-full border bg-white px-4 py-2 text-xs font-bold">View Full Details</button>
                          <button onClick={() => handleRejectJob(job.id)} className="ml-auto flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white"><X className="h-3.5 w-3.5" /> Reject</button>
                          <button onClick={() => handleApproveJob(job)} className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow"><Check className="h-3.5 w-3.5" /> Approve &amp; Publish LIVE</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">Review every recruiter submission carefully before approval.</p>
                </div>
              )}

              {adminTab === 'accounts' && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <p className="flex items-center gap-2 text-base font-extrabold"><FileText className="h-5 w-5 text-red-500" /> Job Seeker Account Deletion Requests ({pendingDeletionRequests.length} pending)</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Job Seekers cannot delete their account directly. They raise a request from their account with a reason. <b>Approve &amp; Delete</b> only when the reason is proper; otherwise Reject and the account will remain active.</p>
                  <div className="mt-4 space-y-3">
                    {pendingDeletionRequests.length === 0 && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <BadgeCheck className="mx-auto h-9 w-9 text-emerald-500" />
                        <p className="mt-2 text-sm font-bold">No pending deletion requests</p>
                        <p className="text-xs text-slate-500">When a Job Seeker raises an account-deletion request, it will appear here.</p>
                      </div>
                    )}
                    {pendingDeletionRequests.map(req => (
                      <div key={req.id} className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-extrabold text-white">{req.name.trim().charAt(0).toUpperCase()}</div>
                          <div className="min-w-[220px] flex-1">
                            <p className="text-sm font-extrabold">{req.name} <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">JOB SEEKER</span> <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">DELETION REQUEST</span></p>
                            <p className="text-xs text-slate-600">+91 {req.mobile} • {req.email}</p>
                            <p className="text-[11px] text-slate-500">Account created: {new Date(req.accountCreatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Requested: {req.requestedAt}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-xl bg-white p-3">
                          <p className="text-[10px] font-extrabold tracking-widest text-slate-400">REASON GIVEN BY JOB SEEKER</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">{req.reasonCategory}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-700">{req.reasonDetails}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a href={`tel:+91${req.mobile}`} className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white"><Phone className="h-3 w-3" /> Call User</a>
                          <a href={`https://wa.me/91${req.mobile}?text=${encodeURIComponent('Hi ' + req.name + ', I am M Divakar Reddy from PharmaSales Jobs. I am reviewing your account deletion request.')}`} target="_blank" className="flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
                          <button onClick={() => handleRejectDeletionRequest(req)} className="ml-auto flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600"><X className="h-3.5 w-3.5" /> Reject Request</button>
                          <button onClick={() => handleApproveDeletionRequest(req)} className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow"><Trash2 className="h-3.5 w-3.5" /> Approve &amp; Delete Account</button>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold text-red-600">Approval permanently deletes this Job Seeker account and frees the mobile number.</p>
                      </div>
                    ))}
                  </div>
                  {rejectedDeletionRequests.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-extrabold text-slate-700">Rejected Requests</p>
                      <div className="mt-2 space-y-2">
                        {rejectedDeletionRequests.map(req => (
                          <div key={req.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                            <span className="font-extrabold">{req.name}</span>
                            <span className="text-slate-500">+91 {req.mobile}</span>
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 font-bold text-slate-600">REJECTED</span>
                            <span className="min-w-[180px] flex-1 text-slate-600">{req.reasonCategory}: {req.reasonDetails}</span>
                            <span className="text-slate-400">{req.reviewedAt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">Approve deletion only when the Job Seeker has given a proper reason.</p>
                </div>
              )}

              {adminTab === 'support' && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-base font-extrabold"><MessageCircle className="h-5 w-5 text-sky-600" /> User Support Tickets ({supportTickets.length})</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">Tickets raised by users through <b>AI Assistant → Raise Support Ticket</b> or Contact Support. Users must select a proper reason and explain the issue clearly.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-extrabold">
                      <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">{supportTickets.filter(t => t.status === 'open').length} Open</span>
                      <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-800">{supportTickets.filter(t => t.status === 'in-progress').length} In Progress</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">{supportTickets.filter(t => t.status === 'resolved').length} Resolved</span>
                      <a href={buildSupportMailto()} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-white"><Mail className="h-3.5 w-3.5" /> {SUPPORT_EMAIL}</a>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {supportTickets.length === 0 && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <BadgeCheck className="mx-auto h-9 w-9 text-emerald-500" />
                        <p className="mt-2 text-sm font-bold">No support tickets yet</p>
                        <p className="text-xs text-slate-500">When a user raises a ticket through AI Chat, it will appear here with the proper reason and contact details.</p>
                      </div>
                    )}
                    {supportTickets.map(ticket => (
                      <div key={ticket.id} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-extrabold text-white">{ticket.name.trim().charAt(0).toUpperCase()}</div>
                          <div className="min-w-[220px] flex-1">
                            <p className="flex flex-wrap items-center gap-1.5 text-sm font-extrabold">{ticket.name}
                              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold text-white">{ticket.ticketNo}</span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase text-sky-700 shadow-sm">{ticket.role}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${ticket.status === 'open' ? 'bg-amber-400 text-slate-900' : ticket.status === 'in-progress' ? 'bg-sky-600 text-white' : ticket.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'}`}>{supportTicketStatusLabel(ticket.status).toUpperCase()}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600">+91 {ticket.mobile} • {ticket.email}</p>
                            <p className="text-[11px] text-slate-500">Raised: {ticket.createdAt} • Updated: {ticket.updatedAt} • Source: {ticket.source === 'ai' ? 'AI Chat' : 'Contact Support'}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-xl bg-white p-3">
                          <p className="text-[10px] font-extrabold tracking-widest text-slate-400">PROPER REASON SELECTED BY USER</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">{ticket.category}</p>
                          <p className="mt-2 text-[10px] font-extrabold tracking-widest text-slate-400">SUBJECT</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">{ticket.subject}</p>
                          <p className="mt-2 text-[10px] font-extrabold tracking-widest text-slate-400">ISSUE DETAILS</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-700">{ticket.details}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a href={`tel:+91${ticket.mobile}`} className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white"><Phone className="h-3 w-3" /> Call User</a>
                          <a href={`https://wa.me/91${ticket.mobile}?text=${encodeURIComponent('Hi ' + ticket.name + ', I am M Divakar Reddy from PharmaSales Jobs. I am reviewing your support ticket ' + ticket.ticketNo + '.')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
                          <a href={buildAdminReplyMailto(ticket)} className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"><Mail className="h-3 w-3" /> Email Reply</a>
                          <div className="ml-auto flex flex-wrap gap-1.5">
                            {[
                              { value: 'open' as SupportTicketStatus, label: 'Open' },
                              { value: 'in-progress' as SupportTicketStatus, label: 'In Progress' },
                              { value: 'resolved' as SupportTicketStatus, label: 'Resolved' },
                              { value: 'closed' as SupportTicketStatus, label: 'Closed' },
                            ].map(option => (
                              <button key={option.value} onClick={() => handleSupportTicketStatus(ticket.id, option.value)} disabled={ticket.status === option.value} className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold ${ticket.status === option.value ? 'cursor-default bg-sky-600 text-white' : 'border bg-white text-slate-600 hover:bg-sky-50'}`}>{option.label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">Reply from your support email {SUPPORT_EMAIL} and keep the ticket number in the subject for easy tracking.</p>
                </div>
              )}

              {adminTab === 'manage' && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-extrabold">All Vacancies ({jobs.length})</p>
                    <button onClick={handleResetJobs} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"><RotateCcw className="h-3.5 w-3.5" /> Reset to Default 12</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {jobs.length === 0 && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">No vacancies. Post your first vacancy from the Post Vacancy tab.</p>}
                    {jobs.map(job => (
                      <div key={job.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white px-3 py-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white" style={{ background: job.color }}>{job.company.slice(0, 2).toUpperCase()}</div>
                        <div className="min-w-[200px] flex-1">
                          <p className="text-sm font-bold">{job.company} • {job.title} {job.id.startsWith('admin-') && <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Posted by you</span>}</p>
                          <p className="text-xs text-slate-500">{job.hq} ({job.state}) • {job.type} • {job.ctc} • {job.posted}</p>
                        </div>
                        <button onClick={() => setSelected(job)} className="rounded-full border px-3 py-1.5 text-xs font-bold">View</button>
                        <button onClick={() => handleDeleteJob(job.id)} className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === 'settings' && (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <form className="rounded-2xl border bg-white p-5" onSubmit={e => { e.preventDefault(); handleChangePassword() }}>
                    <p className="flex items-center gap-2 text-base font-extrabold"><KeyRound className="h-5 w-5 text-sky-600" /> Change Admin Password</p>
                    <div className="mt-3 space-y-3">
                      <div><label className="mb-1 block text-xs font-bold text-slate-600">Current Password</label><input type="password" value={passForm.current} onChange={e => setPassForm({ ...passForm, current: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                      <div><label className="mb-1 block text-xs font-bold text-slate-600">New Password (min 6 characters)</label><input type="password" value={passForm.next} onChange={e => setPassForm({ ...passForm, next: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                      <div><label className="mb-1 block text-xs font-bold text-slate-600">Confirm New Password</label><input type="password" value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                      <button type="submit" className="w-full rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white">Update Password</button>
                    </div>
                  </form>
                  <div className="rounded-2xl border bg-white p-5">
                    <p className="text-base font-extrabold">Admin Account</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Name</span><b>M Divakar Reddy</b></p>
                      <p className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Admin ID</span><b>divakar</b></p>
                      <p className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Role</span><b>App Founder &amp; Admin</b></p>
                      <p className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Status</span><b className="text-emerald-600">Logged in • Unlimited access</b></p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={handleResetJobs} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-xs font-bold"><RotateCcw className="h-3.5 w-3.5" /> Reset Vacancies</button>
                      <button onClick={handleAdminLogout} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-600 py-2.5 text-xs font-bold text-white"><LogOut className="h-3.5 w-3.5" /> Logout</button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">Keep your Admin password private and change it regularly.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {/* FOOTER - always visible */}
      {/* FOOTER */}
      {!isIsolatedShellPage && (
      <footer className="border-t bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-[1280px] px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"><img src="/icon-192.png" alt="PharmaSales Jobs" className="h-10 w-10 shrink-0 rounded-full bg-white ring-1 ring-sky-100 object-cover" /><div className="min-w-0"><p className="truncate text-[17px] font-extrabold leading-none text-white">PharmaSales Jobs</p><p className="mt-1 truncate text-[9px] font-semibold leading-none tracking-wide text-sky-300">The MR to NSM Jobs Network</p></div></div>
              <p className="mt-3 text-xs leading-relaxed opacity-80">{shouldHideJobSeekerExperience ? 'PharmaSales Jobs — The MR to NSM Jobs Network. Post verified vacancies free after Admin approval and shortlist anonymous pharma candidates. No Recruiter plan needed. Managed by M Divakar Reddy since 2026.' : 'PharmaSales Jobs — The MR to NSM Jobs Network. Verified vacancies, masked contacts, subscription unlocks. Managed by M Divakar Reddy since 2026.'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Explore</p>
              <ul className="mt-3 space-y-2 text-sm opacity-80">
                {shouldHideJobSeekerExperience ? (
                  <>
                    <li><button onClick={openCandidateProfiles} className="hover:text-white">Candidates List</button></li>
                    <li><button onClick={() => navigate('postjob')} className="hover:text-white">Post Vacancy</button></li>
                    <li><button onClick={() => navigate('ai')} className="hover:text-white">AI Assistant</button></li>
                    <li><button onClick={() => navigate('recruiters')} className="hover:text-white">For Recruiters</button></li>
                  </>
                ) : (
                  <>
                    <li><button onClick={() => navigate('jobs')} className="hover:text-white">Browse Vacancies</button></li>
                    <li><button onClick={() => navigate('pricing')} className="hover:text-white">Subscription</button></li>
                    <li><button onClick={() => navigate('ai')} className="hover:text-white">AI Assistant</button></li>
                    <li><button onClick={() => navigate('recruiters')} className="hover:text-white">For Recruiters</button></li>
                  </>
                )}
                {isAdmin && <li><button onClick={() => openAdmin()} className="hover:text-white">Admin Dashboard</button></li>}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Legal & Support</p>
              <ul className="mt-3 space-y-2 text-sm opacity-80">
                <li><button onClick={() => openLegal('privacy')} className="hover:text-white">Privacy Policy</button></li>
                <li><button onClick={() => openLegal('terms')} className="hover:text-white">Terms &amp; Privacy</button></li>
                <li><button onClick={() => openLegal('support')} className="hover:text-white">Contact Support</button></li>
                <li><button onClick={() => { navigate('ai'); openSupportTicket('ai') }} className="hover:text-white">Raise Support Ticket (AI Chat)</button></li>
                <li><a href={buildSupportMailto()} className="break-all hover:text-white">Support: {SUPPORT_EMAIL}</a></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-bold text-white">Managed by</p>
              <p className="mt-1 font-extrabold text-white">M Divakar Reddy</p>
              <p className="text-xs opacity-80">App Founder — PharmaSales Jobs • 9+ Years Pharma Experience • Ex-Employee (Business Development Manager), Wallace Pharmaceuticals Pvt. Ltd.</p>
              {isAdmin && <button onClick={() => openAdmin()} className="mt-3 w-full rounded-full bg-sky-600 py-2 text-xs font-bold text-white hover:bg-sky-500">Open Admin Dashboard</button>}
              <p className="mt-3 text-xs opacity-80">© 2026 PharmaSales Jobs • Since 2026. All vacancies verified. No spam — masked contacts & ad-labeled.</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-500 px-2.5 py-1 font-bold text-white">Verified Jobs</span>
                <span className="rounded-full bg-sky-600 px-2.5 py-1 font-bold text-white">Since 2026</span>
                <span className="rounded-full bg-amber-400 px-2.5 py-1 font-bold text-slate-900">Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* JOB DETAILS MODAL */}
      <AnimatePresence>
        {selected && !shouldHideJobSeekerExperience && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }} onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-[720px] overflow-auto rounded-2xl bg-white">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: isCompanyVisible(selected) ? selected.color : '#475569' }}>{getCompanyInitials(selected)}</div>
                  <div>
                    <p className="text-sm font-extrabold">{getDisplayCompany(selected)} • {selected.title}</p>
                    <p className="text-xs text-slate-500">{selected.hq} • {selected.posted}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-full border p-2"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {selected.verified && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Verified</span>}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{getRoleLabel(selected.type)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{selected.exp}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{selected.ctc}</span>
                  {isExtraJob(selected) && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">Extra Job • Separate Ads</span>}
                </div>
                <h4 className="mt-4 text-[15px] font-extrabold">Job Description</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{getSafeJobText(selected, selected.desc)} Must have 2-wheeler, valid license, willingness to do fieldwork, RCPA and stockist follow-up. Daily reporting via SFA app.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Division</p><p className="text-sm font-bold">{getSafeJobText(selected, selected.division)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Qualification</p><p className="text-sm font-bold">{selected.qual}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">HQ & Coverage</p><p className="text-sm font-bold">{selected.hq} • Covers nearby 30km</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Perks</p><p className="text-sm font-bold">{selected.perks.join(' • ')}</p></div>
                </div>
                <div className="mt-4 rounded-xl border bg-sky-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold tracking-wide text-sky-800">COMPANY & CONTACT DETAILS</p>
                    {isExtraJob(selected) && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-amber-700">{getExtraRevealCount(selected)}/3 revealed</span>}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-bold tracking-wide text-slate-500">COMPANY</p><p className="mt-1 text-sm font-bold">{getDisplayCompany(selected)}</p></div>
                    <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-bold tracking-wide text-slate-500">MANAGER</p><p className="mt-1 text-sm font-bold">{isManagerVisible(selected) ? selected.contactPerson : 'Hidden Manager •••'}</p></div>
                    <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-bold tracking-wide text-slate-500">CONTACT NUMBER</p><p className="mt-1 text-sm font-bold">{isPhoneVisible(selected) ? selected.phone : '+91 ••••• •••••'}</p></div>
                  </div>
                  <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><span className="text-xs font-bold text-slate-500">EMAIL: </span>{isEmailVisible(selected) ? selected.email : '••••@company.com'}</p>

                  {isExtraJob(selected) ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {!isCompanyVisible(selected) && <button onClick={() => attemptExtraReveal(selected, 'company')} className="flex items-center justify-center gap-1.5 rounded-full bg-amber-500 px-3 py-2.5 text-xs font-extrabold text-white"><TvMinimalPlay className="h-4 w-4" /> Ad — Company</button>}
                      {!isManagerVisible(selected) && <button onClick={() => attemptExtraReveal(selected, 'manager')} className="flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 py-2.5 text-xs font-extrabold text-white"><TvMinimalPlay className="h-4 w-4" /> Ad — Manager</button>}
                      {!isPhoneVisible(selected) && <button onClick={() => attemptExtraReveal(selected, 'phone')} className="flex items-center justify-center gap-1.5 rounded-full bg-sky-700 px-3 py-2.5 text-xs font-extrabold text-white"><TvMinimalPlay className="h-4 w-4" /> Ad — Number</button>}
                    </div>
                  ) : !revealed.has(selected.id) ? (
                    <button onClick={() => attemptReveal(selected)} className="mt-3 w-full rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white">{tier === 'free' ? 'Watch Ad — Reveal Full Contact' : 'Reveal Full Contact'}</button>
                  ) : null}

                  {isPhoneVisible(selected) && (
                    <div className="mt-3 flex gap-2">
                      <a href={`tel:${selected.phone.replace(/\s/g, '')}`} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 py-2.5 text-sm font-bold text-white"><Phone className="h-4 w-4" /> Call</a>
                      <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}?text=Hi%20Sir%2C%20interested%20in%20${encodeURIComponent(getDisplayCompany(selected) + ' ' + selected.type + ' vacancy at ' + selected.hq)}`} target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { handleApply(selected); setSelected(null) }} className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white ${applied.has(selected.id) ? 'bg-emerald-600' : 'bg-sky-600'}`}><Send className="h-4 w-4" /> {applied.has(selected.id) ? 'Applied' : applyAdJob?.id === selected.id ? 'Ad Playing…' : 'Apply Now'}</button>
                  <button onClick={() => setSelected(null)} className="rounded-full border bg-white px-6 py-3 text-sm font-bold">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REWARDED AD MODAL */}
      <AnimatePresence>
        {showRewarded && !shouldHideJobSeekerExperience && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white">
              <div className="bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold"><TvMinimalPlay className="h-4 w-4 text-amber-400" /> Sponsored Video</p>
                  <button onClick={() => closeSponsoredReveal()} className="rounded-full bg-white/20 p-1"><X className="h-4 w-4" /></button>
                </div>
                <p className="mt-1 text-xs opacity-80">{rewardAction === 'contact' ? <>Watch the full ad to reveal manager, contact number and email for <b>{getDisplayCompany(showRewarded)}</b>.</> : rewardAction === 'company' ? <>Watch the full ad to reveal the <b>company name</b> for this {showRewarded.hq} vacancy.</> : rewardAction === 'manager' ? <>Watch the full ad to reveal the <b>manager / contact person name</b>.</> : <>Watch the full ad to reveal the <b>contact number and email</b>.</>}</p>
              </div>
              <div className="p-4">
                <div className="rounded-xl bg-black p-3 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded bg-amber-400 px-2 py-1 font-bold text-black">AD • VIDEO</span>
                    <span className="rounded bg-white/20 px-2 py-1">{Math.max(0, Math.ceil(15 - (rewardProgress * 15) / 100))}s</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center justify-center py-6">
                    <Megaphone className="h-10 w-10 text-amber-400" />
                    <p className="mt-3 text-sm font-bold">Pharma Sales Mastery — 40% OFF</p>
                    <p className="text-xs opacity-70">Trusted by 12,000 MRs • 4.8★</p>
                    <div className="mt-4 h-2 w-full rounded-full bg-white/20">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${rewardProgress}%` }} />
                    </div>
                  </div>
                </div>
                {rewardProgress < 100 ? (
                  <button disabled={rewardProgress > 0} onClick={startRewardedAd} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-bold text-white disabled:opacity-80">
                    {rewardProgress > 0 ? <>Ad playing… {Math.max(0, Math.ceil(15 - (rewardProgress * 15) / 100))}s left</> : <><Play className="h-4 w-4" /> Play Ad (15 sec)</>}
                  </button>
                ) : (
                  <button onClick={handleRewardedComplete} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white">
                    <Gift className="h-4 w-4" /> Claim Reward — {rewardAction === 'contact' ? 'Reveal Full Contact' : rewardAction === 'company' ? 'Reveal Company' : rewardAction === 'manager' ? 'Reveal Manager Name' : 'Reveal Contact Number'}
                  </button>
                )}
                <p className="mt-2 text-center text-xs text-slate-500">Reward granted only after watching full 15 sec</p>
                <button onClick={() => closeSponsoredReveal(true)} className="mt-2 w-full rounded-full border border-sky-600 py-2 text-xs font-bold text-sky-700">Skip reveal ads — Starter ₹99/mo (Apply ad still plays once)</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPLY NOW SPONSORED AD — Free, Starter and Pro */}
      <AnimatePresence>
        {applyAdJob && !shouldHideJobSeekerExperience && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white">
              <div className="bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-bold"><TvMinimalPlay className="h-4 w-4 text-amber-400" /> Sponsored • Apply Now Ad</p>
                  <button onClick={() => { setApplyAdJob(null); setApplyAdProgress(0); setToast('Application cancelled — the Apply ad was closed.') }} className="rounded-full bg-white/20 p-1" aria-label="Cancel application"><X className="h-4 w-4" /></button>
                </div>
                <p className="mt-1 text-xs leading-relaxed opacity-80">This one sponsored ad runs for Free, Starter and Pro users. Your application will submit automatically after the full 15 seconds.</p>
              </div>
              <div className="p-4">
                <div className="rounded-xl bg-black p-3 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded bg-amber-400 px-2 py-1 font-bold text-black">AD • VIDEO</span>
                    <span className="rounded bg-white/20 px-2 py-1">{Math.max(0, Math.ceil(15 - (applyAdProgress * 15) / 100))}s</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
                    <Megaphone className="h-10 w-10 text-amber-400" />
                    <p className="mt-3 text-sm font-bold">Pharma Sales Mastery — 40% OFF</p>
                    <p className="text-xs opacity-70">Trusted by 12,000 MRs • 4.8★</p>
                    <div className="mt-4 h-2 w-full rounded-full bg-white/20">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${applyAdProgress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-sky-50 p-3 text-center">
                  <p className="text-xs font-bold text-sky-700">APPLICATION READY TO SUBMIT</p>
                  <p className="mt-1 text-sm font-extrabold">{getDisplayCompany(applyAdJob)} • {applyAdJob.title}</p>
                  <p className="text-xs text-slate-500">{applyAdJob.hq} • {applyAdJob.ctc}</p>
                </div>
                <p className="mt-3 text-center text-sm font-bold">Submitting in {Math.max(0, Math.ceil(15 - (applyAdProgress * 15) / 100))} sec…</p>
                <button onClick={() => { setApplyAdJob(null); setApplyAdProgress(0); setToast('Application cancelled — the Apply ad was closed.') }} className="mt-3 w-full rounded-full border py-2.5 text-sm font-bold">Cancel Application</button>
                <p className="mt-2 text-center text-xs text-slate-500">If you cancel before the ad finishes, your application will not be submitted.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRICING MODAL */}
      <AnimatePresence>
        {showPricing && !shouldHideJobSeekerExperience && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPricing(false)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-[980px] overflow-auto rounded-2xl bg-white">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
                <div>
                  <p className="text-lg font-extrabold">Job Seeker Subscription Plans — PharmaSales Jobs</p>
                  <p className="text-xs text-slate-500">Free is ad-supported. Starter/Pro remove browsing and contact-reveal ads; Apply Now still plays one sponsored ad.</p>
                </div>
                <button onClick={() => setShowPricing(false)} className="rounded-full border p-2"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-3">
                {TIERS.map(t => (
                  <div key={t.id} className={`rounded-2xl border p-4 ${tier === t.id ? 'border-sky-600 bg-sky-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2"><t.icon className="h-5 w-5" /><p className="font-extrabold">{t.name}</p></div>
                    <p className="mt-1 text-xl font-extrabold">{t.price}<span className="text-xs font-semibold text-slate-500">{t.period}</span></p>
                    <ul className="mt-3 space-y-1.5">
                      {t.features.map(f => <li key={f} className="flex gap-2 text-xs"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{f}</li>)}
                    </ul>
                    <button onClick={() => { setTier(t.id); setShowPricing(false); setToast(`${t.name} plan selected`) }} className={`mt-4 w-full rounded-full py-2.5 text-sm font-bold ${tier === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>{tier === t.id ? 'Active' : 'Select'}</button>
                  </div>
                ))}
              </div>
              <div className="border-t bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                <p><b>Free plan:</b> 3 daily full-contact unlocks open 7 extra jobs. Extra jobs use separate sponsored ads for company, manager name and contact number.</p>
                <p className="mt-1"><b>Starter & Pro:</b> Direct contact reveals and no browsing/native ads. <b>Apply Now:</b> one sponsored ad plays on every plan before submission.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JOB SEEKER ACCOUNT DELETION REQUEST — Admin approval required */}
      <AnimatePresence>
        {showDeletionRequestModal && currentUser && currentUser.role === 'seeker' && hasAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowDeletionRequestModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600"><FileText className="h-7 w-7" /></div>
              <h3 className="mt-3 text-center text-xl font-extrabold">Request Account Deletion</h3>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-center">
                <p className="font-extrabold">{currentUser.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">Job Seeker • +91 {currentUser.mobile} • {currentUser.email}</p>
              </div>
              {myDeletionRequest?.status === 'pending' ? (
                <div>
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-amber-900"><Clock3 className="h-4 w-4" /> Request Pending with Admin</p>
                    <p className="mt-1 text-xs text-amber-700">Requested on {myDeletionRequest.requestedAt}. Your account remains active until Admin Divakar Reddy approves the request.</p>
                    <p className="mt-3 text-[10px] font-extrabold tracking-widest text-amber-600">YOUR REASON</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{myDeletionRequest.reasonCategory}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{myDeletionRequest.reasonDetails}</p>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setShowDeletionRequestModal(false)} className="flex-1 rounded-full border py-2.5 text-sm font-bold">Close</button>
                    <button onClick={handleWithdrawDeletionRequest} className="flex-1 rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white">Withdraw Request</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); handleSubmitDeletionRequest() }}>
                  <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">Job Seeker accounts are not deleted directly. Raise a request with a <b>proper reason</b>. Admin Divakar Reddy will review it and delete the account only if the reason is valid.</p>
                  {myDeletionRequest?.status === 'rejected' && (
                    <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                      <p className="font-extrabold">Previous request rejected{myDeletionRequest.reviewedAt ? ` • ${myDeletionRequest.reviewedAt}` : ''}</p>
                      <p className="mt-1">{myDeletionRequest.adminNote || 'Admin did not find the previous reason sufficient.'}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-bold text-slate-600">Select Reason *</label>
                    <select value={deletionRequestForm.category} onChange={e => { setDeletionRequestForm(prev => ({ ...prev, category: e.target.value })); setDeletionRequestError('') }} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                      <option value="">Select a proper reason</option>
                      {DELETION_REASON_OPTIONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                    </select>
                  </div>
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-bold text-slate-600">Explain Your Reason Properly *</label>
                    <textarea value={deletionRequestForm.details} onChange={e => { setDeletionRequestForm(prev => ({ ...prev, details: e.target.value })); setDeletionRequestError('') }} rows={4} maxLength={500} placeholder="Write clearly why you want this Job Seeker account deleted..." className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    <p className="mt-1 text-right text-[11px] font-semibold text-slate-400">{deletionRequestForm.details.trim().length}/500 characters • Minimum 20</p>
                  </div>
                  {deletionRequestError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{deletionRequestError}</p>}
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setShowDeletionRequestModal(false)} className="flex-1 rounded-full border py-2.5 text-sm font-bold">Cancel</button>
                    <button type="submit" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600"><Send className="h-4 w-4" /> Submit to Admin</button>
                  </div>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">Submitting this form does not delete your account immediately. Admin approval is required.</p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE RECRUITER ACCOUNT CONFIRMATION — Recruiters only */}
      <AnimatePresence>
        {showDeleteAccountConfirm && currentUser && currentUser.role === 'recruiter' && hasAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowDeleteAccountConfirm(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()} className="w-full max-w-[440px] rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 className="h-7 w-7" /></div>
              <h3 className="mt-3 text-center text-xl font-extrabold">Delete Recruiter Account?</h3>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-center">
                <p className="font-extrabold">{currentUser.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">+91 {currentUser.mobile} • {currentUser.email}</p>
              </div>
              <div className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> This mobile number can then be used for Job Seeker login / registration.</p>
                <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Pending (not yet approved) vacancy submissions from this mobile will be withdrawn.</p>
                <p className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" /> Vacancies already approved and LIVE will remain until Admin removes them.</p>
              </div>
              <p className="mt-3 text-center text-xs font-bold text-red-600">This action cannot be undone.</p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setShowDeleteAccountConfirm(false)} className="flex-1 rounded-full border py-2.5 text-sm font-bold">Cancel</button>
                <button onClick={handleDeleteRecruiterAccount} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"><Trash2 className="h-4 w-4" /> Delete Account</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUPPORT TICKET — raised from AI Chat / Contact Support with a proper reason */}
      <AnimatePresence>
        {showSupportTicketModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowSupportTicketModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[540px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              {createdSupportTicket ? (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></div>
                  <h3 className="mt-3 text-xl font-extrabold">Support Ticket Raised ✅</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">Your ticket has been saved for Admin review. Keep the ticket number for follow-up emails.</p>
                  <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">{createdSupportTicket.ticketNo}</span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">Open</span>
                      <span className="ml-auto text-[11px] font-semibold text-slate-500">{createdSupportTicket.createdAt}</span>
                    </div>
                    <p className="mt-3 text-[10px] font-extrabold tracking-widest text-slate-400">PROPER REASON</p>
                    <p className="mt-1 text-sm font-extrabold">{createdSupportTicket.category}</p>
                    <p className="mt-2 text-[10px] font-extrabold tracking-widest text-slate-400">SUBJECT</p>
                    <p className="mt-1 text-sm font-extrabold">{createdSupportTicket.subject}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{createdSupportTicket.details}</p>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">For urgent follow-up, email <b className="text-sky-700">{SUPPORT_EMAIL}</b> and mention ticket <b>{createdSupportTicket.ticketNo}</b>.</p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <a href={buildSupportMailto(createdSupportTicket)} className="flex items-center justify-center gap-1.5 rounded-full bg-slate-900 py-2.5 text-xs font-extrabold text-white"><Mail className="h-3.5 w-3.5" /> Email Ticket</a>
                    <button onClick={() => { setCreatedSupportTicket(null); setSupportTicketForm(prev => ({ ...prev, category: '', subject: '', details: '' })); setSupportTicketError('') }} className="rounded-full border py-2.5 text-xs font-extrabold">Raise Another</button>
                    <button onClick={() => setShowSupportTicketModal(false)} className="rounded-full bg-sky-600 py-2.5 text-xs font-extrabold text-white">Done</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); handleSubmitSupportTicket() }}>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-700"><MessageCircle className="h-7 w-7" /></div>
                  <h3 className="mt-3 text-center text-xl font-extrabold">Raise a Support Ticket</h3>
                  <p className="mx-auto mt-2 max-w-md text-center text-xs leading-relaxed text-slate-500">{supportTicketSource === 'ai' ? 'From AI Assistant • ' : 'From Contact Support • '}Select a <b>proper reason</b> and explain the issue clearly. Admin Divakar Reddy will review it.</p>
                  <a href={buildSupportMailto()} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow hover:bg-slate-800"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{SUPPORT_EMAIL}</span></a>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Full Name *</label>
                      <input value={supportTicketForm.name} onChange={e => { setSupportTicketForm(prev => ({ ...prev, name: e.target.value })); setSupportTicketError('') }} placeholder="Your full name" autoComplete="name" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Registered Mobile Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">+91</span>
                        <input value={supportTicketForm.mobile} onChange={e => { setSupportTicketForm(prev => ({ ...prev, mobile: e.target.value })); setSupportTicketError('') }} type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" className="w-full rounded-xl border bg-white py-3 pl-14 pr-3 text-sm font-semibold outline-none focus:border-sky-500" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold text-slate-600">Correct Email ID *</label>
                      <input value={supportTicketForm.email} onChange={e => { setSupportTicketForm(prev => ({ ...prev, email: e.target.value })); setSupportTicketError('') }} type="email" autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold text-slate-600">Select a Proper Reason *</label>
                      <select value={supportTicketForm.category} onChange={e => { setSupportTicketForm(prev => ({ ...prev, category: e.target.value })); setSupportTicketError('') }} className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
                        <option value="">Select the reason for this ticket</option>
                        {SUPPORT_TICKET_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold text-slate-600">Subject *</label>
                      <input value={supportTicketForm.subject} onChange={e => { setSupportTicketForm(prev => ({ ...prev, subject: e.target.value })); setSupportTicketError('') }} maxLength={100} placeholder="e.g. Unable to login with my registered mobile" className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold text-slate-600">Explain Your Issue With Proper Reason *</label>
                      <textarea value={supportTicketForm.details} onChange={e => { setSupportTicketForm(prev => ({ ...prev, details: e.target.value })); setSupportTicketError('') }} rows={5} maxLength={1000} placeholder="Write clearly what happened. Mention the job/company/HQ, screen name or date/time if relevant..." className="w-full rounded-xl border bg-white px-3 py-3 text-sm leading-relaxed outline-none focus:border-sky-500" />
                      <p className="mt-1 text-right text-[11px] font-semibold text-slate-400">{supportTicketForm.details.trim().length}/1000 characters • Minimum 20</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><b>Do not share</b> passwords, OTPs, bank details, Aadhaar/PAN or other sensitive information in AI Chat or this ticket.</div>
                  {supportTicketError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{supportTicketError}</p>}
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => setShowSupportTicketModal(false)} className="flex-1 rounded-full border py-3 text-sm font-bold">Cancel</button>
                    <button type="submit" className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sky-600 py-3 text-sm font-extrabold text-white shadow hover:bg-sky-700"><Send className="h-4 w-4" /> Submit Ticket</button>
                  </div>
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">Your ticket will appear under AI Assistant → My Support Tickets and in Admin Support Tickets.</p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CANDIDATE DETAILS — slides in only after a Recruiter selects a candidate from the list */}
      <AnimatePresence>
        {selectedCandidate && canViewCandidateProfiles && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setSelectedCandidate(null)} className="fixed inset-0 z-[65] bg-black/55 backdrop-blur-[1px]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} className="fixed right-0 top-0 z-[70] flex h-[100dvh] w-[94%] max-w-[470px] flex-col bg-[#f0f7ff] shadow-2xl">
              <div className="flex items-start gap-3 border-b bg-slate-900 px-4 py-4 text-white">
                <button type="button" onClick={() => setSelectedCandidate(null)} aria-label="Back to Candidates List" title="Back to Candidates List" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95"><ArrowLeft className="h-5 w-5" strokeWidth={2.5} /></button>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-900"><User className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold tracking-widest text-sky-300">CANDIDATE DETAILS • ANONYMOUS</p>
                  <h3 className="mt-0.5 truncate text-lg font-extrabold leading-tight">Candidate {selectedCandidate.code}</h3>
                  <p className="text-xs font-semibold text-slate-300">Name, mobile number &amp; email ID are hidden</p>
                </div>
                <button type="button" onClick={() => setSelectedCandidate(null)} aria-label="Close candidate details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
                <div className="mb-3 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-relaxed text-emerald-900">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Contact details are shared only through Admin after the candidate gives consent.</span>
                </div>
                {renderAnonymousCandidateCard(selectedCandidate)}
              </div>
            </motion.aside>
          </>
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

      {/* Bottom nav for mobile (app-like) - page navigation */}
      {!isIsolatedShellPage && (
      <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-around px-2 py-2">
          {shouldHideJobSeekerExperience ? (
            <>
              <button onClick={() => navigate('recruiters')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='recruiters'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
                <Building2 className={`h-5 w-5 ${page==='recruiters'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='recruiters'?'text-white':''}`}>Recruiters</span>
              </button>
              <button onClick={openCandidateProfiles} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='candidates'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
                <Users className={`h-5 w-5 ${page==='candidates'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='candidates'?'text-white':''}`}>Candidates</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('jobs')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='jobs'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
                <Layers className={`h-5 w-5 ${page==='jobs'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='jobs'?'text-white':''}`}>Jobs</span>
              </button>
              <button onClick={() => navigate('saved')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='saved'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
                <Bookmark className={`h-5 w-5 ${page==='saved'?'text-white': saved.size ? 'text-sky-600' : 'text-slate-400'}`} /><span className={`text-[11px] font-bold ${page==='saved'?'text-white':''}`}>Saved {saved.size ? `•${saved.size}` : ''}</span>
              </button>
            </>
          )}
          <button onClick={() => navigate('ai')} className={`flex flex-col items-center gap-1 rounded-xl px-5 py-1.5 ${page==='ai'?'bg-slate-900 text-white shadow':'bg-sky-600 text-white'}`}>
            <Sparkles className="h-5 w-5" /><span className="text-[11px] font-bold">AI Chat</span>
          </button>
          {shouldHideJobSeekerExperience ? (
            <button onClick={() => navigate('postjob')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='postjob'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
              <Plus className={`h-5 w-5 ${page==='postjob'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='postjob'?'text-white':''}`}>Post</span>
            </button>
          ) : (
            <button onClick={() => navigate('pricing')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='pricing'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
              <Crown className={`h-5 w-5 ${page==='pricing'?'text-white':'text-amber-500'}`} /><span className={`text-[11px] font-bold ${page==='pricing'?'text-white':''}`}>Pro</span>
            </button>
          )}
          {currentUser?.role === 'seeker' && hasAuthenticated ? (
            <button onClick={openSeekerProfile} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='profile'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
              <User className={`h-5 w-5 ${page==='profile'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='profile'?'text-white':''}`}>Profile</span>
            </button>
          ) : currentUser?.role === 'recruiter' && hasAuthenticated ? (
            <button onClick={() => openLegal('support')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='legal'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
              <FileText className={`h-5 w-5 ${page==='legal'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='legal'?'text-white':''}`}>Support</span>
            </button>
          ) : (
            <button onClick={() => navigate('recruiters')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='recruiters'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
              <Building2 className={`h-5 w-5 ${page==='recruiters'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='recruiters'?'text-white':''}`}>Recruiters</span>
            </button>
          )}
        </div>
      </div>
      <div className="h-[72px] lg:hidden" />
      </>
      )}
    </div>
  )
}

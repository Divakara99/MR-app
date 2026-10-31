import { useEffect, useRef, useState } from 'react'
import {
  Search, MapPin, Briefcase, IndianRupee, Building2, BadgeCheck, Clock3,
  Eye, EyeOff, Bookmark, BookmarkCheck, Share2, Phone, Mail, Filter, X, Menu,
  Crown, ShieldCheck, Sparkles, Zap, Star, Users, TrendingUp, FileText, Send,
  MessageCircle, Play, Smartphone, ChevronDown, ChevronUp, ChevronRight, ArrowLeft,
  GraduationCap, Layers, Siren, Megaphone, Quote,
  LockKeyhole, Unlock, TvMinimalPlay, BadgeIndianRupee, Check,
  Settings, User, LogOut, LogIn, Plus, SearchX, Info, AlertTriangle, Gift, Trash2, LayoutDashboard, KeyRound, RotateCcw,
  Package, Upload, Camera, Download, Pencil, Copy, CreditCard, Landmark, QrCode, Wallet
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { isSupabaseConfigured, supabase, type RemoteAccountRow, type RemoteAppSettingRow, type RemoteCandidateRow, type RemotePurchaseRow, type RemoteSyncRecordRow, type RemoteUserStateRow } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { LEGAL_POLICY_DATE, PRIVACY_SECTIONS, SUPPORT_EMAIL, SUPPORT_TICKET_REASONS, TERMS_SECTIONS } from './legalSupport'

// TYPES
type Tier = 'free' | 'starter' | 'pro'
type ExtraRevealField = 'company' | 'manager' | 'phone'
type SponsoredRevealAction = 'contact' | ExtraRevealField
type ExtraJobReveals = Partial<Record<ExtraRevealField, boolean>>
type StoredDailyJobAccess = {
  date: string
  revealed: string[]
  paidRevealed: string[]
  dailyUnlocks: number
  extraReveals: Record<string, ExtraJobReveals>
}
type UserJobState = {
  saved: string[]
  applied: string[]
  requestedCandidates: string[]
  dailyAccess: StoredDailyJobAccess
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
  // Who added this vacancy (shown very small in Job Details). Missing = Admin/seed.
  postedBy?: string
  postedByRole?: 'admin' | 'recruiter' | 'seeker'
}

type PendingJob = Job & { submittedAt: string; submittedBy: string; submittedByRole?: 'recruiter' | 'seeker' }
type EntryRole = 'seeker' | 'recruiter'
type AppPage = 'welcome' | 'auth' | 'home' | 'jobs' | 'pricing' | 'payment' | 'recruiters' | 'candidates' | 'ai' | 'saved' | 'admin' | 'postjob' | 'profile' | 'account' | 'legal'
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
  // Optional private uploads — never shown to Recruiters (candidates stay anonymous).
  profilePhoto?: string
  resumeName?: string
  resumeSize?: number
  resumeType?: string
  resumeUploadedAt?: string
}
type CandidateProfileView = {
  id: string
  code: string
  source: 'registered'
  profile: SeekerProfile
}
type Account = {
  role: EntryRole
  name: string
  mobile: string
  email: string
  createdAt: string
  passwordHash?: string
  hasPassword?: boolean
  profile?: SeekerProfile
}
type PurchaseRecord = {
  id: string
  name: string
  mobile: string
  email: string
  role: EntryRole
  plan: Tier
  planName: string
  amount: number
  method: string
  status: 'paid' | 'pending' | 'failed'
  transactionId: string
  purchasedAt: string
  expiresAt: string
}
type PaidPlanId = 'starter' | 'pro'
type PaidPlanConfig = {
  name: string
  price: number
  validityDays: number
  dailyLimit: number
  unlimited: boolean
  enabled: boolean
  popular: boolean
  features: string[]
}
type PaymentReceivingSettings = {
  receiverName: string
  upiId: string
  upiEnabled: boolean
  qrImageUrl: string
  paymentLink: string
  paymentLinkEnabled: boolean
  bankDetails: string
  bankEnabled: boolean
  instructions: string
  demoCheckoutEnabled: boolean
}
type CommerceSettings = {
  plans: Record<PaidPlanId, PaidPlanConfig>
  payment: PaymentReceivingSettings
  updatedAt?: string
}
type CheckoutMethod = 'upi' | 'payment-link' | 'bank' | 'demo'
type AuthStep = 'mobile' | 'register' | 'forgot'
type AuthFormState = {
  name: string
  mobile: string
  email: string
  identifier: string
  password: string
  confirmPassword: string
}
const EMPTY_AUTH_FORM: AuthFormState = { name: '', mobile: '', email: '', identifier: '', password: '', confirmPassword: '' }
type AuthField = keyof AuthFormState
type AuthFieldErrors = Partial<Record<AuthField, string>>
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
type RemoteSyncCollectionKey = 'jobs' | 'pending_jobs' | 'support_tickets' | 'deletion_requests'
type SyncRecord = { id: string }

// Vacancies are real only: no seeded/demo jobs are bundled with the app.
const JOBS: Job[] = []

const LOCATIONS = ['All India', 'Telangana', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Maharashtra', 'Gujarat', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Delhi']
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
  { id: 'free' as Tier, name: 'Free', price: '₹0', period: '/forever', color: 'slate', icon: ShieldCheck, features: ['First 3 jobs: full hiring contact opens after a sponsored ad', 'Next 7 jobs: company, manager and phone open with separate ads', 'Total Free access: 10 jobs every day', 'Save vacancies and apply after unlocking the contact', 'Apply Now shows one sponsored ad before submission'], cta: 'Current Plan', popular: false, limit: '3 + 7 extra/day' },
  { id: 'starter' as Tier, name: 'Starter', price: '₹99', period: '/month', color: 'sky', icon: Zap, features: ['15 direct contacts/day — no reveal ads', 'No banner or native ads', 'Unmasked phone + email', 'Apply Now plays one sponsored ad per application', 'WhatsApp contact button', 'AI Resume builder'], cta: 'Go Starter — ₹99/mo', popular: true, limit: '15/day' },
  { id: 'pro' as Tier, name: 'Pro', price: '₹499', period: '/month', color: 'violet', icon: Crown, features: ['Unlimited direct contacts — no reveal ads', 'No banner or native ads', 'Apply Now plays one sponsored ad per application', 'Direct Recruiter Chat', 'Interview preparation AI', 'Featured profile for 30 days', 'Salary insights & negotiation tips'], cta: 'Go Pro', popular: false, limit: 'Unlimited' },
]

const COMMERCE_SETTINGS_KEY = 'mr-commerce-settings-v1'
const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  plans: {
    starter: {
      name: 'Starter',
      price: 99,
      validityDays: 30,
      dailyLimit: 15,
      unlimited: false,
      enabled: true,
      popular: true,
      features: ['Hiring phone number and email open directly', 'No ads while browsing vacancies', 'No ads to reveal contacts within your daily limit', 'Call and WhatsApp buttons where the hiring contact is available', 'Apply Now still shows one sponsored ad'],
    },
    pro: {
      name: 'Pro',
      price: 499,
      validityDays: 30,
      dailyLimit: 9999,
      unlimited: true,
      enabled: true,
      popular: false,
      features: ['Hiring phone number and email open directly', 'No ads while browsing vacancies', 'No ads to reveal hiring contacts', 'Best choice for urgent and heavy daily job search', 'Apply Now still shows one sponsored ad'],
    },
  },
  payment: {
    receiverName: 'M Divakar Reddy',
    upiId: '',
    upiEnabled: false,
    qrImageUrl: '',
    paymentLink: '',
    paymentLinkEnabled: false,
    bankDetails: '',
    bankEnabled: false,
    instructions: 'Pay the exact plan amount using the Admin payment source shown here. After payment, enter the UPI/UTR/transaction reference and tap Payment Done — Activate Plan.',
    demoCheckoutEnabled: true,
  },
}
const asSettingsRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
)
const settingsString = (value: unknown, fallback: string, maxLength: number) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback
)
const settingsBoolean = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback
const settingsNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback
}
const normalizePaidPlanConfig = (value: unknown, fallback: PaidPlanConfig): PaidPlanConfig => {
  const source = asSettingsRecord(value)
  const unlimited = settingsBoolean(source.unlimited, fallback.unlimited)
  const features = Array.isArray(source.features)
    ? source.features.map(item => String(item).trim()).filter(Boolean).slice(0, 12).map(item => item.slice(0, 160))
    : fallback.features
  return {
    name: settingsString(source.name, fallback.name, 40) || fallback.name,
    price: settingsNumber(source.price, fallback.price, 1, 100000),
    validityDays: settingsNumber(source.validityDays, fallback.validityDays, 1, 3650),
    dailyLimit: unlimited ? 9999 : settingsNumber(source.dailyLimit, fallback.dailyLimit, 1, 10000),
    unlimited,
    enabled: settingsBoolean(source.enabled, fallback.enabled),
    popular: settingsBoolean(source.popular, fallback.popular),
    features: features.length > 0 ? features : fallback.features,
  }
}
const normalizeCommerceSettings = (value: unknown): CommerceSettings => {
  const source = asSettingsRecord(value)
  const plans = asSettingsRecord(source.plans)
  const payment = asSettingsRecord(source.payment)
  const starter = normalizePaidPlanConfig(plans.starter, DEFAULT_COMMERCE_SETTINGS.plans.starter)
  const pro = normalizePaidPlanConfig(plans.pro, DEFAULT_COMMERCE_SETTINGS.plans.pro)
  if (starter.popular && pro.popular) pro.popular = false
  return {
    plans: { starter, pro },
    payment: {
      receiverName: settingsString(payment.receiverName, DEFAULT_COMMERCE_SETTINGS.payment.receiverName, 100) || DEFAULT_COMMERCE_SETTINGS.payment.receiverName,
      upiId: settingsString(payment.upiId, DEFAULT_COMMERCE_SETTINGS.payment.upiId, 120),
      upiEnabled: settingsBoolean(payment.upiEnabled, DEFAULT_COMMERCE_SETTINGS.payment.upiEnabled),
      qrImageUrl: settingsString(payment.qrImageUrl, DEFAULT_COMMERCE_SETTINGS.payment.qrImageUrl, 750000),
      paymentLink: settingsString(payment.paymentLink, DEFAULT_COMMERCE_SETTINGS.payment.paymentLink, 600),
      paymentLinkEnabled: settingsBoolean(payment.paymentLinkEnabled, DEFAULT_COMMERCE_SETTINGS.payment.paymentLinkEnabled),
      bankDetails: settingsString(payment.bankDetails, DEFAULT_COMMERCE_SETTINGS.payment.bankDetails, 1200),
      bankEnabled: settingsBoolean(payment.bankEnabled, DEFAULT_COMMERCE_SETTINGS.payment.bankEnabled),
      instructions: settingsString(payment.instructions, DEFAULT_COMMERCE_SETTINGS.payment.instructions, 1200) || DEFAULT_COMMERCE_SETTINGS.payment.instructions,
      demoCheckoutEnabled: settingsBoolean(payment.demoCheckoutEnabled, DEFAULT_COMMERCE_SETTINGS.payment.demoCheckoutEnabled),
    },
    updatedAt: settingsString(source.updatedAt, '', 60) || undefined,
  }
}
const loadStoredCommerceSettings = (): CommerceSettings => {
  try {
    const raw = localStorage.getItem(COMMERCE_SETTINGS_KEY)
    return raw ? normalizeCommerceSettings(JSON.parse(raw)) : normalizeCommerceSettings(DEFAULT_COMMERCE_SETTINGS)
  } catch { return normalizeCommerceSettings(DEFAULT_COMMERCE_SETTINGS) }
}
const validateCommerceSettings = (settings: CommerceSettings): string => {
  for (const plan of [settings.plans.starter, settings.plans.pro]) {
    if (!plan.name.trim()) return 'Enter both plan names.'
    if (!Number.isFinite(plan.price) || plan.price <= 0) return `${plan.name || 'Plan'} price must be above ₹0.`
    if (!Number.isFinite(plan.validityDays) || plan.validityDays < 1) return `${plan.name || 'Plan'} validity must be at least 1 day.`
    if (!plan.unlimited && (!Number.isFinite(plan.dailyLimit) || plan.dailyLimit < 1)) return `${plan.name || 'Plan'} daily contact limit must be at least 1.`
    if (plan.features.map(feature => feature.trim()).filter(Boolean).length === 0) return `Add at least one benefit for ${plan.name || 'the plan'}.`
  }
  const payment = settings.payment
  if (!payment.receiverName.trim()) return 'Enter the payment receiver / payee name.'
  if (payment.upiEnabled && !/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(payment.upiId.trim())) return 'Enter a correct UPI ID, or turn UPI payment off.'
  if (payment.paymentLinkEnabled) {
    try {
      const url = new URL(payment.paymentLink.trim())
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Invalid URL')
    } catch { return 'Enter a correct payment link, or turn Payment Link off.' }
  }
  if (payment.bankEnabled && !payment.bankDetails.trim()) return 'Enter bank receiving details, or turn Bank Transfer off.'
  if (!payment.upiEnabled && !payment.paymentLinkEnabled && !payment.bankEnabled && !payment.demoCheckoutEnabled) return 'Enable at least one payment receiving method.'
  return ''
}
const formatINR = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const getPaidPlanLimit = (plan: PaidPlanConfig) => plan.unlimited ? 9999 : Math.max(1, Math.round(plan.dailyLimit) || 1)
const getActivePlanPurchase = (records: PurchaseRecord[], mobile: string, now = Date.now()): PurchaseRecord | undefined => {
  const normalizedMobile = normalizeMobile(mobile)
  if (!normalizedMobile) return undefined
  const priority: Record<Tier, number> = { free: 0, starter: 1, pro: 2 }
  return records
    .filter(record => record.role === 'seeker' && normalizeMobile(record.mobile) === normalizedMobile && record.status === 'paid' && record.plan !== 'free' && new Date(record.expiresAt).getTime() > now)
    .sort((a, b) => priority[b.plan] - priority[a.plan] || new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime() || new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]
}
const mergePurchaseRecords = (primary: PurchaseRecord[], secondary: PurchaseRecord[]): PurchaseRecord[] => {
  const merged = new Map<string, PurchaseRecord>()
  ;[...secondary, ...primary].forEach(record => {
    const key = (record.transactionId || record.id || '').trim().toLowerCase()
    if (key) merged.set(key, record)
  })
  return Array.from(merged.values()).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
}
const getPlanDaysLeft = (expiresAt?: string, now = Date.now()) => {
  if (!expiresAt) return 0
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / (24 * 60 * 60 * 1000)))
}

const SEEKER_AI_WELCOME = 'Hi! I’m your PharmaSales AI assistant 👋\n\nTry me:\n• “Resume for B.Pharm fresher”\n• “Interview Q&A for ASM/RSM roles”\n• “Best Hyderabad vacancies for 2 yrs exp”\n\nNeed help from Admin? Tap “Raise Support Ticket” below or type “raise support ticket”. Please give a proper reason so we can solve it quickly.'
const RECRUITER_AI_WELCOME = 'Hi! I’m your PharmaSales Jobs recruiter assistant 👋\n\nI can help you with:\n• Writing a clear vacancy description for any role from Trainee MR to NSM\n• Interview questions for MR to NSM candidates\n• Candidate screening & shortlist checklists\n• Improving response to your vacancy\n\nJob search and subscription plans are for Job Seekers only — your Recruiter account does not need a plan. Need Admin help? Tap “Raise Support Ticket” below.'
const getAiWelcomeMessages = (role?: EntryRole | null) => [{ role: 'assistant' as const, text: role === 'recruiter' ? RECRUITER_AI_WELCOME : SEEKER_AI_WELCOME }]

// Helpers
const maskPhone = (p: string) => p.replace(/(.{4})(.*)(.{3})/, (_, a, mid, c) => a + 'X'.repeat(mid.length) + c)
const maskEmail = (e: string) => e.replace(/^(.{1})(.*)(@.*)$/, (_, a, mid, dom) => a + 'X'.repeat(Math.min(mid.length, 6)) + dom)

// ADMIN (M Divakar Reddy)
const ADMIN_REGISTERED_EMAIL = 'akhildivakara@gmail.com'
const ADMIN_IDS = ['divakar', 'admin', ADMIN_REGISTERED_EMAIL]
const ADMIN_AUTH_KEY = 'mr-admin-auth-v1'
const ADMIN_PASS_KEY = 'mr-admin-pass-v1'
const ADMIN_JOBS_KEY = 'mr-admin-jobs-v1'
const PENDING_JOBS_KEY = 'mr-pending-jobs-v1'
const ACCOUNTS_KEY = 'mr-accounts-v1'
const SESSION_KEY = 'mr-session-v1'
const GOOGLE_ENTRY_ROLE_KEY = 'mr-google-entry-role-v1'
const DELETION_REQUESTS_KEY = 'mr-deletion-requests-v1'
const SUPPORT_TICKETS_KEY = 'mr-support-tickets-v1'
const GUEST_SUPPORT_TICKET_IDS_KEY = 'mr-guest-support-ticket-ids-v1'
const PURCHASES_KEY = 'mr-purchases-v1'
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
const USER_JOB_STATE_KEY = 'mr-user-job-state-v1'
const FREE_DAILY_JOB_LIMIT = 3
const FREE_EXTRA_JOB_LIMIT = 7
const getTodayKey = () => new Date().toLocaleDateString('en-CA')
const emptyDailyJobAccess = (): StoredDailyJobAccess => ({ date: getTodayKey(), revealed: [], paidRevealed: [], dailyUnlocks: 0, extraReveals: {} })
const loadDailyJobAccess = (): StoredDailyJobAccess => {
  try {
    const raw = localStorage.getItem(DAILY_JOB_ACCESS_KEY)
    if (!raw) return emptyDailyJobAccess()
    const parsed = JSON.parse(raw) as Partial<StoredDailyJobAccess>
    if (parsed.date !== getTodayKey()) return emptyDailyJobAccess()
    return {
      date: getTodayKey(),
      revealed: Array.isArray(parsed.revealed) ? parsed.revealed.map(String) : [],
      paidRevealed: Array.isArray(parsed.paidRevealed) ? parsed.paidRevealed.map(String) : [],
      dailyUnlocks: Number.isFinite(parsed.dailyUnlocks) ? Math.max(0, Math.floor(parsed.dailyUnlocks as number)) : 0,
      extraReveals: parsed.extraReveals && typeof parsed.extraReveals === 'object' && !Array.isArray(parsed.extraReveals) ? parsed.extraReveals : {},
    }
  } catch { return emptyDailyJobAccess() }
}
const LEGACY_DEMO_JOB_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'])
const loadInitialJobs = (): Job[] => {
  try {
    const raw = localStorage.getItem(ADMIN_JOBS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Keep only real Admin-posted/Admin-approved jobs already saved on this
    // device. Old bundled demo vacancies (IDs 1–15) are never restored.
    return (parsed as Job[]).filter(job => job && !LEGACY_DEMO_JOB_IDS.has(String(job.id)))
  } catch { return [] }
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
// ---- Job Seeker uploads (profile photo + resume) ----
// The photo is downscaled and kept with the account profile. The resume file
// itself is stored privately on this device (IndexedDB); only its name/size
// metadata travels with the profile. Recruiters never see either upload.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
const fileToCompressedPhotoDataUrl = (file: File, maxDimension = 384): Promise<string> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    try {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    } catch (err) {
      URL.revokeObjectURL(url)
      reject(err)
    }
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to read image')) }
  img.src = url
})
const RESUME_DB_NAME = 'pharmasales-resume-store-v1'
const resumeStorageKey = (account: { role: EntryRole; mobile: string }) => `${account.role}:${account.mobile}`
const openResumeDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return }
  const request = indexedDB.open(RESUME_DB_NAME, 1)
  request.onupgradeneeded = () => { request.result.createObjectStore('resumes') }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error ?? new Error('Unable to open resume storage'))
})
const resumeDbRequest = async <T,>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openResumeDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction('resumes', mode)
    const request = run(tx.objectStore('resumes'))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Resume storage failed'))
    tx.oncomplete = () => db.close()
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Resume storage failed')) }
  })
}
const saveResumeBlob = (key: string, file: File) => resumeDbRequest('readwrite', store => store.put(file, key))
const loadResumeBlob = (key: string) => resumeDbRequest<Blob | undefined>('readonly', store => store.get(key) as IDBRequest<Blob | undefined>)
const deleteResumeBlob = (key: string) => resumeDbRequest('readwrite', store => store.delete(key))
const AccountAvatar = ({ name, photo, imgClassName, fallbackClassName }: { name: string; photo?: string; imgClassName: string; fallbackClassName: string }) => (
  photo
    ? <img src={photo} alt={name} className={`${imgClassName} shrink-0 select-none rounded-full object-cover object-center`} />
    : <span className={`${fallbackClassName} shrink-0 select-none items-center justify-center rounded-full font-extrabold`} style={{ display: 'inline-flex' }}>{name.trim().charAt(0).toUpperCase()}</span>
)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.1-4.2 1.1-3.2 0-5.9-2.1-6.8-5.1L1.3 17.2C3.3 21.2 7.3 24 12 24z" />
    <path fill="#FBBC05" d="M5.2 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L1.3 6.8C.5 8.4 0 10.1 0 12s.5 3.6 1.3 5.2l3.9-3z" />
    <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.8 1.3 6.8l3.9 3c.9-3 3.6-5.1 6.8-5.1z" />
  </svg>
)
const normalizeMobile = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}
const isValidMobile = (value: string) => /^[6-9]\d{9}$/.test(normalizeMobile(value))
const getMobileValidationError = (value: string) => {
  if (!value.trim()) return 'Enter your 10-digit mobile number.'
  return isValidMobile(value) ? null : 'Enter a correct 10-digit Indian mobile number.'
}
const getNameValidationError = (value: string) => {
  const name = value.trim().replace(/\s+/g, ' ')
  if (!name) return 'Enter your full name.'
  return name.length < 3 ? 'Enter your full name (minimum 3 letters).' : null
}
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
const MIN_PASSWORD_LENGTH = 6
const PASSWORD_HASH_ITERATIONS = 120000
const getPasswordValidationError = (password: string, label = 'Password') => {
  if (!password) return `Enter your ${label.toLowerCase()}.`
  if (password.length < MIN_PASSWORD_LENGTH) return `${label} must be at least ${MIN_PASSWORD_LENGTH} characters.`
  return null
}
const hasAccountPassword = (account?: Account | null) => Boolean(account?.passwordHash || account?.hasPassword)
const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0))
const createLocalPasswordHash = async (password: string) => {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) throw new Error('Secure password storage is not available in this browser')
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const key = await globalThis.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PASSWORD_HASH_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return `pbkdf2_sha256$${PASSWORD_HASH_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`
}
const verifyLocalPasswordHash = async (password: string, storedHash?: string) => {
  if (!storedHash || !globalThis.crypto?.subtle) return false
  const [scheme, iterationsText, saltText, expectedText] = storedHash.split('$')
  const iterations = Number(iterationsText)
  if (scheme !== 'pbkdf2_sha256' || !Number.isInteger(iterations) || iterations < 10000 || !saltText || !expectedText) return false
  try {
    const salt = base64ToBytes(saltText)
    const expected = base64ToBytes(expectedText)
    const key = await globalThis.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await globalThis.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      key,
      expected.length * 8,
    )
    const actual = new Uint8Array(bits)
    if (actual.length !== expected.length) return false
    let difference = 0
    actual.forEach((byte, index) => { difference |= byte ^ expected[index] })
    return difference === 0
  } catch {
    return false
  }
}
type ParsedAuthIdentifier = { kind: 'mobile' | 'email'; value: string; error: string | null }
const parseAuthIdentifier = (value: string): ParsedAuthIdentifier => {
  const raw = value.trim()
  if (!raw) return { kind: 'mobile', value: '', error: 'Enter your registered mobile number or email ID.' }
  if (raw.includes('@')) {
    const email = raw.toLowerCase()
    return { kind: 'email', value: email, error: getEmailValidationError(email) }
  }
  if (/[^+\d\s-]/.test(raw)) return { kind: 'mobile', value: normalizeMobile(raw), error: 'Enter a correct 10-digit mobile number or a complete email ID.' }
  const mobile = normalizeMobile(raw)
  return { kind: 'mobile', value: mobile, error: isValidMobile(mobile) ? null : 'Enter a correct 10-digit Indian mobile number or your registered email ID.' }
}
const accountMatchesIdentifier = (account: Account, identifier: ParsedAuthIdentifier) => (
  identifier.kind === 'email'
    ? account.email.trim().toLowerCase() === identifier.value
    : normalizeMobile(account.mobile) === identifier.value
)
const mergeAccountLists = (current: Account[], incoming: Account[]) => {
  const merged = new Map(current.map(account => [`${account.role}:${normalizeMobile(account.mobile)}`, account]))
  incoming.forEach(account => {
    const key = `${account.role}:${normalizeMobile(account.mobile)}`
    const previous = merged.get(key)
    merged.set(key, previous?.passwordHash && !account.passwordHash
      ? { ...account, passwordHash: previous.passwordHash, hasPassword: true }
      : account)
  })
  return Array.from(merged.values())
}
const loadAccounts = (): Account[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as Account[]).filter(a => a && (a.role === 'seeker' || a.role === 'recruiter') && a.name && a.mobile && a.email)
  } catch { return [] }
}
const loadPurchases = (): PurchaseRecord[] => {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as PurchaseRecord[]).filter(p => p && p.id && p.plan && p.purchasedAt)
  } catch { return [] }
}
const formatAdminDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
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
  if (!account || !isValidEmail(account.email) || !hasAccountPassword(account)) return null
  // Standing rule: a Recruiter account on this mobile blocks the Job Seeker session.
  if (account.role === 'seeker' && allAccounts.some(a => a.role === 'recruiter' && a.mobile === account.mobile)) return null
  return account
}
const emptyUserJobState = (): UserJobState => ({
  saved: [],
  applied: [],
  requestedCandidates: [],
  dailyAccess: emptyDailyJobAccess(),
})
const normalizeStoredIdList = (value: unknown): string[] => (
  Array.isArray(value)
    ? Array.from(new Set(value.map(item => String(item).trim()).filter(Boolean))).slice(0, 5000)
    : []
)
const normalizeUserJobState = (value: unknown): UserJobState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyUserJobState()
  const candidate = value as Partial<UserJobState>
  const daily = candidate.dailyAccess && typeof candidate.dailyAccess === 'object' && !Array.isArray(candidate.dailyAccess)
    ? candidate.dailyAccess as Partial<StoredDailyJobAccess>
    : null
  return {
    saved: normalizeStoredIdList(candidate.saved),
    applied: normalizeStoredIdList(candidate.applied),
    requestedCandidates: normalizeStoredIdList(candidate.requestedCandidates),
    dailyAccess: daily?.date === getTodayKey()
      ? {
          date: getTodayKey(),
          revealed: normalizeStoredIdList(daily.revealed),
          paidRevealed: normalizeStoredIdList(daily.paidRevealed),
          dailyUnlocks: Number.isFinite(daily.dailyUnlocks) ? Math.max(0, Math.floor(daily.dailyUnlocks as number)) : 0,
          extraReveals: daily.extraReveals && typeof daily.extraReveals === 'object' && !Array.isArray(daily.extraReveals)
            ? daily.extraReveals as Record<string, ExtraJobReveals>
            : {},
        }
      : emptyDailyJobAccess(),
  }
}
const userJobStateKey = (account: Pick<Account, 'role' | 'mobile'>) => `${account.role}:${normalizeMobile(account.mobile)}`
const loadStoredUserJobStates = (): Record<string, UserJobState> => {
  try {
    const raw = localStorage.getItem(USER_JOB_STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([key, state]) => [key, normalizeUserJobState(state)]))
  } catch { return {} }
}
const getStoredUserJobState = (account: Pick<Account, 'role' | 'mobile'>): UserJobState | null => (
  loadStoredUserJobStates()[userJobStateKey(account)] ?? null
)
const saveStoredUserJobState = (account: Pick<Account, 'role' | 'mobile'>, state: UserJobState) => {
  try {
    const states = loadStoredUserJobStates()
    states[userJobStateKey(account)] = normalizeUserJobState(state)
    localStorage.setItem(USER_JOB_STATE_KEY, JSON.stringify(states))
  } catch { /* ignore */ }
}
const deleteStoredUserJobState = (account: Pick<Account, 'role' | 'mobile'>) => {
  try {
    const states = loadStoredUserJobStates()
    delete states[userJobStateKey(account)]
    localStorage.setItem(USER_JOB_STATE_KEY, JSON.stringify(states))
  } catch { /* ignore */ }
}
const loadInitialUserJobState = (): UserJobState => {
  const sessionAccount = loadSessionAccount()
  const stored = sessionAccount ? getStoredUserJobState(sessionAccount) : null
  if (stored) return stored
  let requestedCandidates: string[] = []
  try {
    const raw = localStorage.getItem(CANDIDATE_INTERESTS_KEY)
    if (raw) requestedCandidates = normalizeStoredIdList(JSON.parse(raw))
  } catch { /* ignore */ }
  return {
    saved: [],
    applied: [],
    requestedCandidates,
    dailyAccess: loadDailyJobAccess(),
  }
}
const mergeUserJobStates = (primary: UserJobState, secondary: UserJobState): UserJobState => {
  const mergedExtraReveals: Record<string, ExtraJobReveals> = { ...secondary.dailyAccess.extraReveals }
  Object.entries(primary.dailyAccess.extraReveals).forEach(([jobId, fields]) => {
    mergedExtraReveals[jobId] = { ...(mergedExtraReveals[jobId] ?? {}), ...fields }
  })
  return normalizeUserJobState({
    saved: [...primary.saved, ...secondary.saved],
    applied: [...primary.applied, ...secondary.applied],
    requestedCandidates: [...primary.requestedCandidates, ...secondary.requestedCandidates],
    dailyAccess: {
      date: getTodayKey(),
      revealed: [...primary.dailyAccess.revealed, ...secondary.dailyAccess.revealed],
      paidRevealed: [...primary.dailyAccess.paidRevealed, ...secondary.dailyAccess.paidRevealed],
      dailyUnlocks: Math.max(primary.dailyAccess.dailyUnlocks, secondary.dailyAccess.dailyUnlocks),
      extraReveals: mergedExtraReveals,
    },
  })
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
    hasPassword: row.has_password === true,
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

const loadGuestSupportTicketIds = (): string[] => {
  try {
    const raw = localStorage.getItem(GUEST_SUPPORT_TICKET_IDS_KEY)
    if (raw) return normalizeStoredIdList(JSON.parse(raw))
  } catch { /* ignore */ }
  // Migrate guest tickets that were created on this device before sync existed.
  return loadSupportTickets().filter(ticket => ticket.role === 'guest').map(ticket => ticket.id)
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

type HowToVideoLanguage = 'english' | 'hindi' | 'kannada' | 'telugu'
type HowToVideoRole = EntryRole | 'admin'

const HOW_TO_VIDEOS: Record<HowToVideoLanguage, { label: string; nativeLabel: string; src: string; downloadName: string; duration: string }> = {
  english: {
    label: 'English',
    nativeLabel: 'English',
    src: '/videos/PharmaSales-Jobs-How-To-Use-English-Voice.mp4',
    downloadName: 'PharmaSales-Jobs-How-To-Use-English-Voice.mp4',
    duration: '1:23',
  },
  hindi: {
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    src: '/videos/PharmaSales-Jobs-How-To-Use-Hindi-Voice.mp4',
    downloadName: 'PharmaSales-Jobs-How-To-Use-Hindi-Voice.mp4',
    duration: '1:44',
  },
  kannada: {
    label: 'kannada',
    nativeLabel: 'ಕನ್ನಡ',
    src: '/videos/PharmaSales-Jobs-How-To-Use-kannada-Voice.mp4',
    downloadName: 'PharmaSales-Jobs-How-To-Use-kannada-Voice.mp4',
    duration: '1:40',
  },
  telugu: {
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    src: '/videos/PharmaSales-Jobs-How-To-Use-Telugu-Voice.mp4',
    downloadName: 'PharmaSales-Jobs-How-To-Use-Telugu-Voice.mp4',
    duration: '1:36',
  },
}

const HOW_TO_VIDEO_ROLE_CHAPTERS: Record<HowToVideoLanguage, Record<HowToVideoRole, number>> = {
  english: { seeker: 27, recruiter: 61, admin: 73 },
  hindi: { seeker: 37, recruiter: 78, admin: 92 },
  kannada: { seeker: 34, recruiter: 74, admin: 87 },
  telugu: { seeker: 32, recruiter: 71, admin: 84 },
}

const HOW_TO_VIDEO_ROLE_COPY: Record<HowToVideoRole, { title: string; description: string; chapterLabel: string }> = {
  seeker: {
    title: 'Job Seeker Login Guide',
    description: 'Watch the App Founder highlight, then learn profile setup, job search, contact unlocks, plans and Apply.',
    chapterLabel: 'Play Job Seeker section',
  },
  recruiter: {
    title: 'Recruiter Login Guide',
    description: 'Watch the App Founder highlight, then learn anonymous candidate search, vacancy posting and Admin approval.',
    chapterLabel: 'Play Recruiter section',
  },
  admin: {
    title: 'Admin Login Guide',
    description: 'Watch the App Founder highlight, then learn vacancy approvals, users, plans, payments and support management.',
    chapterLabel: 'Play Admin section',
  },
}

const formatHowToVideoTime = (totalSeconds: number) => `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`

export default function App() {
  // App state
  const [tier, setTier] = useState<Tier>('free')
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => loadPurchases())
  const [commerceSettings, setCommerceSettings] = useState<CommerceSettings>(() => loadStoredCommerceSettings())
  const [commerceDraft, setCommerceDraft] = useState<CommerceSettings>(() => loadStoredCommerceSettings())
  const [commerceSettingsError, setCommerceSettingsError] = useState('')
  const [commerceSettingsSaving, setCommerceSettingsSaving] = useState(false)
  const [commerceAdminPassword, setCommerceAdminPassword] = useState('')
  const [commerceQrUploading, setCommerceQrUploading] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<PaidPlanId | null>(null)
  const [checkoutMethod, setCheckoutMethod] = useState<CheckoutMethod>('demo')
  const [checkoutReference, setCheckoutReference] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutProcessing, setCheckoutProcessing] = useState(false)
  const [planClock, setPlanClock] = useState(() => Date.now())
  const [planPurchaseSyncReady, setPlanPurchaseSyncReady] = useState(() => !isSupabaseConfigured)
  const previousTierRef = useRef<Tier>('free')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('All India')
  const [city, setCity] = useState('All Cities')
  const [hq, setHq] = useState('All HQs')
  const [company, setCompany] = useState('All Companies')
  const [role, setRole] = useState<typeof ROLES[number]>('All Roles')
  const [expFilter, setExpFilter] = useState<typeof EXP_OPTIONS[number]>('All Experience')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(() => new Set(loadInitialUserJobState().saved))
  const [applied, setApplied] = useState<Set<string>>(() => new Set(loadInitialUserJobState().applied))
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set(loadInitialUserJobState().dailyAccess.revealed))
  const [paidRevealed, setPaidRevealed] = useState<Set<string>>(() => new Set(loadInitialUserJobState().dailyAccess.paidRevealed))
  const [dailyUnlocks, setDailyUnlocks] = useState(() => loadInitialUserJobState().dailyAccess.dailyUnlocks)
  const [extraReveals, setExtraReveals] = useState<Record<string, ExtraJobReveals>>(() => loadInitialUserJobState().dailyAccess.extraReveals)
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
  const [howToVideoLanguage, setHowToVideoLanguage] = useState<HowToVideoLanguage>('english')
  const [howToVideoRole, setHowToVideoRole] = useState<HowToVideoRole | null>(null)
  const [howToVideoStage, setHowToVideoStage] = useState<'language' | 'player'>('language')
  const howToVideoPlayerRef = useRef<HTMLVideoElement | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>(() => getAiWelcomeMessages(loadSessionAccount()?.role))
  const [aiLoading, setAiLoading] = useState(false)
  // Jobs are state (Admin can post/delete; cached here and synced via Supabase)
  const [jobs, setJobs] = useState<Job[]>(() => loadInitialJobs())
  useEffect(() => { try { localStorage.setItem(ADMIN_JOBS_KEY, JSON.stringify(jobs)) } catch { /* ignore */ } }, [jobs])
  // Admin auth (M Divakar Reddy only)
  const [isAdmin, setIsAdmin] = useState(() => { try { return localStorage.getItem(ADMIN_AUTH_KEY) === '1' } catch { return false } })
  const [adminId, setAdminId] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [showAdminForgot, setShowAdminForgot] = useState(false)
  const [adminForgotId, setAdminForgotId] = useState('')
  const [adminForgotEmail, setAdminForgotEmail] = useState('')
  const [adminForgotNew, setAdminForgotNew] = useState('')
  const [adminForgotConfirm, setAdminForgotConfirm] = useState('')
  const [adminForgotError, setAdminForgotError] = useState('')
  const [adminTab, setAdminTab] = useState<'overview' | 'post' | 'approvals' | 'users' | 'purchases' | 'payments' | 'plan-settings' | 'payment-settings' | 'accounts' | 'support' | 'manage' | 'settings'>('overview')
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [adminUserRoleFilter, setAdminUserRoleFilter] = useState<'all' | 'seeker' | 'recruiter' | 'admin'>('all')
  const [adminUserSearch, setAdminUserSearch] = useState('')
  const [adminAccountDetail, setAdminAccountDetail] = useState<Account | null>(null)
  const [remoteAdminUsers, setRemoteAdminUsers] = useState<RemoteAccountRow[] | null>(null)
  const [remotePurchases, setRemotePurchases] = useState<PurchaseRecord[] | null>(null)
  const [adminDataLoading, setAdminDataLoading] = useState(false)
  const [newJob, setNewJob] = useState({ company: '', title: 'Medical Representative', division: '', state: 'Telangana', city: 'Hyderabad', area: '', type: 'Field MR' as Job['type'], exp: '0-2 yrs (Freshers can apply)', ctc: '', vacancies: '1', qual: 'B.Pharm / B.Sc / D.Pharm', desc: '', contactPerson: 'M Divakar Reddy', phone: '', email: '', urgent: false })
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' })
  // Recruiter-submitted vacancies — LIVE only after Admin approval
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>(() => {
    try { const raw = localStorage.getItem(PENDING_JOBS_KEY); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed as PendingJob[] } } catch { /* ignore */ }
    return []
  })
  useEffect(() => { try { localStorage.setItem(PENDING_JOBS_KEY, JSON.stringify(pendingJobs)) } catch { /* ignore */ } }, [pendingJobs])
  const [recruiterJob, setRecruiterJob] = useState({ company: '', title: 'Medical Representative', division: '', state: 'Telangana', city: 'Hyderabad', area: '', type: 'Field MR' as Job['type'], exp: '0-2 yrs (Freshers can apply)', ctc: '', vacancies: '1', qual: 'B.Pharm / B.Sc / D.Pharm', desc: '', contactType: 'Manager', contactPerson: '', phone: '', email: '', urgent: false })
  const [recruiterSubmitted, setRecruiterSubmitted] = useState(false)
  // User accounts (Job Seeker / Recruiter) — register with mobile, email and
  // a minimum-6-character password; then login with mobile OR email + password.
  // Admin keeps its separate existing login and is not part of this user flow.
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts())
  const [currentUser, setCurrentUser] = useState<Account | null>(() => loadSessionAccount())
  const [hasAuthenticated, setHasAuthenticated] = useState(() => Boolean(loadSessionAccount()))
  const [authStep, setAuthStep] = useState<AuthStep>('mobile')
  const [authForm, setAuthForm] = useState<AuthFormState>(EMPTY_AUTH_FORM)
  const [authError, setAuthError] = useState('')
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({})
  const [authIdentifierTouched, setAuthIdentifierTouched] = useState(false)
  const [authNameTouched, setAuthNameTouched] = useState(false)
  const [authMobileTouched, setAuthMobileTouched] = useState(false)
  const [authEmailTouched, setAuthEmailTouched] = useState(false)
  const [authPasswordTouched, setAuthPasswordTouched] = useState(false)
  const [authConfirmPasswordTouched, setAuthConfirmPasswordTouched] = useState(false)
  const [showAuthPassword, setShowAuthPassword] = useState(false)
  const [showAuthConfirmPassword, setShowAuthConfirmPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false)
  const [googlePendingProfile, setGooglePendingProfile] = useState<{ role: EntryRole; name: string; email: string } | null>(null)
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false)
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>(() => loadDeletionRequests())
  const [showDeletionRequestModal, setShowDeletionRequestModal] = useState(false)
  const [deletionRequestForm, setDeletionRequestForm] = useState({ category: '', details: '' })
  const [deletionRequestError, setDeletionRequestError] = useState('')
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy')
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => loadSupportTickets())
  const [guestSupportTicketIds, setGuestSupportTicketIds] = useState<Set<string>>(() => new Set(loadGuestSupportTicketIds()))
  const [showSupportTicketModal, setShowSupportTicketModal] = useState(false)
  const [supportTicketSource, setSupportTicketSource] = useState<SupportTicketSource>('ai')
  const [supportTicketForm, setSupportTicketForm] = useState({ name: '', mobile: '', email: '', category: '', subject: '', details: '' })
  const [supportTicketError, setSupportTicketError] = useState('')
  const [createdSupportTicket, setCreatedSupportTicket] = useState<SupportTicket | null>(null)
  const [seekerProfileForm, setSeekerProfileForm] = useState<SeekerProfile>(() => loadSessionAccount()?.profile ?? EMPTY_SEEKER_PROFILE)
  const [uploadBusy, setUploadBusy] = useState<'' | 'photo' | 'resume' | 'download'>('')
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const [seekerProfileError, setSeekerProfileError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileEditField, setProfileEditField] = useState<keyof SeekerProfile | ''>('')
  const [accountEditField, setAccountEditField] = useState<'name' | 'email' | ''>('')
  const [accountEditValue, setAccountEditValue] = useState('')
  const [accountEditError, setAccountEditError] = useState('')
  const [accountSaving, setAccountSaving] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateRoleFilter, setCandidateRoleFilter] = useState('All Roles')
  const [candidateExperienceFilter, setCandidateExperienceFilter] = useState('All Candidates')
  const [candidateStateFilter, setCandidateStateFilter] = useState('All India')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfileView | null>(null)
  const [remoteCandidateProfiles, setRemoteCandidateProfiles] = useState<CandidateProfileView[]>([])
  const [requestedCandidates, setRequestedCandidates] = useState<Set<string>>(() => new Set(loadInitialUserJobState().requestedCandidates))
  useEffect(() => { try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)) } catch { /* ignore */ } }, [accounts])
  useEffect(() => { try { localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(deletionRequests)) } catch { /* ignore */ } }, [deletionRequests])
  useEffect(() => { try { localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(supportTickets)) } catch { /* ignore */ } }, [supportTickets])
  useEffect(() => { try { localStorage.setItem(GUEST_SUPPORT_TICKET_IDS_KEY, JSON.stringify(Array.from(guestSupportTicketIds))) } catch { /* ignore */ } }, [guestSupportTicketIds])
  useEffect(() => { try { localStorage.setItem(CANDIDATE_INTERESTS_KEY, JSON.stringify(Array.from(requestedCandidates))) } catch { /* ignore */ } }, [requestedCandidates])
  useEffect(() => { try { localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases)) } catch { /* ignore */ } }, [purchases])
  useEffect(() => { try { localStorage.setItem(COMMERCE_SETTINGS_KEY, JSON.stringify(commerceSettings)) } catch { /* ignore */ } }, [commerceSettings])
  // Re-check plan validity while the app stays open (and whenever it regains focus).
  useEffect(() => {
    const tick = () => setPlanClock(Date.now())
    const interval = window.setInterval(tick, 30000)
    const onVisibility = () => { if (!document.hidden) tick() }
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
  // A paid tier exists only while a paid purchase for this Job Seeker is inside
  // its Admin-set validity. At expiry this automatically removes paid benefits.
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'seeker' || isAdmin) {
      previousTierRef.current = 'free'
      if (tier !== 'free') setTier('free')
      return
    }
    const activePurchase = getActivePlanPurchase(purchases, currentUser.mobile, planClock)
    const nextTier: Tier = activePurchase?.plan ?? 'free'
    const wasPaidTier = previousTierRef.current !== 'free'
    const shouldRemovePaidBenefits = nextTier === 'free' && (wasPaidTier || (planPurchaseSyncReady && paidRevealed.size > 0))
    if (shouldRemovePaidBenefits) {
      const remainingRevealed = new Set(Array.from(revealed).filter(id => !paidRevealed.has(id)))
      setRevealed(remainingRevealed)
      setExtraReveals(prev => Object.fromEntries(Object.entries(prev).filter(([jobId]) => !paidRevealed.has(jobId))))
      setPaidRevealed(new Set())
      setDailyUnlocks(jobs.slice(0, FREE_DAILY_JOB_LIMIT).filter(job => remainingRevealed.has(job.id)).length)
      setSelected(null)
      setShowRewarded(null)
      setRewardProgress(0)
      setApplyAdJob(null)
      setApplyAdProgress(0)
      if (wasPaidTier) setToast('Your paid plan validity has ended. Free plan is now active and paid benefits are turned off.')
    }
    previousTierRef.current = nextTier
    if (tier !== nextTier) setTier(nextTier)
    // Entitlement is recalculated from purchases + the validity clock. Revealed/job
    // state is intentionally read only at the expiry transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, currentUser?.mobile, isAdmin, purchases, planClock, planPurchaseSyncReady])
  useEffect(() => {
    try { localStorage.setItem(DAILY_JOB_ACCESS_KEY, JSON.stringify({ date: getTodayKey(), revealed: Array.from(revealed), paidRevealed: Array.from(paidRevealed), dailyUnlocks, extraReveals })) } catch { /* ignore */ }
  }, [revealed, paidRevealed, dailyUnlocks, extraReveals])
  useEffect(() => {
    if (currentUser?.role === 'seeker') setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
  }, [currentUser])
  const aiEndRef = useRef<HTMLDivElement>(null)
  const heroSearchRef = useRef<HTMLInputElement>(null)
  const secretTapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null })
  const remoteSessionRefreshRef = useRef(false)
  const remoteSyncLoadStartedRef = useRef(false)
  const remoteSyncLoadedRef = useRef<Record<string, boolean>>({})
  const remoteSyncPreviousRef = useRef<Record<string, SyncRecord[]>>({})
  const remoteSyncTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const remoteUserStateLoadedKeyRef = useRef('')
  const remoteUserStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const googleAuthProcessingRef = useRef(false)
  const authLookupIdentifierRef = useRef('')
  const rewardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetAuthPasswordState = () => {
    setAuthPasswordTouched(false)
    setAuthConfirmPasswordTouched(false)
    setShowAuthPassword(false)
    setShowAuthConfirmPassword(false)
  }
  const clearAuthErrors = () => {
    setAuthError('')
    setAuthFieldErrors({})
  }
  const clearAuthFieldError = (field: AuthField) => {
    setAuthFieldErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }
  const showAuthFieldErrors = (errors: AuthFieldErrors) => {
    setAuthError('')
    setAuthFieldErrors(errors)
  }
  const showAuthFieldError = (field: AuthField, message: string) => {
    showAuthFieldErrors({ [field]: message })
  }
  const markAuthFieldTouched = (field: AuthField) => {
    if (field === 'identifier') setAuthIdentifierTouched(true)
    if (field === 'name') setAuthNameTouched(true)
    if (field === 'mobile') setAuthMobileTouched(true)
    if (field === 'email') setAuthEmailTouched(true)
    if (field === 'password') setAuthPasswordTouched(true)
    if (field === 'confirmPassword') setAuthConfirmPasswordTouched(true)
  }
  const markAuthFieldsTouched = (fields: AuthField[]) => {
    fields.forEach(markAuthFieldTouched)
  }
  const resetAuthTouched = () => {
    setAuthIdentifierTouched(false)
    setAuthNameTouched(false)
    setAuthMobileTouched(false)
    setAuthEmailTouched(false)
    resetAuthPasswordState()
  }
  const updateAuthField = (field: AuthField, value: string) => {
    setAuthForm(prev => ({ ...prev, [field]: value }))
    setAuthError('')
    clearAuthFieldError(field)
    // Password and Confirm Password are one pair: editing either box should
    // not leave a stale "do not match" error under the other box.
    if (field === 'password') clearAuthFieldError('confirmPassword')
    if (field === 'confirmPassword') clearAuthFieldError('password')
  }

  const limitForTier: Record<Tier, number> = {
    free: FREE_DAILY_JOB_LIMIT,
    starter: getPaidPlanLimit(commerceSettings.plans.starter),
    pro: getPaidPlanLimit(commerceSettings.plans.pro),
  }
  const activePlanPurchase = currentUser?.role === 'seeker'
    ? getActivePlanPurchase(purchases, currentUser.mobile, planClock)
    : undefined
  const latestPlanPurchase = currentUser?.role === 'seeker'
    ? purchases.filter(record => record.role === 'seeker' && normalizeMobile(record.mobile) === normalizeMobile(currentUser.mobile) && record.status === 'paid' && record.plan !== 'free').sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]
    : undefined
  const planCards = [
    {
      ...TIERS[0],
      enabled: true,
      validityDays: 0,
      bestFor: 'Best for trying PharmaSales Jobs and checking a few vacancies daily.',
      simpleMeaning: 'You get 3 full hiring contacts first. After those 3, 7 more jobs open with separate sponsored ads for each important detail.',
      contactAccess: '3 full contacts + 7 extra jobs/day',
      contactDetails: 'After sponsored ads',
      adsText: 'Browsing and contact-reveal ads apply',
      validityText: 'No expiry — daily limit resets',
      paymentText: 'No payment needed',
    },
    ...(['starter', 'pro'] as PaidPlanId[]).map(planId => {
      const plan = commerceSettings.plans[planId]
      const base = TIERS.find(item => item.id === planId) ?? TIERS[1]
      const limitLabel = plan.unlimited ? 'Unlimited' : `${getPaidPlanLimit(plan)}/day`
      return {
        ...base,
        id: planId as Tier,
        name: plan.name,
        price: formatINR(plan.price),
        period: `/${plan.validityDays} days`,
        features: [`${plan.unlimited ? 'Unlimited direct contacts' : `${getPaidPlanLimit(plan)} direct contacts/day`} — no reveal ads`, ...plan.features],
        cta: `Buy ${plan.name} — ${formatINR(plan.price)}`,
        popular: plan.popular,
        limit: limitLabel,
        enabled: plan.enabled,
        validityDays: plan.validityDays,
        bestFor: planId === 'starter'
          ? 'Best for regular MR to NSM job search with faster direct contacts.'
          : 'Best for urgent job change and heavy daily applications.',
        simpleMeaning: planId === 'starter'
          ? `Pay once and directly open up to ${getPaidPlanLimit(plan)} hiring contacts every day during the full validity.`
          : `Pay once and directly open ${plan.unlimited ? 'unlimited hiring contacts' : `up to ${getPaidPlanLimit(plan)} hiring contacts per day`} during the full validity.`,
        contactAccess: plan.unlimited ? 'Unlimited direct contacts' : `${getPaidPlanLimit(plan)} direct contacts/day`,
        contactDetails: 'Direct — no reveal ad',
        adsText: 'No browsing/reveal ads; Apply ad still shows',
        validityText: `${plan.validityDays} days from activation`,
        paymentText: 'Pay once for the full validity',
      }
    }),
  ]
  const isJobSeekerUser = hasAuthenticated && currentUser?.role === 'seeker' && !isAdmin
  const isRecruiterUser = hasAuthenticated && currentUser?.role === 'recruiter'
  const shouldHideJobSeekerExperience = isRecruiterUser && !isAdmin
  const isAdFree = isAdmin || isRecruiterUser || tier !== 'free' // Admin/Recruiter/paid: no Job Seeker browsing or contact-reveal ads. Apply ad is Job Seeker-only.
  const isAdminLoginPage = page === 'admin' && !isAdmin
  // Welcome, Auth, both Admin states, and guest Legal are isolated screens.
  // They must not expose the normal Jobs/Home/Recruiter navigation shell.
  const isIsolatedShellPage = page === 'welcome' || page === 'auth' || page === 'admin' || (page === 'legal' && !hasAuthenticated && !isAdmin)
  const welcomeSelectedRole: EntryRole | null = entryRole

  useEffect(() => {
    if (!howToVideoRole) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [howToVideoRole])

  const openHowToVideo = (guideRole: HowToVideoRole) => {
    setHowToVideoRole(guideRole)
    setHowToVideoStage('language')
  }

  const closeHowToVideo = () => {
    howToVideoPlayerRef.current?.pause()
    setHowToVideoRole(null)
    setHowToVideoStage('language')
  }

  const selectHowToVideoLanguage = (language: HowToVideoLanguage) => {
    setHowToVideoLanguage(language)
    setHowToVideoStage('player')
  }

  const playHowToVideoChapter = () => {
    const player = howToVideoPlayerRef.current
    if (!player || !howToVideoRole) return
    try { player.currentTime = HOW_TO_VIDEO_ROLE_CHAPTERS[howToVideoLanguage][howToVideoRole] } catch { /* metadata may still be loading */ }
    void player.play().catch(() => undefined)
  }

  const renderHowToVideoButton = (guideRole: HowToVideoRole) => (
    <button
      type="button"
      onClick={() => openHowToVideo(guideRole)}
      aria-haspopup="dialog"
      className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-2.5 text-left text-white shadow-md transition hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow">
        <Play className="ml-0.5 h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold leading-tight">How to Use App</span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold leading-tight text-emerald-50">English • हिन्दी • ಕನ್ನಡ • Telugu</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/90" />
    </button>
  )

  const renderHowToVideoModal = () => {
    const guideRole = howToVideoRole ?? 'seeker'
    const copy = HOW_TO_VIDEO_ROLE_COPY[guideRole]
    const video = HOW_TO_VIDEOS[howToVideoLanguage]
    const chapterStart = HOW_TO_VIDEO_ROLE_CHAPTERS[howToVideoLanguage][guideRole]

    return (
      <AnimatePresence>
        {howToVideoRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeHowToVideo}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-[2px] sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.96, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 14 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`How to Use App — ${copy.title}`}
              className="max-h-[94dvh] w-full max-w-[430px] overflow-hidden rounded-[26px] bg-white text-left shadow-2xl"
            >
              <div className="app-topbar-background flex items-center gap-3 px-4 py-3 text-white">
                <img src="/divakar-reddy-circle-200.jpg" alt="M Divakar Reddy — App Founder" className="h-11 w-11 shrink-0 rounded-full border-2 border-amber-300 object-cover shadow" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-extrabold tracking-[0.14em] text-amber-200">APP FOUNDER HIGHLIGHT</p>
                  <h3 className="mt-0.5 truncate text-base font-extrabold leading-tight">How to Use App</h3>
                  <p className="truncate text-[11px] font-semibold text-sky-100">{copy.title} • M Divakar Reddy</p>
                </div>
                <button type="button" onClick={closeHowToVideo} aria-label="Close How to Use video" title="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30 active:scale-95">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {howToVideoStage === 'language' ? (
                <div className="p-4">
                  <p className="text-sm font-extrabold text-slate-900">Choose video language</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">The video will open immediately.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Choose How to Use video language">
                    {(Object.keys(HOW_TO_VIDEOS) as HowToVideoLanguage[]).map(language => {
                      const option = HOW_TO_VIDEOS[language]
                      const active = howToVideoLanguage === language
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() => selectHowToVideoLanguage(language)}
                          className={`group flex min-h-[74px] items-center gap-2 rounded-3xl border px-3 py-3 text-left transition active:scale-[0.98] ${active ? 'border-sky-600 bg-sky-600 text-white shadow-md' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-300 hover:bg-sky-50'}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-extrabold leading-tight">{option.nativeLabel}</span>
                            <span className={`mt-1 block text-[11px] font-bold leading-tight ${active ? 'text-sky-100' : 'text-slate-500'}`}>{option.label} • {option.duration}</span>
                          </span>
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-white text-sky-700' : 'bg-sky-600 text-white'}`}>
                            <Play className="ml-0.5 h-3.5 w-3.5" />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-center text-[11px] font-semibold text-slate-400">Every video starts with the App Founder highlight.</p>
                </div>
              ) : (
                <div>
                  <video
                    key={`${guideRole}-${howToVideoLanguage}`}
                    ref={howToVideoPlayerRef}
                    src={video.src}
                    poster="/videos/PharmaSales-Jobs-Founder-Highlight.jpg"
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    onLoadedMetadata={e => { void e.currentTarget.play().catch(() => undefined) }}
                    className="h-[min(56dvh,540px)] w-full bg-slate-950 object-contain"
                  />
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-slate-700">{video.nativeLabel} • {video.label} • {video.duration}</span>
                      <button
                        type="button"
                        onClick={() => { howToVideoPlayerRef.current?.pause(); setHowToVideoStage('language') }}
                        className="flex shrink-0 items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-extrabold text-sky-700 transition hover:bg-sky-100"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Language
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button type="button" onClick={playHowToVideoChapter} className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2.5 text-[11px] font-extrabold text-white shadow hover:bg-emerald-700">
                        <Play className="h-3.5 w-3.5" /> {copy.chapterLabel.replace('Play ', '')} • {formatHowToVideoTime(chapterStart)}
                      </button>
                      <a href={video.src} download={video.downloadName} className="flex items-center justify-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] font-extrabold text-sky-700 hover:bg-sky-100">
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

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
    const jobSeekerOnlyPages: AppPage[] = ['home', 'jobs', 'pricing', 'payment', 'saved', 'profile']
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
  // No hard-coded Admin password: the local fallback exists only after a
  // successful verified Admin login/reset has stored the current password.
  const storedAdminPassword = () => { try { return localStorage.getItem(ADMIN_PASS_KEY) || '' } catch { return '' } }
  const openAdmin = (tab: typeof adminTab = 'overview') => {
    if (!isAdmin) {
      setAdminId('')
      setAdminPass('')
      setAdminError('')
      setShowAdminPass(false)
    }
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
    setShowAdminMenu(false)
    navigate('admin')
  }
  // FULLY SECRET: Admin Login opens only after 5 quick taps on the Welcome
  // page logo/photo. No tap count or hint is ever shown, and the gesture is
  // disabled on every other page (Job Seeker, Recruiter, Auth, Admin, etc.).
  const handleSecretTap = (): boolean => {
    if (page !== 'welcome') return false
    const s = secretTapRef.current
    s.count += 1
    if (s.timer) clearTimeout(s.timer)
    s.timer = setTimeout(() => { s.count = 0 }, 2500)
    if (s.count >= 5) {
      s.count = 0
      if (s.timer) clearTimeout(s.timer)
      openAdmin()
      return true
    }
    return false
  }
  const getSafeHomeDestination = (): typeof page => {
    if (isAdmin) return 'admin'
    if (hasAuthenticated && currentUser) return getAccountDestination(currentUser)
    return 'welcome'
  }
  const handleBrandLogoClick = () => {
    if (page === 'admin') {
      // On Admin Login, the brand must never redirect to Jobs/Home.
      if (isAdmin) openAdmin('overview')
      return
    }
    if (isAdmin) { openAdmin('overview'); return }
    navigate(getSafeHomeDestination())
  }
  const isBackDestinationAllowed = (destination: AppPage): boolean => {
    if (destination === page) return false
    if (destination === 'welcome' || destination === 'auth') return !hasAuthenticated && !isAdmin
    if (destination === 'admin') return isAdmin || !hasAuthenticated
    if (shouldHideJobSeekerExperience && ['home', 'jobs', 'pricing', 'payment', 'saved', 'profile'].includes(destination)) return false
    if (destination === 'candidates') return isAdmin || (hasAuthenticated && currentUser?.role === 'recruiter')
    if (destination === 'profile') return isAdmin || currentUser?.role === 'seeker'
    if (destination === 'account') return isAdmin || (hasAuthenticated && Boolean(currentUser))
    return true
  }
  const getFallbackBackDestination = (): AppPage | null => {
    if (page === 'welcome' || page === 'admin') return null
    if (page === 'auth') return 'welcome'
    if (page === 'candidates') return 'recruiters'
    if (page === 'postjob') {
      if (isAdmin) return 'admin'
      if (hasAuthenticated && currentUser?.role === 'seeker') return 'jobs'
      return 'recruiters'
    }
    if (page === 'payment') return 'pricing'
    if (page === 'saved' || page === 'pricing') return 'jobs'
    if (page === 'jobs') return 'home'
    if (page === 'profile') return currentUser?.role === 'seeker' && isSeekerProfileComplete(currentUser.profile) ? 'home' : 'jobs'
    if (page === 'account') {
      if (isAdmin) return 'admin'
      if (hasAuthenticated && currentUser) return getAccountDestination(currentUser)
      return 'welcome'
    }
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
  const canGoBack = Boolean(backDestination || (page === 'auth' && authStep !== 'mobile') || (page === 'admin' && isAdmin && adminTab !== 'overview'))
  const handlePageBack = () => {
    if (showAdminMenu) { setShowAdminMenu(false); return }
    if (showMobileMenu) { setShowMobileMenu(false); return }
    if (showAccountMenu) { setShowAccountMenu(false); return }
    if (selectedCandidate) { setSelectedCandidate(null); return }
    if (selected) { setSelected(null); return }
    if (page === 'auth' && authStep !== 'mobile') {
      setAuthStep('mobile')
      clearAuthErrors()
      resetAuthTouched()
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
    setAdminId('')
    setAdminError('')
    setAdminPass('')
    setShowAdminPass(false)
    setShowAdminForgot(false)
    setAdminForgotError('')
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
      const preservedIncoming = incoming.map(account => {
        const local = prev.find(a => a.role === account.role && normalizeMobile(a.mobile) === normalizeMobile(account.mobile))
        return local?.passwordHash && !account.passwordHash
          ? { ...account, passwordHash: local.passwordHash, hasPassword: true }
          : account
      })
      const next = [...prev.filter(a => normalizeMobile(a.mobile) !== normalizeMobile(mobile)), ...preservedIncoming]
      try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }
  const mergeIncomingAccountsState = (incoming: Account[]) => {
    setAccounts(prev => {
      const next = mergeAccountLists(prev, incoming)
      try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }
  const fetchRemoteSyncCollection = async <T extends SyncRecord>(collectionKey: RemoteSyncCollectionKey): Promise<T[] | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('list_app_sync_records', { p_collection_key: collectionKey })
    if (error) throw error
    return ((data ?? []) as RemoteSyncRecordRow[]).map(row => ({ ...(row.payload as Record<string, unknown>), id: row.record_id } as T))
  }
  const syncRemoteSyncCollection = async <T extends SyncRecord>(collectionKey: RemoteSyncCollectionKey, previous: T[], next: T[]) => {
    if (!supabase) return
    const previousById = new Map(previous.map((record, index) => [record.id, { index, json: JSON.stringify(record) }]))
    const nextIds = new Set(next.map(record => record.id))
    const operations: Promise<void>[] = []

    next.forEach((record, index) => {
      const previousRecord = previousById.get(record.id)
      if (!previousRecord || previousRecord.index !== index || previousRecord.json !== JSON.stringify(record)) {
        operations.push((async () => {
          const { error } = await supabase.rpc('upsert_app_sync_record', {
            p_collection_key: collectionKey,
            p_record_id: record.id,
            p_position: index,
            p_payload: record,
          })
          if (error) throw error
        })())
      }
    })

    previous.forEach(record => {
      if (!nextIds.has(record.id)) {
        operations.push((async () => {
          const { error } = await supabase.rpc('delete_app_sync_record', {
            p_collection_key: collectionKey,
            p_record_id: record.id,
          })
          if (error) throw error
        })())
      }
    })

    await Promise.all(operations)
  }
  const scheduleRemoteSyncCollection = <T extends SyncRecord>(collectionKey: RemoteSyncCollectionKey, next: T[]) => {
    if (!supabase || !remoteSyncLoadedRef.current[collectionKey]) return
    const existingTimer = remoteSyncTimersRef.current[collectionKey]
    if (existingTimer) clearTimeout(existingTimer)
    remoteSyncTimersRef.current[collectionKey] = setTimeout(() => {
      const previous = (remoteSyncPreviousRef.current[collectionKey] ?? []) as T[]
      remoteSyncPreviousRef.current[collectionKey] = next
      void syncRemoteSyncCollection(collectionKey, previous, next).catch(() => {
        // Keep the last confirmed snapshot so a later edit retries the diff.
        remoteSyncPreviousRef.current[collectionKey] = previous
      })
    }, 350)
  }
  const mergeRemoteSyncRecords = <T extends SyncRecord>(remote: T[], local: T[]): T[] => {
    const remoteIds = new Set(remote.map(record => record.id))
    return [...remote, ...local.filter(record => !remoteIds.has(record.id))]
  }
  const applyUserJobState = (state: UserJobState) => {
    const normalized = normalizeUserJobState(state)
    setSaved(new Set(normalized.saved))
    setApplied(new Set(normalized.applied))
    setRequestedCandidates(new Set(normalized.requestedCandidates))
    setRevealed(new Set(normalized.dailyAccess.revealed))
    setPaidRevealed(new Set(normalized.dailyAccess.paidRevealed))
    setDailyUnlocks(normalized.dailyAccess.dailyUnlocks)
    setExtraReveals(normalized.dailyAccess.extraReveals)
  }
  const getCurrentUserJobState = (): UserJobState => ({
    saved: Array.from(saved),
    applied: Array.from(applied),
    requestedCandidates: Array.from(requestedCandidates),
    dailyAccess: {
      date: getTodayKey(),
      revealed: Array.from(revealed),
      paidRevealed: Array.from(paidRevealed),
      dailyUnlocks,
      extraReveals,
    },
  })
  const getLocalUserJobState = (account: Account): UserJobState => (
    getStoredUserJobState(account) ?? getCurrentUserJobState()
  )
  const fetchRemoteUserJobState = async (account: Account): Promise<UserJobState | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('get_app_user_state', {
      p_role: account.role,
      p_mobile: normalizeMobile(account.mobile),
    })
    if (error) throw error
    const row = ((data ?? []) as RemoteUserStateRow[])[0]
    return row?.payload ? normalizeUserJobState(row.payload) : null
  }
  const saveRemoteUserJobState = async (account: Account, state: UserJobState) => {
    if (!supabase) return
    const { error } = await supabase.rpc('set_app_user_state', {
      p_role: account.role,
      p_mobile: normalizeMobile(account.mobile),
      p_payload: normalizeUserJobState(state),
    })
    if (error) throw error
  }
  const fetchRemoteAccountsByMobile = async (mobile: string): Promise<Account[] | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('find_app_accounts_by_mobile', { p_mobile: mobile })
    if (error) throw error
    return ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow)
  }
  const fetchRemoteAccountsByIdentifier = async (identifier: string): Promise<Account[] | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('find_app_accounts_by_identifier', { p_identifier: identifier })
    if (error) throw error
    return ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow)
  }
  const loginRemoteAccount = async (role: EntryRole, identifier: string, password: string): Promise<Account | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('login_app_account', {
      p_role: role,
      p_identifier: identifier,
      p_password: password,
    })
    if (error) throw error
    return ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === role) ?? null
  }
  const setRemoteAccountPassword = async (role: EntryRole, mobile: string, password: string): Promise<Account | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('set_app_password', {
      p_role: role,
      p_mobile: mobile,
      p_password: password,
    })
    if (error) throw error
    return ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === role && a.mobile === mobile) ?? null
  }
  const resetRemoteAccountPassword = async (role: EntryRole, mobile: string, email: string, password: string): Promise<Account | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('reset_app_password_with_registered_details', {
      p_role: role,
      p_mobile: mobile,
      p_email: email,
      p_password: password,
    })
    if (error) throw error
    return ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === role && a.mobile === mobile) ?? null
  }
  const authenticateExistingAccount = async (account: Account, identifier: string, password: string): Promise<Account | null> => {
    if (supabase) {
      const remoteAccount = await loginRemoteAccount(account.role, identifier, password)
      if (remoteAccount) {
        return account.passwordHash && !remoteAccount.passwordHash
          ? { ...remoteAccount, passwordHash: account.passwordHash, hasPassword: true }
          : remoteAccount
      }
    }
    if (account.passwordHash && await verifyLocalPasswordHash(password, account.passwordHash)) return account
    return null
  }
  const fetchRemoteCandidateProfiles = async () => {
    if (!supabase) return
    const { data, error } = await supabase.rpc('list_anonymous_candidate_profiles')
    if (error) throw error
    const mapped = ((data ?? []) as RemoteCandidateRow[]).map(row => {
      const publicProfile: SeekerProfile = { ...(normalizeSeekerProfile(row.profile) ?? EMPTY_SEEKER_PROFILE) }
      delete publicProfile.profilePhoto
      delete publicProfile.resumeName
      delete publicProfile.resumeSize
      delete publicProfile.resumeType
      delete publicProfile.resumeUploadedAt
      return {
        id: `supabase-${row.candidate_id}`,
        code: row.candidate_code,
        source: 'registered' as const,
        profile: publicProfile,
      }
    })
    setRemoteCandidateProfiles(mapped)
  }
  const purchaseFromRemoteRow = (row: RemotePurchaseRow): PurchaseRecord => ({
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    role: row.role === 'recruiter' ? 'recruiter' : 'seeker',
    plan: row.plan === 'pro' ? 'pro' : row.plan === 'starter' ? 'starter' : 'free',
    planName: row.plan === 'pro' ? 'Pro' : row.plan === 'starter' ? 'Starter' : 'Free',
    amount: Number(row.amount_inr) || 0,
    method: row.method || 'In-App',
    status: row.status === 'failed' ? 'failed' : row.status === 'pending' ? 'pending' : 'paid',
    transactionId: row.transaction_id,
    purchasedAt: row.purchased_at,
    expiresAt: row.expires_at || row.purchased_at,
  })
  const recordRemotePurchase = async (record: PurchaseRecord, throwOnError = false): Promise<boolean> => {
    if (!supabase) return true
    try {
      const { data, error } = await supabase.rpc('record_app_purchase', {
        p_role: record.role,
        p_name: record.name,
        p_mobile: record.mobile,
        p_email: record.email,
        p_plan: record.plan,
        p_amount: record.amount,
        p_method: record.method,
        p_status: record.status,
        p_transaction_id: record.transactionId,
        p_expires_at: record.expiresAt,
      })
      if (error) throw error
      if (data === false) throw new Error('This payment reference has already been used. Enter the new UPI/UTR transaction reference for this payment.')
      return true
    } catch (error) {
      if (throwOnError) throw error
      return false
    }
  }
  const fetchRemotePurchasesForMobile = async (mobile: string): Promise<PurchaseRecord[] | null> => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('list_app_purchases_for_mobile', { p_mobile: normalizeMobile(mobile) })
    if (error) throw error
    return ((data ?? []) as RemotePurchaseRow[]).map(purchaseFromRemoteRow)
  }
  useEffect(() => {
    if (!supabase || !currentUser || currentUser.role !== 'seeker') {
      setPlanPurchaseSyncReady(!isSupabaseConfigured)
      return
    }
    let cancelled = false
    setPlanPurchaseSyncReady(false)
    void fetchRemotePurchasesForMobile(currentUser.mobile)
      .then(remoteRecords => {
        if (cancelled || !remoteRecords) return
        setPurchases(prev => mergePurchaseRecords(remoteRecords, prev))
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setPlanPurchaseSyncReady(true) })
    return () => { cancelled = true }
    // Fetch this seeker's synced purchases whenever the signed-in seeker changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, currentUser?.mobile])
  const refreshCommerceSettings = async (): Promise<CommerceSettings> => {
    if (!supabase) return commerceSettings
    const { data, error } = await supabase.rpc('get_app_setting', { p_setting_key: 'commerce' })
    if (error) throw error
    const row = ((data ?? []) as RemoteAppSettingRow[])[0]
    if (!row?.payload) return commerceSettings
    const remoteSettings = normalizeCommerceSettings({ ...row.payload, updatedAt: row.updated_at ?? undefined })
    setCommerceSettings(remoteSettings)
    if (!isAdmin || (adminTab !== 'plan-settings' && adminTab !== 'payment-settings')) setCommerceDraft(remoteSettings)
    return remoteSettings
  }
  useEffect(() => {
    void refreshCommerceSettings().catch(() => undefined)
    // Load the Admin-set plans/payment receiving source once when the app opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const fetchAdminSupabaseData = async () => {
    if (!supabase) return
    setAdminDataLoading(true)
    try {
      const [usersResult, purchasesResult] = await Promise.all([
        supabase.rpc('admin_list_accounts'),
        supabase.rpc('admin_list_purchases'),
      ])
      if (!usersResult.error && Array.isArray(usersResult.data)) setRemoteAdminUsers(usersResult.data as RemoteAccountRow[])
      if (!purchasesResult.error && Array.isArray(purchasesResult.data)) setRemotePurchases((purchasesResult.data as RemotePurchaseRow[]).map(purchaseFromRemoteRow))
    } catch { /* Admin lists keep showing this device's records */ } finally {
      setAdminDataLoading(false)
    }
  }
  useEffect(() => {
    if (isAdmin && page === 'admin' && ['users', 'purchases', 'payments'].includes(adminTab)) void fetchAdminSupabaseData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, page, adminTab])
  useEffect(() => {
    if (!isAdmin || (adminTab !== 'plan-settings' && adminTab !== 'payment-settings')) return
    setCommerceDraft(commerceSettings)
    setCommerceSettingsError('')
    setCommerceAdminPassword(storedAdminPassword())
    // Refresh the editor from the live settings each time Admin opens it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminTab])
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
    remoteUserStateLoadedKeyRef.current = ''
    applyUserJobState(getStoredUserJobState(account) ?? (isNewAccount ? emptyUserJobState() : getCurrentUserJobState()))
    setCurrentUser(account)
    setHasAuthenticated(true)
    setEntryRole(account.role)
    setGooglePendingProfile(null)
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ role: account.role, mobile: account.mobile })) } catch { /* ignore */ }
    clearAuthErrors()
    setAuthStep('mobile')
    setAuthForm(prev => ({ ...prev, identifier: account.mobile, password: '', confirmPassword: '' }))
    resetAuthTouched()
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
    if (hasAuthenticated && currentUser?.role === r && existingForRole && !blockedByRecruiter) { completeUserAuth(existingForRole, false); return }
    setAuthStep('mobile')
    clearAuthErrors()
    resetAuthTouched()
    if (existingForRole) {
      setAuthForm(prev => ({ ...prev, name: prev.name || existingForRole.name, mobile: existingForRole.mobile, email: prev.email || existingForRole.email, identifier: existingForRole.mobile, password: '', confirmPassword: '' }))
    } else if (currentUser && currentUser.role !== r) {
      setAuthForm(prev => ({ ...prev, name: prev.name || currentUser.name, mobile: currentUser.mobile, email: prev.email || currentUser.email, identifier: currentUser.mobile, password: '', confirmPassword: '' }))
    } else {
      setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
    }
    navigate('auth')
  }
  const handleWelcomeRoleSelect = (r: EntryRole) => {
    // Welcome is a two-step flow: tap a role to select it and reveal its
    // Login / Register button; tap the selected role again to unselect it.
    setEntryRole(prev => (prev === r ? null : r))
    setAuthStep('mobile')
    clearAuthErrors()
    resetAuthTouched()
    setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
  }
  const clearGoogleAuthReturn = async () => {
    try { localStorage.removeItem(GOOGLE_ENTRY_ROLE_KEY) } catch { /* ignore */ }
    try { window.history.replaceState({}, document.title, window.location.pathname) } catch { /* ignore */ }
    if (supabase) {
      try { await supabase.auth.signOut() } catch { /* Google identity is only a short-lived login check */ }
    }
  }
  const handleGoogleLogin = async () => {
    if (authLoading || googleAuthLoading) return
    if (!supabase) {
      setAuthError('Google login needs the Supabase connection. Please login with your mobile number/email and password.')
      return
    }
    const selectedRole = entryRole ?? 'seeker'
    setGoogleAuthLoading(true)
    clearAuthErrors()
    try { localStorage.setItem(GOOGLE_ENTRY_ROLE_KEY, selectedRole) } catch { /* ignore */ }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      try { localStorage.removeItem(GOOGLE_ENTRY_ROLE_KEY) } catch { /* ignore */ }
      setGoogleAuthLoading(false)
      setAuthError('Google login is not available yet. Please login with your mobile number/email and password.')
    }
    // On success the browser leaves this page for Google, then returns here.
  }
  const completeGoogleLogin = async (googleUser: SupabaseUser, selectedRole: EntryRole) => {
    if (googleAuthProcessingRef.current) return
    googleAuthProcessingRef.current = true
    setGoogleAuthLoading(true)
    clearAuthErrors()
    try {
      const email = (googleUser.email ?? '').trim().toLowerCase()
      if (!email || !isValidEmail(email)) throw new Error('Google did not return a valid email ID')
      const metadata = googleUser.user_metadata ?? {}
      const googleName = String(metadata.full_name || metadata.name || '').trim() || email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Google User'

      let availableAccounts = accounts
      if (supabase) {
        const remoteAccounts = await fetchRemoteAccountsByIdentifier(email)
        if (remoteAccounts) {
          availableAccounts = mergeAccountLists(accounts, remoteAccounts)
          writeAccounts(availableAccounts)
        }
      }

      const matchedAccount = availableAccounts.find(a => a.role === selectedRole && a.email.trim().toLowerCase() === email)
      if (matchedAccount) {
        const blockedByRecruiter = selectedRole === 'seeker' && availableAccounts.some(a => a.role === 'recruiter' && normalizeMobile(a.mobile) === normalizeMobile(matchedAccount.mobile))
        if (blockedByRecruiter) {
          await clearGoogleAuthReturn()
          setEntryRole(selectedRole)
          setAuthForm(prev => ({ ...prev, identifier: email, password: '', confirmPassword: '' }))
          setAuthStep('mobile')
          markAuthFieldTouched('identifier')
          showAuthFieldError('identifier', 'Job Seeker login is blocked because this mobile number has a Recruiter account. Delete the Recruiter account first, or login as Recruiter.')
          navigate('auth', { resetHistory: true })
          return
        }

        if (!hasAccountPassword(matchedAccount)) {
          await clearGoogleAuthReturn()
          setEntryRole(selectedRole)
          setGooglePendingProfile({ role: selectedRole, name: matchedAccount.name, email })
          setAuthForm({ name: matchedAccount.name, mobile: normalizeMobile(matchedAccount.mobile), email, identifier: email, password: '', confirmPassword: '' })
          setAuthStep('register')
          clearAuthErrors()
          setAuthEmailTouched(false)
          resetAuthPasswordState()
          navigate('auth', { resetHistory: true })
          return
        }

        await clearGoogleAuthReturn()
        completeUserAuth(matchedAccount, false)
        return
      }

      // First Google login: keep the existing registration rules. The user
      // adds a mobile number and creates a password once, so the same person
      // can later login with Google OR mobile/email + password.
      await clearGoogleAuthReturn()
      setEntryRole(selectedRole)
      setGooglePendingProfile({ role: selectedRole, name: googleName, email })
      setAuthForm({ name: googleName, mobile: '', email, identifier: email, password: '', confirmPassword: '' })
      setAuthStep('register')
      clearAuthErrors()
      resetAuthTouched()
      navigate('auth', { resetHistory: true })
      setToast('Google email verified ✅ Add your mobile number and create a password to finish.')
    } catch {
      await clearGoogleAuthReturn()
      setEntryRole(selectedRole)
      setAuthStep('mobile')
      setAuthError('Google login could not be completed. Please try again, or login with your mobile number/email and password.')
      navigate('auth', { resetHistory: true })
    } finally {
      googleAuthProcessingRef.current = false
      setGoogleAuthLoading(false)
    }
  }
  const handleLoginContinue = async () => {
    if (authLoading) return
    const selectedRole = entryRole ?? 'seeker'
    const parsedIdentifier = parseAuthIdentifier(authForm.identifier)
    const password = authForm.password
    const passwordError = getPasswordValidationError(password)
    const loginFieldErrors: AuthFieldErrors = {}
    if (parsedIdentifier.error) loginFieldErrors.identifier = parsedIdentifier.error
    if (passwordError) loginFieldErrors.password = passwordError
    if (Object.keys(loginFieldErrors).length > 0) {
      markAuthFieldsTouched(Object.keys(loginFieldErrors) as AuthField[])
      showAuthFieldErrors(loginFieldErrors)
      return
    }

    setAuthLoading(true)
    clearAuthErrors()
    try {
      let availableAccounts = accounts
      if (supabase) {
        const remoteAccounts = parsedIdentifier.kind === 'mobile'
          ? await fetchRemoteAccountsByMobile(parsedIdentifier.value)
          : await fetchRemoteAccountsByIdentifier(parsedIdentifier.value)
        if (remoteAccounts) {
          availableAccounts = parsedIdentifier.kind === 'mobile'
            ? mergeAccountLists(
                accounts.filter(a => normalizeMobile(a.mobile) !== parsedIdentifier.value),
                mergeAccountLists(accounts, remoteAccounts).filter(a => normalizeMobile(a.mobile) === parsedIdentifier.value),
              )
            : mergeAccountLists(accounts, remoteAccounts)
          writeAccounts(availableAccounts)
        }
      }

      const existingCandidates = availableAccounts.filter(a => a.role === selectedRole && accountMatchesIdentifier(a, parsedIdentifier))
      const existing = existingCandidates[0]

      if (selectedRole === 'seeker') {
        const blockedMobile = parsedIdentifier.kind === 'mobile' ? parsedIdentifier.value : existing?.mobile
        const recruiterAccount = blockedMobile
          ? availableAccounts.find(a => a.role === 'recruiter' && normalizeMobile(a.mobile) === normalizeMobile(blockedMobile))
          : undefined
        if (recruiterAccount && (parsedIdentifier.kind === 'mobile' || existing)) {
          markAuthFieldTouched('identifier')
          showAuthFieldError('identifier', `This mobile is registered as a Recruiter account (${recruiterAccount.name}). Job Seeker login is blocked. Login as Recruiter and delete that account first.`)
          return
        }
      }

      if (existing) {
        let authenticatedAccount: Account | null = null
        const passwordCandidates = existingCandidates.filter(hasAccountPassword)
        for (const candidate of passwordCandidates) {
          authenticatedAccount = await authenticateExistingAccount(candidate, parsedIdentifier.value, password)
          if (authenticatedAccount) break
        }
        if (passwordCandidates.length > 0 && !authenticatedAccount) {
          setAuthPasswordTouched(true)
          showAuthFieldError('password', 'Wrong password. Please check your password or use Forgot Password below.')
          return
        }

        const accountForNextStep = authenticatedAccount ?? existing
        const existingEmailValidation = validateEmailAddress(accountForNextStep.email)
        if (existingEmailValidation.error) {
          setAuthForm({
            name: accountForNextStep.name,
            mobile: accountForNextStep.mobile,
            email: existingEmailValidation.suggestion ?? accountForNextStep.email,
            identifier: parsedIdentifier.value,
            password,
            confirmPassword: hasAccountPassword(accountForNextStep) ? password : '',
          })
          setAuthEmailTouched(true)
          setAuthPasswordTouched(true)
          setAuthStep('register')
          showAuthFieldError('email', `Your saved email ID (${accountForNextStep.email}) is not correct. ${existingEmailValidation.error} Please correct it to continue.`)
          setToast('Please correct your email ID to continue.')
          return
        }

        if (!hasAccountPassword(accountForNextStep)) {
          setAuthForm({
            name: accountForNextStep.name,
            mobile: accountForNextStep.mobile,
            email: accountForNextStep.email,
            identifier: parsedIdentifier.value,
            password,
            confirmPassword: '',
          })
          setAuthEmailTouched(true)
          setAuthPasswordTouched(true)
          setAuthConfirmPasswordTouched(false)
          setAuthStep('register')
          showAuthFieldError('confirmPassword', 'This existing account was created before password login. Please confirm a password of at least 6 characters.')
          setToast('Please set a password for your existing account.')
          return
        }

        completeUserAuth(accountForNextStep, false)
        return
      }

      const otherRoleAccount = availableAccounts.find(a => accountMatchesIdentifier(a, parsedIdentifier))
      setAuthForm(prev => ({
        name: prev.name || otherRoleAccount?.name || '',
        mobile: parsedIdentifier.kind === 'mobile' ? parsedIdentifier.value : (otherRoleAccount?.mobile || prev.mobile || ''),
        email: parsedIdentifier.kind === 'email' ? parsedIdentifier.value : (prev.email || otherRoleAccount?.email || ''),
        identifier: parsedIdentifier.value,
        password,
        confirmPassword: '',
      }))
      setAuthEmailTouched(false)
      setAuthPasswordTouched(true)
      setAuthConfirmPasswordTouched(false)
      setAuthStep('register')
      setToast(otherRoleAccount
        ? 'Account found for the other role — complete this role registration to continue.'
        : 'New account — complete your name, mobile, email and confirm your password.')
    } catch {
      setAuthError('Unable to login or check your account right now. Please check your internet connection and try again.')
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
    const password = authForm.password
    const confirmPassword = authForm.confirmPassword
    const registerFieldErrors: AuthFieldErrors = {}
    const mobileError = getMobileValidationError(authForm.mobile)
    if (mobileError) registerFieldErrors.mobile = mobileError
    const nameError = getNameValidationError(name)
    if (nameError) registerFieldErrors.name = nameError
    const emailError = getEmailValidationError(email)
    if (emailError) registerFieldErrors.email = emailError
    if (Object.keys(registerFieldErrors).length > 0) {
      markAuthFieldsTouched(Object.keys(registerFieldErrors) as AuthField[])
      showAuthFieldErrors(registerFieldErrors)
      return
    }

    setAuthLoading(true)
    clearAuthErrors()
    try {
      let availableAccounts = accounts
      if (supabase) {
        const [remoteMobileAccounts, remoteEmailAccounts] = await Promise.all([
          fetchRemoteAccountsByMobile(mobile),
          fetchRemoteAccountsByIdentifier(email),
        ])
        if (remoteMobileAccounts) {
          const preservedMobileAccounts = mergeAccountLists(accounts, remoteMobileAccounts)
            .filter(a => normalizeMobile(a.mobile) === mobile)
          availableAccounts = mergeAccountLists(
            accounts.filter(a => normalizeMobile(a.mobile) !== mobile),
            preservedMobileAccounts,
          )
        }
        if (remoteEmailAccounts) availableAccounts = mergeAccountLists(availableAccounts, remoteEmailAccounts)
        writeAccounts(availableAccounts)
      }

      if (selectedRole === 'seeker') {
        const recruiterAccount = availableAccounts.find(a => a.role === 'recruiter' && normalizeMobile(a.mobile) === mobile)
        if (recruiterAccount) {
          markAuthFieldTouched('mobile')
          showAuthFieldError('mobile', `This mobile is registered as a Recruiter account (${recruiterAccount.name}). Job Seeker registration is blocked until that Recruiter account is deleted.`)
          return
        }
      }

      const existing = availableAccounts.find(a => a.role === selectedRole && normalizeMobile(a.mobile) === mobile)
      const emailOwner = availableAccounts.find(a => a.role === selectedRole && normalizeMobile(a.mobile) !== mobile && a.email.trim().toLowerCase() === email)
      if (emailOwner) {
        markAuthFieldTouched('email')
        showAuthFieldError('email', 'This email ID is already registered with another mobile number for this account type. Login with that email ID and password, or use the correct registered mobile number.')
        return
      }

      const needsPasswordSetup = !existing || !hasAccountPassword(existing)
      const passwordError = getPasswordValidationError(password, needsPasswordSetup ? 'Password' : 'Current password')
      const passwordFieldErrors: AuthFieldErrors = {}
      if (passwordError) passwordFieldErrors.password = passwordError
      if (needsPasswordSetup && password !== confirmPassword) passwordFieldErrors.confirmPassword = 'Password and Confirm Password do not match.'
      if (Object.keys(passwordFieldErrors).length > 0) {
        markAuthFieldsTouched(Object.keys(passwordFieldErrors) as AuthField[])
        showAuthFieldErrors(passwordFieldErrors)
        return
      }

      if (existing && hasAccountPassword(existing)) {
        const authenticatedAccount = await authenticateExistingAccount(existing, mobile, password)
        if (!authenticatedAccount) {
          setAuthPasswordTouched(true)
          showAuthFieldError('password', 'Wrong current password. Please check your password or use Forgot Password from the login screen.')
          return
        }

        if (isValidEmail(authenticatedAccount.email)) {
          completeUserAuth(authenticatedAccount, false)
          return
        }

        let correctedAccount: Account = { ...authenticatedAccount, name, email }
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
          correctedAccount = authenticatedAccount.passwordHash && !updated.passwordHash
            ? { ...updated, passwordHash: authenticatedAccount.passwordHash, hasPassword: true }
            : updated
        }
        writeAccounts(availableAccounts.map(a => a.role === selectedRole && normalizeMobile(a.mobile) === mobile ? correctedAccount : a))
        completeUserAuth(correctedAccount, false)
        return
      }

      if (existing) {
        let updatedAccount: Account = { ...existing, name, email }
        if (supabase && !isValidEmail(existing.email)) {
          const { data, error } = await supabase.rpc('update_app_account_email', {
            p_role: selectedRole,
            p_name: name,
            p_mobile: mobile,
            p_email: email,
          })
          if (error) throw error
          const updated = ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === selectedRole && a.mobile === mobile)
          if (!updated) throw new Error('Corrected account was not returned')
          updatedAccount = updated
        }
        if (supabase) {
          const remotePasswordAccount = await setRemoteAccountPassword(selectedRole, mobile, password)
          if (remotePasswordAccount) updatedAccount = { ...remotePasswordAccount, name, email }
        }
        updatedAccount = {
          ...updatedAccount,
          passwordHash: updatedAccount.passwordHash || await createLocalPasswordHash(password),
          hasPassword: true,
        }
        writeAccounts(availableAccounts.map(a => a.role === selectedRole && normalizeMobile(a.mobile) === mobile ? updatedAccount : a))
        completeUserAuth(updatedAccount, false)
        setToast('Password set successfully ✅ You can now login with your mobile or email and password.')
        return
      }

      let account: Account
      if (supabase) {
        const { data, error } = await supabase.rpc('register_app_account', {
          p_role: selectedRole,
          p_name: name,
          p_mobile: mobile,
          p_email: email,
          p_password: password,
        })
        if (error) throw error
        const created = ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(a => a.role === selectedRole && a.mobile === mobile)
        if (!created) throw new Error('Account was not returned')
        account = created
      } else {
        account = {
          role: selectedRole,
          name,
          mobile,
          email,
          passwordHash: await createLocalPasswordHash(password),
          hasPassword: true,
          createdAt: new Date().toISOString(),
        }
      }
      const updatedAccounts = [...availableAccounts.filter(a => !(a.role === selectedRole && normalizeMobile(a.mobile) === mobile)), account]
      writeAccounts(updatedAccounts)
      completeUserAuth(account, true)
    } catch (error) {
      const message = (error as { message?: string } | null)?.message ?? ''
      const lowerMessage = message.toLowerCase()
      if (lowerMessage.includes('email')) {
        markAuthFieldTouched('email')
        showAuthFieldError('email', message)
      } else if (lowerMessage.includes('password')) {
        markAuthFieldTouched('password')
        showAuthFieldError('password', message)
      } else if (lowerMessage.includes('mobile')) {
        markAuthFieldTouched('mobile')
        showAuthFieldError('mobile', message)
      } else {
        setAuthError('Unable to create or update your account right now. Please check your internet connection and try again.')
      }
    } finally {
      setAuthLoading(false)
    }
  }
  const openForgotPassword = () => {
    const parsedIdentifier = parseAuthIdentifier(authForm.identifier)
    setAuthForm(prev => ({
      ...prev,
      mobile: parsedIdentifier.kind === 'mobile' && !parsedIdentifier.error ? parsedIdentifier.value : prev.mobile,
      email: parsedIdentifier.kind === 'email' && !parsedIdentifier.error ? parsedIdentifier.value : prev.email,
      password: '',
      confirmPassword: '',
    }))
    clearAuthErrors()
    resetAuthTouched()
    setAuthStep('forgot')
  }
  const handleForgotPasswordReset = async () => {
    if (authLoading) return
    const selectedRole = entryRole ?? 'seeker'
    const mobile = normalizeMobile(authForm.mobile)
    const email = authForm.email.trim().toLowerCase()
    const password = authForm.password
    const forgotFieldErrors: AuthFieldErrors = {}
    const mobileError = getMobileValidationError(authForm.mobile)
    if (mobileError) forgotFieldErrors.mobile = mobileError
    const emailError = getEmailValidationError(email)
    if (emailError) forgotFieldErrors.email = emailError
    const passwordError = getPasswordValidationError(password, 'New password')
    if (passwordError) forgotFieldErrors.password = passwordError
    if (password !== authForm.confirmPassword) forgotFieldErrors.confirmPassword = 'New password and Confirm Password do not match.'
    if (Object.keys(forgotFieldErrors).length > 0) {
      markAuthFieldsTouched(Object.keys(forgotFieldErrors) as AuthField[])
      showAuthFieldErrors(forgotFieldErrors)
      return
    }

    setAuthLoading(true)
    clearAuthErrors()
    try {
      const localPasswordHash = await createLocalPasswordHash(password)
      let availableAccounts = accounts
      if (supabase) {
        const [remoteMobileAccounts, remoteEmailAccounts] = await Promise.all([
          fetchRemoteAccountsByMobile(mobile),
          fetchRemoteAccountsByIdentifier(email),
        ])
        if (remoteMobileAccounts) {
          const preservedMobileAccounts = mergeAccountLists(accounts, remoteMobileAccounts)
            .filter(a => normalizeMobile(a.mobile) === mobile)
          availableAccounts = mergeAccountLists(
            accounts.filter(a => normalizeMobile(a.mobile) !== mobile),
            preservedMobileAccounts,
          )
        }
        if (remoteEmailAccounts) availableAccounts = mergeAccountLists(availableAccounts, remoteEmailAccounts)
        writeAccounts(availableAccounts)
      }

      if (selectedRole === 'seeker' && availableAccounts.some(a => a.role === 'recruiter' && normalizeMobile(a.mobile) === mobile)) {
        markAuthFieldTouched('mobile')
        showAuthFieldError('mobile', 'This mobile is registered as a Recruiter account. Select Recruiter above to reset that account password.')
        return
      }

      const existing = availableAccounts.find(a => a.role === selectedRole && normalizeMobile(a.mobile) === mobile && a.email.trim().toLowerCase() === email)
      if (!existing) {
        markAuthFieldsTouched(['mobile', 'email'])
        showAuthFieldErrors({
          mobile: 'Registered mobile number and email ID do not match the same account. Please check this mobile number.',
          email: 'Registered mobile number and email ID do not match the same account. Please check this email ID.',
        })
        return
      }

      let updatedAccount: Account = existing
      if (supabase) {
        const remoteAccount = await resetRemoteAccountPassword(selectedRole, mobile, email, password)
        if (!remoteAccount) {
          markAuthFieldsTouched(['mobile', 'email'])
          showAuthFieldErrors({
            mobile: 'Registered mobile number and email ID do not match the same account. Please check this mobile number.',
            email: 'Registered mobile number and email ID do not match the same account. Please check this email ID.',
          })
          return
        }
        updatedAccount = remoteAccount
      }
      updatedAccount = { ...updatedAccount, passwordHash: localPasswordHash, hasPassword: true }
      writeAccounts(availableAccounts.map(a => a.role === selectedRole && normalizeMobile(a.mobile) === mobile ? updatedAccount : a))
      completeUserAuth(updatedAccount, false)
      setToast('Password reset successful ✅ You are now logged in.')
    } catch {
      setAuthError('Unable to reset your password right now. Please check your internet connection and try again.')
    } finally {
      setAuthLoading(false)
    }
  }
  const openSeekerProfile = () => {
    if (!currentUser || currentUser.role !== 'seeker') return
    setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
    setSeekerProfileError('')
    setProfileEditField('')
    setShowMobileMenu(false)
    setShowAccountMenu(false)
    navigate('profile')
  }
  const openSeekerProfileField = (field: keyof SeekerProfile) => {
    if (!currentUser || currentUser.role !== 'seeker') return
    setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
    setSeekerProfileError('')
    setProfileEditField(field)
    setShowMobileMenu(false)
    setShowAccountMenu(false)
    navigate('profile')
  }
  const openMyAccount = () => {
    setAccountEditField('')
    setAccountEditValue('')
    setAccountEditError('')
    if (currentUser?.role === 'seeker') setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
    setShowMobileMenu(false)
    setShowAccountMenu(false)
    navigate('account')
  }
  const startAccountFieldEdit = (field: 'name' | 'email') => {
    if (!currentUser) return
    setAccountEditField(field)
    setAccountEditValue(currentUser[field])
    setAccountEditError('')
  }
  const openMyAccountField = (field: 'name' | 'email') => {
    if (!currentUser) return
    setAccountEditField(field)
    setAccountEditValue(currentUser[field])
    setAccountEditError('')
    if (currentUser.role === 'seeker') setSeekerProfileForm(currentUser.profile ?? EMPTY_SEEKER_PROFILE)
    setShowMobileMenu(false)
    setShowAccountMenu(false)
    navigate('account')
  }
  const cancelAccountFieldEdit = () => {
    setAccountEditField('')
    setAccountEditValue('')
    setAccountEditError('')
  }
  const saveAccountField = async () => {
    if (!currentUser || !accountEditField || accountSaving) return
    const field = accountEditField
    const nextValue = field === 'email'
      ? accountEditValue.trim().toLowerCase()
      : accountEditValue.trim().replace(/\s+/g, ' ')

    if (field === 'name' && nextValue.length < 3) {
      setAccountEditError('Please enter your full name (at least 3 characters).')
      return
    }
    if (field === 'email') {
      const emailError = getEmailValidationError(nextValue)
      if (emailError) { setAccountEditError(emailError); return }
      const emailAlreadyUsed = accounts.some(account => account.role === currentUser.role && normalizeMobile(account.mobile) !== normalizeMobile(currentUser.mobile) && account.email.trim().toLowerCase() === nextValue)
      if (emailAlreadyUsed) {
        setAccountEditError('This email is already used by another account in this role.')
        return
      }
    }
    if (nextValue === currentUser[field]) {
      cancelAccountFieldEdit()
      return
    }

    setAccountSaving(true)
    setAccountEditError('')
    try {
      let updatedAccount: Account = { ...currentUser, [field]: nextValue }
      if (supabase) {
        const { data, error } = await supabase.rpc('update_app_account_email', {
          p_role: currentUser.role,
          p_name: updatedAccount.name,
          p_mobile: currentUser.mobile,
          p_email: updatedAccount.email,
        })
        if (error) throw error
        const remoteAccount = ((data ?? []) as RemoteAccountRow[]).map(accountFromRemoteRow).find(account => account.role === currentUser.role && normalizeMobile(account.mobile) === normalizeMobile(currentUser.mobile))
        if (!remoteAccount) throw new Error('Updated account was not returned')
        updatedAccount = currentUser.passwordHash && !remoteAccount.passwordHash
          ? { ...remoteAccount, passwordHash: currentUser.passwordHash, hasPassword: true }
          : remoteAccount
      }
      const hasLocalAccount = accounts.some(account => account.role === currentUser.role && normalizeMobile(account.mobile) === normalizeMobile(currentUser.mobile))
      const nextAccounts = hasLocalAccount
        ? accounts.map(account => account.role === currentUser.role && normalizeMobile(account.mobile) === normalizeMobile(currentUser.mobile) ? updatedAccount : account)
        : [...accounts, updatedAccount]
      writeAccounts(nextAccounts)
      setCurrentUser(updatedAccount)
      cancelAccountFieldEdit()
      setToast(`${field === 'name' ? 'Name' : 'Email'} updated in My Account ✅`)
    } catch {
      setAccountEditError('Unable to save this detail right now. Please check it and try again.')
    } finally {
      setAccountSaving(false)
    }
  }
  const updateSeekerProfileField = (field: keyof SeekerProfile, value: string) => {
    setSeekerProfileForm(prev => {
      const next = { ...prev, [field]: value } as SeekerProfile
      if (field === 'experienceType' && value === 'fresher' && (next.desiredRole === 'ASM' || next.desiredRole === 'RSM')) next.desiredRole = 'Trainee MR'
      return next
    })
    setSeekerProfileError('')
  }
  useEffect(() => {
    if (page !== 'profile' || !profileEditField) return
    const timer = window.setTimeout(() => {
      const element = document.querySelector(`[data-profile-field="${profileEditField}"]`) as HTMLElement | null
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element?.focus({ preventScroll: true })
    }, 140)
    return () => window.clearTimeout(timer)
  }, [page, profileEditField, seekerProfileForm.experienceType])
  // Uploads save to the Job Seeker account immediately (with the current form
  // draft) so the photo/resume stay in the account even before "Save Profile".
  const persistSeekerProfilePatch = (patch: Partial<SeekerProfile>) => {
    if (!currentUser || currentUser.role !== 'seeker') return
    const nextProfile: SeekerProfile = { ...seekerProfileForm, ...patch }
    const updatedAccount: Account = { ...currentUser, profile: nextProfile }
    writeAccounts(accounts.map(a => a.role === 'seeker' && a.mobile === currentUser.mobile ? updatedAccount : a))
    setCurrentUser(updatedAccount)
    setSeekerProfileForm(nextProfile)
  }
  const handleProfilePhotoFile = async (file: File | undefined) => {
    if (!file || uploadBusy) return
    if (!file.type.startsWith('image/')) { setSeekerProfileError('Please choose a JPG or PNG profile photo.'); return }
    if (file.size > MAX_UPLOAD_BYTES) { setSeekerProfileError('Profile photo is too large. Please choose a photo up to 5 MB.'); return }
    setUploadBusy('photo')
    try {
      const dataUrl = await fileToCompressedPhotoDataUrl(file)
      persistSeekerProfilePatch({ profilePhoto: dataUrl })
      setSeekerProfileError('')
      setToast('Profile photo uploaded to your account ✅')
    } catch {
      setSeekerProfileError('Unable to upload this photo. Please try another JPG or PNG image.')
    } finally {
      setUploadBusy('')
    }
  }
  const handleResumeFile = async (file: File | undefined) => {
    if (!file || uploadBusy || !currentUser || currentUser.role !== 'seeker') return
    const lowerName = file.name.toLowerCase()
    const allowedType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
    if (!allowedType && !/\.(pdf|doc|docx)$/.test(lowerName)) { setSeekerProfileError('Please upload your resume as a PDF, DOC or DOCX file.'); return }
    if (file.size > MAX_UPLOAD_BYTES) { setSeekerProfileError('Resume file is too large. Please upload a resume up to 5 MB.'); return }
    setUploadBusy('resume')
    try {
      await saveResumeBlob(resumeStorageKey(currentUser), file)
      persistSeekerProfilePatch({
        resumeName: file.name,
        resumeSize: file.size,
        resumeType: file.type || 'application/octet-stream',
        resumeUploadedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      })
      setSeekerProfileError('')
      setToast('Resume uploaded to your account ✅')
    } catch {
      setSeekerProfileError('Unable to save this resume on this device. Please try again.')
    } finally {
      setUploadBusy('')
    }
  }
  const handleDownloadResume = async () => {
    if (!currentUser || currentUser.role !== 'seeker' || uploadBusy) return
    setUploadBusy('download')
    try {
      const blob = await loadResumeBlob(resumeStorageKey(currentUser))
      if (!blob) {
        setToast('Your resume file is saved on the device where you uploaded it. Please upload it again on this device.')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = seekerProfileForm.resumeName || currentUser.profile?.resumeName || 'resume'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {
      setToast('Unable to open your resume right now. Please try again.')
    } finally {
      setUploadBusy('')
    }
  }
  const handleRemoveProfilePhoto = () => {
    persistSeekerProfilePatch({ profilePhoto: undefined })
    setToast('Profile photo removed')
  }
  const handleRemoveResume = () => {
    if (currentUser?.role === 'seeker') void deleteResumeBlob(resumeStorageKey(currentUser)).catch(() => undefined)
    persistSeekerProfilePatch({ resumeName: undefined, resumeSize: undefined, resumeType: undefined, resumeUploadedAt: undefined })
    setToast('Resume removed from your account')
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
        updatedAccount = currentUser.passwordHash && !remoteAccount.passwordHash
          ? { ...remoteAccount, passwordHash: currentUser.passwordHash, hasPassword: true }
          : remoteAccount
      }
      const updatedAccounts = accounts.map(a => a.role === 'seeker' && a.mobile === currentUser.mobile ? updatedAccount : a)
      writeAccounts(updatedAccounts)
      setCurrentUser(updatedAccount)
      setSeekerProfileForm(updatedAccount.profile ?? profile)
      setSeekerProfileError('')
      setProfileEditField('')
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
    if (ticket.role === 'guest') setGuestSupportTicketIds(prev => new Set(prev).add(ticket.id))
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
    remoteUserStateLoadedKeyRef.current = ''
    applyUserJobState(emptyUserJobState())
    setCurrentUser(null)
    setHasAuthenticated(false)
    setEntryRole(null)
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    setAuthForm(EMPTY_AUTH_FORM)
    setAuthStep('mobile')
    clearAuthErrors()
    resetAuthTouched()
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
    deleteStoredUserJobState(deletedAccount)
    remoteUserStateLoadedKeyRef.current = ''
    applyUserJobState(emptyUserJobState())
    setPendingJobs(prev => prev.filter(job => normalizeMobile(job.phone) !== deletedAccount.mobile))
    setRecruiterJob(prev => ({ ...prev, contactPerson: '', phone: '', email: '' }))
    setRecruiterSubmitted(false)
    setCurrentUser(null)
    setHasAuthenticated(false)
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    setEntryRole(null)
    setAuthForm({ ...EMPTY_AUTH_FORM, name: deletedAccount.name, mobile: deletedAccount.mobile, email: deletedAccount.email, identifier: deletedAccount.mobile })
    setAuthStep('mobile')
    clearAuthErrors()
    resetAuthTouched()
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
    deleteStoredUserJobState({ role: 'seeker', mobile: request.mobile })
    if (supabase) void fetchRemoteCandidateProfiles().catch(() => undefined)
    const updatedRequests = deletionRequests.filter(r => r.id !== request.id)
    setDeletionRequests(updatedRequests)
    try { localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updatedRequests)) } catch { /* ignore */ }
    if (currentUser?.role === 'seeker' && currentUser.mobile === request.mobile) {
      setCurrentUser(null)
      setHasAuthenticated(false)
      try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
      remoteUserStateLoadedKeyRef.current = ''
      applyUserJobState(emptyUserJobState())
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
  const completeAdminLogin = () => {
    setIsAdmin(true)
    setPageHistory([])
    try { localStorage.setItem(ADMIN_AUTH_KEY, '1') } catch { /* ignore */ }
    setAdminError(''); setAdminPass('')
    setShowAdminForgot(false); setAdminForgotError('')
    setToast('Welcome back, M Divakar Reddy! 👑 Admin dashboard unlocked')
  }
  const handleAdminLogin = async () => {
    const enteredId = adminId.trim().toLowerCase()
    // When Supabase is connected, the Admin account is verified from app_admins.
    // Any RPC/network problem falls back to this device's Admin password.
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('admin_login', { p_admin_id: enteredId, p_password: adminPass })
        if (!error && data === true) { try { localStorage.setItem(ADMIN_PASS_KEY, adminPass) } catch { /* keep local copy in sync with Supabase */ } completeAdminLogin(); return }
        if (!error && data === false) { setAdminError('Wrong Admin ID/Email or Password. Please try again.'); return }
      } catch { /* fall through to local Admin login */ }
    }
    const idOk = ADMIN_IDS.includes(enteredId)
    if (idOk && adminPass && storedAdminPassword() && adminPass === storedAdminPassword()) {
      completeAdminLogin()
    } else {
      setAdminError('Wrong Admin ID/Email or Password. Please try again.')
    }
  }
  const handleAdminForgotPassword = async () => {
    const forgotId = adminForgotId.trim().toLowerCase()
    const forgotEmail = adminForgotEmail.trim().toLowerCase()
    if (!forgotId || !forgotEmail) { setAdminForgotError('Enter Admin ID and registered Admin email.'); return }
    const forgotEmailError = getEmailValidationError(forgotEmail)
    if (forgotEmailError) { setAdminForgotError(forgotEmailError); return }
    if (adminForgotNew.length < 6) { setAdminForgotError('New password must be at least 6 characters.'); return }
    if (adminForgotNew !== adminForgotConfirm) { setAdminForgotError('New password and confirm password do not match.'); return }
    const localDetailsOk = (forgotId === 'divakar' || forgotId === 'admin') && forgotEmail === ADMIN_REGISTERED_EMAIL
    const finishAdminReset = () => {
      try { localStorage.setItem(ADMIN_PASS_KEY, adminForgotNew) } catch { /* ignore */ }
      setAdminId('')
      setAdminPass('')
      setAdminError('')
      setAdminForgotError('')
      setAdminForgotNew('')
      setAdminForgotConfirm('')
      setShowAdminForgot(false)
      setToast('Admin password reset successfully 🔐 Login with your new password')
    }
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('admin_reset_password_with_registered_details', { p_admin_id: forgotId, p_email: forgotEmail, p_new_password: adminForgotNew })
        if (!error && data === true) { finishAdminReset(); return }
        if (!error && data === false) { setAdminForgotError('Admin ID and registered Admin email do not match.'); return }
      } catch { /* fall through to local Admin reset */ }
    }
    if (localDetailsOk) { finishAdminReset(); return }
    setAdminForgotError('Admin ID and registered Admin email do not match.')
  }
  const handleAdminLogout = () => {
    const destination = hasAuthenticated && currentUser ? getAccountDestination(currentUser) : entryRole ? 'auth' : 'welcome'
    setAdminId('')
    setIsAdmin(false)
    try { localStorage.removeItem(ADMIN_AUTH_KEY) } catch { /* ignore */ }
    setAdminPass('')
    setAdminError('')
    setShowAdminPass(false)
    setShowAdminForgot(false)
    setAdminForgotError('')
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
    setShowAdminMenu(false)
    setToast('Admin logged out. See you soon, Divakar Reddy!')
    navigate(destination, { resetHistory: true })
  }
  const handlePostJob = () => {
    if (!newJob.company.trim() || !newJob.ctc.trim() || !newJob.phone.trim() || !newJob.email.trim()) { setToast('Please fill Company, CTC, Contact Phone and Contact Email to publish'); return }
    const contactEmailError = getEmailValidationError(newJob.email)
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
      email: newJob.email.trim(),
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
  const handleClearAllVacancies = () => {
    setJobs([])
    setSaved(new Set())
    setApplied(new Set())
    setSelected(null)
    try { localStorage.setItem(ADMIN_JOBS_KEY, '[]') } catch { /* ignore */ }
    setToast('All vacancies cleared. Post a real vacancy to make it live.')
  }
  const handleChangePassword = () => {
    if (!passForm.current || !storedAdminPassword() || passForm.current !== storedAdminPassword()) { setToast('Current password is wrong'); return }
    if (passForm.next.length < 6) { setToast('New password must be at least 6 characters'); return }
    if (passForm.next !== passForm.confirm) { setToast('New password and confirm password do not match'); return }
    const nextPassword = passForm.next
    const currentPassword = passForm.current
    try { localStorage.setItem(ADMIN_PASS_KEY, nextPassword) } catch { /* ignore */ }
    if (supabase) {
      void supabase.rpc('admin_change_password', { p_admin_id: adminId.trim().toLowerCase() || 'divakar', p_current_password: currentPassword, p_new_password: nextPassword }).then(() => undefined, () => undefined)
    }
    setPassForm({ current: '', next: '', confirm: '' })
    setToast('Admin password changed successfully 🔐 Use it from next login')
  }
  // ---- ADMIN: JOB SEEKER PLANS + PAYMENT RECEIVING SOURCE ----
  const updateCommercePlanDraft = (planId: PaidPlanId, patch: Partial<PaidPlanConfig>) => {
    setCommerceDraft(prev => {
      const nextPlans = { ...prev.plans, [planId]: { ...prev.plans[planId], ...patch } }
      if (patch.popular) {
        const otherPlanId: PaidPlanId = planId === 'starter' ? 'pro' : 'starter'
        nextPlans[otherPlanId] = { ...nextPlans[otherPlanId], popular: false }
      }
      if (patch.unlimited) nextPlans[planId] = { ...nextPlans[planId], dailyLimit: 9999 }
      return { ...prev, plans: nextPlans }
    })
  }
  const updateCommercePaymentDraft = (patch: Partial<PaymentReceivingSettings>) => {
    setCommerceDraft(prev => ({ ...prev, payment: { ...prev.payment, ...patch } }))
  }
  const handlePaymentQrFile = async (file: File | undefined) => {
    if (!file || commerceQrUploading) return
    if (!file.type.startsWith('image/')) { setCommerceSettingsError('Please choose a JPG or PNG payment QR image.'); return }
    if (file.size > MAX_UPLOAD_BYTES) { setCommerceSettingsError('Payment QR image is too large. Please choose an image up to 5 MB.'); return }
    setCommerceQrUploading(true)
    try {
      const dataUrl = await fileToCompressedPhotoDataUrl(file, 720)
      updateCommercePaymentDraft({ qrImageUrl: dataUrl })
      setCommerceSettingsError('')
      setToast('Payment QR added. Save Payment Settings to show it to Job Seekers.')
    } catch {
      setCommerceSettingsError('Unable to read this QR image. Please try another JPG or PNG image.')
    } finally {
      setCommerceQrUploading(false)
    }
  }
  const saveCommerceSettings = async () => {
    const draftValidationError = validateCommerceSettings(commerceDraft)
    if (draftValidationError) { setCommerceSettingsError(draftValidationError); return }
    const normalized = normalizeCommerceSettings({ ...commerceDraft, updatedAt: new Date().toISOString() })
    const validationError = validateCommerceSettings(normalized)
    if (validationError) { setCommerceSettingsError(validationError); return }
    if (supabase && !commerceAdminPassword) {
      setCommerceSettingsError('Enter the current Admin password to securely save these payment settings to Supabase.')
      return
    }
    setCommerceSettingsSaving(true)
    setCommerceSettingsError('')
    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('set_app_setting_admin', {
          p_admin_id: 'divakar',
          p_admin_password: commerceAdminPassword,
          p_setting_key: 'commerce',
          p_payload: normalized,
        })
        if (error) throw error
        if (data !== true) throw new Error('Admin password was not accepted. Payment settings were not saved.')
      }
      setCommerceSettings(normalized)
      setCommerceDraft(normalized)
      setToast(supabase ? 'Plans & payment receiving source saved live ✅ Job Seekers will see the new price, validity and payment details.' : 'Plans & payment receiving source saved on this device ✅')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save these settings. Please check the Admin password and try again.'
      setCommerceSettingsError(message)
    } finally {
      setCommerceSettingsSaving(false)
    }
  }
  // ---- PLAN PURCHASE -> recorded for Admin Purchases/Payments lists (+ Supabase sync) ----
  const getAvailableCheckoutMethods = (settings: CommerceSettings): { id: CheckoutMethod; label: string }[] => {
    const methods: { id: CheckoutMethod; label: string }[] = []
    if (settings.payment.upiEnabled && settings.payment.upiId.trim()) methods.push({ id: 'upi', label: 'UPI' })
    if (settings.payment.paymentLinkEnabled && settings.payment.paymentLink.trim()) methods.push({ id: 'payment-link', label: 'Payment Link' })
    if (settings.payment.bankEnabled && settings.payment.bankDetails.trim()) methods.push({ id: 'bank', label: 'Bank Transfer' })
    if (settings.payment.demoCheckoutEnabled) methods.push({ id: 'demo', label: 'Demo Checkout' })
    return methods.length > 0 ? methods : [{ id: 'demo', label: 'Demo Checkout' }]
  }
  const getPlanCheckoutExpiry = (planId: PaidPlanId, validityDays: number): string => {
    const now = Date.now()
    const samePlanExpiry = currentUser?.role === 'seeker'
      ? purchases
          .filter(record => record.role === 'seeker' && normalizeMobile(record.mobile) === normalizeMobile(currentUser.mobile) && record.plan === planId && record.status === 'paid' && new Date(record.expiresAt).getTime() > now)
          .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime())[0]
      : undefined
    const baseTime = samePlanExpiry ? new Date(samePlanExpiry.expiresAt).getTime() : now
    return new Date(baseTime + validityDays * 24 * 60 * 60 * 1000).toISOString()
  }
  const closePlanCheckout = () => {
    if (checkoutProcessing) return
    setCheckoutPlan(null)
    setCheckoutReference('')
    setCheckoutError('')
  }
  const handlePlanSelect = async (nextTier: Tier) => {
    const latestSettings = await refreshCommerceSettings().catch(() => commerceSettings)
    const activePurchaseNow = currentUser?.role === 'seeker' ? getActivePlanPurchase(purchases, currentUser.mobile) : undefined
    if (nextTier === 'free') {
      if (activePurchaseNow) {
        setToast(`${activePurchaseNow.planName} is active until ${formatAdminDate(activePurchaseNow.expiresAt)}. Free will start automatically after expiry.`)
      } else {
        setTier('free')
        setToast('Free plan is active — 3 daily full-contact unlocks, then 7 extra jobs.')
      }
      return
    }
    if (!currentUser || currentUser.role !== 'seeker' || !hasAuthenticated) {
      setShowPricing(false)
      if (isAdmin) {
        openAdmin('plan-settings')
        setToast('Admin: set plan prices, validity and the payment receiving source here. Login as a Job Seeker to test a purchase.')
      } else {
        setToast('Please login as a Job Seeker to purchase a plan.')
      }
      return
    }
    const planConfig = latestSettings.plans[nextTier]
    if (!planConfig.enabled) { setToast(`${planConfig.name} is not available for purchase right now.`); return }
    if (activePurchaseNow?.plan === 'pro' && nextTier === 'starter') {
      setToast(`Your ${activePurchaseNow.planName} plan is active until ${formatAdminDate(activePurchaseNow.expiresAt)}. Starter can be purchased after it expires.`)
      return
    }
    setCheckoutPlan(nextTier)
    setCheckoutMethod(getAvailableCheckoutMethods(latestSettings)[0].id)
    setCheckoutReference('')
    setCheckoutError('')
    setShowPricing(false)
  }
  const completePlanPurchase = async () => {
    if (!checkoutPlan || checkoutProcessing) return
    if (!currentUser || currentUser.role !== 'seeker' || !hasAuthenticated) { setCheckoutError('Please login as a Job Seeker to activate this plan.'); return }
    const planConfig = commerceSettings.plans[checkoutPlan]
    if (!planConfig.enabled) { setCheckoutError(`${planConfig.name} is not available for purchase right now.`); return }
    const enteredReference = checkoutReference.trim().replace(/\s+/g, '')
    if (checkoutMethod !== 'demo' && enteredReference.length < 6) {
      setCheckoutError('Enter the UPI/UTR/transaction reference shown after payment (minimum 6 characters).')
      return
    }
    if (enteredReference.length > 100) { setCheckoutError('Payment reference is too long. Please enter only the transaction/UTR reference.'); return }
    const transactionId = checkoutMethod === 'demo'
      ? 'TXN' + Date.now().toString(36).toUpperCase()
      : enteredReference
    const knownPurchases = [...purchases, ...(remotePurchases ?? [])]
    if (knownPurchases.some(record => record.transactionId.trim().toLowerCase() === transactionId.toLowerCase())) {
      setCheckoutError('This payment reference has already been used. Enter the new transaction/UTR reference for this payment.')
      return
    }
    const methodLabel = checkoutMethod === 'upi'
      ? 'UPI'
      : checkoutMethod === 'payment-link'
        ? 'Payment Link'
        : checkoutMethod === 'bank'
          ? 'Bank Transfer'
          : 'In-App Checkout (Demo)'
    const now = new Date()
    const record: PurchaseRecord = {
      id: 'purchase-' + Date.now(),
      name: currentUser.name,
      mobile: currentUser.mobile,
      email: currentUser.email,
      role: 'seeker',
      plan: checkoutPlan,
      planName: planConfig.name,
      amount: planConfig.price,
      method: methodLabel,
      status: 'paid',
      transactionId,
      purchasedAt: now.toISOString(),
      expiresAt: getPlanCheckoutExpiry(checkoutPlan, planConfig.validityDays),
    }
    setCheckoutProcessing(true)
    setCheckoutError('')
    try {
      await recordRemotePurchase(record, true)
      setPurchases(prev => mergePurchaseRecords([record], prev))
      if (remotePurchases) setRemotePurchases(prev => mergePurchaseRecords([record], prev ?? []))
      previousTierRef.current = checkoutPlan
      setTier(checkoutPlan)
      setPlanClock(Date.now())
      setCheckoutPlan(null)
      setCheckoutReference('')
      setShowPricing(false)
      setToast(`${record.planName} activated automatically ✅ Valid till ${formatAdminDate(record.expiresAt)}. After expiry, Free will activate automatically.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment could not be recorded. Please check the reference and try again.'
      setCheckoutError(message)
    } finally {
      setCheckoutProcessing(false)
    }
  }
  // ---- RECRUITER SUBMISSION -> ADMIN APPROVAL ----
  const handleRecruiterSubmit = () => {
    if (!recruiterJob.company.trim() || !recruiterJob.ctc.trim() || !recruiterJob.phone.trim() || !recruiterJob.contactPerson.trim() || !recruiterJob.email.trim()) { setToast('Please fill Company, CTC, Contact Person Name, Contact Mobile Number and Contact Email'); return }
    const contactEmailError = getEmailValidationError(recruiterJob.email)
    if (contactEmailError) { setToast(contactEmailError); return }
    const cityName = recruiterJob.city.trim() || 'Hyderabad'
    const contactName = recruiterJob.contactPerson.trim().split(' - ')[0].trim()
    const posterName = currentUser && hasAuthenticated ? currentUser.name : contactName
    const posterRole: 'seeker' | 'recruiter' = currentUser?.role === 'seeker' ? 'seeker' : 'recruiter'
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
      desc: recruiterJob.desc.trim() || `Opening at ${recruiterJob.company.trim()} for ${cityName} HQ. Submitted by a ${posterRole === 'seeker' ? 'Job Seeker' : 'Recruiter'} member — under verification by M Divakar Reddy.`,
      contactPerson: `${contactName} - ${recruiterJob.contactType}`,
      phone: recruiterJob.phone.trim(),
      email: recruiterJob.email.trim(),
      skills: ['Doctor Calling', 'RCPA', 'Stockist Handling'],
      perks: ['TA/DA', 'Incentives', 'Mobile Allowance'],
      postedBy: posterName,
      postedByRole: posterRole,
      submittedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      submittedBy: posterName,
      submittedByRole: posterRole,
    }
    setPendingJobs(prev => [pending, ...prev])
    setRecruiterSubmitted(true)
    setToast('Vacancy submitted! It will go LIVE after Admin (Divakar Reddy) approval ✅')
  }
  const resetRecruiterForm = () => {
    setRecruiterJob({ company: '', title: 'Medical Representative', division: '', state: 'Telangana', city: 'Hyderabad', area: '', type: 'Field MR', exp: '0-2 yrs (Freshers can apply)', ctc: '', vacancies: '1', qual: 'B.Pharm / B.Sc / D.Pharm', desc: '', contactType: 'Manager', contactPerson: '', phone: '', email: '', urgent: false })
    setRecruiterSubmitted(false)
  }
  const handleApproveJob = (pend: PendingJob) => {
    const { submittedAt, submittedBy, submittedByRole, ...rest } = pend
    const job: Job = { ...rest, postedBy: rest.postedBy || submittedBy, postedByRole: rest.postedByRole || submittedByRole || 'recruiter', id: 'job-' + Date.now(), posted: 'Just now', verified: true, hot: true }
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
        const remoteAccount = remoteAccounts.find(a => a.role === storedSession.role)
        const localAccount = accounts.find(a => a.role === storedSession.role && normalizeMobile(a.mobile) === storedSession.mobile)
        const account = remoteAccount && localAccount?.passwordHash && !remoteAccount.passwordHash
          ? { ...remoteAccount, passwordHash: localAccount.passwordHash, hasPassword: true }
          : remoteAccount
        const blockedByRecruiter = storedSession.role === 'seeker' && remoteAccounts.some(a => a.role === 'recruiter' && a.mobile === storedSession.mobile)
        if (!account || blockedByRecruiter || !isValidEmail(account.email) || !hasAccountPassword(account)) {
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
    let pendingRole: EntryRole | null = null
    try {
      const storedRole = localStorage.getItem(GOOGLE_ENTRY_ROLE_KEY)
      if (storedRole === 'seeker' || storedRole === 'recruiter') pendingRole = storedRole
    } catch { /* ignore */ }
    if (!pendingRole) return

    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '')
    const oauthError = searchParams.get('error_description') || searchParams.get('error') || hashParams.get('error_description') || hashParams.get('error')
    if (oauthError) {
      void clearGoogleAuthReturn()
      setEntryRole(pendingRole)
      setAuthStep('mobile')
      setAuthError('Google login was not completed. If this continues, the Google provider may not be enabled yet. You can login with your mobile number/email and password.')
      navigate('auth', { resetHistory: true })
      return
    }

    let cancelled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session?.user) {
        const googleUser = session.user
        // Supabase recommends deferring other Supabase calls out of this
        // callback; the account lookup runs on the next tick.
        window.setTimeout(() => { if (!cancelled) void completeGoogleLogin(googleUser, pendingRole) }, 0)
      }
    })
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) void completeGoogleLogin(data.user, pendingRole)
    }, () => undefined)
    return () => { cancelled = true; subscription.unsubscribe() }
    // Run once when the browser returns from Google.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!supabase || remoteSyncLoadStartedRef.current) return
    remoteSyncLoadStartedRef.current = true
    let cancelled = false

    const loadLocalPendingJobs = (): PendingJob[] => {
      try {
        const raw = localStorage.getItem(PENDING_JOBS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed as PendingJob[]
        }
      } catch { /* ignore */ }
      return []
    }

    const loadCollection = async <T extends SyncRecord>(
      collectionKey: RemoteSyncCollectionKey,
      localRecords: T[],
      applyRecords: (records: T[]) => void,
      cleanRemoteRecords: (records: T[]) => T[] = records => records,
    ) => {
      try {
        const remoteRecords = await fetchRemoteSyncCollection<T>(collectionKey)
        if (cancelled || !remoteRecords) return
        remoteSyncPreviousRef.current[collectionKey] = remoteRecords
        remoteSyncLoadedRef.current[collectionKey] = true
        applyRecords(mergeRemoteSyncRecords(cleanRemoteRecords(remoteRecords), localRecords))
      } catch {
        // Local device data remains available if Supabase is temporarily offline.
      }
    }

    void Promise.all([
      loadCollection<Job>('jobs', loadInitialJobs(), setJobs, records => records.filter(job => job && !LEGACY_DEMO_JOB_IDS.has(String(job.id)))),
      loadCollection<PendingJob>('pending_jobs', loadLocalPendingJobs(), setPendingJobs),
      loadCollection<SupportTicket>('support_tickets', loadSupportTickets(), setSupportTickets),
      loadCollection<AccountDeletionRequest>('deletion_requests', loadDeletionRequests(), setDeletionRequests),
    ])

    return () => { cancelled = true }
    // Load shared collections once; later edits are mirrored by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { scheduleRemoteSyncCollection('jobs', jobs) }, [jobs])
  useEffect(() => { scheduleRemoteSyncCollection('pending_jobs', pendingJobs) }, [pendingJobs])
  useEffect(() => { scheduleRemoteSyncCollection('support_tickets', supportTickets) }, [supportTickets])
  useEffect(() => { scheduleRemoteSyncCollection('deletion_requests', deletionRequests) }, [deletionRequests])

  useEffect(() => {
    if (!currentUser) {
      remoteUserStateLoadedKeyRef.current = ''
      return
    }
    const account = currentUser
    const stateKey = userJobStateKey(account)
    const localState = getLocalUserJobState(account)
    applyUserJobState(localState)
    saveStoredUserJobState(account, localState)
    if (!supabase) {
      remoteUserStateLoadedKeyRef.current = stateKey
      return
    }

    remoteUserStateLoadedKeyRef.current = ''
    let cancelled = false
    ;(async () => {
      try {
        const remoteState = await fetchRemoteUserJobState(account)
        if (cancelled) return
        if (remoteState) {
          const mergedState = mergeUserJobStates(getStoredUserJobState(account) ?? localState, remoteState)
          applyUserJobState(mergedState)
          saveStoredUserJobState(account, mergedState)
        } else {
          await saveRemoteUserJobState(account, localState)
        }
        if (!cancelled) remoteUserStateLoadedKeyRef.current = stateKey
      } catch {
        // The per-account local copy remains available offline.
      }
    })()
    return () => { cancelled = true }
    // Reload only when the signed-in role/mobile changes, not on profile-object updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, currentUser?.mobile])

  useEffect(() => {
    if (!currentUser) return
    const account = currentUser
    const state = getCurrentUserJobState()
    saveStoredUserJobState(account, state)
    if (!supabase || remoteUserStateLoadedKeyRef.current !== userJobStateKey(account)) return
    if (remoteUserStateTimerRef.current) clearTimeout(remoteUserStateTimerRef.current)
    remoteUserStateTimerRef.current = setTimeout(() => {
      void saveRemoteUserJobState(account, state).catch(() => undefined)
    }, 350)
    // Persist when the account identity or any synced job-state value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, currentUser?.mobile, saved, applied, requestedCandidates, revealed, paidRevealed, dailyUnlocks, extraReveals])

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
  const getJobPostedByLabel = (job: Job) => {
    const name = job.postedBy?.trim()
    if (!name) return 'M Divakar Reddy • Admin'
    if (job.postedByRole === 'seeker') return `${name} • Job Seeker`
    if (job.postedByRole === 'admin') return `${name} • Admin`
    return `${name} • Recruiter`
  }
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
    setPaidRevealed(prev => new Set([...prev, job.id]))
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
      if (!isAdmin) setPaidRevealed(prev => new Set([...prev, job.id]))
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
  const parsedAuthIdentifier = parseAuthIdentifier(authForm.identifier)
  const authLoginExistingAccount = entryRole && !parsedAuthIdentifier.error
    ? accounts.find(a => a.role === entryRole && accountMatchesIdentifier(a, parsedAuthIdentifier))
    : undefined
  const authEffectiveMobile = authStep === 'mobile'
    ? (parsedAuthIdentifier.kind === 'mobile' ? parsedAuthIdentifier.value : authLoginExistingAccount?.mobile ?? '')
    : normalizedAuthMobile
  const authRecruiterBlockAccount = entryRole === 'seeker' && authEffectiveMobile
    ? accounts.find(a => a.role === 'recruiter' && normalizeMobile(a.mobile) === normalizeMobile(authEffectiveMobile))
    : undefined
  const authOtherRoleAccount = entryRole ? accounts.find(a => a.role !== entryRole && normalizeMobile(a.mobile) === normalizedAuthMobile) : undefined
  const authRegisterExistingAccount = entryRole && !authRecruiterBlockAccount
    ? accounts.find(a => a.role === entryRole && normalizeMobile(a.mobile) === normalizedAuthMobile)
    : undefined
  const authExistingAccount = authStep === 'mobile'
    ? (authRecruiterBlockAccount ? undefined : authLoginExistingAccount)
    : authRegisterExistingAccount
  const authExistingEmailValidation = authExistingAccount ? validateEmailAddress(authExistingAccount.email) : null
  const authExistingEmailError = authExistingEmailValidation?.error ?? null
  const authExistingNeedsPasswordSetup = Boolean(authExistingAccount && !hasAccountPassword(authExistingAccount))
  const authRegisterNeedsPasswordSetup = !authRegisterExistingAccount || !hasAccountPassword(authRegisterExistingAccount)
  const authIdentifierFieldError = authFieldErrors.identifier ?? (authIdentifierTouched ? parsedAuthIdentifier.error : null)
  const authNameFieldError = authFieldErrors.name ?? (authNameTouched ? getNameValidationError(authForm.name) : null)
  const authMobileFieldError = authFieldErrors.mobile ?? (authMobileTouched ? getMobileValidationError(authForm.mobile) : null)
  const authEmailValidation = validateEmailAddress(authForm.email)
  const authEmailFieldError = authFieldErrors.email ?? (authEmailTouched ? authEmailValidation.error : null)
  const showAuthEmailError = Boolean(authEmailFieldError)
  const showAuthEmailSuccess = authEmailTouched && Boolean(authForm.email.trim()) && !authEmailValidation.error && !authFieldErrors.email
  const authPasswordError = getPasswordValidationError(authForm.password, authStep === 'forgot' ? 'New password' : 'Password')
  const authPasswordFieldError = authFieldErrors.password ?? (authPasswordTouched ? authPasswordError : null)
  const showAuthPasswordError = Boolean(authPasswordFieldError)
  const showAuthPasswordSuccess = authPasswordTouched && Boolean(authForm.password) && !authPasswordError && !authFieldErrors.password
  const authConfirmPasswordError = authForm.confirmPassword !== authForm.password ? 'Confirm Password does not match.' : null
  const authConfirmPasswordFieldError = authFieldErrors.confirmPassword ?? (authConfirmPasswordTouched ? authConfirmPasswordError : null)
  const showAuthConfirmPasswordError = Boolean(authConfirmPasswordFieldError)
  const authLookupIdentifier = authStep === 'mobile'
    ? (parsedAuthIdentifier.error ? '' : parsedAuthIdentifier.value)
    : (isValidMobile(normalizedAuthMobile) ? normalizedAuthMobile : '')
  const activeGooglePendingProfile = googlePendingProfile && entryRole === googlePendingProfile.role && authForm.email.trim().toLowerCase() === googlePendingProfile.email
    ? googlePendingProfile
    : null
  const myDeletionRequest = currentUser?.role === 'seeker' ? deletionRequests.find(r => r.mobile === currentUser.mobile) : undefined
  const pendingDeletionRequests = deletionRequests.filter(r => r.status === 'pending')
  const rejectedDeletionRequests = deletionRequests.filter(r => r.status === 'rejected')
  const openSupportTickets = supportTickets.filter(ticket => ticket.status === 'open' || ticket.status === 'in-progress')
  // Admin Users / Purchases / Payments — Supabase rows when connected, else this device's records.
  const displayedAdminUsers: Account[] = remoteAdminUsers ? remoteAdminUsers.map(accountFromRemoteRow) : accounts
  const adminSeekerCount = displayedAdminUsers.filter(a => a.role === 'seeker').length
  const adminRecruiterCount = displayedAdminUsers.filter(a => a.role === 'recruiter').length
  const filteredAdminUsers = displayedAdminUsers.filter(a => {
    if (adminUserRoleFilter === 'seeker' && a.role !== 'seeker') return false
    if (adminUserRoleFilter === 'recruiter' && a.role !== 'recruiter') return false
    if (adminUserRoleFilter === 'admin') return false
    if (!adminUserSearch.trim()) return true
    const q = adminUserSearch.trim().toLowerCase()
    return a.name.toLowerCase().includes(q) || a.mobile.includes(q) || a.email.toLowerCase().includes(q)
  })
  const displayedPurchases: PurchaseRecord[] = [...(remotePurchases ?? purchases)].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
  const myPlanPurchases: PurchaseRecord[] = currentUser?.role === 'seeker'
    ? mergePurchaseRecords(purchases, remotePurchases ?? []).filter(record => record.role === 'seeker' && normalizeMobile(record.mobile) === normalizeMobile(currentUser.mobile))
    : []
  const isPurchaseActive = (p: PurchaseRecord) => p.status === 'paid' && new Date(p.expiresAt).getTime() > planClock
  const adminAccountPurchases = adminAccountDetail
    ? displayedPurchases.filter(purchase => purchase.role === adminAccountDetail.role && normalizeMobile(purchase.mobile) === normalizeMobile(adminAccountDetail.mobile))
    : []
  const adminAccountActivePurchase = adminAccountDetail?.role === 'seeker'
    ? getActivePlanPurchase(adminAccountPurchases, adminAccountDetail.mobile, planClock)
    : undefined
  const adminAccountSupportTickets = adminAccountDetail
    ? supportTickets.filter(ticket => normalizeMobile(ticket.mobile) === normalizeMobile(adminAccountDetail.mobile) || ticket.email.trim().toLowerCase() === adminAccountDetail.email.trim().toLowerCase())
    : []
  const adminAccountDeletionRequest = adminAccountDetail?.role === 'seeker'
    ? deletionRequests.find(request => normalizeMobile(request.mobile) === normalizeMobile(adminAccountDetail.mobile))
    : undefined
  const adminAccountLiveJobs = adminAccountDetail
    ? jobs.filter(job => job.postedBy?.trim().toLowerCase() === adminAccountDetail.name.trim().toLowerCase() && job.postedByRole === adminAccountDetail.role)
    : []
  const adminAccountPendingJobs = adminAccountDetail
    ? pendingJobs.filter(job => job.submittedBy.trim().toLowerCase() === adminAccountDetail.name.trim().toLowerCase() && (job.submittedByRole ?? 'recruiter') === adminAccountDetail.role)
    : []
  const totalRevenue = displayedPurchases.filter(p => p.status === 'paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const thisMonthRevenue = displayedPurchases.filter(p => { const d = new Date(p.purchasedAt); const now = new Date(); return p.status === 'paid' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const mySupportTickets = isAdmin ? supportTickets : currentUser ? supportTickets.filter(ticket => ticket.mobile === currentUser.mobile) : supportTickets.filter(ticket => ticket.role === 'guest' && guestSupportTicketIds.has(ticket.id))
  const accountSeekerProfile: SeekerProfile = currentUser?.role === 'seeker' ? currentUser.profile ?? EMPTY_SEEKER_PROFILE : EMPTY_SEEKER_PROFILE
  const localRegisteredCandidateProfiles: CandidateProfileView[] = accounts
    .filter(a => a.role === 'seeker' && isSeekerProfileComplete(a.profile))
    .map((a, index) => {
      // Candidates stay fully anonymous: private uploads never enter Recruiter views.
      const publicProfile: SeekerProfile = { ...(a.profile as SeekerProfile) }
      delete publicProfile.profilePhoto
      delete publicProfile.resumeName
      delete publicProfile.resumeSize
      delete publicProfile.resumeType
      delete publicProfile.resumeUploadedAt
      return { id: `registered-${index}-${anonymousCandidateCode(a.mobile)}`, code: anonymousCandidateCode(a.mobile), source: 'registered' as const, profile: publicProfile }
    })
  const registeredCandidateProfiles: CandidateProfileView[] = isSupabaseConfigured ? remoteCandidateProfiles : localRegisteredCandidateProfiles
  // Only real registered Job Seeker profiles are shown — no sample/demo profiles.
  const candidateProfiles: CandidateProfileView[] = registeredCandidateProfiles
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

  // When a complete mobile/email identifier is typed on the login screen,
  // refresh its account state from Supabase so account/blocker messages are current.
  useEffect(() => {
    if (!supabase || page !== 'auth' || !authLookupIdentifier) return
    const lookupKey = `${authStep}:${authLookupIdentifier}`
    if (authLookupIdentifierRef.current === lookupKey) return
    authLookupIdentifierRef.current = lookupKey
    let cancelled = false
    ;(async () => {
      try {
        const shouldLookupByMobile = authStep !== 'mobile' || parsedAuthIdentifier.kind === 'mobile'
        const remoteAccounts = shouldLookupByMobile
          ? await fetchRemoteAccountsByMobile(authLookupIdentifier)
          : await fetchRemoteAccountsByIdentifier(authLookupIdentifier)
        if (!cancelled && remoteAccounts) {
          if (shouldLookupByMobile) mergeAccountsForMobileState(authLookupIdentifier, remoteAccounts)
          else mergeIncomingAccountsState(remoteAccounts)
        }
      } catch {
        // The submit action will show a connection message if lookup still fails.
      }
    })()
    return () => { cancelled = true }
  }, [authLookupIdentifier, authStep, page])

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
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-extrabold text-sky-700">REGISTERED</span>
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
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold text-sky-700">REGISTERED JOB SEEKER</span>
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

  const renderPencilEditButton = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label={`Edit ${label}`} title={`Edit ${label}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 shadow-sm transition hover:bg-sky-100 hover:text-sky-900 active:scale-95">
      <Pencil className="h-4 w-4" />
    </button>
  )
  const renderEditableAccountField = (field: 'name' | 'email', label: string, value: string) => {
    const isEditing = accountEditField === field
    return (
      <div key={field} className={`rounded-2xl border p-3.5 ${isEditing ? 'border-sky-300 bg-sky-50/70 ring-2 ring-sky-100' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}<Pencil className="h-3 w-3 text-sky-500" /></p>
            {!isEditing && <p className="mt-1 break-words text-sm font-extrabold leading-snug text-slate-900">{value || 'Not added'}</p>}
          </div>
          {!isEditing && renderPencilEditButton(label, () => startAccountFieldEdit(field))}
        </div>
        {isEditing && (
          <div className="mt-2">
            <input
              autoFocus
              value={accountEditValue}
              onChange={e => { setAccountEditValue(e.target.value); setAccountEditError('') }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void saveAccountField() } if (e.key === 'Escape') cancelAccountFieldEdit() }}
              type={field === 'email' ? 'email' : 'text'}
              inputMode={field === 'email' ? 'email' : 'text'}
              autoComplete={field === 'email' ? 'email' : 'name'}
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500"
            />
            {accountEditError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{accountEditError}</p>}
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={accountSaving} onClick={() => void saveAccountField()} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sky-600 px-3 py-2 text-xs font-extrabold text-white shadow transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"><Check className="h-3.5 w-3.5" /> {accountSaving ? 'Saving…' : 'Save'}</button>
              <button type="button" disabled={accountSaving} onClick={cancelAccountFieldEdit} className="flex items-center justify-center gap-1.5 rounded-full border bg-white px-3 py-2 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><X className="h-3.5 w-3.5" /> Cancel</button>
            </div>
          </div>
        )}
      </div>
    )
  }
  const renderLockedAccountField = (label: string, value: string, note: string) => (
    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-1 break-words text-sm font-extrabold leading-snug text-slate-900">{value || 'Not added'}</p>
          <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-500">{note}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400" title="Locked for account safety"><LockKeyhole className="h-4 w-4" /></span>
      </div>
    </div>
  )
  const renderSeekerProfileEditRow = (field: keyof SeekerProfile, label: string, value: string | undefined, required = false) => (
    <div key={field} className="rounded-2xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}{required && <span className="text-red-500">*</span>}<Pencil className="h-3 w-3 text-sky-500" /></p>
          <p className={`mt-1 break-words text-sm font-extrabold leading-snug ${value ? 'text-slate-900' : 'text-slate-400'}`}>{value || 'Not added'}</p>
        </div>
        {renderPencilEditButton(label, () => openSeekerProfileField(field))}
      </div>
    </div>
  )
  const getPlanCta = (planCard: typeof planCards[number]) => {
    if (planCard.id === 'free') {
      return {
        disabled: false,
        label: activePlanPurchase ? `${activePlanPurchase.planName} is Active` : 'Free Plan is Active',
      }
    }
    if (!planCard.enabled) return { disabled: true, label: 'Purchase Paused by Admin' }
    if (activePlanPurchase?.plan === 'pro' && planCard.id === 'starter') return { disabled: true, label: 'Available After Pro Expiry' }
    if (tier === planCard.id) return { disabled: false, label: `Renew / Extend ${planCard.name}` }
    if (activePlanPurchase?.plan === 'starter' && planCard.id === 'pro') return { disabled: false, label: `Upgrade to ${planCard.name} — ${planCard.price}` }
    return { disabled: false, label: `Buy ${planCard.name} — ${planCard.price}` }
  }

  const renderPlanCard = (planCard: typeof planCards[number]) => {
    const PlanIcon = planCard.icon
    const cta = getPlanCta(planCard)
    const isCurrent = tier === planCard.id
    const headerClass = planCard.id === 'free'
      ? 'bg-gradient-to-br from-slate-800 to-slate-950'
      : planCard.id === 'starter'
        ? 'bg-gradient-to-br from-sky-600 to-blue-800'
        : 'bg-gradient-to-br from-violet-600 to-indigo-800'
    const factItems = [
      { label: 'Validity', value: planCard.validityText },
      { label: 'Hiring contacts', value: planCard.contactAccess },
      { label: 'Phone & email', value: planCard.contactDetails },
      { label: 'Ads', value: planCard.adsText },
    ]

    return (
      <article key={planCard.id} className={`flex h-full flex-col overflow-hidden rounded-[26px] border bg-white text-left shadow-sm ${planCard.popular ? 'border-sky-300 shadow-sky-100 ring-2 ring-sky-100' : 'border-slate-200'} ${isCurrent ? 'ring-2 ring-emerald-300' : ''}`}>
        <div className={`${headerClass} p-5 text-white`}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner"><PlanIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-white/80">JOB SEEKER PLAN</p>
              <h3 className="mt-0.5 truncate text-xl font-extrabold leading-tight">{planCard.name}</h3>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {planCard.popular && <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold text-sky-800 shadow-sm">MOST POPULAR</span>}
              {isCurrent && <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-extrabold text-white shadow-sm">CURRENT PLAN</span>}
              {!planCard.enabled && planCard.id !== 'free' && <span className="rounded-full bg-slate-900/70 px-2.5 py-1 text-[9px] font-extrabold text-white">PAUSED</span>}
            </div>
          </div>
          <p className="mt-4 text-[34px] font-extrabold leading-none">{planCard.price}<span className="ml-1 text-sm font-bold text-white/85">{planCard.period}</span></p>
          <p className="mt-1.5 text-xs font-bold text-white/90">{planCard.paymentText}</p>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="rounded-2xl bg-sky-50 px-3.5 py-3">
            <p className="text-[10px] font-extrabold tracking-[0.12em] text-sky-700">BEST FOR</p>
            <p className="mt-1 text-sm font-bold leading-relaxed text-slate-900">{planCard.bestFor}</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{planCard.simpleMeaning}</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {factItems.map(item => (
              <div key={item.label} className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-slate-500">{item.label}</p>
                <p className="mt-1 text-[11px] font-extrabold leading-snug text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">You get</p>
          <ul className="mt-2.5 space-y-2">
            {planCard.features.map((feature, featureIndex) => (
              <li key={`${feature}-${featureIndex}`} className="flex gap-2 text-[13px] leading-snug text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className={`mb-5 mt-4 rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${planCard.id === 'free' ? 'bg-amber-50 text-amber-950' : 'bg-emerald-50 text-emerald-950'}`}>
            <b>{planCard.id === 'free' ? 'Daily reset:' : 'After payment:'}</b>{' '}
            {planCard.id === 'free'
              ? 'Free access resets on the next day. Apply Now also shows one sponsored ad.'
              : 'The plan activates after payment confirmation. Free returns automatically at the exact expiry time.'}
          </div>

          <button
            type="button"
            onClick={() => void handlePlanSelect(planCard.id)}
            disabled={cta.disabled}
            className={`mt-auto w-full rounded-full py-3 text-sm font-extrabold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-50 ${isCurrent && planCard.id !== 'free' ? 'bg-emerald-600 hover:bg-emerald-700' : planCard.id === 'starter' ? 'bg-sky-700 hover:bg-sky-800' : planCard.id === 'pro' ? 'bg-violet-700 hover:bg-violet-800' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {cta.label}
          </button>
          <p className="mt-2 text-center text-[11px] font-semibold leading-relaxed text-slate-500">
            {planCard.id === 'free' ? 'No card or UPI payment is needed for Free.' : 'Exact amount, receiver and expiry are shown again before payment.'}
          </p>
        </div>
      </article>
    )
  }

  const renderPaymentSteps = () => {
    const steps = [
      { title: 'Choose a plan', text: 'Open Plans & Benefits and select Free, Starter or Pro.', icon: Crown },
      { title: 'Check the amount', text: 'Confirm the plan name, exact amount, validity and receiver name.', icon: Eye },
      { title: 'Make the payment', text: 'Use the UPI, payment link, bank or demo option switched on by Admin.', icon: Wallet },
      { title: 'Save the reference', text: 'Copy the UPI/UTR/transaction number. Use a new reference for every payment.', icon: FileText },
      { title: 'Plan auto-activates', text: 'Tap “Payment Done”. The new expiry date will appear in Payment & My Plan.', icon: BadgeCheck },
    ]
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-3xl border border-sky-100 bg-white p-4 shadow-sm">
            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[11px] font-extrabold text-white">{index + 1}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><step.icon className="h-5 w-5" /></span>
            <p className="mt-3 pr-5 text-sm font-extrabold leading-tight text-slate-900">{step.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{step.text}</p>
          </div>
        ))}
      </div>
    )
  }

  const renderPaymentMethodCards = () => {
    const paymentSettings = commerceSettings.payment
    const canSeeCheckoutDetails = isAdmin || (hasAuthenticated && currentUser?.role === 'seeker')
    const methods = [
      {
        id: 'upi' as CheckoutMethod,
        title: 'UPI / QR',
        icon: QrCode,
        available: Boolean(paymentSettings.upiEnabled && paymentSettings.upiId.trim()),
        summary: 'Pay with GPay, PhonePe, Paytm, BHIM or by scanning the QR shown at checkout.',
        detail: canSeeCheckoutDetails && paymentSettings.upiId.trim()
          ? `Receiver: ${paymentSettings.receiverName} • UPI ID: ${paymentSettings.upiId}`
          : 'The UPI ID and QR are shown inside checkout after you choose a plan.',
        note: 'After success, copy the UPI Reference/UTR number.',
      },
      {
        id: 'payment-link' as CheckoutMethod,
        title: 'Payment Link',
        icon: CreditCard,
        available: Boolean(paymentSettings.paymentLinkEnabled && paymentSettings.paymentLink.trim()),
        summary: 'Open the Admin payment link from checkout and complete the exact plan amount.',
        detail: `Receiver: ${paymentSettings.receiverName}. The link opens only from the plan checkout.`,
        note: 'Save the transaction/reference number shown by the payment provider.',
      },
      {
        id: 'bank' as CheckoutMethod,
        title: 'Bank Transfer',
        icon: Landmark,
        available: Boolean(paymentSettings.bankEnabled && paymentSettings.bankDetails.trim()),
        summary: 'Transfer the exact plan amount to the Admin bank account shown at checkout.',
        detail: `Receiver: ${paymentSettings.receiverName}. Full bank details are shown after plan selection.`,
        note: 'Enter the UTR/NEFT/IMPS reference after transfer.',
      },
      {
        id: 'demo' as CheckoutMethod,
        title: 'Demo Checkout',
        icon: Info,
        available: paymentSettings.demoCheckoutEnabled,
        summary: 'Test activation only. No real money moves to any bank or UPI account.',
        detail: 'Use this only to check how plan activation and expiry work.',
        note: 'Do not treat a demo activation as a real payment.',
      },
    ]

    return (
      <div className="grid gap-3 md:grid-cols-2">
        {methods.map(method => (
          <article key={method.id} className={`rounded-3xl border p-4 shadow-sm ${method.available ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${method.available ? 'bg-emerald-600' : 'bg-slate-400'}`}><method.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900">{method.title}</h4>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${method.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{method.available ? 'READY' : 'NOT AVAILABLE'}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{method.summary}</p>
              </div>
            </div>
            <p className="mt-3 break-words rounded-2xl bg-slate-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-slate-700">{method.detail}</p>
            <p className="mt-2 flex gap-1.5 text-[11px] font-semibold leading-relaxed text-sky-800"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {method.note}</p>
          </article>
        ))}
      </div>
    )
  }

  const renderCurrentPlanStatusCard = () => {
    if (isAdmin && !currentUser) {
      return (
        <div className="rounded-[26px] border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white"><Settings className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold tracking-[0.13em] text-sky-700">ADMIN PREVIEW</p>
              <h3 className="mt-1 text-lg font-extrabold">Manage plans and payment separately</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Plan Settings controls price, validity and benefits. Payment Settings controls the UPI/QR, payment link and bank receiver shown to Job Seekers.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => openAdmin('plan-settings')} className="rounded-full bg-sky-700 px-4 py-2.5 text-xs font-extrabold text-white">Open Plan Settings</button>
            <button type="button" onClick={() => openAdmin('payment-settings')} className="rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white">Open Payment Settings</button>
          </div>
        </div>
      )
    }

    if (!currentUser || !hasAuthenticated || currentUser.role !== 'seeker') {
      return (
        <div className="rounded-[26px] border border-sky-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white"><User className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold tracking-[0.13em] text-sky-700">JOB SEEKER LOGIN NEEDED</p>
              <h3 className="mt-1 text-lg font-extrabold">Login to buy, renew and see your payment history</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Plans are linked to your registered Job Seeker mobile number, so purchases can be restored on your account.</p>
            </div>
            <button type="button" onClick={() => enterAs('seeker')} className="shrink-0 rounded-full bg-slate-900 px-5 py-3 text-xs font-extrabold text-white">Job Seeker Login</button>
          </div>
        </div>
      )
    }

    if (activePlanPurchase) {
      return (
        <div className="overflow-hidden rounded-[26px] border border-emerald-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20"><BadgeCheck className="h-6 w-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold tracking-[0.13em] text-emerald-100">MY CURRENT PLAN</p>
                <h3 className="mt-0.5 text-xl font-extrabold">{activePlanPurchase.planName} is Active</h3>
                <p className="text-sm font-semibold text-emerald-50">Valid till {formatAdminDate(activePlanPurchase.expiresAt)} • {getPlanDaysLeft(activePlanPurchase.expiresAt, planClock)} day(s) left</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-emerald-800">ACTIVE</span>
            </div>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 px-3 py-2.5"><p className="text-[9px] font-extrabold tracking-[0.11em] text-emerald-700">AMOUNT PAID</p><p className="mt-1 text-sm font-extrabold">{formatINR(activePlanPurchase.amount)}</p></div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-2.5"><p className="text-[9px] font-extrabold tracking-[0.11em] text-emerald-700">DIRECT CONTACTS TODAY</p><p className="mt-1 text-sm font-extrabold">{Math.min(displayedDailyUnlocks, limitForTier[tier])} / {limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]} used</p></div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-2.5"><p className="text-[9px] font-extrabold tracking-[0.11em] text-emerald-700">AFTER EXPIRY</p><p className="mt-1 text-sm font-extrabold">Free starts automatically</p></div>
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            <button type="button" onClick={() => void handlePlanSelect(activePlanPurchase.plan)} className="rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white">Renew / Extend {activePlanPurchase.planName}</button>
            {activePlanPurchase.plan === 'starter' && commerceSettings.plans.pro.enabled && <button type="button" onClick={() => void handlePlanSelect('pro')} className="rounded-full bg-violet-700 px-4 py-2.5 text-xs font-extrabold text-white">Upgrade to {commerceSettings.plans.pro.name}</button>}
            {page !== 'pricing' && <button type="button" onClick={() => navigate('pricing')} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">Compare Plans</button>}
            {page !== 'payment' && <button type="button" onClick={() => navigate('payment')} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">Payment & History</button>}
          </div>
        </div>
      )
    }

    if (latestPlanPurchase) {
      return (
        <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white"><Clock3 className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold tracking-[0.13em] text-amber-700">PAID PLAN EXPIRED</p>
              <h3 className="mt-1 text-lg font-extrabold text-amber-950">{latestPlanPurchase.planName} ended — Free is active now</h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">The paid plan expired on <b>{formatAdminDate(latestPlanPurchase.expiresAt)}</b>. Buy again whenever you want direct contact access.</p>
            </div>
            <button type="button" onClick={() => navigate('pricing')} className="shrink-0 rounded-full bg-slate-900 px-5 py-3 text-xs font-extrabold text-white">Renew a Plan</button>
          </div>
        </div>
      )
    }

    return (
      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white"><ShieldCheck className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold tracking-[0.13em] text-slate-500">MY CURRENT PLAN</p>
            <h3 className="mt-1 text-lg font-extrabold">Free Plan is Active</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">Daily Free access gives 3 full hiring contacts, then 7 extra jobs. Upgrade only if you want contacts faster without reveal ads.</p>
          </div>
          {page !== 'pricing' && <button type="button" onClick={() => navigate('pricing')} className="shrink-0 rounded-full bg-sky-700 px-5 py-3 text-xs font-extrabold text-white">View Plans</button>}
        </div>
      </div>
    )
  }

  const renderPaymentHistoryCards = () => {
    if (!currentUser || !hasAuthenticated || currentUser.role !== 'seeker') {
      return (
        <div className="rounded-3xl bg-slate-50 p-6 text-center">
          <Wallet className="mx-auto h-9 w-9 text-slate-400" />
          <p className="mt-2 text-sm font-extrabold">Login to see payment history</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">Your Starter/Pro payments are shown only on your Job Seeker account.</p>
        </div>
      )
    }
    if (myPlanPurchases.length === 0) {
      return (
        <div className="rounded-3xl bg-slate-50 p-6 text-center">
          <Wallet className="mx-auto h-9 w-9 text-slate-400" />
          <p className="mt-2 text-sm font-extrabold">No paid-plan payment yet</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">When you buy Starter or Pro, the amount, method, reference and expiry will appear here.</p>
          <button type="button" onClick={() => navigate('pricing')} className="mt-4 rounded-full bg-sky-700 px-5 py-2.5 text-xs font-extrabold text-white">Choose a Plan</button>
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {myPlanPurchases.slice(0, 10).map(purchase => {
          const isActive = isPurchaseActive(purchase)
          const statusLabel = purchase.status !== 'paid' ? purchase.status.toUpperCase() : isActive ? 'ACTIVE' : 'EXPIRED'
          return (
            <article key={purchase.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${purchase.plan === 'pro' ? 'bg-violet-700' : 'bg-sky-700'}`}><IndianRupee className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold">{purchase.planName} Plan</p>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{statusLabel}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">Purchased: {formatAdminDate(purchase.purchasedAt)}<br />Expires: {formatAdminDate(purchase.expiresAt)}</p>
                </div>
                <p className="shrink-0 text-base font-extrabold">{formatINR(purchase.amount)}</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px]"><span className="block font-extrabold uppercase tracking-wide text-slate-500">Payment method</span><span className="mt-0.5 block font-bold text-slate-800">{purchase.method}</span></p>
                <p className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px]"><span className="block font-extrabold uppercase tracking-wide text-slate-500">Reference</span><span className="mt-0.5 block break-all font-mono font-bold text-slate-800">{purchase.transactionId}</span></p>
              </div>
            </article>
          )
        })}
        {myPlanPurchases.length > 10 && <p className="text-center text-[11px] font-semibold text-slate-500">Showing your latest 10 payments.</p>}
      </div>
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
      <div className="sticky top-0 z-40 border-b border-sky-200 bg-[#f0f7ff]/95 backdrop-blur">
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
      <header className={`app-topbar-background sticky ${isAdFree ? 'top-0' : 'top-[37px]'} z-30 border-b text-white shadow-md`}>
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="flex h-[64px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
            {showGlobalPageBack && (
              <button type="button" onClick={handlePageBack} aria-label="Go back" title="Go back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-slate-800 shadow-md transition hover:bg-sky-50 active:scale-95 sm:h-10 sm:w-10">
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            )}
            <button onClick={handleBrandLogoClick} aria-label="PharmaSales Jobs — The MR to NSM Jobs Network" className="brand-title-card flex min-w-0 select-none items-center gap-1.5 rounded-2xl border px-1.5 py-1.5 text-left min-[380px]:gap-2 min-[380px]:px-2 sm:gap-2.5 sm:px-2.5">
              <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-8 w-8 shrink-0 rounded-[22%] bg-white ring-1 ring-sky-100 object-cover shadow-md min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="brand-title-text whitespace-nowrap text-[16px] font-extrabold leading-none tracking-tight min-[380px]:text-[17px] sm:text-[20px]">PharmaSales Jobs</p>
                  <span className="hidden rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white xl:inline-flex">VERIFIED</span>
                </div>
                <p className="brand-title-subtitle mt-0.5 whitespace-nowrap text-[7.5px] leading-none tracking-wide min-[380px]:text-[8px] sm:text-[10px]">The MR to NSM Jobs Network</p>
              </div>
            </button>
            </div>

            <nav className="hidden items-center gap-1 text-white lg:flex">
              {!shouldHideJobSeekerExperience && (
                <>
                  <button onClick={() => navigate('home')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 ${page==='home'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}>Home</button>
                  <button onClick={() => navigate('jobs')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 ${page==='jobs'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}>Jobs <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${page==='jobs'?'bg-sky-100 text-sky-700':'bg-white/20 text-white'}`}>{jobs.length} New</span></button>
                  <button onClick={() => navigate('pricing')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 ${page==='pricing'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}>Plans</button>
                  <button onClick={() => navigate('payment')} className={`hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 xl:block ${page==='payment'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}>Payment</button>
                </>
              )}
              <button onClick={() => navigate('recruiters')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 ${page==='recruiters'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}>For Recruiters</button>
              {hasAuthenticated && currentUser?.role === 'recruiter' && <button onClick={openCandidateProfiles} className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 xl:inline-flex ${page==='candidates'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}><Users className="h-4 w-4" /> Candidates List</button>}
              {(shouldHideJobSeekerExperience || isJobSeekerUser) && <button onClick={() => navigate('postjob')} className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 xl:inline-flex ${page==='postjob'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}><Plus className="h-4 w-4" /> Post Vacancy</button>}
              <button onClick={() => navigate('ai')} className={`rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 ${page==='ai'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}>AI Assistant</button>
              <button onClick={() => openLegal('support')} className={`hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/15 xl:block ${page==='legal'?'bg-white text-sky-700 shadow-sm hover:bg-sky-50':''}`}>Legal &amp; Support</button>
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
              {isAdmin && !currentUser && (
                <button type="button" onClick={() => openAdmin('settings')} title="Admin My Account & Settings" className="hidden items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-800 shadow-sm transition hover:bg-sky-100 lg:flex">
                  <Pencil className="h-4 w-4" /> My Account
                </button>
              )}
              {currentUser && hasAuthenticated && (
                <div className="relative hidden lg:block">
                  <button type="button" onClick={() => setShowAccountMenu(prev => !prev)} aria-expanded={showAccountMenu} title="My Account" className="flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 py-1 pl-1 pr-2 shadow-sm transition hover:bg-sky-100">
                    <AccountAvatar name={currentUser.name} photo={currentUser.role === 'seeker' ? currentUser.profile?.profilePhoto : undefined} imgClassName="h-8 w-8 border border-white shadow-sm" fallbackClassName="flex h-8 w-8 bg-sky-600 text-xs text-white" />
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
                            <AccountAvatar name={currentUser.name} photo={currentUser.role === 'seeker' ? currentUser.profile?.profilePhoto : undefined} imgClassName="h-11 w-11 border-2 border-white shadow" fallbackClassName="flex h-11 w-11 bg-white text-sm text-sky-700 shadow" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-extrabold">{currentUser.name}</p>
                              <p className="text-xs font-semibold text-sky-100">{currentUser.role === 'recruiter' ? 'Recruiter' : 'Job Seeker'} • +91 {currentUser.mobile}</p>
                              <p className="truncate text-[11px] text-sky-100/90">{currentUser.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 p-2">
                          <button type="button" onClick={openMyAccount} className="flex w-full items-center gap-2.5 rounded-2xl bg-sky-50 px-3 py-2.5 text-left text-sm font-extrabold text-sky-800 hover:bg-sky-100"><Pencil className="h-4 w-4 text-sky-600" /><span className="flex-1">My Account</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-sky-700 shadow-sm">Edit details</span></button>
                          {currentUser.role === 'seeker' ? (
                            <>
                              <button type="button" onClick={openSeekerProfile} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><Pencil className="h-4 w-4 text-sky-600" /><span className="flex-1">{isSeekerProfileComplete(currentUser.profile) ? 'Edit Job Profile' : 'Complete Job Profile'}</span>{!isSeekerProfileComplete(currentUser.profile) && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">{seekerProfileProgress(currentUser.profile)}%</span>}</button>
                              <button type="button" onClick={() => navigate('pricing')} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><Crown className="h-4 w-4 text-violet-600" /><span className="flex-1">Plans &amp; Benefits</span><span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold capitalize text-violet-700">{tier}</span></button>
                              <button type="button" onClick={() => navigate('payment')} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-emerald-50"><CreditCard className="h-4 w-4 text-emerald-600" /><span className="flex-1">Payment &amp; My Plan</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${activePlanPurchase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{activePlanPurchase ? 'Active' : 'Free'}</span></button>
                              <button type="button" onClick={() => navigate('saved')} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><Bookmark className="h-4 w-4 text-sky-600" /><span className="flex-1">Saved Vacancies</span>{saved.size > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">{saved.size}</span>}</button>
                              <button type="button" onClick={() => navigate('postjob')} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold hover:bg-sky-50"><Plus className="h-4 w-4 text-sky-600" /><span className="flex-1">Post a Vacancy</span><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">Admin approval</span></button>
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
                        <div className="flex items-center gap-2.5 border-t bg-sky-50/70 px-4 py-3">
                          <img src="/divakar-reddy-circle-100.jpg" alt="M Divakar Reddy — Founder" className="h-9 w-9 shrink-0 select-none aspect-square rounded-full object-cover object-center border-2 border-white shadow" />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1 text-xs font-extrabold leading-none"><span className="truncate">M Divakar Reddy</span><BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" /></p>
                            <p className="mt-1 truncate text-[10px] font-bold leading-none text-sky-700">App Founder — PharmaSales Jobs</p>
                          </div>
                        </div>
                        <div className="border-t bg-slate-50 p-2">
                          <button type="button" onClick={handleUserLogout} className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-white hover:text-red-600"><LogOut className="h-4 w-4" /> Logout</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={() => setShowMobileMenu(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white text-slate-800 shadow-md lg:hidden"><Menu className="h-5 w-5" /></button>
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
              {/* Frozen account profile — only this top profile area stays fixed in the menu. */}
              <div className="app-topbar-background relative z-10 shrink-0 border-b px-4 pb-3 pt-4">
                {currentUser && hasAuthenticated ? (
                  <div className="rounded-2xl border border-sky-100 bg-white px-3 py-3 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <AccountAvatar name={currentUser.name} photo={currentUser.role === 'seeker' ? currentUser.profile?.profilePhoto : undefined} imgClassName="h-10 w-10 border border-sky-100" fallbackClassName="flex h-10 w-10 bg-sky-600 text-sm text-white" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold leading-tight">{currentUser.name}</p>
                        <p className="text-[11px] font-bold text-sky-700">{currentUser.role === 'recruiter' ? 'Recruiter' : 'Job Seeker'} • +91 {currentUser.mobile}</p>
                        <p className="truncate text-[11px] text-slate-500">{currentUser.email}</p>
                      </div>
                      <button type="button" onClick={() => setShowMobileMenu(false)} aria-label="Close menu" title="Close menu" className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-2.5 grid gap-2">
                      <button onClick={openMyAccount} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 py-2 text-[11px] font-extrabold text-white"><Pencil className="h-3.5 w-3.5" /> My Account • Edit Details</button>
                      {currentUser.role === 'seeker' && (
                        <button onClick={openSeekerProfile} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-sky-600 py-2 text-[11px] font-extrabold text-white"><Pencil className="h-3.5 w-3.5" /> {isSeekerProfileComplete(currentUser.profile) ? 'Edit Job Profile • Complete' : `Complete Job Profile • ${seekerProfileProgress(currentUser.profile)}%`}</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-sky-100 bg-white px-3 py-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white"><User className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold leading-tight">{isAdmin ? 'M Divakar Reddy' : 'My Account'}</p>
                        <p className="text-[11px] font-bold text-sky-700">{isAdmin ? 'Admin • Admin ID: divakar' : 'Account details'}</p>
                      </div>
                      <button type="button" onClick={() => setShowMobileMenu(false)} aria-label="Close menu" title="Close menu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {isAdmin && (
                      <button onClick={() => openAdmin('settings')} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 py-2 text-[11px] font-extrabold text-white"><Pencil className="h-3.5 w-3.5" /> My Account &amp; Settings</button>
                    )}
                  </div>
                )}
              </div>

              {/* Everything below the frozen profile — including Free/plan — scrolls. */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="-mx-4 -mt-3 mb-4 border-b bg-slate-50 px-4 pb-3 pt-2">
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
                </div>
                <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-400">NAVIGATION</p>
                <div className="grid gap-2">
                  {[
                    { label: 'Home', sub: 'Overview & featured jobs', icon: Layers, page: 'home' as const },
                    { label: 'Browse Jobs', sub: `${jobs.length} verified jobs`, icon: Layers, page: 'jobs' as const },
                    { label: 'Plans & Benefits', sub: `Free → ${commerceSettings.plans.starter.name} ${formatINR(commerceSettings.plans.starter.price)} → ${commerceSettings.plans.pro.name} ${formatINR(commerceSettings.plans.pro.price)}`, icon: Crown, page: 'pricing' as const },
                    { label: 'Payment & My Plan', sub: activePlanPurchase ? `${activePlanPurchase.planName} active till ${formatAdminDate(activePlanPurchase.expiresAt)}` : 'Payment steps, methods & history', icon: CreditCard, page: 'payment' as const },
                    { label: 'For Recruiters', sub: 'Managed by M Divakar Reddy', icon: Building2, page: 'recruiters' as const },
                    { label: 'Candidates List', sub: 'Recruiter only • Tap candidate for details', icon: Users, page: 'candidates' as const },
                    { label: 'Post a Vacancy', sub: isJobSeekerUser ? 'Add a vacancy • Live after Admin approval' : 'Recruiters • Live after Admin approval', icon: Plus, page: 'postjob' as const },
                    { label: 'AI Assistant', sub: shouldHideJobSeekerExperience ? 'Hiring help • Support tickets' : 'Resume • Interview • RCPA', icon: Sparkles, page: 'ai' as const },
                    { label: 'Legal & Support', sub: 'Privacy • Terms • Support ticket', icon: FileText, page: 'legal' as const },
                    { label: 'Admin Dashboard', sub: 'Only for M Divakar Reddy (Admin)', icon: LayoutDashboard, page: 'admin' as const },
                  ].filter(item => (isAdmin || item.page !== 'admin') && (canViewCandidateProfiles || item.page !== 'candidates') && (!isJobSeekerUser || item.page !== 'recruiters') && (!shouldHideJobSeekerExperience || !['home', 'jobs', 'pricing', 'payment'].includes(item.page))).map(item => (
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
                    <p className="mb-2 mt-5 text-[11px] font-bold tracking-widest text-slate-400">MY ACCOUNT</p>
                    <div className="grid gap-2">
                      <button type="button" onClick={openMyAccount} className="flex w-full items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-left transition hover:bg-sky-100/70 active:scale-[0.98]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm"><Pencil className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold leading-tight text-sky-900">My Account</span>
                          <span className="block text-xs text-sky-700">Edit name, email{currentUser.role === 'seeker' ? ' and job profile' : ''}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-sky-500" />
                      </button>
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

                {/* Founder — shifted from the header into the menu */}
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-3">
                  <img src="/divakar-reddy-circle-200.jpg" alt="M Divakar Reddy — Founder" className="h-12 w-12 shrink-0 select-none aspect-square rounded-full object-cover object-center border-2 border-white shadow" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[13px] font-extrabold leading-none"><span className="truncate">M Divakar Reddy</span><BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" /></p>
                    <p className="mt-1 truncate text-[10px] font-bold leading-none text-sky-700">App Founder — PharmaSales Jobs</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-[1.25] text-slate-600">9+ Years Pharma Experience • Ex-Employee (Business Development Manager), Wallace Pharmaceuticals Pvt. Ltd.</p>
                  </div>
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

      {/* Back arrow lives inside the header bar, aligned with the brand name.
          Only the guest Legal screen (no navbar) keeps this slim standalone row;
          Auth, Candidates and Admin Login place the same icon on their own screens. */}
      {showGlobalPageBack && isIsolatedShellPage && page === 'legal' && (
        <div className="mx-auto max-w-[1280px] px-4 pt-2">
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
              <div className="brand-title-card flex w-full items-center gap-2.5 rounded-[22px] border p-2.5 text-left min-[420px]:gap-3 min-[420px]:p-3 sm:gap-4 sm:p-4">
                <button onClick={() => handleSecretTap()} aria-label="PharmaSales Jobs" className="block shrink-0 select-none transition active:scale-95">
                  <img src="/icon-192.png" alt="PharmaSales Jobs — The MR to NSM Jobs Network" className="h-14 w-14 rounded-[22%] bg-white ring-1 ring-sky-100 object-cover shadow-lg min-[420px]:h-16 min-[420px]:w-16 sm:h-[72px] sm:w-[72px]" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="brand-title-text whitespace-nowrap text-[19px] font-extrabold leading-none tracking-tight min-[420px]:text-[23px] sm:text-[28px]">PharmaSales Jobs</h1>
                  <p className="brand-title-subtitle mt-1.5 whitespace-nowrap text-[9px] leading-none tracking-wide min-[420px]:text-[10px] sm:text-xs">The MR to NSM Jobs Network</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">VERIFIED</span>
                    <span className="brand-title-badge-since rounded-full px-2 py-0.5 text-[9px] font-extrabold">SINCE 2026</span>
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
                    <span className={`mt-0.5 block text-[11px] font-extrabold tracking-wide transition-colors duration-300 ${welcomeSelectedRole === 'recruiter' ? 'text-sky-50' : 'text-amber-700'}`}>Build Winning Pharma Teams. Faster.</span>
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

              <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-slate-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Stay logged in until logout • Google or mobile/email login</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-extrabold text-sky-700">
                <button type="button" onClick={() => openLegal('privacy')} className="hover:text-sky-900 hover:underline">Privacy Policy</button><span className="text-slate-300">•</span>
                <button type="button" onClick={() => openLegal('terms')} className="hover:text-sky-900 hover:underline">Terms &amp; Privacy</button><span className="text-slate-300">•</span>
                <button type="button" onClick={() => openLegal('support')} className="hover:text-sky-900 hover:underline">Contact Support</button>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] font-bold text-white">© 2026 PharmaSales Jobs • Since 2026 • Managed by M Divakar Reddy</p>
          </div>
        </section>
      )}
      {/* USER LOGIN / REGISTER — Job Seeker/Recruiter only. First time: name +
          mobile + email + password; after that: mobile OR email + password.
          Admin intentionally keeps its separate existing login flow. */}
      {page === 'auth' && (
        <section className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-sky-700 via-sky-600 to-indigo-800 px-4 py-10">
          <div className="w-full max-w-md">
            <div className="rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
              <button type="button" onClick={handlePageBack} aria-label="Go back" title="Go back" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"><ArrowLeft className="h-5 w-5" strokeWidth={2.5} /></button>
              <div className="mt-3">
                <div className="brand-title-card flex items-center gap-2.5 rounded-[20px] border p-2.5 text-left min-[420px]:gap-3 min-[420px]:p-3">
                  <span className="block shrink-0 select-none">
                    <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-12 w-12 rounded-[22%] bg-white ring-1 ring-sky-100 object-cover shadow-lg min-[420px]:h-14 min-[420px]:w-14" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="brand-title-text whitespace-nowrap text-[18px] font-extrabold leading-none tracking-tight min-[420px]:text-[20px]">PharmaSales Jobs</p>
                    <p className="brand-title-subtitle mt-1 whitespace-nowrap text-[9px] leading-none tracking-wide min-[420px]:text-[10px]">The MR to NSM Jobs Network</p>
                  </div>
                </div>
                <h1 className="mt-5 text-center text-[22px] font-extrabold leading-tight">{entryRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} Login / Register</h1>
                {renderHowToVideoButton(entryRole === 'recruiter' ? 'recruiter' : 'seeker')}
              </div>

              <div className="relative mt-4 grid grid-cols-2 rounded-full bg-slate-100 p-1" role="radiogroup" aria-label="Select account type">
                <span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow transition-transform duration-300 ease-out ${entryRole === 'recruiter' ? 'translate-x-full' : 'translate-x-0'}`} />
                <button type="button" role="radio" aria-checked={entryRole !== 'recruiter'} onClick={() => { setEntryRole('seeker'); setAuthStep('mobile'); clearAuthErrors(); resetAuthTouched(); setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' })) }} className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-extrabold transition-colors duration-300 ${entryRole !== 'recruiter' ? 'text-slate-900' : 'text-slate-500'}`}><User className="h-3.5 w-3.5" /> Job Seeker{entryRole !== 'recruiter' && <Check className="h-3.5 w-3.5 text-sky-700" />}</button>
                <button type="button" role="radio" aria-checked={entryRole === 'recruiter'} onClick={() => { setEntryRole('recruiter'); setAuthStep('mobile'); clearAuthErrors(); resetAuthTouched(); setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' })) }} className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-extrabold transition-colors duration-300 ${entryRole === 'recruiter' ? 'text-slate-900' : 'text-slate-500'}`}><Building2 className="h-3.5 w-3.5" /> Recruiter{entryRole === 'recruiter' && <Check className="h-3.5 w-3.5 text-sky-700" />}</button>
              </div>

              {authStep === 'mobile' ? (
                <form className="mt-5" onSubmit={e => { e.preventDefault(); handleLoginContinue() }}>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Mobile Number or Email ID *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User className="h-4 w-4" /></span>
                    <input value={authForm.identifier} onChange={e => updateAuthField('identifier', e.target.value)} onBlur={() => setAuthIdentifierTouched(true)} type="text" inputMode="email" autoComplete="username" placeholder="10-digit mobile or yourname@gmail.com" aria-invalid={Boolean(authIdentifierFieldError)} aria-describedby={authIdentifierFieldError && !authRecruiterBlockAccount ? 'auth-identifier-message' : undefined} className={`w-full rounded-xl border bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none ${authIdentifierFieldError ? 'border-red-400 focus:border-red-500' : 'focus:border-sky-500'}`} />
                  </div>
                  {authIdentifierFieldError && !authRecruiterBlockAccount && (
                    <p id="auth-identifier-message" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-relaxed text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{authIdentifierFieldError}</span></p>
                  )}
                  {authRecruiterBlockAccount ? (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left">
                      <div className="flex gap-2.5">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-extrabold text-amber-900">This mobile is registered as Recruiter</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800"><b>{authRecruiterBlockAccount.name}</b> uses this mobile for a Recruiter account. Job Seeker login is blocked until that Recruiter account is deleted.</p>
                          <button type="button" onClick={() => { setEntryRole('recruiter'); setAuthStep('mobile'); clearAuthErrors(); resetAuthTouched(); setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' })) }} className="mt-2 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white">Login as Recruiter to delete account</button>
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
                        <p className="truncate text-[11px] text-slate-600">{entryRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} account found • {authExistingNeedsPasswordSetup ? 'Password setup needed' : authExistingAccount.email}</p>
                      </div>
                      <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-bold text-slate-600">Password *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><LockKeyhole className="h-4 w-4" /></span>
                      <input value={authForm.password} onChange={e => updateAuthField('password', e.target.value)} onBlur={() => setAuthPasswordTouched(true)} type={showAuthPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Minimum 6 characters" aria-invalid={showAuthPasswordError} aria-describedby="auth-password-message" className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm font-semibold outline-none ${showAuthPasswordError ? 'border-red-400 focus:border-red-500' : showAuthPasswordSuccess ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                      <button type="button" onClick={() => setShowAuthPassword(prev => !prev)} aria-label={showAuthPassword ? 'Hide password' : 'Show password'} title={showAuthPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">{showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                    {showAuthPasswordError ? (
                      <p id="auth-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {authPasswordFieldError}</p>
                    ) : showAuthPasswordSuccess ? (
                      <p id="auth-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Password length is correct.</p>
                    ) : null}
                  </div>
                  <div className="mt-2 text-right">
                    <button type="button" onClick={openForgotPassword} className="text-xs font-extrabold text-sky-700 hover:text-sky-900 hover:underline">Forgot Password?</button>
                  </div>
                  {authError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{authError}</p>}
                  <button type="submit" disabled={!!authRecruiterBlockAccount || authLoading || googleAuthLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"><LogIn className="h-4 w-4" /> {authLoading ? 'Checking Account...' : authRecruiterBlockAccount ? 'Job Seeker Login Blocked' : authExistingNeedsPasswordSetup ? 'Set Password & Continue' : authExistingEmailError ? 'Verify & Correct Email ID' : authExistingAccount ? 'Login & Continue' : 'Continue to Register'}</button>
                  {isSupabaseConfigured && (
                    <>
                      <div className="my-4 flex items-center gap-3" aria-hidden="true">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-[10px] font-extrabold tracking-[0.18em] text-slate-400">OR</span>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                      <button type="button" onClick={() => void handleGoogleLogin()} disabled={authLoading || googleAuthLoading} className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                        <GoogleIcon />
                        {googleAuthLoading ? 'Opening Google...' : 'Continue with Google'}
                      </button>
                    </>
                  )}
                </form>
              ) : authStep === 'forgot' ? (
                <form className="mt-5" onSubmit={e => { e.preventDefault(); handleForgotPasswordReset() }}>
                  <div className="rounded-2xl bg-sky-50 p-3 text-center">
                    <p className="text-sm font-extrabold text-sky-900">Forgot Password</p>
                    <p className="text-[11px] font-medium leading-relaxed text-sky-700">Enter the same registered mobile number and email ID used for this {entryRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} account, then create a new password.</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Registered Mobile Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">+91</span>
                        <input value={authForm.mobile} onChange={e => updateAuthField('mobile', e.target.value)} onBlur={() => setAuthMobileTouched(true)} type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit registered mobile number" aria-invalid={Boolean(authMobileFieldError)} aria-describedby={authMobileFieldError ? 'auth-mobile-message' : undefined} className={`w-full rounded-xl border bg-white py-3 pl-14 pr-3 text-sm font-semibold outline-none ${authMobileFieldError ? 'border-red-400 focus:border-red-500' : 'focus:border-sky-500'}`} />
                      </div>
                      {authMobileFieldError && (
                        <p id="auth-mobile-message" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-relaxed text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{authMobileFieldError}</span></p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Registered Email ID *</label>
                      <input value={authForm.email} onChange={e => updateAuthField('email', e.target.value)} onBlur={() => setAuthEmailTouched(true)} type="email" autoComplete="email" placeholder="yourname@gmail.com" aria-invalid={showAuthEmailError} aria-describedby="auth-email-message" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none ${showAuthEmailError ? 'border-red-400 focus:border-red-500' : showAuthEmailSuccess ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                      {showAuthEmailError ? (
                        <p id="auth-email-message" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-relaxed text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{authEmailFieldError}{!authFieldErrors.email && authEmailValidation.suggestion ? <> Did you mean <button type="button" onClick={() => { updateAuthField('email', authEmailValidation.suggestion ?? authForm.email); setAuthEmailTouched(true) }} className="font-extrabold text-sky-700 underline">{authEmailValidation.suggestion}</button>?</> : null}</span></p>
                      ) : showAuthEmailSuccess ? (
                        <p id="auth-email-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Email format is correct.</p>
                      ) : (
                        <p id="auth-email-message" className="mt-1 text-[11px] font-medium text-slate-400">Both registered mobile and email must match the same account.</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">New Password *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><LockKeyhole className="h-4 w-4" /></span>
                        <input value={authForm.password} onChange={e => updateAuthField('password', e.target.value)} onBlur={() => setAuthPasswordTouched(true)} type={showAuthPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Minimum 6 characters" aria-invalid={showAuthPasswordError} aria-describedby="auth-password-message" className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm font-semibold outline-none ${showAuthPasswordError ? 'border-red-400 focus:border-red-500' : showAuthPasswordSuccess ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                        <button type="button" onClick={() => setShowAuthPassword(prev => !prev)} aria-label={showAuthPassword ? 'Hide new password' : 'Show new password'} title={showAuthPassword ? 'Hide new password' : 'Show new password'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">{showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                      {showAuthPasswordError ? (
                        <p id="auth-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {authPasswordFieldError}</p>
                      ) : showAuthPasswordSuccess ? (
                        <p id="auth-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Password length is correct.</p>
                      ) : (
                        <p id="auth-password-message" className="mt-1 text-[11px] font-medium text-slate-400">Minimum 6 characters.</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Confirm New Password *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><KeyRound className="h-4 w-4" /></span>
                        <input value={authForm.confirmPassword} onChange={e => updateAuthField('confirmPassword', e.target.value)} onBlur={() => setAuthConfirmPasswordTouched(true)} type={showAuthConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter new password again" aria-invalid={showAuthConfirmPasswordError} aria-describedby="auth-confirm-password-message" className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm font-semibold outline-none ${showAuthConfirmPasswordError ? 'border-red-400 focus:border-red-500' : authConfirmPasswordTouched && authForm.confirmPassword && !authConfirmPasswordError ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                        <button type="button" onClick={() => setShowAuthConfirmPassword(prev => !prev)} aria-label={showAuthConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} title={showAuthConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">{showAuthConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                      {showAuthConfirmPasswordError ? (
                        <p id="auth-confirm-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {authConfirmPasswordFieldError}</p>
                      ) : authConfirmPasswordTouched && authForm.confirmPassword ? (
                        <p id="auth-confirm-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Passwords match.</p>
                      ) : (
                        <p id="auth-confirm-password-message" className="mt-1 text-[11px] font-medium text-slate-400">Enter the same new password again.</p>
                      )}
                    </div>
                  </div>
                  {authError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{authError}</p>}
                  <button type="submit" disabled={authLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><KeyRound className="h-4 w-4" /> {authLoading ? 'Resetting Password...' : 'Reset Password & Login'}</button>
                  <button type="button" onClick={() => { setAuthStep('mobile'); clearAuthErrors(); setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' })); resetAuthTouched() }} className="mt-2 w-full rounded-full border py-2.5 text-xs font-bold text-slate-600">Return to Login</button>
                </form>
              ) : (
                <form className="mt-5" onSubmit={e => { e.preventDefault(); handleRegister() }}>
                  <div className="rounded-2xl bg-sky-50 p-3 text-center">
                    <p className="text-sm font-extrabold text-sky-900">{authExistingEmailError ? 'Correct Your Email ID' : authExistingAccount && authRegisterNeedsPasswordSetup ? 'Set Your Password' : authExistingAccount ? 'Account Already Registered' : `New ${entryRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} Account`}</p>
                    <p className="text-[11px] font-medium text-sky-700">{authExistingEmailError ? 'Your account was saved earlier with an incorrect email format. Correct it to continue.' : authExistingAccount && authRegisterNeedsPasswordSetup ? 'This account was created before password login. Set a minimum-6-character password to secure it.' : authExistingAccount ? 'Enter your current password to login to this existing account.' : 'Register with your name, mobile number, correct email ID and a minimum-6-character password.'}</p>
                  </div>
                  {activeGooglePendingProfile && (
                    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"><GoogleIcon /></span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-emerald-900">Google email verified</p>
                        <p className="mt-0.5 break-all text-[11px] font-semibold text-emerald-800">{activeGooglePendingProfile.email}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">Add your mobile number and create a password once. After that, login with Google <b>or</b> mobile/email + password.</p>
                      </div>
                      <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    </div>
                  )}
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
                      <input value={authForm.name} onChange={e => updateAuthField('name', e.target.value)} onBlur={() => setAuthNameTouched(true)} autoComplete="name" placeholder="Enter your full name" aria-invalid={Boolean(authNameFieldError)} aria-describedby={authNameFieldError ? 'auth-name-message' : undefined} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none ${authNameFieldError ? 'border-red-400 focus:border-red-500' : 'focus:border-sky-500'}`} />
                      {authNameFieldError && (
                        <p id="auth-name-message" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-relaxed text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{authNameFieldError}</span></p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Mobile Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">+91</span>
                        <input value={authForm.mobile} onChange={e => updateAuthField('mobile', e.target.value)} onBlur={() => setAuthMobileTouched(true)} type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" aria-invalid={Boolean(authMobileFieldError)} aria-describedby={authMobileFieldError ? 'auth-mobile-message' : undefined} className={`w-full rounded-xl border bg-white py-3 pl-14 pr-3 text-sm font-semibold outline-none ${authMobileFieldError ? 'border-red-400 focus:border-red-500' : 'focus:border-sky-500'}`} />
                      </div>
                      {authMobileFieldError && (
                        <p id="auth-mobile-message" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-relaxed text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{authMobileFieldError}</span></p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Correct Email ID *{activeGooglePendingProfile ? ' (verified by Google)' : ''}</label>
                      <input value={authForm.email} disabled={Boolean(activeGooglePendingProfile)} onChange={e => updateAuthField('email', e.target.value)} onBlur={() => setAuthEmailTouched(true)} type="email" autoComplete="email" placeholder="yourname@gmail.com" aria-invalid={showAuthEmailError} aria-describedby="auth-email-message" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-emerald-50 disabled:text-slate-600 ${showAuthEmailError ? 'border-red-400 focus:border-red-500' : showAuthEmailSuccess ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                      {showAuthEmailError ? (
                        <p id="auth-email-message" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-relaxed text-red-600"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{authEmailFieldError}{!authFieldErrors.email && authEmailValidation.suggestion ? <> Did you mean <button type="button" onClick={() => { updateAuthField('email', authEmailValidation.suggestion ?? authForm.email); setAuthEmailTouched(true) }} className="font-extrabold text-sky-700 underline">{authEmailValidation.suggestion}</button>?</> : null}</span></p>
                      ) : showAuthEmailSuccess ? (
                        <p id="auth-email-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Email format is correct.</p>
                      ) : (
                        <p id="auth-email-message" className="mt-1 text-[11px] font-medium text-slate-400">Gmail IDs must end with @gmail.com.</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{authRegisterNeedsPasswordSetup ? 'Create Password *' : 'Current Password *'}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><LockKeyhole className="h-4 w-4" /></span>
                        <input value={authForm.password} onChange={e => updateAuthField('password', e.target.value)} onBlur={() => setAuthPasswordTouched(true)} type={showAuthPassword ? 'text' : 'password'} autoComplete={authRegisterNeedsPasswordSetup ? 'new-password' : 'current-password'} placeholder="Minimum 6 characters" aria-invalid={showAuthPasswordError} aria-describedby="auth-password-message" className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm font-semibold outline-none ${showAuthPasswordError ? 'border-red-400 focus:border-red-500' : showAuthPasswordSuccess ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                        <button type="button" onClick={() => setShowAuthPassword(prev => !prev)} aria-label={showAuthPassword ? 'Hide password' : 'Show password'} title={showAuthPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">{showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                      {showAuthPasswordError ? (
                        <p id="auth-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {authPasswordFieldError}</p>
                      ) : showAuthPasswordSuccess ? (
                        <p id="auth-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Password length is correct.</p>
                      ) : (
                        <p id="auth-password-message" className="mt-1 text-[11px] font-medium text-slate-400">Minimum 6 characters. Keep your password private.</p>
                      )}
                    </div>
                    {authRegisterNeedsPasswordSetup && (
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600">Confirm Password *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><KeyRound className="h-4 w-4" /></span>
                          <input value={authForm.confirmPassword} onChange={e => updateAuthField('confirmPassword', e.target.value)} onBlur={() => setAuthConfirmPasswordTouched(true)} type={showAuthConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter password again" aria-invalid={showAuthConfirmPasswordError} aria-describedby="auth-confirm-password-message" className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm font-semibold outline-none ${showAuthConfirmPasswordError ? 'border-red-400 focus:border-red-500' : authConfirmPasswordTouched && authForm.confirmPassword && !authConfirmPasswordError ? 'border-emerald-400 focus:border-emerald-500' : 'focus:border-sky-500'}`} />
                          <button type="button" onClick={() => setShowAuthConfirmPassword(prev => !prev)} aria-label={showAuthConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} title={showAuthConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">{showAuthConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </div>
                        {showAuthConfirmPasswordError ? (
                          <p id="auth-confirm-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {authConfirmPasswordFieldError}</p>
                        ) : authConfirmPasswordTouched && authForm.confirmPassword ? (
                          <p id="auth-confirm-password-message" className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Passwords match.</p>
                        ) : (
                          <p id="auth-confirm-password-message" className="mt-1 text-[11px] font-medium text-slate-400">Enter the same password again.</p>
                        )}
                      </div>
                    )}
                  </div>
                  {authError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{authError}</p>}
                  <button type="submit" disabled={!!authRecruiterBlockAccount || authLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4" /> {authLoading ? (authExistingEmailError ? 'Saving Correction...' : authRegisterNeedsPasswordSetup && authExistingAccount ? 'Setting Password...' : 'Creating Account...') : authRecruiterBlockAccount ? 'Job Seeker Registration Blocked' : authExistingEmailError && authRegisterNeedsPasswordSetup ? 'Correct Email & Set Password' : authExistingEmailError ? 'Correct Email & Continue' : authExistingAccount && authRegisterNeedsPasswordSetup ? 'Set Password & Continue' : authExistingAccount ? 'Login & Continue' : 'Register & Continue'}</button>
                  <button type="button" onClick={() => { setAuthStep('mobile'); clearAuthErrors(); setGooglePendingProfile(null); resetAuthTouched(); setAuthForm(prev => ({ ...prev, password: '', confirmPassword: '' })) }} className="mt-2 w-full rounded-full border py-2.5 text-xs font-bold text-slate-600">Use another mobile number or email</button>
                </form>
              )}


              <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">By continuing, you agree to our <button type="button" onClick={() => openLegal('terms')} className="font-extrabold text-sky-700 hover:underline">Terms</button> &amp; <button type="button" onClick={() => openLegal('privacy')} className="font-extrabold text-sky-700 hover:underline">Privacy Policy</button>.</p>
            </div>
            <p className="mt-4 text-center text-[11px] font-bold text-white">PharmaSales Jobs • Since 2026 • Managed by M Divakar Reddy</p>
          </div>
        </section>
      )}
      {/* MY ACCOUNT — available to every signed-in Job Seeker and Recruiter */}
      {page === 'account' && (
        <section className="mx-auto max-w-[1120px] px-4 pb-8 pt-2">
          {!currentUser || !hasAuthenticated ? (
            isAdmin ? (
              <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white"><Settings className="h-7 w-7" /></span>
                <h2 className="mt-3 text-xl font-extrabold">My Account — Admin</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Admin ID <b className="text-slate-900">divakar</b> is correct. Admin account and password settings are inside the Admin Dashboard.</p>
                <button onClick={() => openAdmin('settings')} className="mt-5 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white">Open Admin Settings</button>
              </div>
            ) : (
              <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600"><User className="h-7 w-7" /></span>
                <h2 className="mt-3 text-xl font-extrabold">My Account Login Required</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Login as a Job Seeker or Recruiter to view and edit your account details.</p>
                <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                  <button onClick={() => enterAs('seeker')} className="rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white">Job Seeker Login</button>
                  <button onClick={() => enterAs('recruiter')} className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white">Recruiter Login</button>
                </div>
              </div>
            )
          ) : (
            <>
              <div className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <AccountAvatar name={currentUser.name} photo={currentUser.role === 'seeker' ? currentUser.profile?.profilePhoto : undefined} imgClassName="h-16 w-16 border-2 border-white shadow" fallbackClassName="flex h-16 w-16 bg-white text-xl text-sky-700 shadow" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold tracking-widest text-sky-100">MY ACCOUNT</p>
                    <h2 className="mt-1 truncate text-[26px] font-extrabold leading-tight">{currentUser.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-sky-50">{currentUser.role === 'recruiter' ? 'Recruiter Account' : 'Job Seeker Account'} • +91 {currentUser.mobile}</p>
                    <p className="truncate text-xs text-sky-100">{currentUser.email}</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-sky-700 shadow"><Pencil className="h-3.5 w-3.5" /> Tap pencil to edit</span>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-extrabold"><User className="h-5 w-5 text-sky-600" /> Account Details</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">Use the pencil icon beside a column to edit that detail. Mobile number and account type stay locked for login safety.</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><Pencil className="h-5 w-5" /></span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {renderEditableAccountField('name', 'Full Name', currentUser.name)}
                    {renderLockedAccountField('Mobile Number', `+91 ${currentUser.mobile}`, 'This is your login ID. Contact Admin/Support if your mobile number must change.')}
                    {renderEditableAccountField('email', 'Email ID', currentUser.email)}
                    {renderLockedAccountField('Account Type', currentUser.role === 'recruiter' ? 'Recruiter' : 'Job Seeker', 'Account type is selected during registration and cannot be changed here.')}
                    {renderLockedAccountField('Password', '••••••••', 'For safety, reset your password through Forgot Password on the login screen.')}
                    {renderLockedAccountField('Account Created', formatAdminDate(currentUser.createdAt), 'Your PharmaSales Jobs account joining date.')}
                  </div>
                </div>

                <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="flex items-center gap-2 text-base font-extrabold"><Settings className="h-5 w-5 text-sky-600" /> Account Actions</h3>
                  <div className="mt-4 grid gap-2">
                    {currentUser.role === 'seeker' ? (
                      <>
                        <button type="button" onClick={openSeekerProfile} className="flex w-full items-center gap-2.5 rounded-2xl bg-sky-600 px-4 py-3 text-left text-sm font-extrabold text-white shadow transition hover:bg-sky-700"><Pencil className="h-4 w-4" /><span className="flex-1">Edit Job Profile</span><span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold">{seekerProfileProgress(currentUser.profile)}%</span></button>
                        <button type="button" onClick={() => navigate('saved')} className="flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition hover:bg-sky-50"><Bookmark className="h-4 w-4 text-sky-600" /><span className="flex-1">Saved Vacancies</span>{saved.size > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">{saved.size}</span>}</button>
                        <button type="button" onClick={() => navigate('postjob')} className="flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition hover:bg-sky-50"><Plus className="h-4 w-4 text-sky-600" /><span className="flex-1">Post a Vacancy</span><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">Admin approval</span></button>
                        <button type="button" onClick={openDeletionRequest} className="flex w-full items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-bold text-amber-800 transition hover:bg-amber-100/70"><FileText className="h-4 w-4" /><span className="flex-1">{myDeletionRequest?.status === 'pending' ? 'Deletion Request Pending' : 'Request Account Deletion'}</span></button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={openCandidateProfiles} className="flex w-full items-center gap-2.5 rounded-2xl bg-sky-600 px-4 py-3 text-left text-sm font-extrabold text-white shadow transition hover:bg-sky-700"><Users className="h-4 w-4" /><span className="flex-1">Candidates List</span></button>
                        <button type="button" onClick={() => navigate('postjob')} className="flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition hover:bg-sky-50"><Plus className="h-4 w-4 text-sky-600" /><span className="flex-1">Post Vacancy</span><span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">Admin approval</span></button>
                        <button type="button" onClick={() => setShowDeleteAccountConfirm(true)} className="flex w-full items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-100/70"><Trash2 className="h-4 w-4" /><span className="flex-1">Delete Recruiter Account</span></button>
                      </>
                    )}
                    <button type="button" onClick={() => navigate('ai')} className="flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition hover:bg-violet-50"><MessageCircle className="h-4 w-4 text-violet-600" /><span className="flex-1">AI Chat &amp; Support Tickets</span></button>
                    <button type="button" onClick={handleUserLogout} className="flex w-full items-center gap-2.5 rounded-2xl border bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"><LogOut className="h-4 w-4" /><span className="flex-1">Logout</span></button>
                  </div>
                </div>
              </div>

              {currentUser.role === 'seeker' && (
                <div className="mt-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="flex items-center gap-2 text-base font-extrabold"><Crown className="h-5 w-5 text-violet-600" /> My Subscription</h3>
                    <span className={`ml-auto rounded-full px-3 py-1 text-[10px] font-extrabold ${activePlanPurchase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{activePlanPurchase ? `${activePlanPurchase.planName.toUpperCase()} ACTIVE` : 'FREE ACTIVE'}</span>
                  </div>
                  {activePlanPurchase ? (
                    <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white"><BadgeCheck className="h-6 w-6" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-extrabold text-emerald-950">{activePlanPurchase.planName} • {formatINR(activePlanPurchase.amount)}</p>
                          <p className="mt-1 text-xs leading-relaxed text-emerald-900">Valid till <b>{formatAdminDate(activePlanPurchase.expiresAt)}</b> • {getPlanDaysLeft(activePlanPurchase.expiresAt, planClock)} day(s) left • {activePlanPurchase.method}</p>
                          <p className="mt-1 text-xs leading-relaxed text-emerald-800">Today: {Math.min(displayedDailyUnlocks, limitForTier[tier])}/{limitForTier[tier] === 9999 ? '∞' : limitForTier[tier]} direct contacts used. At expiry, Free activates automatically and paid benefits/revealed paid contacts stop.</p>
                          <p className="mt-1 break-all font-mono text-[11px] text-emerald-700">Transaction: {activePlanPurchase.transactionId}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => void handlePlanSelect(activePlanPurchase.plan)} className="rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow">Renew / Extend {activePlanPurchase.planName}</button>
                        {activePlanPurchase.plan === 'starter' && commerceSettings.plans.pro.enabled && <button type="button" onClick={() => void handlePlanSelect('pro')} className="rounded-full bg-violet-600 px-4 py-2.5 text-xs font-extrabold text-white shadow">Upgrade to {commerceSettings.plans.pro.name} — {formatINR(commerceSettings.plans.pro.price)}</button>}
                        <button type="button" onClick={() => navigate('pricing')} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">View All Plans</button>
                        <button type="button" onClick={() => navigate('payment')} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">Payment & History</button>
                      </div>
                    </div>
                  ) : latestPlanPurchase ? (
                    <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <p className="flex items-center gap-2 text-base font-extrabold text-amber-950"><Clock3 className="h-5 w-5 text-amber-700" /> {latestPlanPurchase.planName} expired • Free is active</p>
                      <p className="mt-1 text-xs leading-relaxed text-amber-900">Your last paid plan ended on <b>{formatAdminDate(latestPlanPurchase.expiresAt)}</b>. Paid benefits are turned off. Buy again to activate a new plan immediately after payment confirmation.</p>
                      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => navigate('pricing')} className="rounded-full bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white">Renew Subscription</button><button type="button" onClick={() => navigate('payment')} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">Payment History</button></div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                      <p className="text-base font-extrabold">Free Plan</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">3 daily full-contact unlocks, then 7 extra jobs. Current Admin-set paid plans: {commerceSettings.plans.starter.name} {formatINR(commerceSettings.plans.starter.price)}/{commerceSettings.plans.starter.validityDays} days and {commerceSettings.plans.pro.name} {formatINR(commerceSettings.plans.pro.price)}/{commerceSettings.plans.pro.validityDays} days.</p>
                      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => navigate('pricing')} className="rounded-full bg-sky-600 px-4 py-2.5 text-xs font-extrabold text-white">View Plans & Benefits</button><button type="button" onClick={() => navigate('payment')} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">How Payment Works</button></div>
                    </div>
                  )}
                </div>
              )}

              {currentUser.role === 'seeker' && (
                <div className="mt-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-extrabold"><Briefcase className="h-5 w-5 text-sky-600" /> Job Profile Details</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">Every profile column has a pencil. Tap it to jump directly to that field and edit it.</p>
                    </div>
                    <div className="w-full rounded-2xl bg-sky-50 px-4 py-3 sm:w-[220px]">
                      <div className="flex items-center justify-between text-xs font-extrabold text-sky-800"><span>Profile completion</span><span>{seekerProfileProgress(accountSeekerProfile)}%</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${seekerProfileProgress(accountSeekerProfile)}%` }} /></div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {renderSeekerProfileEditRow('experienceType', 'Fresher / Experienced', accountSeekerProfile.experienceType === 'fresher' ? 'Fresher' : 'Experienced', true)}
                    {renderSeekerProfileEditRow('qualification', 'Qualification', accountSeekerProfile.qualification, true)}
                    {renderSeekerProfileEditRow('desiredRole', 'Role Looking For', accountSeekerProfile.desiredRole ? getRoleLabel(accountSeekerProfile.desiredRole) : undefined, true)}
                    {accountSeekerProfile.experienceType === 'fresher' ? (
                      renderSeekerProfileEditRow('passingYear', 'Passing Year', accountSeekerProfile.passingYear, true)
                    ) : (
                      <>
                        {renderSeekerProfileEditRow('totalExperience', 'Total Experience', accountSeekerProfile.totalExperience, true)}
                        {renderSeekerProfileEditRow('currentCompany', 'Current Company', accountSeekerProfile.currentCompany, true)}
                        {renderSeekerProfileEditRow('currentRole', 'Current Role', accountSeekerProfile.currentRole ? getRoleLabel(accountSeekerProfile.currentRole) : undefined, true)}
                        {renderSeekerProfileEditRow('currentPackage', 'Current Package', accountSeekerProfile.currentPackage, true)}
                      </>
                    )}
                    {renderSeekerProfileEditRow('expectedPackage', 'Expected Package', accountSeekerProfile.expectedPackage, true)}
                    {renderSeekerProfileEditRow('state', 'Current State', accountSeekerProfile.state, true)}
                    {renderSeekerProfileEditRow('city', 'Current City', accountSeekerProfile.city, true)}
                    {renderSeekerProfileEditRow('currentHq', 'Current HQ', accountSeekerProfile.currentHq, true)}
                    {renderSeekerProfileEditRow('preferredHq', 'Preferred HQ', accountSeekerProfile.preferredHq)}
                    {renderSeekerProfileEditRow('noticePeriod', 'Notice Period / Joining', accountSeekerProfile.noticePeriod, true)}
                    {renderSeekerProfileEditRow('twoWheeler', 'Two-Wheeler', accountSeekerProfile.twoWheeler, true)}
                    {renderSeekerProfileEditRow('skills', 'Skills', accountSeekerProfile.skills)}
                    {renderSeekerProfileEditRow('profilePhoto', 'Profile Photo', accountSeekerProfile.profilePhoto ? 'Photo added' : undefined)}
                    {renderSeekerProfileEditRow('resumeName', 'Resume', accountSeekerProfile.resumeName)}
                  </div>
                  <button type="button" onClick={openSeekerProfile} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-extrabold text-white shadow transition hover:bg-sky-700 sm:w-auto sm:px-6"><Pencil className="h-4 w-4" /> Open Full Profile Editor</button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {/* JOB SEEKER PROFILE — required job data; Recruiters see it anonymously */}
      {page === 'profile' && (
        <section className="mx-auto max-w-[1120px] px-4 pb-8 pt-2">
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
                      <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2"><div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-[10px] font-bold text-slate-400">NAME <Pencil className="h-3 w-3 text-sky-500" /></p><p className="truncate font-extrabold">{currentUser.name}</p></div>{renderPencilEditButton('Full Name', () => openMyAccountField('name'))}</div>
                      <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2"><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-slate-400">MOBILE</p><p className="font-extrabold">+91 {currentUser.mobile}</p><p className="text-[10px] font-semibold text-slate-400">Login ID • locked</p></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400" title="Mobile number is your login ID"><LockKeyhole className="h-4 w-4" /></span></div>
                      <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2"><div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-[10px] font-bold text-slate-400">EMAIL <Pencil className="h-3 w-3 text-sky-500" /></p><p className="truncate font-extrabold">{currentUser.email}</p></div>{renderPencilEditButton('Email ID', () => openMyAccountField('email'))}</div>
                    </div>
                  </div>

                  {/* Optional uploads — saved to this Job Seeker account only */}
                  <input ref={profilePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { void handleProfilePhotoFile(e.target.files?.[0]); e.target.value = '' }} />
                  <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={e => { void handleResumeFile(e.target.files?.[0]); e.target.value = '' }} />
                  <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-sky-50 p-4">
                    <p className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-indigo-700"><Upload className="h-4 w-4" /> PROFILE PHOTO &amp; RESUME <span className="font-bold normal-case tracking-normal text-slate-400">(Optional)</span></p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        {seekerProfileForm.profilePhoto ? (
                          <img src={seekerProfileForm.profilePhoto} alt={currentUser.name} className="h-16 w-16 shrink-0 select-none rounded-full border-2 border-white object-cover object-center shadow" />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 select-none items-center justify-center rounded-full bg-sky-600 text-xl font-extrabold text-white shadow">{currentUser.name.trim().charAt(0).toUpperCase()}</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold">{currentUser.name}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{seekerProfileForm.profilePhoto ? 'Profile photo added' : 'Add your profile photo'}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <button type="button" data-profile-field="profilePhoto" disabled={!!uploadBusy} onClick={() => profilePhotoInputRef.current?.click()} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-extrabold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Camera className="h-3.5 w-3.5" /> {uploadBusy === 'photo' ? 'Uploading…' : seekerProfileForm.profilePhoto ? 'Change Photo' : 'Upload Photo'}</button>
                            {seekerProfileForm.profilePhoto && (
                              <button type="button" disabled={!!uploadBusy} onClick={handleRemoveProfilePhoto} className="flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2.5 sm:ml-auto sm:max-w-[320px]">
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><FileText className="h-5 w-5" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-extrabold leading-tight">{seekerProfileForm.resumeName || 'No resume uploaded'}</p>
                            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{seekerProfileForm.resumeName ? `${formatFileSize(seekerProfileForm.resumeSize)}${seekerProfileForm.resumeUploadedAt ? ` • ${seekerProfileForm.resumeUploadedAt}` : ''}` : 'PDF, DOC or DOCX • up to 5 MB'}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button type="button" data-profile-field="resumeName" disabled={!!uploadBusy} onClick={() => resumeInputRef.current?.click()} className="flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"><Upload className="h-3.5 w-3.5" /> {uploadBusy === 'resume' ? 'Uploading…' : seekerProfileForm.resumeName ? 'Change Resume' : 'Upload Resume'}</button>
                          {seekerProfileForm.resumeName && (
                            <>
                              <button type="button" disabled={!!uploadBusy} onClick={() => void handleDownloadResume()} className="flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-extrabold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" /> {uploadBusy === 'download' ? 'Opening…' : 'View / Download'}</button>
                              <button type="button" disabled={!!uploadBusy} onClick={handleRemoveResume} className="flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-slate-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Private to your account. Recruiters cannot see your name, photo, resume, mobile number or email ID.</p>
                  </div>

                  <p className="mt-6 flex items-center justify-between gap-2 text-sm font-extrabold"><span>1. Are you a Fresher or Experienced? *</span><Pencil className="h-4 w-4 shrink-0 text-sky-500" /></p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" data-profile-field="experienceType" onClick={() => updateSeekerProfileField('experienceType', 'fresher')} className={`rounded-2xl border-2 p-4 text-left transition ${seekerProfileForm.experienceType === 'fresher' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'} ${profileEditField === 'experienceType' ? 'ring-4 ring-sky-100' : ''}`}>
                      <GraduationCap className={`h-6 w-6 ${seekerProfileForm.experienceType === 'fresher' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="mt-2 block text-sm font-extrabold">Fresher</span>
                      <span className="block text-xs text-slate-500">No pharma field-force experience</span>
                    </button>
                    <button type="button" data-profile-field="experienceType" onClick={() => updateSeekerProfileField('experienceType', 'experienced')} className={`rounded-2xl border-2 p-4 text-left transition ${seekerProfileForm.experienceType === 'experienced' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:bg-slate-50'} ${profileEditField === 'experienceType' ? 'ring-4 ring-sky-100' : ''}`}>
                      <Briefcase className={`h-6 w-6 ${seekerProfileForm.experienceType === 'experienced' ? 'text-violet-600' : 'text-slate-400'}`} />
                      <span className="mt-2 block text-sm font-extrabold">Experienced</span>
                      <span className="block text-xs text-slate-500">Currently / previously working</span>
                    </button>
                  </div>

                  <p className="mt-6 text-sm font-extrabold">2. Required job details</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Qualification *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <select data-profile-field="qualification" value={seekerProfileForm.qualification} onChange={e => updateSeekerProfileField('qualification', e.target.value)} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'qualification' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`}>
                        <option value="">Select qualification</option>
                        {SEEKER_QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Role You Are Looking For *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <select data-profile-field="desiredRole" value={seekerProfileForm.desiredRole} onChange={e => updateSeekerProfileField('desiredRole', e.target.value)} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'desiredRole' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`}>
                        {(seekerProfileForm.experienceType === 'fresher' ? ['Trainee MR', 'Field MR'] : JOB_ROLES).map(roleName => <option key={roleName} value={roleName}>{getRoleLabel(roleName)}</option>)}
                      </select>
                    </div>

                    {seekerProfileForm.experienceType === 'fresher' ? (
                      <div>
                        <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Passing Year *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                        <input data-profile-field="passingYear" value={seekerProfileForm.passingYear} onChange={e => updateSeekerProfileField('passingYear', e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="e.g. 2026" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'passingYear' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
                        <p className="mt-1 text-[11px] font-semibold text-emerald-700">Fresher selected — current company & current package are not required.</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Total Pharma Experience *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                          <select data-profile-field="totalExperience" value={seekerProfileForm.totalExperience} onChange={e => updateSeekerProfileField('totalExperience', e.target.value)} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'totalExperience' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`}>
                            <option value="">Select experience</option>
                            {SEEKER_EXPERIENCE_OPTIONS.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Current Company *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                          <input data-profile-field="currentCompany" value={seekerProfileForm.currentCompany} onChange={e => updateSeekerProfileField('currentCompany', e.target.value)} placeholder="e.g. Sun Pharma" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'currentCompany' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
                        </div>
                        <div>
                          <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Current Role *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                          <select data-profile-field="currentRole" value={seekerProfileForm.currentRole} onChange={e => updateSeekerProfileField('currentRole', e.target.value)} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'currentRole' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`}>
                            <option value="">Select current role</option>
                            {[...JOB_ROLES, 'Other Pharma Role'].map(roleName => <option key={roleName} value={roleName}>{getRoleLabel(roleName)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Current Package ( CTC ) *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                          <input data-profile-field="currentPackage" value={seekerProfileForm.currentPackage} onChange={e => updateSeekerProfileField('currentPackage', e.target.value)} placeholder="e.g. ₹4.5 LPA" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'currentPackage' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Expected Package *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <input data-profile-field="expectedPackage" value={seekerProfileForm.expectedPackage} onChange={e => updateSeekerProfileField('expectedPackage', e.target.value)} placeholder="e.g. ₹4.0 - 4.5 LPA" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'expectedPackage' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Current State *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <select data-profile-field="state" value={seekerProfileForm.state} onChange={e => updateSeekerProfileField('state', e.target.value)} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'state' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`}>
                        <option value="">Select state</option>
                        {LOCATIONS.slice(1).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Current City *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <input data-profile-field="city" value={seekerProfileForm.city} onChange={e => updateSeekerProfileField('city', e.target.value)} placeholder="e.g. Hyderabad" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'city' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Current HQ / Work Location *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <input data-profile-field="currentHq" value={seekerProfileForm.currentHq} onChange={e => updateSeekerProfileField('currentHq', e.target.value)} placeholder="e.g. Hyderabad - Ameerpet" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'currentHq' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Preferred HQ (Optional)</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <input data-profile-field="preferredHq" value={seekerProfileForm.preferredHq} onChange={e => updateSeekerProfileField('preferredHq', e.target.value)} placeholder="e.g. Hyderabad / Bengaluru" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'preferredHq' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Notice Period / Joining *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <select data-profile-field="noticePeriod" value={seekerProfileForm.noticePeriod} onChange={e => updateSeekerProfileField('noticePeriod', e.target.value)} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'noticePeriod' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`}>
                        <option value="">Select availability</option>
                        {['Immediate', '15 days', '30 days', '45 days', '60 days'].map(np => <option key={np} value={np}>{np}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Two-Wheeler Available? *</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <select data-profile-field="twoWheeler" value={seekerProfileForm.twoWheeler} onChange={e => updateSeekerProfileField('twoWheeler', e.target.value)} className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'twoWheeler' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`}>
                        <option value="">Select option</option>
                        {['Yes', 'No', 'Will arrange'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Skills (Optional, comma separated)</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label>
                      <input data-profile-field="skills" value={seekerProfileForm.skills} onChange={e => updateSeekerProfileField('skills', e.target.value)} placeholder="e.g. RCPA, Doctor Calling, Stockist Handling" className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-sky-500 ${profileEditField === 'skills' ? 'border-sky-500 ring-4 ring-sky-100' : ''}`} />
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
      {shouldHideJobSeekerExperience && ['home', 'jobs', 'pricing', 'payment', 'saved', 'profile'].includes(page) && (
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
                  {planCards.map(t => (
                    <button key={t.id} onClick={() => void handlePlanSelect(t.id)} disabled={!t.enabled && tier !== t.id} className={`w-full rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${tier === t.id ? 'border-sky-500 bg-sky-50' : 'bg-slate-50 hover:bg-white'}`}>
                      <div className="flex items-center gap-2">
                        <t.icon className={`h-4 w-4 ${tier === t.id ? 'text-sky-600' : 'text-slate-500'}`} />
                        <span className="text-sm font-bold">{t.name}</span>
                        <span className="ml-auto text-xs font-bold">{t.price}{t.period}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{t.id === 'free' ? `${t.limit} unlocks` : t.enabled ? `${t.limit} unlocks • ${t.validityDays}-day validity` : 'Purchase paused by Admin'}</p>
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
                  <p className="mt-3 text-sm font-bold">{jobs.length === 0 ? 'No live vacancies yet' : filtered.length === 0 ? 'No vacancies match your filters' : 'No vacancies are available in today’s Free access for these filters'}</p>
                  <p className="text-xs text-slate-500">{jobs.length === 0 ? 'New real vacancies will appear here after Admin posts or approves them.' : filtered.length === 0 ? 'Try clearing location/company or search with different HQ like Hyderabad/Pune' : 'Free shows today’s first 3 jobs, then 7 extra jobs after all 3 unlocks. Clear filters or view Starter/Pro for every matching job.'}</p>
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
      {/* PLANS & BENEFITS PAGE — plan matter is shown card-by-card in simple words */}
      {page === 'pricing' && !shouldHideJobSeekerExperience && (
      <section id="pricing" className="bg-[#f0f7ff]">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-sky-800 via-sky-700 to-indigo-800 text-white shadow-xl">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold tracking-[0.13em] text-sky-800">PLANS & BENEFITS</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold tracking-[0.13em]">JOB SEEKERS ONLY</span>
                <button type="button" onClick={() => navigate('payment')} className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-sky-800 shadow transition hover:bg-sky-50"><CreditCard className="h-4 w-4" /> Payment &amp; My Plan</button>
              </div>
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
                <div>
                  <h2 className="text-[30px] font-extrabold leading-[1.08] sm:text-[38px]">Choose how fast you want to contact hiring managers.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sky-50">A plan controls <b>how many hiring contacts open daily</b> and whether you watch ads to reveal them. Free is enough to start. Paid plans save time with direct contact access during the full validity.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white/15 px-2 py-3 backdrop-blur"><p className="text-[10px] font-extrabold tracking-widest text-sky-100">FREE</p><p className="mt-1 text-sm font-extrabold">3 + 7/day</p></div>
                  <div className="rounded-2xl bg-white px-2 py-3 text-sky-900 shadow"><p className="truncate text-[10px] font-extrabold tracking-widest text-sky-700">{commerceSettings.plans.starter.name.toUpperCase()}</p><p className="mt-1 text-sm font-extrabold">{commerceSettings.plans.starter.unlimited ? 'Unlimited' : `${getPaidPlanLimit(commerceSettings.plans.starter)}/day`}</p></div>
                  <div className="rounded-2xl bg-violet-500/35 px-2 py-3 backdrop-blur"><p className="truncate text-[10px] font-extrabold tracking-widest text-violet-100">{commerceSettings.plans.pro.name.toUpperCase()}</p><p className="mt-1 text-sm font-extrabold">{commerceSettings.plans.pro.unlimited ? 'Unlimited' : `${getPaidPlanLimit(commerceSettings.plans.pro)}/day`}</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">{renderCurrentPlanStatusCard()}</div>

          <div className="mt-9 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-sky-700">STEP 1 — COMPARE THE THREE CARDS</p>
              <h3 className="mt-1 text-2xl font-extrabold leading-tight">Every plan explained in simple words</h3>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">Check four things on each card: <b>price</b>, <b>validity</b>, <b>contacts per day</b>, and <b>ads</b>. Prices and benefits are controlled by Admin and update automatically when Admin saves new settings.</p>
            </div>
            <button type="button" onClick={() => navigate('payment')} className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-extrabold text-white shadow"><Wallet className="h-4 w-4" /> See How Payment Works</button>
          </div>

          <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-3">
            {planCards.map(planCard => renderPlanCard(planCard))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[26px] border border-sky-100 bg-white shadow-sm">
            <div className="border-b bg-sky-50/70 px-5 py-4">
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-sky-700">QUICK COMPARISON</p>
              <h3 className="mt-1 text-xl font-extrabold">Difference between Free, {commerceSettings.plans.starter.name} and {commerceSettings.plans.pro.name}</h3>
              <p className="mt-1 text-sm text-slate-600">Read one row at a time. This table uses the live Admin-set price, validity and daily limit.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-white text-slate-900">
                    <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">What to check</th>
                    {planCards.map(planCard => <th key={planCard.id} className="px-4 py-3 text-sm font-extrabold">{planCard.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Price', values: planCards.map(planCard => `${planCard.price} ${planCard.period}`) },
                    { label: 'Validity', values: planCards.map(planCard => planCard.validityText) },
                    { label: 'Hiring contacts', values: planCards.map(planCard => planCard.contactAccess) },
                    { label: 'Phone & email', values: planCards.map(planCard => planCard.contactDetails) },
                    { label: 'Ads', values: planCards.map(planCard => planCard.adsText) },
                    { label: 'Payment', values: planCards.map(planCard => planCard.paymentText) },
                    { label: 'Best for', values: planCards.map(planCard => planCard.bestFor) },
                  ].map((row, rowIndex) => (
                    <tr key={row.label} className={rowIndex % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                      <th className="px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">{row.label}</th>
                      {row.values.map((value, valueIndex) => <td key={`${row.label}-${valueIndex}`} className="px-4 py-3 font-semibold leading-relaxed text-slate-800">{value}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-9">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold tracking-[0.14em] text-emerald-700">STEP 2 — PAYMENT IN 5 SIMPLE STEPS</p>
                <h3 className="mt-1 text-2xl font-extrabold leading-tight">Pay only after checking the receiver and exact amount</h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">The separate Payment page shows your current plan, available methods and payment history. The final receiver, amount and new expiry are shown again inside checkout before you confirm.</p>
              </div>
              <button type="button" onClick={() => navigate('payment')} className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-extrabold text-white shadow"><CreditCard className="h-4 w-4" /> Open Payment Page</button>
            </div>
            <div className="mt-4">{renderPaymentSteps()}</div>
            <div className="mt-4">{renderPaymentMethodCards()}</div>
          </div>

          <div className="mt-9">
            <p className="text-[11px] font-extrabold tracking-[0.14em] text-violet-700">COMMON QUESTIONS</p>
            <h3 className="mt-1 text-2xl font-extrabold">Plan and payment doubts — clear answers</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl border bg-white p-4 shadow-sm"><BadgeCheck className="h-5 w-5 text-emerald-600" /><h4 className="mt-2 text-sm font-extrabold">When does my plan start?</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">Immediately after you complete checkout and tap <b>Payment Done — Activate Plan</b>. The expiry date appears on the Payment page and in My Account.</p></article>
              <article className="rounded-3xl border bg-white p-4 shadow-sm"><RotateCcw className="h-5 w-5 text-sky-600" /><h4 className="mt-2 text-sm font-extrabold">Can I renew before expiry?</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">Yes. Renewing the <b>same plan</b> extends from your current expiry. If you upgrade, checkout shows the new plan expiry before payment confirmation.</p></article>
              <article className="rounded-3xl border bg-white p-4 shadow-sm"><Clock3 className="h-5 w-5 text-amber-600" /><h4 className="mt-2 text-sm font-extrabold">What happens at expiry?</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">Paid benefits stop at the exact expiry time and <b>Free activates automatically</b>. You do not need to logout or create a new account.</p></article>
              <article className="rounded-3xl border bg-white p-4 shadow-sm"><TvMinimalPlay className="h-5 w-5 text-violet-600" /><h4 className="mt-2 text-sm font-extrabold">Why is there an Apply ad?</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">Paid plans remove browsing and contact-reveal ads. For application safety and sponsorship, <b>Apply Now still shows one sponsored ad on every plan</b>.</p></article>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            <article className="flex gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><h4 className="text-sm font-extrabold text-emerald-950">Recruiters: no plan needed</h4><p className="mt-1 text-xs leading-relaxed text-emerald-900">Recruiters register free, post vacancies for Admin approval and view anonymous candidate profiles. Paid plans are only for Job Seeker contact access.</p></div></article>
            <article className="flex gap-3 rounded-3xl border bg-white p-4 shadow-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><h4 className="text-sm font-extrabold">Why are contacts protected?</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">Masking helps reduce spam calls. Free users unlock with ads; paid users open contacts directly within their plan limit.</p></div></article>
            <article className="flex gap-3 rounded-3xl border bg-white p-4 shadow-sm"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><h4 className="text-sm font-extrabold">Founder-verified vacancies</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">Member-submitted vacancies go live only after Admin approval by App Founder <b>M Divakar Reddy</b>.</p></div></article>
          </div>
        </div>
      </section>
      )}
      {/* PAYMENT & MY PLAN PAGE — separate from Plans & Benefits in every menu */}
      {page === 'payment' && !shouldHideJobSeekerExperience && (
      <section id="payment" className="bg-[#f0f7ff]">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800 text-white shadow-xl">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold tracking-[0.13em] text-emerald-800">PAYMENT &amp; MY PLAN</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold tracking-[0.13em]">SEPARATE PAYMENT PAGE</span>
                <button type="button" onClick={() => navigate('pricing')} className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-emerald-800 shadow transition hover:bg-emerald-50"><Crown className="h-4 w-4" /> Plans &amp; Benefits</button>
              </div>
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                <div>
                  <h2 className="text-[30px] font-extrabold leading-[1.08] sm:text-[38px]">Payment steps, plan status and history — all in one place.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50">First choose a plan. Before paying, check the <b>receiver name</b>, <b>exact amount</b> and <b>new expiry</b>. After payment, enter the new UTR/transaction reference to activate the plan.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white px-2 py-3 text-emerald-900 shadow"><p className="text-[10px] font-extrabold tracking-widest text-emerald-700">RECEIVER</p><p className="mt-1 truncate text-xs font-extrabold">{commerceSettings.payment.receiverName}</p></div>
                  <div className="rounded-2xl bg-white/15 px-2 py-3 backdrop-blur"><p className="text-[10px] font-extrabold tracking-widest text-emerald-100">METHODS READY</p><p className="mt-1 text-sm font-extrabold">{getAvailableCheckoutMethods(commerceSettings).length}</p></div>
                  <div className="rounded-2xl bg-white/15 px-2 py-3 backdrop-blur"><p className="text-[10px] font-extrabold tracking-widest text-emerald-100">ACTIVATION</p><p className="mt-1 text-xs font-extrabold">Automatic</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">{renderCurrentPlanStatusCard()}</div>

          <div className="mt-9 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            <div className="min-w-0">
              <div>
                <p className="text-[11px] font-extrabold tracking-[0.14em] text-emerald-700">HOW TO PAY</p>
                <h3 className="mt-1 text-2xl font-extrabold">Follow these 5 cards in order</h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">Do not pay from an old screenshot or an old UPI ID. Always open the plan checkout so the latest Admin receiver, amount and expiry are shown for that purchase.</p>
                <div className="mt-4">{renderPaymentSteps()}</div>
              </div>

              <div className="mt-9">
                <p className="text-[11px] font-extrabold tracking-[0.14em] text-sky-700">PAYMENT METHODS SET BY ADMIN</p>
                <h3 className="mt-1 text-2xl font-extrabold">Choose only a method marked “READY”</h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">Admin can switch each method ON or OFF. A method marked <b>NOT AVAILABLE</b> will not appear as a usable checkout choice.</p>
                <div className="mt-4">{renderPaymentMethodCards()}</div>
              </div>

              <div className="mt-6 rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-amber-950"><ShieldCheck className="h-5 w-5 text-amber-700" /> Before tapping “Payment Done”, check these 5 points</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    `Receiver name is ${commerceSettings.payment.receiverName}.`,
                    'Amount exactly matches the selected plan price.',
                    'Payment status in your UPI/bank app is Successful.',
                    'Reference is the new UPI/UTR/transaction number for this payment.',
                    'The same reference has not been used for an earlier purchase.',
                  ].map((item, index) => (
                    <p key={item} className={`flex gap-2 rounded-2xl bg-white px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-950 ${index === 4 ? 'sm:col-span-2' : ''}`}><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {item}</p>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-amber-900"><b>Manual UPI/bank note:</b> PharmaSales Jobs records the reference you submit; Admin can cross-check it in the Payment List. If money was deducted but the plan did not activate, raise a support ticket with your registered mobile number and the same reference.</p>
              </div>

              {commerceSettings.payment.instructions.trim() && (
                <div className="mt-4 rounded-[26px] border border-sky-200 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-base font-extrabold"><Info className="h-5 w-5 text-sky-700" /> Admin payment instructions</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{commerceSettings.payment.instructions}</p>
                </div>
              )}
            </div>

            <aside className="min-w-0 space-y-4">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Wallet className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold tracking-[0.13em] text-emerald-700">MY PAYMENT HISTORY</p>
                    <h3 className="mt-0.5 text-lg font-extrabold">Purchases on my mobile number</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">Each card shows the plan, amount, method, reference, purchase date and expiry.</p>
                  </div>
                  {currentUser?.role === 'seeker' && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">{myPlanPurchases.length} record{myPlanPurchases.length === 1 ? '' : 's'}</span>}
                </div>
                <div className="mt-4">{renderPaymentHistoryCards()}</div>
              </div>

              <div className="rounded-[26px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-sky-950"><Clock3 className="h-5 w-5 text-sky-700" /> What happens after payment?</h3>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-sky-950">
                  <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Plan activates on the same Job Seeker mobile number.</p>
                  <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Direct contacts work until the exact expiry time.</p>
                  <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Free starts automatically after expiry; your account and profile stay safe.</p>
                  <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Renewing the same plan before expiry extends its validity.</p>
                </div>
              </div>

              <div className="rounded-[26px] border bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold"><MessageCircle className="h-5 w-5 text-violet-600" /> Payment problem?</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Raise a support ticket with your <b>registered mobile</b>, <b>plan name</b>, <b>amount</b> and <b>UTR/transaction reference</b>. Do not share your password or bank PIN with anyone.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => openSupportTicket('support')} className="rounded-full bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white">Raise Support Ticket</button>
                  <button type="button" onClick={() => openLegal('support')} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">Contact Support</button>
                </div>
              </div>
            </aside>
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
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Only real completed Job Seeker profiles are shown</span>
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
                <img src="/divakar-reddy-circle-400.jpg" className="h-20 w-20 shrink-0 select-none aspect-square rounded-full object-cover object-center bg-[#e8e8e8] border-2 border-white shadow" alt="M Divakar Reddy" />
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
                <a href={buildSupportMailto()} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-bold text-white"><Mail className="h-4 w-4" /> Email Support</a>
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
              <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold text-white">FOR JOB SEEKERS &amp; RECRUITERS</span>
              <h2 className="mt-3 text-[26px] font-extrabold leading-tight">Post a Vacancy</h2>
              <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-slate-600">Free to submit. Your vacancy goes <b>LIVE only after verification &amp; approval by M Divakar Reddy (Admin)</b> — usually within 2 hours. After approval, your name appears small as <b>Posted by</b> in the job details.</p>
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
                <p className="mt-5 text-sm font-extrabold text-slate-900">👤 Hiring Contact Details <span className="text-xs font-semibold text-slate-500">(Manager / RBM / ZSM / HR • Admin will call to verify • shown to candidates only after they unlock)</span></p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Enter the <b>Manager / RBM / ZSM / HR</b> contact for this vacancy — not your own details, unless you are the hiring contact.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Person Type *</label><select value={recruiterJob.contactType} onChange={e => setRecruiterJob({ ...recruiterJob, contactType: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"><option value="Manager">Manager</option><option value="RBM">RBM (Regional Business Manager)</option><option value="ZSM">ZSM (Zonal Sales Manager)</option><option value="HR">HR</option></select></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Person Name *</label><input value={recruiterJob.contactPerson} onChange={e => setRecruiterJob({ ...recruiterJob, contactPerson: e.target.value })} placeholder="e.g. Ramesh Reddy" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Mobile Number *</label><input value={recruiterJob.phone} onChange={e => setRecruiterJob({ ...recruiterJob, phone: e.target.value })} placeholder="+91 98XXX XXXXX" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Email *</label><input value={recruiterJob.email} onChange={e => setRecruiterJob({ ...recruiterJob, email: e.target.value })} placeholder="hr@company.com" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                </div>
                <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white shadow hover:bg-sky-700"><Send className="h-4 w-4" /> Submit for Admin Approval</button>
                <p className="mt-2 text-center text-xs text-slate-500">By submitting, you confirm this is a genuine vacancy. Fake/duplicate posts are rejected by Admin.</p>
              </form>
            )}

            <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-white p-4">
              <img src="/divakar-reddy-circle-100.jpg" alt="M Divakar Reddy" className="h-11 w-11 shrink-0 select-none aspect-square rounded-full object-cover object-center border-2 border-white shadow" />
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
                        { q: 'Where are my account options?', a: 'Open My Account from the Account menu on desktop or the My Account section in the mobile menu. Tap the pencil icon beside any editable column to update your name, email or Job Seeker profile field. Account deletion and logout are also kept there.' },
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
                <div className="brand-title-card flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-2.5 py-2 min-[420px]:gap-3 min-[420px]:px-3" aria-label="PharmaSales Jobs — The MR to NSM Jobs Network">
                  <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-10 w-10 shrink-0 rounded-[22%] bg-white ring-1 ring-sky-100 object-cover shadow min-[420px]:h-11 min-[420px]:w-11" />
                  <div className="min-w-0">
                    <p className="brand-title-text truncate text-[16px] font-extrabold leading-none tracking-tight min-[420px]:text-[18px]">PharmaSales Jobs</p>
                    <p className="brand-title-subtitle mt-1 truncate text-[8px] leading-none tracking-wide min-[420px]:text-[9px]">The MR to NSM Jobs Network</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-white p-6 shadow-xl">
                <div className="text-center">
                  <img src="/divakar-reddy-circle-200.jpg" alt="M Divakar Reddy — Admin" className="mx-auto h-24 w-24 select-none aspect-square rounded-full object-cover object-center border-4 border-sky-100 shadow" />
                  <span className="mt-3 inline-block rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold tracking-wide text-slate-900">👑 ADMIN ONLY</span>
                  <h2 className="mt-2 text-2xl font-extrabold">Admin Login</h2>
                  <p className="text-sm font-semibold text-sky-700">M Divakar Reddy</p>
                  <p className="text-xs text-slate-500">App Founder — PharmaSales Jobs • Admin</p>
                </div>
                {renderHowToVideoButton('admin')}
                <form className="mt-4 space-y-3" autoComplete="off" onSubmit={e => { e.preventDefault(); handleAdminLogin() }}>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Admin ID / Email</label>
                    <input value={adminId} onChange={e => setAdminId(e.target.value)} name="admin-login-id" autoCapitalize="none" autoComplete="off" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Password</label>
                    <div className="relative">
                      <input type={showAdminPass ? 'text' : 'password'} value={adminPass} onChange={e => setAdminPass(e.target.value)} name="admin-login-password" placeholder="Enter admin password" autoComplete="off" className="w-full rounded-xl border bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:border-sky-500" />
                      <button type="button" onClick={() => setShowAdminPass(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:bg-slate-100">{showAdminPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  {adminError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{adminError}</p>}
                  <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 py-3 text-sm font-bold text-white shadow hover:bg-sky-700"><LogIn className="h-4 w-4" /> Login to Dashboard</button>
                </form>
                <button type="button" onClick={() => { setShowAdminForgot(v => !v); setAdminForgotError('') }} className="mx-auto mt-3 block text-xs font-extrabold text-sky-700 hover:underline">Forgot Admin Password?</button>
                {showAdminForgot && (
                  <form className="mt-3 space-y-3 rounded-2xl bg-slate-50 p-4 text-left" onSubmit={e => { e.preventDefault(); void handleAdminForgotPassword() }}>
                    <p className="text-xs leading-relaxed text-slate-600"><b className="text-slate-900">Reset Admin password:</b> enter the Admin ID and registered Admin email to set a new password.</p>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Admin ID</label>
                      <input value={adminForgotId} onChange={e => setAdminForgotId(e.target.value)} name="admin-forgot-id" autoCapitalize="none" autoComplete="off" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Registered Admin Email</label>
                      <input value={adminForgotEmail} onChange={e => setAdminForgotEmail(e.target.value)} name="admin-registered-email" autoCapitalize="none" autoComplete="off" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">New Password</label>
                      <input type="password" value={adminForgotNew} onChange={e => setAdminForgotNew(e.target.value)} placeholder="Minimum 6 characters" autoComplete="new-password" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Confirm New Password</label>
                      <input type="password" value={adminForgotConfirm} onChange={e => setAdminForgotConfirm(e.target.value)} placeholder="Enter new password again" autoComplete="new-password" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                    </div>
                    {adminForgotError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{adminForgotError}</p>}
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white shadow hover:bg-slate-800"><KeyRound className="h-4 w-4" /> Reset Admin Password</button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* One blue Admin top bar: back + brand on the left, ADMIN + Menu on the top-right. */}
              <div className="app-topbar-background mb-4 overflow-hidden rounded-[26px] border">
                <div className="flex items-center gap-2 px-2.5 py-2.5 min-[420px]:gap-3 min-[420px]:px-3.5 sm:px-4">
                  {canGoBack && (
                    <button type="button" onClick={handlePageBack} aria-label="Go back" title="Go back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-slate-800 shadow-md transition hover:bg-sky-50 active:scale-95">
                      <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                  )}
                  <button onClick={() => openAdmin('overview')} aria-label="PharmaSales Jobs Admin overview" className="flex min-w-0 flex-1 items-center gap-2.5 text-left min-[420px]:gap-3">
                    <img src="/icon-192.png" alt="PharmaSales Jobs" className="h-9 w-9 shrink-0 rounded-[22%] bg-white object-cover shadow-[0_8px_20px_rgba(8,47,73,0.32),0_0_0_2px_rgba(255,255,255,0.92)] min-[380px]:h-10 min-[380px]:w-10 min-[420px]:h-11 min-[420px]:w-11" />
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-extrabold leading-none tracking-tight text-white [text-shadow:0_1px_2px_rgba(8,47,73,0.38)] min-[380px]:text-[17px] min-[420px]:text-[19px]">PharmaSales Jobs</span>
                      <span className="mt-1 block truncate text-[8px] font-extrabold leading-none tracking-wide text-sky-50 min-[420px]:text-[9px]">The MR to NSM Jobs Network</span>
                    </span>
                  </button>
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-sky-800 shadow-sm sm:inline-flex">ADMIN</span>
                    <button type="button" onClick={() => setShowAdminMenu(true)} aria-label="Open Admin Menu" title="Admin Menu" className="relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl bg-white px-2.5 text-sky-800 shadow-md transition hover:bg-sky-50 active:scale-95 min-[420px]:px-3.5">
                      <Menu className="h-5 w-5" />
                      <span className="hidden text-xs font-extrabold min-[420px]:inline">Menu</span>
                      {(pendingJobs.length + pendingDeletionRequests.length + openSupportTickets.length) > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-900 shadow">{pendingJobs.length + pendingDeletionRequests.length + openSupportTickets.length}</span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-white/20 bg-slate-950/15 px-3 py-2 min-[420px]:px-3.5 sm:px-4">
                  <p className="shrink-0 text-[9px] font-extrabold tracking-[0.14em] text-sky-100">ADMIN MENU</p>
                  <p className="min-w-0 flex-1 truncate text-xs font-extrabold text-white">{({ overview: 'Overview', post: 'Post Vacancy', approvals: 'Approvals', users: 'Users List', purchases: 'Purchase List', payments: 'Payment List', 'plan-settings': 'Plan Settings', 'payment-settings': 'Payment Settings', accounts: 'Account Requests', support: 'Support Tickets', manage: 'Manage Vacancies', settings: 'Settings' } as Record<string, string>)[adminTab]}</p>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white"><span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-300' : 'bg-amber-300'}`} />{isSupabaseConfigured ? 'Supabase Live' : 'This Device'}</span>
                </div>
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

              <AnimatePresence>
                {showAdminMenu && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setShowAdminMenu(false)} className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm" />
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="fixed right-0 top-0 z-[60] flex h-[100dvh] w-[86%] max-w-[340px] flex-col bg-white shadow-2xl">
                      <div className="app-topbar-background flex items-center gap-3 px-4 py-4 text-white">
                        <img src="/divakar-reddy-circle-100.jpg" alt="M Divakar Reddy — Admin" className="h-11 w-11 shrink-0 select-none aspect-square rounded-full border-2 border-white object-cover object-center shadow" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold leading-tight">M Divakar Reddy</p>
                          <p className="text-[11px] font-bold text-sky-100">Admin Menu • PharmaSales Jobs</p>
                        </div>
                        <button type="button" onClick={() => setShowAdminMenu(false)} aria-label="Close Admin Menu" title="Close menu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30 active:scale-95"><X className="h-5 w-5" /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-3 py-3">
                        <div className="grid gap-1.5">
                          {[
                            { id: 'overview' as const, label: 'Overview', sub: 'Dashboard summary', icon: LayoutDashboard, badge: undefined as number | undefined, badgeClass: '' },
                            { id: 'post' as const, label: 'Post Vacancy', sub: 'Publish instantly as Admin', icon: Plus, badge: undefined, badgeClass: '' },
                            { id: 'approvals' as const, label: 'Approvals', sub: 'Vacancies waiting for approval', icon: Clock3, badge: pendingJobs.length, badgeClass: 'bg-amber-400 text-slate-900' },
                            { id: 'users' as const, label: 'Users List', sub: 'Job Seekers • Recruiters • Admin', icon: Users, badge: displayedAdminUsers.length + 1, badgeClass: 'bg-sky-100 text-sky-700' },
                            { id: 'purchases' as const, label: 'Purchase List', sub: 'Starter & Pro plan purchases', icon: Crown, badge: displayedPurchases.length, badgeClass: 'bg-violet-100 text-violet-700' },
                            { id: 'payments' as const, label: 'Payment List', sub: 'Transactions & revenue', icon: IndianRupee, badge: displayedPurchases.filter(p => p.status === 'paid').length, badgeClass: 'bg-emerald-100 text-emerald-700' },
                            { id: 'plan-settings' as const, label: 'Plan Settings', sub: 'Price • validity • contacts • benefits', icon: Crown, badge: undefined, badgeClass: '' },
                            { id: 'payment-settings' as const, label: 'Payment Settings', sub: 'Receiver • UPI/QR • link • bank', icon: Wallet, badge: undefined, badgeClass: '' },
                            { id: 'accounts' as const, label: 'Account Requests', sub: 'Deletion requests', icon: FileText, badge: pendingDeletionRequests.length, badgeClass: 'bg-red-500 text-white' },
                            { id: 'support' as const, label: 'Support Tickets', sub: 'User help requests', icon: MessageCircle, badge: openSupportTickets.length, badgeClass: 'bg-sky-500 text-white' },
                            { id: 'manage' as const, label: 'Manage Vacancies', sub: 'Live jobs on the app', icon: Briefcase, badge: jobs.length, badgeClass: 'bg-slate-100 text-slate-600' },
                            { id: 'settings' as const, label: 'Settings', sub: 'My Account • Admin ID divakar • Password', icon: Settings, badge: undefined, badgeClass: '' },
                          ].map(item => (
                            <button key={item.id} type="button" onClick={() => { setAdminTab(item.id); setShowAdminMenu(false) }} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.98] ${adminTab === item.id ? 'bg-slate-900 text-white shadow' : 'hover:bg-slate-50'}`}>
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${adminTab === item.id ? 'bg-white/15 text-white' : 'bg-sky-50 text-sky-600'}`}><item.icon className="h-5 w-5" /></span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-extrabold leading-tight">{item.label}</span>
                                <span className={`block truncate text-[11px] leading-tight ${adminTab === item.id ? 'text-slate-300' : 'text-slate-500'}`}>{item.sub}</span>
                              </span>
                              {typeof item.badge === 'number' && item.badge > 0 && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${item.badgeClass}`}>{item.badge}</span>}
                              <ChevronRight className={`h-4 w-4 shrink-0 ${adminTab === item.id ? 'text-slate-300' : 'text-slate-400'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="border-t bg-slate-50 px-3 py-3">
                        <p className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />{isSupabaseConfigured ? 'Supabase connected — accounts, vacancies, tickets, purchases & payments sync live.' : 'Showing this device’s data — connect Supabase to sync all accounts.'}</p>
                        <button type="button" onClick={handleAdminLogout} className="mt-2 flex w-full items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 text-left text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"><LogOut className="h-4 w-4" /><span className="flex-1">Admin Logout</span></button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

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
                    <div><label className="mb-1 block text-xs font-bold text-slate-600">Contact Email *</label><input value={newJob.email} onChange={e => setNewJob({ ...newJob, email: e.target.value })} placeholder="hr@company.com" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
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
                          <span><b>Submitted by:</b> {job.submittedBy} ({job.submittedByRole === 'seeker' ? 'Job Seeker' : 'Recruiter'})</span><span className="text-slate-300">|</span>
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

              {adminTab === 'users' && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex items-center gap-2 text-base font-extrabold"><Users className="h-5 w-5 text-sky-600" /> Users List ({displayedAdminUsers.length + 1})</p>
                    <span className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />{remoteAdminUsers ? 'Supabase Live' : isSupabaseConfigured ? 'Supabase • Loading' : 'This Device'}</span>
                    {isSupabaseConfigured && <button type="button" onClick={() => void fetchAdminSupabaseData()} disabled={adminDataLoading} className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-bold shadow-sm transition hover:bg-slate-50 disabled:opacity-60"><RotateCcw className={`h-3.5 w-3.5 ${adminDataLoading ? 'animate-spin' : ''}`} /> Refresh</button>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">All three roles in one place — <b>Job Seekers</b>, <b>Recruiters</b> and <b>Admin</b>. Accounts are created and managed in Supabase ({isSupabaseConfigured ? 'connected' : 'connect Supabase to sync every device'}). Use <b>View Account</b> to open a user’s account/profile, current plan and purchases. User passwords are never shown and there is no master-password login.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3.5"><p className="text-[11px] font-bold text-slate-500">Total Accounts</p><p className="mt-0.5 text-2xl font-extrabold">{displayedAdminUsers.length + 1}</p></div>
                    <div className="rounded-2xl bg-sky-50 p-3.5"><p className="text-[11px] font-bold text-sky-700">Job Seekers</p><p className="mt-0.5 text-2xl font-extrabold text-sky-700">{adminSeekerCount}</p></div>
                    <div className="rounded-2xl bg-amber-50 p-3.5"><p className="text-[11px] font-bold text-amber-700">Recruiters</p><p className="mt-0.5 text-2xl font-extrabold text-amber-700">{adminRecruiterCount}</p></div>
                    <div className="rounded-2xl bg-slate-900 p-3.5 text-white"><p className="text-[11px] font-bold text-slate-300">Admin</p><p className="mt-0.5 text-2xl font-extrabold">1</p></div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap gap-1.5">
                      {([['all', 'All Roles'], ['seeker', 'Job Seekers'], ['recruiter', 'Recruiters'], ['admin', 'Admin']] as const).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => setAdminUserRoleFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${adminUserRoleFilter === value ? 'bg-slate-900 text-white shadow' : 'border bg-white text-slate-600 hover:bg-slate-50'}`}>{label}</button>
                      ))}
                    </div>
                    <div className="relative sm:ml-auto sm:w-[260px]">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input value={adminUserSearch} onChange={e => setAdminUserSearch(e.target.value)} placeholder="Search name, mobile, email" className="w-full rounded-full border bg-white py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-sky-500" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(adminUserRoleFilter === 'all' || adminUserRoleFilter === 'admin') && (
                      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-900/10 bg-gradient-to-r from-sky-600 to-indigo-600 px-3.5 py-3 text-white shadow-sm">
                        <img src="/divakar-reddy-circle-100.jpg" alt="M Divakar Reddy — Admin" className="h-10 w-10 shrink-0 select-none aspect-square rounded-full border-2 border-white object-cover object-center shadow" />
                        <div className="min-w-[200px] flex-1">
                          <p className="text-sm font-extrabold leading-tight">M Divakar Reddy <span className="ml-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-900">👑 ADMIN</span></p>
                          <p className="text-xs text-sky-100">Admin ID: divakar • App Founder — PharmaSales Jobs</p>
                        </div>
                        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold">Full Access</span>
                        <button type="button" onClick={() => setAdminTab('settings')} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-sky-700 shadow-sm"><Eye className="h-3.5 w-3.5" /> View Account</button>
                      </div>
                    )}
                    {filteredAdminUsers.map(account => (
                      <div key={`${account.role}-${account.mobile}`} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-3.5 py-3">
                        <AccountAvatar name={account.name} photo={account.role === 'seeker' ? account.profile?.profilePhoto : undefined} imgClassName="h-10 w-10 border border-sky-100" fallbackClassName={`flex h-10 w-10 text-sm text-white ${account.role === 'seeker' ? 'bg-sky-600' : 'bg-amber-500'}`} />
                        <div className="min-w-[200px] flex-1">
                          <p className="truncate text-sm font-extrabold leading-tight">{account.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${account.role === 'seeker' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>{account.role === 'seeker' ? 'JOB SEEKER' : 'RECRUITER'}</span></p>
                          <p className="truncate text-xs text-slate-600">+91 {account.mobile} • {account.email}</p>
                          <p className="text-[11px] text-slate-400">Joined: {formatAdminDate(account.createdAt)}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          {account.role === 'seeker' && <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isSeekerProfileComplete(account.profile) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{isSeekerProfileComplete(account.profile) ? 'Profile Complete' : `Profile ${seekerProfileProgress(account.profile)}%`}</span>}
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${(account.hasPassword || account.passwordHash) ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>{(account.hasPassword || account.passwordHash) ? 'Password Set' : 'No Password'}</span>
                          <button type="button" onClick={() => setAdminAccountDetail(account)} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-slate-800"><Eye className="h-3.5 w-3.5" /> View Account</button>
                        </div>
                      </div>
                    ))}
                    {filteredAdminUsers.length === 0 && adminUserRoleFilter !== 'admin' && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <Users className="mx-auto h-9 w-9 text-slate-300" />
                        <p className="mt-2 text-sm font-bold">No users found</p>
                        <p className="text-xs text-slate-500">{displayedAdminUsers.length === 0 ? 'When Job Seekers and Recruiters register, their accounts appear here.' : 'Try a different search or role filter.'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminTab === 'purchases' && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex items-center gap-2 text-base font-extrabold"><Crown className="h-5 w-5 text-violet-600" /> Purchase List ({displayedPurchases.length})</p>
                    <span className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />{remotePurchases ? 'Supabase Live' : isSupabaseConfigured ? 'Supabase • Loading' : 'This Device'}</span>
                    {isSupabaseConfigured && <button type="button" onClick={() => void fetchAdminSupabaseData()} disabled={adminDataLoading} className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-bold shadow-sm transition hover:bg-slate-50 disabled:opacity-60"><RotateCcw className={`h-3.5 w-3.5 ${adminDataLoading ? 'animate-spin' : ''}`} /> Refresh</button>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Every paid plan purchase is recorded with the Admin-set price and validity used at checkout. Plans turn EXPIRED automatically at their expiry time.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3.5"><p className="text-[11px] font-bold text-slate-500">Total Purchases</p><p className="mt-0.5 text-2xl font-extrabold">{displayedPurchases.length}</p></div>
                    <div className="rounded-2xl bg-emerald-50 p-3.5"><p className="text-[11px] font-bold text-emerald-700">Active Plans</p><p className="mt-0.5 text-2xl font-extrabold text-emerald-700">{displayedPurchases.filter(isPurchaseActive).length}</p></div>
                    <div className="rounded-2xl bg-sky-50 p-3.5"><p className="text-[11px] font-bold text-sky-700">{commerceSettings.plans.starter.name} • Current {formatINR(commerceSettings.plans.starter.price)}</p><p className="mt-0.5 text-2xl font-extrabold text-sky-700">{displayedPurchases.filter(p => p.plan === 'starter').length}</p></div>
                    <div className="rounded-2xl bg-violet-50 p-3.5"><p className="text-[11px] font-bold text-violet-700">{commerceSettings.plans.pro.name} • Current {formatINR(commerceSettings.plans.pro.price)}</p><p className="mt-0.5 text-2xl font-extrabold text-violet-700">{displayedPurchases.filter(p => p.plan === 'pro').length}</p></div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {displayedPurchases.map(purchase => (
                      <div key={purchase.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-3.5 py-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${purchase.plan === 'pro' ? 'bg-violet-600' : 'bg-sky-600'}`}><Crown className="h-5 w-5" /></span>
                        <div className="min-w-[200px] flex-1">
                          <p className="truncate text-sm font-extrabold leading-tight">{purchase.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${purchase.plan === 'pro' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>{purchase.planName.toUpperCase()}</span></p>
                          <p className="truncate text-xs text-slate-600">{purchase.mobile ? `+91 ${purchase.mobile} • ` : ''}{purchase.email}</p>
                          <p className="text-[11px] text-slate-400">Purchased: {formatAdminDate(purchase.purchasedAt)} • Valid till: {formatAdminDate(purchase.expiresAt)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-extrabold">₹{Number(purchase.amount) || 0}</p>
                          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${purchase.status !== 'paid' ? 'bg-red-50 text-red-600' : isPurchaseActive(purchase) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{purchase.status !== 'paid' ? purchase.status.toUpperCase() : isPurchaseActive(purchase) ? 'ACTIVE' : 'EXPIRED'}</span>
                        </div>
                      </div>
                    ))}
                    {displayedPurchases.length === 0 && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <Crown className="mx-auto h-9 w-9 text-slate-300" />
                        <p className="mt-2 text-sm font-bold">No purchases yet</p>
                        <p className="text-xs text-slate-500">When a Job Seeker buys Starter or Pro, the purchase appears here instantly.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminTab === 'payments' && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex items-center gap-2 text-base font-extrabold"><IndianRupee className="h-5 w-5 text-emerald-600" /> Payment List ({displayedPurchases.length})</p>
                    <span className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />{remotePurchases ? 'Supabase Live' : isSupabaseConfigured ? 'Supabase • Loading' : 'This Device'}</span>
                    {isSupabaseConfigured && <button type="button" onClick={() => void fetchAdminSupabaseData()} disabled={adminDataLoading} className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-bold shadow-sm transition hover:bg-slate-50 disabled:opacity-60"><RotateCcw className={`h-3.5 w-3.5 ${adminDataLoading ? 'animate-spin' : ''}`} /> Refresh</button>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Every payment transaction with amount, method and status. Preview currently uses demo in-app checkout — Google Play Billing replaces it before Play Store release, and payments sync to Supabase when connected.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl bg-emerald-50 p-3.5"><p className="text-[11px] font-bold text-emerald-700">Total Collected</p><p className="mt-0.5 text-2xl font-extrabold text-emerald-700">₹{totalRevenue.toLocaleString('en-IN')}</p></div>
                    <div className="rounded-2xl bg-sky-50 p-3.5"><p className="text-[11px] font-bold text-sky-700">This Month</p><p className="mt-0.5 text-2xl font-extrabold text-sky-700">₹{thisMonthRevenue.toLocaleString('en-IN')}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3.5"><p className="text-[11px] font-bold text-slate-500">Successful</p><p className="mt-0.5 text-2xl font-extrabold">{displayedPurchases.filter(p => p.status === 'paid').length}</p></div>
                    <div className="rounded-2xl bg-red-50 p-3.5"><p className="text-[11px] font-bold text-red-600">Failed / Pending</p><p className="mt-0.5 text-2xl font-extrabold text-red-600">{displayedPurchases.filter(p => p.status !== 'paid').length}</p></div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {displayedPurchases.map(purchase => (
                      <div key={purchase.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-3.5 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><IndianRupee className="h-5 w-5" /></span>
                        <div className="min-w-[200px] flex-1">
                          <p className="truncate font-mono text-xs font-extrabold leading-tight text-slate-800">{purchase.transactionId}</p>
                          <p className="truncate text-xs text-slate-600">{purchase.name} • {purchase.planName} Plan{purchase.mobile ? ` • +91 ${purchase.mobile}` : ''}</p>
                          <p className="text-[11px] text-slate-400">{purchase.method} • {formatAdminDate(purchase.purchasedAt)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-extrabold">₹{Number(purchase.amount) || 0}</p>
                          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${purchase.status === 'paid' ? 'bg-emerald-500 text-white' : purchase.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-500 text-white'}`}>{purchase.status === 'paid' ? 'PAID' : purchase.status.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                    {displayedPurchases.length === 0 && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center">
                        <IndianRupee className="mx-auto h-9 w-9 text-slate-300" />
                        <p className="mt-2 text-sm font-bold">No payments yet</p>
                        <p className="text-xs text-slate-500">Starter and Pro payments will be listed here with transaction IDs.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(adminTab === 'plan-settings' || adminTab === 'payment-settings') && (
                <div className="mt-4 rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex items-center gap-2 text-base font-extrabold">{adminTab === 'plan-settings' ? <Crown className="h-5 w-5 text-sky-600" /> : <Wallet className="h-5 w-5 text-emerald-600" />} {adminTab === 'plan-settings' ? 'Plan Settings — price, validity, contacts and benefits' : 'Payment Settings — receiver, UPI, QR, payment link and bank'}</p>
                    <span className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />{isSupabaseConfigured ? 'Supabase Live Settings' : 'This Device'}</span>
                    {isSupabaseConfigured && <button type="button" onClick={() => void refreshCommerceSettings().then(settings => { setCommerceDraft(settings); setCommerceSettingsError(''); setToast('Latest live plan and payment settings loaded.') }).catch(() => setCommerceSettingsError('Unable to refresh live settings. Your current editor values were kept.'))} className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-bold shadow-sm transition hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" /> Refresh</button>}
                  </div>
                  <p className="mt-1 max-w-4xl text-xs leading-relaxed text-slate-600">{adminTab === 'plan-settings'
                    ? 'This page controls only what a plan is: name, price, validity, daily contacts, purchase ON/OFF and the benefit lines shown on each Job Seeker plan card. Save after changing anything.'
                    : 'This page controls only where money is received: receiver name, UPI ID/QR, payment link, bank details, instructions and which methods are ON. Job Seekers see this latest source only after you save.'}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => setAdminTab('plan-settings')} className={`flex items-center gap-3 rounded-3xl border p-3 text-left transition ${adminTab === 'plan-settings' ? 'border-sky-600 bg-sky-700 text-white shadow' : 'border-sky-100 bg-sky-50 text-sky-950 hover:border-sky-300'}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${adminTab === 'plan-settings' ? 'bg-white/20' : 'bg-white text-sky-700'}`}><Crown className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">Plan Settings</span><span className={`mt-0.5 block text-[11px] font-semibold ${adminTab === 'plan-settings' ? 'text-sky-100' : 'text-sky-700'}`}>What the Job Seeker gets</span></span>
                      {adminTab === 'plan-settings' && <span className="rounded-full bg-white px-2 py-1 text-[9px] font-extrabold text-sky-800">OPEN</span>}
                    </button>
                    <button type="button" onClick={() => setAdminTab('payment-settings')} className={`flex items-center gap-3 rounded-3xl border p-3 text-left transition ${adminTab === 'payment-settings' ? 'border-emerald-700 bg-emerald-700 text-white shadow' : 'border-emerald-100 bg-emerald-50 text-emerald-950 hover:border-emerald-300'}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${adminTab === 'payment-settings' ? 'bg-white/20' : 'bg-white text-emerald-700'}`}><Wallet className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">Payment Settings</span><span className={`mt-0.5 block text-[11px] font-semibold ${adminTab === 'payment-settings' ? 'text-emerald-100' : 'text-emerald-700'}`}>Where the money is received</span></span>
                      {adminTab === 'payment-settings' && <span className="rounded-full bg-white px-2 py-1 text-[9px] font-extrabold text-emerald-800">OPEN</span>}
                    </button>
                  </div>
                  {commerceSettings.updatedAt && <p className="mt-2 text-[11px] font-bold text-slate-400">Last saved: {formatAdminDate(commerceSettings.updatedAt)}</p>}

                  {adminTab === 'plan-settings' && (
                    <>
                      <div className="mt-5">
                        <p className="text-[11px] font-extrabold tracking-[0.13em] text-sky-700">HOW TO FILL EACH PLAN CARD</p>
                        <h3 className="mt-1 text-lg font-extrabold">Four simple decisions for every paid plan</h3>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <article className="rounded-3xl border border-sky-100 bg-sky-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-extrabold text-white">1</span><h4 className="mt-2 text-sm font-extrabold">Name + price</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">This name and exact price appear on the Job Seeker card and checkout.</p></article>
                          <article className="rounded-3xl border border-sky-100 bg-sky-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-extrabold text-white">2</span><h4 className="mt-2 text-sm font-extrabold">Validity days</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">The plan runs for this many days. Free starts automatically at expiry.</p></article>
                          <article className="rounded-3xl border border-sky-100 bg-sky-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-extrabold text-white">3</span><h4 className="mt-2 text-sm font-extrabold">Contacts per day</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">Set a daily number, or tick Unlimited. The limit resets daily during validity.</p></article>
                          <article className="rounded-3xl border border-sky-100 bg-sky-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-extrabold text-white">4</span><h4 className="mt-2 text-sm font-extrabold">ON/OFF + benefits</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">Purchase ON allows new buying. Write one short benefit per line in simple words.</p></article>
                        </div>
                      </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {(['starter', 'pro'] as PaidPlanId[]).map(planId => {
                      const plan = commerceDraft.plans[planId]
                      return (
                        <div key={planId} className={`rounded-3xl border p-4 ${planId === 'starter' ? 'border-sky-200 bg-sky-50/50' : 'border-violet-200 bg-violet-50/50'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${planId === 'starter' ? 'bg-sky-600' : 'bg-violet-600'}`}>{planId === 'starter' ? <Zap className="h-5 w-5" /> : <Crown className="h-5 w-5" />}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-extrabold">{planId === 'starter' ? 'Starter Plan Settings' : 'Pro Plan Settings'}</p>
                              <p className="text-[11px] font-semibold text-slate-500">{planId === 'starter' ? 'Lower-cost plan for regular daily applications.' : 'Highest-access plan for serious daily job hunting.'}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${plan.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{plan.enabled ? 'PURCHASE ON' : 'PURCHASE OFF'}</span>
                          </div>
                          <div className="mt-3 rounded-2xl border border-white bg-white/90 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 shadow-sm">
                            <p className="font-extrabold text-slate-900">Job Seeker will read this in simple words:</p>
                            <p className="mt-0.5">Pay <b>{formatINR(plan.price)}</b>. Use for <b>{plan.validityDays || 0} days</b>. Open <b>{plan.unlimited ? 'unlimited' : `${plan.dailyLimit || 0}`}</b> hiring contacts every day without contact-reveal ads.</p>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Plan Name</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                              <input value={plan.name} onChange={e => updateCommercePlanDraft(planId, { name: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500" placeholder={planId === 'starter' ? 'Starter' : 'Pro'} />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Price (₹)</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                              <input type="number" min="1" max="100000" value={plan.price} onChange={e => updateCommercePlanDraft(planId, { price: Number(e.target.value) })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500" />
                            </div>
                            <div>
                              <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Validity (days)</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                              <input type="number" min="1" max="3650" value={plan.validityDays} onChange={e => updateCommercePlanDraft(planId, { validityDays: Number(e.target.value) })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Direct Contacts Per Day</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                              <input type="number" min="1" max="10000" value={plan.unlimited ? '' : plan.dailyLimit} disabled={plan.unlimited} onChange={e => updateCommercePlanDraft(planId, { dailyLimit: Number(e.target.value) })} placeholder={plan.unlimited ? 'Unlimited' : 'Example: 15'} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400" />
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-bold"><input type="checkbox" checked={plan.enabled} onChange={e => updateCommercePlanDraft(planId, { enabled: e.target.checked })} className="h-4 w-4 accent-emerald-600" /> Purchase ON</label>
                            <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-bold"><input type="checkbox" checked={plan.unlimited} onChange={e => updateCommercePlanDraft(planId, { unlimited: e.target.checked })} className="h-4 w-4 accent-sky-600" /> Unlimited contacts</label>
                            <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-bold"><input type="checkbox" checked={plan.popular} onChange={e => updateCommercePlanDraft(planId, { popular: e.target.checked })} className="h-4 w-4 accent-violet-600" /> Most Popular</label>
                          </div>
                          <div className="mt-3">
                            <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Plan Benefits (one benefit per line)</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                            <textarea value={plan.features.join('\n')} onChange={e => updateCommercePlanDraft(planId, { features: e.target.value.split('\n') })} rows={6} className="w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-sky-500" placeholder={'No banner or native ads\nUnmasked phone + email'} />
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Write one short, clear benefit per line. The contacts/day line is added automatically first. Do not promise a job or interview.</p>
                          </div>
                          <div className="mt-3 rounded-2xl bg-slate-900 px-3.5 py-3 text-white"><p className="text-[9px] font-extrabold tracking-[0.13em] text-sky-200">LIVE CARD PREVIEW AFTER SAVE</p><p className="mt-1 text-sm font-extrabold">{plan.name || (planId === 'starter' ? 'Starter' : 'Pro')} — {formatINR(plan.price)} / {plan.validityDays || 0} days</p><p className="mt-0.5 text-[11px] font-semibold text-slate-200">{plan.unlimited ? 'Unlimited' : `${plan.dailyLimit || 0}/day`} direct hiring contacts • {plan.enabled ? 'Purchase ON' : 'Purchase OFF'}{plan.popular ? ' • Most Popular' : ''}</p></div>
                        </div>
                      )
                    })}
                  </div>

                    </>
                  )}

                  {adminTab === 'payment-settings' && (
                    <>
                      <div className="mt-5">
                        <p className="text-[11px] font-extrabold tracking-[0.13em] text-emerald-700">HOW TO SET THE RECEIVING SOURCE</p>
                        <h3 className="mt-1 text-lg font-extrabold">Enter one safe source, switch it ON, then save</h3>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <article className="rounded-3xl border border-emerald-100 bg-emerald-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-extrabold text-white">1</span><h4 className="mt-2 text-sm font-extrabold">Receiver name</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">Enter the exact name the Job Seeker will see in the UPI/bank app.</p></article>
                          <article className="rounded-3xl border border-emerald-100 bg-emerald-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-extrabold text-white">2</span><h4 className="mt-2 text-sm font-extrabold">Add payment details</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">Add UPI ID/QR, a payment link, or bank details. You may offer more than one.</p></article>
                          <article className="rounded-3xl border border-emerald-100 bg-emerald-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-extrabold text-white">3</span><h4 className="mt-2 text-sm font-extrabold">Switch method ON</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">Only ON methods with complete details appear as usable checkout cards.</p></article>
                          <article className="rounded-3xl border border-emerald-100 bg-emerald-50 p-3.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-extrabold text-white">4</span><h4 className="mt-2 text-sm font-extrabold">Save + cross-check</h4><p className="mt-1 text-[11px] leading-relaxed text-slate-600">Save with the Admin password, then match every submitted UTR in Payment List.</p></article>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          {[
                            { label: 'UPI / QR', ready: commerceDraft.payment.upiEnabled && Boolean(commerceDraft.payment.upiId.trim()), detail: commerceDraft.payment.upiId || 'UPI ID not added' },
                            { label: 'Payment Link', ready: commerceDraft.payment.paymentLinkEnabled && /^https?:\/\//i.test(commerceDraft.payment.paymentLink.trim()), detail: commerceDraft.payment.paymentLink || 'Payment link not added' },
                            { label: 'Bank Transfer', ready: commerceDraft.payment.bankEnabled && Boolean(commerceDraft.payment.bankDetails.trim()), detail: commerceDraft.payment.bankDetails.trim() ? 'Bank details added' : 'Bank details not added' },
                            { label: 'Demo Checkout', ready: commerceDraft.payment.demoCheckoutEnabled, detail: commerceDraft.payment.demoCheckoutEnabled ? 'Testing is ON — turn OFF for real money' : 'Testing is OFF' },
                          ].map(method => (
                            <article key={method.label} className={`rounded-3xl border p-3.5 ${method.ready ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
                              <div className="flex items-center gap-2"><h4 className="min-w-0 flex-1 truncate text-sm font-extrabold">{method.label}</h4><span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${method.ready ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{method.ready ? 'READY' : 'NOT READY'}</span></div>
                              <p className="mt-1 truncate text-[11px] font-semibold text-slate-500" title={method.detail}>{method.detail}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                  <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Wallet className="h-5 w-5" /></span>
                      <div>
                        <p className="text-sm font-extrabold">Payment Receiving Source</p>
                        <p className="text-[11px] font-semibold text-slate-500">Enter the receiver first. Switch ON only payment methods you personally verified.</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Receiver / Payee Name</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                        <input value={commerceDraft.payment.receiverName} onChange={e => updateCommercePaymentDraft({ receiverName: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500" placeholder="M Divakar Reddy" />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>UPI ID</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                        <input value={commerceDraft.payment.upiId} onChange={e => updateCommercePaymentDraft({ upiId: e.target.value.trim() })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500" placeholder="yourname@upi" />
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-bold"><input type="checkbox" checked={commerceDraft.payment.upiEnabled} onChange={e => updateCommercePaymentDraft({ upiEnabled: e.target.checked })} className="h-4 w-4 accent-emerald-600" /> UPI Payment ON</label>
                      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-bold"><input type="checkbox" checked={commerceDraft.payment.paymentLinkEnabled} onChange={e => updateCommercePaymentDraft({ paymentLinkEnabled: e.target.checked })} className="h-4 w-4 accent-emerald-600" /> Payment Link ON</label>
                      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-bold"><input type="checkbox" checked={commerceDraft.payment.bankEnabled} onChange={e => updateCommercePaymentDraft({ bankEnabled: e.target.checked })} className="h-4 w-4 accent-emerald-600" /> Bank Transfer ON</label>
                      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-bold"><input type="checkbox" checked={commerceDraft.payment.demoCheckoutEnabled} onChange={e => updateCommercePaymentDraft({ demoCheckoutEnabled: e.target.checked })} className="h-4 w-4 accent-amber-600" /> Demo Checkout ON</label>
                    </div>
                    {commerceDraft.payment.demoCheckoutEnabled && (
                      <p className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-amber-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Demo Checkout is ON. Job Seekers can activate without real payment. Turn Demo OFF before collecting real money.</p>
                    )}
                    <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                      <div className="rounded-2xl border bg-white p-3">
                        <p className="flex items-center gap-2 text-xs font-extrabold text-slate-700"><QrCode className="h-4 w-4 text-emerald-600" /> UPI QR Image</p>
                        {commerceDraft.payment.qrImageUrl ? (
                          <img src={commerceDraft.payment.qrImageUrl} alt="Admin UPI payment QR" className="mx-auto mt-3 max-h-56 w-auto rounded-xl border object-contain" />
                        ) : (
                          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-8 text-center text-xs font-semibold text-slate-400">No QR image added</div>
                        )}
                        <input id="admin-payment-qr-input" type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; void handlePaymentQrFile(file) }} />
                        <div className="mt-3 flex gap-2">
                          <label htmlFor="admin-payment-qr-input" className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 py-2.5 text-xs font-bold text-white ${commerceQrUploading ? 'pointer-events-none opacity-60' : ''}`}><Upload className="h-3.5 w-3.5" /> {commerceQrUploading ? 'Adding QR…' : 'Upload QR'}</label>
                          {commerceDraft.payment.qrImageUrl && <button type="button" onClick={() => updateCommercePaymentDraft({ qrImageUrl: '' })} className="flex items-center gap-1.5 rounded-full border px-3 py-2.5 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" /> Remove</button>}
                        </div>
                        {!commerceDraft.payment.qrImageUrl.startsWith('data:') && (
                          <input value={commerceDraft.payment.qrImageUrl} onChange={e => updateCommercePaymentDraft({ qrImageUrl: e.target.value.trim() })} className="mt-3 w-full rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500" placeholder="Or paste QR image URL (optional)" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Payment Link</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                          <input value={commerceDraft.payment.paymentLink} onChange={e => updateCommercePaymentDraft({ paymentLink: e.target.value.trim() })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500" placeholder="https://…" />
                        </div>
                        <div>
                          <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Bank Receiving Details</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                          <textarea value={commerceDraft.payment.bankDetails} onChange={e => updateCommercePaymentDraft({ bankDetails: e.target.value })} rows={4} className="w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-emerald-500" placeholder={'Account Name:\nAccount Number:\nIFSC:\nBank / Branch:'} />
                        </div>
                        <div>
                          <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Instructions Shown to Job Seeker</span><Pencil className="h-3.5 w-3.5 text-sky-500" /></label>
                          <textarea value={commerceDraft.payment.instructions} onChange={e => updateCommercePaymentDraft({ instructions: e.target.value })} rows={4} className="w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <p><b>Manual UPI/bank payments:</b> the plan activates after the Job Seeker submits the payment/UTR reference. Always cross-check that reference in your UPI/bank app from the Payment List. Automatic bank verification/Play Billing can replace this manual confirmation during production billing setup.</p>
                    </div>
                  </div>

                    </>
                  )}

                  <div className="mt-5 rounded-3xl border bg-slate-50 p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div>
                        {supabase && (
                          <div className="max-w-md">
                            <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span>Current Admin Password (required for secure Supabase save)</span><KeyRound className="h-3.5 w-3.5 text-sky-500" /></label>
                            <input type="password" value={commerceAdminPassword} onChange={e => setCommerceAdminPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-sky-500" placeholder="Enter current Admin password" />
                          </div>
                        )}
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{adminTab === 'plan-settings'
                          ? 'Saving updates the live plan cards (price, validity, contacts/day, ON/OFF and benefits). Existing purchases keep the price and expiry recorded at their checkout time.'
                          : 'Saving updates the live checkout receiving source. Existing purchases and payment references are not changed.'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => { setCommerceDraft(commerceSettings); setCommerceSettingsError('') }} className="rounded-full border bg-white px-4 py-2.5 text-xs font-extrabold">Reset Changes</button>
                        <button type="button" onClick={() => void saveCommerceSettings()} disabled={commerceSettingsSaving || commerceQrUploading} className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{commerceSettingsSaving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {commerceSettingsSaving ? 'Saving…' : adminTab === 'plan-settings' ? 'Save Plan Settings' : 'Save Payment Settings'}</button>
                      </div>
                    </div>
                    {commerceSettingsError && <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" /> {commerceSettingsError}</p>}
                  </div>
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
                    <button onClick={handleClearAllVacancies} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold"><Trash2 className="h-3.5 w-3.5" /> Clear All Vacancies</button>
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
                      <div><label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Current Password</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label><input id="admin-current-password" type="password" value={passForm.current} onChange={e => setPassForm({ ...passForm, current: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                      <div><label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>New Password (min 6 characters)</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label><input type="password" value={passForm.next} onChange={e => setPassForm({ ...passForm, next: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                      <div><label className="mb-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-600"><span>Confirm New Password</span><Pencil className="h-3.5 w-3.5 shrink-0 text-sky-500" /></label><input type="password" value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500" /></div>
                      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-2.5 text-sm font-bold text-white"><Pencil className="h-4 w-4" /> Update Password</button>
                    </div>
                  </form>
                  <div className="rounded-2xl border bg-white p-5">
                    <p className="flex items-center gap-2 text-base font-extrabold"><User className="h-5 w-5 text-sky-600" /> My Account — Admin</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">Admin ID <b className="text-slate-800">divakar</b> is correct. Login also accepts <b className="text-slate-800">admin</b> or the registered Admin email.</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Name</span><span className="flex items-center gap-2"><b>M Divakar Reddy</b><LockKeyhole className="h-3.5 w-3.5 text-slate-400" /></span></div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Admin ID</span><span className="flex items-center gap-2"><b>divakar</b><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">Correct</span><LockKeyhole className="h-3.5 w-3.5 text-slate-400" /></span></div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="shrink-0 text-slate-500">Registered Email</span><span className="flex min-w-0 items-center gap-2"><b className="truncate">{ADMIN_REGISTERED_EMAIL}</b><LockKeyhole className="h-3.5 w-3.5 shrink-0 text-slate-400" /></span></div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Password</span><span className="flex items-center gap-2"><b>••••••••</b>{renderPencilEditButton('Admin Password', () => document.getElementById('admin-current-password')?.focus())}</span></div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Role</span><span className="flex items-center gap-2"><b>App Founder &amp; Admin</b><LockKeyhole className="h-3.5 w-3.5 text-slate-400" /></span></div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Status</span><b className="text-emerald-600">Logged in • Unlimited access</b></div>
                      <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-950"><b>All user accounts:</b> open <b>Users List → View Account</b> to review any Job Seeker/Recruiter account, profile, plan and purchases. User passwords are never shown, and no universal/master password is enabled.</div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-950"><b>Current paid plans:</b> {commerceSettings.plans.starter.name} {formatINR(commerceSettings.plans.starter.price)}/{commerceSettings.plans.starter.validityDays} days • {commerceSettings.plans.pro.name} {formatINR(commerceSettings.plans.pro.price)}/{commerceSettings.plans.pro.validityDays} days. Receiver: {commerceSettings.payment.receiverName}.</div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button onClick={() => setAdminTab('users')} className="flex items-center justify-center gap-1.5 rounded-full bg-slate-900 py-2.5 text-xs font-extrabold text-white"><Eye className="h-3.5 w-3.5" /> View All Accounts</button>
                      <button onClick={() => setAdminTab('plan-settings')} className="flex items-center justify-center gap-1.5 rounded-full bg-sky-600 py-2.5 text-xs font-extrabold text-white"><Crown className="h-3.5 w-3.5" /> Plan Settings</button>
                      <button onClick={() => setAdminTab('payment-settings')} className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 py-2.5 text-xs font-extrabold text-white"><Wallet className="h-3.5 w-3.5" /> Payment Settings</button>
                      <button onClick={handleClearAllVacancies} className="flex items-center justify-center gap-1.5 rounded-full border py-2.5 text-xs font-bold"><Trash2 className="h-3.5 w-3.5" /> Clear All Vacancies</button>
                      <button onClick={handleAdminLogout} className="flex items-center justify-center gap-1.5 rounded-full bg-red-600 py-2.5 text-xs font-bold text-white sm:col-span-2"><LogOut className="h-3.5 w-3.5" /> Logout</button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">Keep your Admin password private and change it regularly. It is also required to securely save live payment receiving settings.</p>
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
              <div className="brand-title-card inline-flex max-w-full items-center gap-2.5 rounded-2xl border px-3 py-2"><img src="/icon-192.png" alt="PharmaSales Jobs" className="h-10 w-10 shrink-0 rounded-[22%] bg-white ring-1 ring-sky-100 object-cover" /><div className="min-w-0"><p className="brand-title-text truncate text-[17px] font-extrabold leading-none">PharmaSales Jobs</p><p className="brand-title-subtitle mt-1 truncate text-[9px] leading-none tracking-wide">The MR to NSM Jobs Network</p></div></div>
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
                    <li><button onClick={() => navigate('pricing')} className="hover:text-white">Plans &amp; Benefits</button></li>
                    <li><button onClick={() => navigate('payment')} className="hover:text-white">Payment &amp; My Plan</button></li>
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
                    <p className="text-[10px] font-medium leading-tight text-slate-400">Posted by {getJobPostedByLabel(selected)}</p>
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
                <button onClick={() => closeSponsoredReveal(true)} className="mt-2 w-full rounded-full border border-sky-600 py-2 text-xs font-bold text-sky-700">Skip reveal ads — {commerceSettings.plans.starter.name} {formatINR(commerceSettings.plans.starter.price)}/{commerceSettings.plans.starter.validityDays} days (Apply ad still plays once)</button>
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

      {/* ADMIN VIEW ACCOUNT — safe account/profile/plan view; never a user-password bypass */}
      <AnimatePresence>
        {isAdmin && adminAccountDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setAdminAccountDetail(null)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[860px] overflow-y-auto rounded-3xl bg-slate-50 shadow-2xl">
              <div className="sticky top-0 z-10 bg-gradient-to-r from-sky-600 to-indigo-600 p-5 text-white">
                <div className="flex items-start gap-4">
                  <AccountAvatar name={adminAccountDetail.name} photo={adminAccountDetail.role === 'seeker' ? adminAccountDetail.profile?.profilePhoto : undefined} imgClassName="h-16 w-16 border-2 border-white shadow" fallbackClassName="flex h-16 w-16 bg-white text-xl text-sky-700 shadow" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold tracking-widest text-sky-100">ADMIN • VIEW ACCOUNT</p>
                    <h3 className="mt-1 truncate text-2xl font-extrabold leading-tight">{adminAccountDetail.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-sky-50">{adminAccountDetail.role === 'seeker' ? 'Job Seeker Account' : 'Recruiter Account'} • +91 {adminAccountDetail.mobile}</p>
                    <p className="truncate text-xs text-sky-100">{adminAccountDetail.email}</p>
                  </div>
                  <button type="button" onClick={() => setAdminAccountDetail(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30" aria-label="Close account details"><X className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-950">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                  <p><b>Safe Admin view:</b> you can review this account after your normal Admin login. The user’s password is protected and is never shown. This view does not log you in as the user and does not use a universal/master password.</p>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-base font-extrabold"><User className="h-5 w-5 text-sky-600" /> Account Details</h4>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ['Full Name', adminAccountDetail.name],
                        ['Account Type', adminAccountDetail.role === 'seeker' ? 'Job Seeker' : 'Recruiter'],
                        ['Mobile Number', `+91 ${adminAccountDetail.mobile}`],
                        ['Email ID', adminAccountDetail.email],
                        ['Joined', formatAdminDate(adminAccountDetail.createdAt)],
                        ['Password', (adminAccountDetail.hasPassword || adminAccountDetail.passwordHash) ? 'Password set • Protected' : 'No password set'],
                        ...(adminAccountDetail.role === 'seeker' ? [['Job Profile', isSeekerProfileComplete(adminAccountDetail.profile) ? 'Complete' : `${seekerProfileProgress(adminAccountDetail.profile)}% complete`]] as [string, string][] : []),
                        ...(adminAccountDeletionRequest ? [['Deletion Request', `${adminAccountDeletionRequest.status === 'pending' ? 'Pending' : 'Rejected'} • ${adminAccountDeletionRequest.reasonCategory}`]] as [string, string][] : []),
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-slate-50 px-3.5 py-3">
                          <p className="text-[10px] font-extrabold tracking-widest text-slate-400">{label.toUpperCase()}</p>
                          <p className="mt-1 break-words text-sm font-extrabold leading-snug text-slate-900">{value || '—'}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={`tel:+91${adminAccountDetail.mobile}`} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-extrabold text-white"><Phone className="h-3.5 w-3.5" /> Call</a>
                      <a href={`https://wa.me/91${adminAccountDetail.mobile}?text=${encodeURIComponent(`Hi ${adminAccountDetail.name}, I am M Divakar Reddy from PharmaSales Jobs regarding your account.`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-extrabold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                      <a href={`mailto:${adminAccountDetail.email}?subject=${encodeURIComponent('PharmaSales Jobs account support')}`} className="flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-xs font-extrabold"><Mail className="h-3.5 w-3.5" /> Email</a>
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-base font-extrabold"><Crown className="h-5 w-5 text-violet-600" /> Current Plan</h4>
                    {adminAccountDetail.role === 'recruiter' ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-extrabold">No Recruiter plan needed</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">Recruiters register free, post vacancies for Admin approval and browse anonymous candidate profiles.</p>
                      </div>
                    ) : adminAccountActivePurchase ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-base font-extrabold text-emerald-950">{adminAccountActivePurchase.planName} Active</p>
                          <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white">ACTIVE</span>
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-emerald-900">
                          <p><b>Amount:</b> {formatINR(adminAccountActivePurchase.amount)} • {adminAccountActivePurchase.method}</p>
                          <p><b>Purchased:</b> {formatAdminDate(adminAccountActivePurchase.purchasedAt)}</p>
                          <p><b>Valid till:</b> {formatAdminDate(adminAccountActivePurchase.expiresAt)} • {getPlanDaysLeft(adminAccountActivePurchase.expiresAt, planClock)} day(s) left</p>
                          <p className="break-all"><b>Transaction:</b> {adminAccountActivePurchase.transactionId}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-extrabold">Free Active</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{adminAccountPurchases[0] ? `Last paid plan ${adminAccountPurchases[0].planName} expired on ${formatAdminDate(adminAccountPurchases[0].expiresAt)}.` : 'No Starter/Pro purchase recorded for this Job Seeker.'}</p>
                      </div>
                    )}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-slate-50 px-2 py-3"><p className="text-lg font-extrabold">{adminAccountPurchases.length}</p><p className="text-[10px] font-bold text-slate-500">Purchases</p></div>
                      <div className="rounded-2xl bg-slate-50 px-2 py-3"><p className="text-lg font-extrabold">{adminAccountSupportTickets.length}</p><p className="text-[10px] font-bold text-slate-500">Tickets</p></div>
                      <div className="rounded-2xl bg-slate-50 px-2 py-3"><p className="text-lg font-extrabold">{adminAccountLiveJobs.length + adminAccountPendingJobs.length}</p><p className="text-[10px] font-bold text-slate-500">Vacancies</p></div>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <button type="button" onClick={() => { setAdminAccountDetail(null); setAdminTab('purchases') }} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-2.5 text-xs font-extrabold text-white"><Crown className="h-4 w-4" /> Open Purchase List</button>
                      <button type="button" onClick={() => { setAdminAccountDetail(null); setAdminTab('support') }} className="flex w-full items-center justify-center gap-2 rounded-full border bg-white py-2.5 text-xs font-extrabold"><MessageCircle className="h-4 w-4 text-sky-600" /> Open Support Tickets</button>
                      {adminAccountPendingJobs.length > 0 && <button type="button" onClick={() => { setAdminAccountDetail(null); setAdminTab('approvals') }} className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-2.5 text-xs font-extrabold text-white"><Clock3 className="h-4 w-4" /> Review Pending Vacancies ({adminAccountPendingJobs.length})</button>}
                    </div>
                  </div>
                </div>

                {adminAccountDetail.role === 'seeker' && (
                  <div className="mt-4 rounded-3xl border bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="flex items-center gap-2 text-base font-extrabold"><Briefcase className="h-5 w-5 text-sky-600" /> Job Seeker Profile</h4>
                      <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isSeekerProfileComplete(adminAccountDetail.profile) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{isSeekerProfileComplete(adminAccountDetail.profile) ? 'PROFILE COMPLETE' : `PROFILE ${seekerProfileProgress(adminAccountDetail.profile)}%`}</span>
                    </div>
                    {adminAccountDetail.profile ? (
                      <>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {([
                            ['Fresher / Experienced', adminAccountDetail.profile.experienceType === 'fresher' ? 'Fresher' : 'Experienced'],
                            ['Qualification', adminAccountDetail.profile.qualification],
                            ['Role Looking For', adminAccountDetail.profile.desiredRole ? getRoleLabel(adminAccountDetail.profile.desiredRole) : ''],
                            ...(adminAccountDetail.profile.experienceType === 'fresher'
                              ? [['Passing Year', adminAccountDetail.profile.passingYear]] as [string, string][]
                              : [
                                  ['Total Experience', adminAccountDetail.profile.totalExperience],
                                  ['Current Company', adminAccountDetail.profile.currentCompany],
                                  ['Current Role', adminAccountDetail.profile.currentRole ? getRoleLabel(adminAccountDetail.profile.currentRole) : ''],
                                  ['Current Package', adminAccountDetail.profile.currentPackage],
                                ] as [string, string][]),
                            ['Expected Package', adminAccountDetail.profile.expectedPackage],
                            ['Current State', adminAccountDetail.profile.state],
                            ['Current City', adminAccountDetail.profile.city],
                            ['Current HQ', adminAccountDetail.profile.currentHq],
                            ['Preferred HQ', adminAccountDetail.profile.preferredHq],
                            ['Notice Period / Joining', adminAccountDetail.profile.noticePeriod],
                            ['Two-Wheeler', adminAccountDetail.profile.twoWheeler],
                            ['Skills', adminAccountDetail.profile.skills],
                          ] as [string, string][]).map(([label, value]) => (
                            <div key={label} className="rounded-2xl bg-slate-50 px-3.5 py-3">
                              <p className="text-[10px] font-extrabold tracking-widest text-slate-400">{label.toUpperCase()}</p>
                              <p className="mt-1 break-words text-sm font-bold leading-snug text-slate-900">{value?.trim() ? value : 'Not filled'}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-sky-50 px-3.5 py-3 text-xs leading-relaxed text-sky-950"><b>Profile Photo:</b> {adminAccountDetail.profile.profilePhoto ? 'Added' : 'Not added'}</div>
                          <div className="rounded-2xl bg-sky-50 px-3.5 py-3 text-xs leading-relaxed text-sky-950"><b>Resume:</b> {adminAccountDetail.profile.resumeName ? `${adminAccountDetail.profile.resumeName}${adminAccountDetail.profile.resumeSize ? ` • ${formatFileSize(adminAccountDetail.profile.resumeSize)}` : ''}` : 'Not uploaded'}<span className="block text-sky-700">The resume file itself remains private on the Job Seeker’s device.</span></div>
                        </div>
                      </>
                    ) : (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">This Job Seeker has not filled the job profile yet.</p>
                    )}
                  </div>
                )}

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-base font-extrabold"><IndianRupee className="h-5 w-5 text-emerald-600" /> Recent Purchases</h4>
                    <div className="mt-3 space-y-2">
                      {adminAccountPurchases.slice(0, 5).map(purchase => (
                        <div key={purchase.id} className="flex items-start gap-3 rounded-2xl border px-3.5 py-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${purchase.plan === 'pro' ? 'bg-violet-600' : 'bg-sky-600'}`}><Crown className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold">{purchase.planName} • {formatINR(purchase.amount)}</p>
                            <p className="break-all font-mono text-[11px] text-slate-500">{purchase.transactionId}</p>
                            <p className="text-[11px] text-slate-400">{purchase.method} • {formatAdminDate(purchase.purchasedAt)} → {formatAdminDate(purchase.expiresAt)}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${purchase.status !== 'paid' ? 'bg-red-50 text-red-600' : isPurchaseActive(purchase) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{purchase.status !== 'paid' ? purchase.status.toUpperCase() : isPurchaseActive(purchase) ? 'ACTIVE' : 'EXPIRED'}</span>
                        </div>
                      ))}
                      {adminAccountPurchases.length === 0 && <p className="rounded-2xl bg-slate-50 p-5 text-center text-xs font-semibold text-slate-500">No purchases for this account.</p>}
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-white p-5 shadow-sm">
                    <h4 className="flex items-center gap-2 text-base font-extrabold"><Briefcase className="h-5 w-5 text-sky-600" /> Vacancies Submitted</h4>
                    <div className="mt-3 space-y-2">
                      {[...adminAccountPendingJobs.map(job => ({ job, status: 'PENDING APPROVAL' })), ...adminAccountLiveJobs.map(job => ({ job, status: 'LIVE' }))].slice(0, 6).map(({ job, status }) => (
                        <div key={`${status}-${job.id}`} className="flex items-start gap-3 rounded-2xl border px-3.5 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white" style={{ background: job.color }}>{job.company.slice(0, 2).toUpperCase()}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold">{job.company} • {job.title}</p>
                            <p className="truncate text-[11px] text-slate-500">{job.hq} • {job.type} • {job.ctc}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${status === 'LIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{status}</span>
                        </div>
                      ))}
                      {adminAccountLiveJobs.length + adminAccountPendingJobs.length === 0 && <p className="rounded-2xl bg-slate-50 p-5 text-center text-xs font-semibold text-slate-500">No vacancies submitted by this account.</p>}
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600"><b>Support:</b> {adminAccountSupportTickets.filter(ticket => ticket.status === 'open' || ticket.status === 'in-progress').length} open/in-progress ticket(s), {adminAccountSupportTickets.length} total.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRICING MODAL */}
      <AnimatePresence>
        {showPricing && !shouldHideJobSeekerExperience && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPricing(false)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[1120px] overflow-auto rounded-[28px] bg-[#f0f7ff] shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/95 p-4 backdrop-blur">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold tracking-[0.13em] text-sky-700">PLANS & BENEFITS</p>
                  <p className="mt-0.5 truncate text-lg font-extrabold">Compare each plan card before you pay</p>
                  <p className="text-xs leading-relaxed text-slate-600">Price • Validity • Contacts/day • Ads — everything is written on the card. Exact payment receiver and expiry appear again at checkout.</p>
                </div>
                <button type="button" onClick={() => { setShowPricing(false); navigate('payment') }} className="hidden shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white sm:flex"><CreditCard className="h-4 w-4" /> Payment Page</button>
                <button onClick={() => setShowPricing(false)} className="shrink-0 rounded-full border bg-white p-2" aria-label="Close plans"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-4 sm:p-6">
                {renderCurrentPlanStatusCard()}
                <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
                  {planCards.map(planCard => renderPlanCard(planCard))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <p className="rounded-3xl border bg-white p-4 text-xs leading-relaxed text-slate-700"><b className="text-slate-900">Free:</b> 3 full contacts first, then 7 extra jobs with separate detail ads.</p>
                  <p className="rounded-3xl border bg-white p-4 text-xs leading-relaxed text-slate-700"><b className="text-slate-900">Paid:</b> Direct contacts and no browsing/reveal ads until the shown expiry.</p>
                  <p className="rounded-3xl border bg-white p-4 text-xs leading-relaxed text-slate-700"><b className="text-slate-900">Apply Now:</b> One sponsored ad still plays before application submission on every plan.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAN CHECKOUT — Admin-set payment source; activation is automatic after confirmation */}
      <AnimatePresence>
        {checkoutPlan && currentUser?.role === 'seeker' && hasAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-4" onClick={closePlanCheckout}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={e => e.stopPropagation()} className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white p-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${checkoutPlan === 'starter' ? 'bg-sky-600' : 'bg-violet-600'}`}>{checkoutPlan === 'starter' ? <Zap className="h-5 w-5" /> : <Crown className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold">Buy {commerceSettings.plans[checkoutPlan].name} Plan</p>
                  <p className="text-[11px] font-semibold text-slate-500">Payment source set by Admin • Plan activates automatically after confirmation</p>
                </div>
                <button type="button" onClick={closePlanCheckout} disabled={checkoutProcessing} className="rounded-full border p-2 disabled:opacity-50" aria-label="Close checkout"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-5">
                <div className={`rounded-3xl border p-4 ${checkoutPlan === 'starter' ? 'border-sky-200 bg-sky-50' : 'border-violet-200 bg-violet-50'}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-[180px] flex-1">
                      <p className="text-[10px] font-extrabold tracking-widest text-slate-500">PLAN AMOUNT</p>
                      <p className="mt-1 text-3xl font-extrabold">{formatINR(commerceSettings.plans[checkoutPlan].price)} <span className="text-sm font-semibold text-slate-500">/ {commerceSettings.plans[checkoutPlan].validityDays} days</span></p>
                      <p className="mt-1 text-xs font-bold text-slate-600">{commerceSettings.plans[checkoutPlan].unlimited ? 'Unlimited' : `${getPaidPlanLimit(commerceSettings.plans[checkoutPlan])}/day`} direct contact reveals</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-emerald-700 shadow-sm">AUTO-ACTIVATES</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <p className="rounded-xl bg-white px-3 py-2"><span className="block text-[10px] font-extrabold tracking-widest text-slate-400">JOB SEEKER</span><b>{currentUser.name}</b><span className="block truncate text-slate-500">+91 {currentUser.mobile}</span></p>
                    <p className="rounded-xl bg-white px-3 py-2"><span className="block text-[10px] font-extrabold tracking-widest text-slate-400">NEW EXPIRY AFTER PAYMENT</span><b>{formatAdminDate(getPlanCheckoutExpiry(checkoutPlan, commerceSettings.plans[checkoutPlan].validityDays))}</b><span className="block text-slate-500">{activePlanPurchase?.plan === checkoutPlan ? 'Renewal extends your current validity.' : 'Free starts automatically after this time.'}</span></p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { step: '1', label: 'Check amount' },
                    { step: '2', label: 'Make payment' },
                    { step: '3', label: 'Enter UTR' },
                    { step: '4', label: 'Auto-activate' },
                  ].map(item => (
                    <div key={item.step} className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-700 text-[11px] font-extrabold text-white">{item.step}</span>
                      <span className="text-[11px] font-extrabold leading-tight text-sky-950">{item.label}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs font-extrabold tracking-wide text-slate-500">STEP 2 — SELECT PAYMENT METHOD</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {getAvailableCheckoutMethods(commerceSettings).map(method => {
                    const methodHint = method.id === 'upi'
                      ? 'UPI app or QR scan'
                      : method.id === 'payment-link'
                        ? 'Open the Admin payment link'
                        : method.id === 'bank'
                          ? 'NEFT / IMPS bank transfer'
                          : 'Test only — no real money'
                    const selectedMethod = checkoutMethod === method.id
                    return (
                      <button key={method.id} type="button" disabled={checkoutProcessing} onClick={() => { setCheckoutMethod(method.id); setCheckoutError('') }} className={`flex items-center gap-3 rounded-3xl border p-3 text-left transition disabled:opacity-50 ${selectedMethod ? 'border-slate-900 bg-slate-900 text-white shadow' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'}`}>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${selectedMethod ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700'}`}>
                          {method.id === 'upi' ? <QrCode className="h-5 w-5" /> : method.id === 'bank' ? <Landmark className="h-5 w-5" /> : method.id === 'demo' ? <Info className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold leading-tight">{method.label}</span>
                          <span className={`mt-0.5 block text-[11px] font-semibold leading-tight ${selectedMethod ? 'text-slate-200' : 'text-slate-500'}`}>{methodHint}</span>
                        </span>
                        {selectedMethod && <Check className="h-5 w-5 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-950"><Wallet className="h-4 w-4 text-emerald-700" /> Pay To — Admin Receiving Source</p>
                  <p className="mt-2 text-sm"><span className="text-slate-500">Receiver:</span> <b>{commerceSettings.payment.receiverName}</b></p>
                  <p className="text-sm"><span className="text-slate-500">Exact amount:</span> <b>{formatINR(commerceSettings.plans[checkoutPlan].price)}</b></p>
                  <div className="mt-3 grid gap-2 text-[11px] font-semibold sm:grid-cols-3">
                    <p className="flex gap-1.5 rounded-2xl bg-white px-3 py-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Pay only to this receiver</p>
                    <p className="flex gap-1.5 rounded-2xl bg-white px-3 py-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Pay the exact amount shown</p>
                    <p className="flex gap-1.5 rounded-2xl bg-white px-3 py-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> Plan links to +91 {currentUser.mobile}</p>
                  </div>

                  {checkoutMethod === 'upi' && (
                    <div className="mt-3">
                      <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-extrabold tracking-widest text-slate-400">UPI ID</p>
                          <p className="truncate font-mono text-sm font-extrabold">{commerceSettings.payment.upiId}</p>
                        </div>
                        <button type="button" onClick={() => void (async () => { try { await navigator.clipboard.writeText(commerceSettings.payment.upiId); setToast('Admin UPI ID copied.') } catch { setCheckoutError('Unable to copy automatically. Please copy the UPI ID shown above.') } })()} className="flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold"><Copy className="h-3.5 w-3.5" /> Copy UPI ID</button>
                      </div>
                      {commerceSettings.payment.qrImageUrl && <img src={commerceSettings.payment.qrImageUrl} alt="Admin UPI payment QR" className="mx-auto mt-3 max-h-64 w-auto rounded-2xl border bg-white object-contain p-2" />}
                      <a href={`upi://pay?pa=${encodeURIComponent(commerceSettings.payment.upiId)}&pn=${encodeURIComponent(commerceSettings.payment.receiverName)}&am=${commerceSettings.plans[checkoutPlan].price}&cu=INR&tn=${encodeURIComponent(`PharmaSales Jobs ${commerceSettings.plans[checkoutPlan].name} plan for ${currentUser.mobile}`)}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-extrabold text-white shadow"><Smartphone className="h-4 w-4" /> Pay via UPI App</a>
                      <p className="mt-2 text-center text-[11px] text-slate-500">If the UPI app does not open on desktop, scan the QR or pay manually using the UPI ID.</p>
                    </div>
                  )}

                  {checkoutMethod === 'payment-link' && (
                    <div className="mt-3">
                      <a href={commerceSettings.payment.paymentLink} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-extrabold text-white shadow"><CreditCard className="h-4 w-4" /> Open Admin Payment Link</a>
                      <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">{commerceSettings.payment.paymentLink}</p>
                    </div>
                  )}

                  {checkoutMethod === 'bank' && (
                    <div className="mt-3 rounded-2xl bg-white p-3">
                      <p className="flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-slate-400"><Landmark className="h-4 w-4" /> BANK RECEIVING DETAILS</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{commerceSettings.payment.bankDetails}</p>
                    </div>
                  )}

                  {checkoutMethod === 'demo' && (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <p><b>Demo checkout:</b> no real money moves in this preview. Use it only to test automatic plan activation and expiry. Connect Play Billing or a verified payment gateway for production purchases.</p>
                    </div>
                  )}

                  {commerceSettings.payment.instructions.trim() && checkoutMethod !== 'demo' && <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-white px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">{commerceSettings.payment.instructions}</p>}
                </div>

                {checkoutMethod !== 'demo' && (
                  <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/60 p-4">
                    <p className="text-[10px] font-extrabold tracking-[0.12em] text-sky-700">STEP 3 — AFTER SUCCESSFUL PAYMENT</p>
                    <label className="mb-1 mt-1 block text-xs font-bold text-slate-700">Enter Payment / UTR / Transaction Reference *</label>
                    <input value={checkoutReference} onChange={e => { setCheckoutReference(e.target.value); setCheckoutError('') }} disabled={checkoutProcessing} className="w-full rounded-xl border bg-white px-3 py-3 font-mono text-sm font-semibold outline-none focus:border-sky-500 disabled:bg-slate-50" placeholder="Enter reference shown after successful payment" autoComplete="off" />
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Use a new reference for every purchase/renewal. Admin can cross-check it in the Payment List.</p>
                  </div>
                )}

                {checkoutError && <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" /> {checkoutError}</p>}

                <p className="mt-5 text-center text-[10px] font-extrabold tracking-[0.12em] text-emerald-700">STEP 4 — CONFIRM • PLAN ACTIVATES AUTOMATICALLY</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={closePlanCheckout} disabled={checkoutProcessing} className="flex-1 rounded-full border py-3 text-sm font-extrabold disabled:opacity-50">Cancel</button>
                  <button type="button" onClick={() => void completePlanPurchase()} disabled={checkoutProcessing} className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-extrabold text-white shadow disabled:opacity-60">{checkoutProcessing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />} {checkoutProcessing ? 'Activating…' : checkoutMethod === 'demo' ? 'Complete Demo Payment — Activate Plan' : 'Payment Done — Activate Plan'}</button>
                </div>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">After activation, this purchase appears in Admin Purchase &amp; Payment Lists. Paid benefits stop automatically at expiry.</p>
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

      {/* HOW TO USE VIDEO — language first, then player; no long login-page scroll */}
      {renderHowToVideoModal()}

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
            <button onClick={() => navigate('pricing')} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='pricing' || page==='payment'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
              <Crown className={`h-5 w-5 ${page==='pricing' || page==='payment'?'text-white':'text-amber-500'}`} /><span className={`text-[11px] font-bold ${page==='pricing' || page==='payment'?'text-white':''}`}>Plans</span>
            </button>
          )}
          {currentUser && hasAuthenticated ? (
            <button onClick={openMyAccount} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 ${page==='account' || page==='profile'?'bg-slate-900 text-white':'hover:bg-slate-50'}`}>
              <User className={`h-5 w-5 ${page==='account' || page==='profile'?'text-white':'text-sky-600'}`} /><span className={`text-[11px] font-bold ${page==='account' || page==='profile'?'text-white':''}`}>Account</span>
            </button>
          ) : isAdmin ? (
            <button onClick={() => openAdmin('settings')} className="flex flex-col items-center gap-1 rounded-xl px-4 py-1 hover:bg-slate-50">
              <User className="h-5 w-5 text-sky-600" /><span className="text-[11px] font-bold">Account</span>
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

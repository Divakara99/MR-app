import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const GEMINI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const geminiRequestLog = new Map<string, number[]>();

const consumeGeminiRateLimit = (key: string, maxRequests: number): boolean => {
  const now = Date.now();
  const recentRequests = (geminiRequestLog.get(key) ?? []).filter(timestamp => now - timestamp < GEMINI_RATE_LIMIT_WINDOW_MS);
  if (recentRequests.length >= maxRequests) {
    geminiRequestLog.set(key, recentRequests);
    return false;
  }
  recentRequests.push(now);
  geminiRequestLog.set(key, recentRequests);
  if (geminiRequestLog.size > 1000) {
    for (const [storedKey, timestamps] of geminiRequestLog.entries()) {
      if (timestamps.every(timestamp => now - timestamp >= GEMINI_RATE_LIMIT_WINDOW_MS)) geminiRequestLog.delete(storedKey);
    }
  }
  return true;
};

const verifySupabaseAccessToken = async (accessToken: string): Promise<{ id: string } | null> => {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const supabasePublishableKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || ''
  ).trim();
  if (!accessToken || !supabaseUrl || !supabasePublishableKey) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: unknown };
    return typeof user.id === 'string' && user.id ? { id: user.id } : null;
  } catch {
    return null;
  }
};

const isAllowedCorsOrigin = (origin: string | undefined, host: string | undefined): boolean => {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (host && url.host === host) return true;
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return true;
    return url.hostname.endsWith('.e2b.app')
      || url.hostname === 'mrnew.netlify.app'
      || url.hostname.endsWith('--mrnew.netlify.app');
  } catch {
    return false;
  }
};

app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  if (req.path.startsWith('/api/')) res.header('Cache-Control', 'no-store');

  const origin = req.header('Origin');
  const originAllowed = isAllowedCorsOrigin(origin, req.header('Host'));
  if (origin && originAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(originAllowed ? 204 : 403);
  next();
});

// Gemini proxy. Without a server key it returns only built-in local help;
// a real key is used only for a verified Supabase Auth session and is never
// read from a VITE_* variable because those are browser-public by design.
app.post('/api/gemini', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 4000) {
    return res.status(400).json({ error: 'Invalid prompt', text: 'Please enter a question of up to 4,000 characters.' });
  }

  const requestedAudience = typeof body.audience === 'string' ? body.audience : 'seeker';
  const audience = ['admin', 'guest', 'recruiter', 'seeker'].includes(requestedAudience) ? requestedAudience : 'seeker';
  const isRecruiterAudience = audience === 'recruiter';
  const history = Array.isArray(body.history)
    ? body.history.slice(-6).flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const entry = item as Record<string, unknown>;
      const role = entry.role === 'model' ? 'model' : entry.role === 'user' ? 'user' : null;
      const text = typeof entry.text === 'string' ? entry.text.trim().slice(0, 2000) : '';
      return role && text ? [{ role, text }] : [];
    })
    : [];

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const ipRateLimitKey = `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  if (!consumeGeminiRateLimit(ipRateLimitKey, 40)) {
    return res.status(429).json({ error: 'Rate limit exceeded', text: 'Too many AI requests. Please wait a few minutes and try again.' });
  }

  if (apiKey) {
    const authorization = req.header('Authorization') || '';
    const accessToken = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
    const verifiedUser = await verifySupabaseAccessToken(accessToken);
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Login required', text: 'Please login to use the live AI Assistant.' });
    }
    if (!consumeGeminiRateLimit(`user:${verifiedUser.id}`, 20)) {
      return res.status(429).json({ error: 'Rate limit exceeded', text: 'Too many AI requests. Please wait a few minutes and try again.' });
    }
  }

  if (!apiKey) {
    // Mock response when no key
    const lower = (prompt || '').toLowerCase();
    let mock = '';
    if (isRecruiterAudience) {
      if (lower.includes('vacancy') || lower.includes('jd') || lower.includes('job description') || lower.includes('post')) {
        mock = `Here is a strong pharma field-force vacancy format:\n\n**Role:** Select the exact level — Trainee MR / Field MR / Senior MR / ASM / RSM / ZSM / NSM\n**HQ / Territory:** Mention city + exact HQ for MR roles; mention region, zone or pan-India scope for manager roles\n**Experience:** Match the role level (Fresher for Trainee MR; team-handling and target ownership for ASM and above)\n**Qualification:** B.Pharm / B.Sc / D.Pharm; MBA preferred for senior manager roles\n**CTC:** Salary range + TA/DA/car allowance + incentives\n**Work:** MR roles: doctor coverage, RCPA, chemist/stockist visits and reporting. Manager roles: team targets, coaching, primary/secondary sales, KOL and stockist strategy\n\nPost it free from **Post Vacancy**. It goes LIVE after Admin verification. No Recruiter plan is needed.`;
      } else if (lower.includes('interview') || lower.includes('question')) {
        mock = `**Pharma field-force interview questions (MR to NSM):**\n1. Explain your doctor-coverage, RCPA and territory plan.\n2. How do you handle a doctor who gives very little time?\n3. How do you track chemist prescriptions and stockist movement?\n4. Give one example of achieving or recovering a sales target.\n5. Demonstrate a 2-minute product detailing call.\n6. For ASM and above: How do you coach a low-performing MR/team and improve territory productivity in 90 days?\n\nScore communication, HQ/territory knowledge, science basics, field discipline, leadership (for manager roles) and joining readiness separately.`;
      } else if (lower.includes('shortlist') || lower.includes('candidate') || lower.includes('screen')) {
        mock = `**Candidate shortlist checklist:**\n• Desired role matches your vacancy\n• HQ/state is workable without relocation risk\n• Experience/company/division fit\n• Current vs expected package is realistic\n• Qualification and two-wheeler confirmed\n• Notice period / immediate joining checked\n\nOpen **Candidates List**, tap a row to view anonymous details, and request contact through Admin after shortlisting.`;
      } else if (lower.includes('plan') || lower.includes('subscription') || lower.includes('pricing') || lower.includes('price')) {
        mock = `Recruiters do **not** need a subscription plan on PharmaSales Jobs. Free, Starter and Pro are Job Seeker plans for job search, contact reveals and Apply Now. As a Recruiter, you can register free, post vacancies for Admin approval, and use the Candidates List.`;
      } else {
        mock = `Hi! I'm your PharmaSales Jobs recruiter assistant 🤝\n\nI can help with:\n• Writing a vacancy / JD for MR to NSM roles\n• Interview questions for pharma field-force candidates\n• Candidate shortlist checklists\n• Improving vacancy response\n\nTry: \"Write ASM vacancy JD for Hyderabad HQ\" or \"Candidate shortlist checklist\".`;
      }
      return res.json({ text: mock, mocked: true });
    }
    if (lower.includes('resume') || lower.includes('cv')) {
      mock = `Here's a tailored MR resume tip:\n\n**For Medical Representative roles:**\n• Highlight D.Pharm/B.Pharm/B.Sc qualification\n• Mention HQ knowledge, doctor coverage, chemist relations\n• Quantify achievements: "Achieved 112% of Q3 target in Hyderabad HQ"\n• Add driving license & willingness to relocate\n• Keep it 1 page, PDF format\n\nWould you like me to draft a cover letter for a specific company?`;
    } else if (lower.includes('interview')) {
      mock = `**Top MR Interview Questions (2025):**\n1. Tell us about detailiing aids & visual aid presentation\n2. How will you handle a doctor who gives no time?\n3. Explain your daily work plan & RCPA\n4. What is your stockist strategy?\n\n**Pro Tip:** Be ready with a 2-min product detailing practice. I can help you practice — tell me a product name!`;
    } else if (lower.includes('salary') || lower.includes('ctc')) {
      mock = `**Pharma Field-Force Salary Insights (India):**\n• Trainee/Fresher MR: ₹2.4 - 3.6 LPA + TA/DA\n• Field MR (2-5 yrs): ₹4 - 6.5 LPA + incentives\n• Senior MR: ₹5.5 - 7.5 LPA + incentives\n• ASM: ₹7 - 10 LPA + car allowance/incentives\n• RSM: ₹10 - 15 LPA + car/incentives\n• ZSM: ₹14 - 22 LPA + car/leadership incentives\n• NSM: ₹25 - 40 LPA + car/leadership incentives\nActual CTC depends on company, therapy area, HQ/territory and performance history.`;
    } else {
      mock = `Hi! I'm your PharmaSales Jobs AI Assistant 🤝\n\nI can help you with:\n• Finding best vacancies matching your HQ & experience\n• Resume & cover letter for Pharma jobs\n• Interview preparation & detailing practice\n• Salary & growth roadmap\n\nTry: "Suggest vacancies for B.Pharm fresher in Hyderabad" or "Prepare me for Mankind MR interview"`;
    }
    return res.json({ text: mock, mocked: true });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.0-flash';
    const contents: any[] = history.map(item => ({ role: item.role, parts: [{ text: item.text }] }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: isRecruiterAudience
          ? `You are PharmaSales Jobs AI for a logged-in Recruiter in India. The Recruiter gives jobs; they are not job searching. Help only with vacancy writing, hiring process, field-force interview questions across Trainee MR, Field MR, Senior MR, ASM, RSM, ZSM and NSM roles, candidate screening/shortlisting and support. Do not recommend job searching, Apply Now, saved jobs or Free/Starter/Pro subscriptions to the Recruiter. Clearly state that Recruiters do not need a plan if pricing is mentioned. Candidate name, mobile and email remain hidden; contact goes through Admin after candidate consent. Be concise and practical. Managed by M Divakar Reddy.`
          : `You are PharmaSales Jobs AI — expert assistant for pharma field-force professionals in India seeking Trainee MR, Field MR, Senior MR, ASM, RSM, ZSM and NSM roles. You help with job search, resume, interview prep, pharma knowledge, RCPA, detailing, territory planning and sales-leadership growth. Be concise, friendly, use Indian pharma context (Sun, Cipla, Dr Reddy's, Mankind, Alkem, Torrent, Zydus, Lupin, Abbott, Glenmark, etc). Managed by M Divakar Reddy.`,
      },
    });
    const text = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    res.json({ text });
  } catch (e: any) {
    console.error('Gemini error', e);
    res.status(500).json({ error: 'Gemini failed', text: 'AI is temporarily unavailable. Please try again.' });
  }
});

// Serve vite build if exists, otherwise dev proxy note
import fs from 'fs';
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'dev-proxy' }));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

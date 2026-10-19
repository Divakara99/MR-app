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

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS for preview
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Gemini proxy
app.post('/api/gemini', async (req, res) => {
  const { prompt, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    // Mock response when no key
    const lower = (prompt || '').toLowerCase();
    let mock = '';
    if (lower.includes('resume') || lower.includes('cv')) {
      mock = `Here's a tailored MR resume tip:\n\n**For Medical Representative roles:**\n• Highlight D.Pharm/B.Pharm/B.Sc qualification\n• Mention HQ knowledge, doctor coverage, chemist relations\n• Quantify achievements: "Achieved 112% of Q3 target in Hyderabad HQ"\n• Add driving license & willingness to relocate\n• Keep it 1 page, PDF format\n\nWould you like me to draft a cover letter for a specific company?`;
    } else if (lower.includes('interview')) {
      mock = `**Top MR Interview Questions (2025):**\n1. Tell us about detailiing aids & visual aid presentation\n2. How will you handle a doctor who gives no time?\n3. Explain your daily work plan & RCPA\n4. What is your stockist strategy?\n\n**Pro Tip:** Be ready with a 2-min product detailing demo. I can help you practice — tell me a product name!`;
    } else if (lower.includes('salary') || lower.includes('ctc')) {
      mock = `**MR Salary Insights (India 2025):**\n• Fresher MR: ₹2.4 - 3.6 LPA + TA/DA (~₹12k-18k)\n• 2-5 yrs exp: ₹4 - 6.5 LPA + incentives\n• ASM/Territory Manager: ₹6.5 - 9 LPA\nSun Pharma, Cipla, Mankind often pay above average with timely incentives.`;
    } else {
      mock = `Hi! I'm your MR Vacancies Hub AI Assistant 🤝\n\nI can help you with:\n• Finding best vacancies matching your HQ & experience\n• Resume & cover letter for Pharma jobs\n• Interview preparation & detailing practice\n• Salary & growth roadmap\n\nTry: "Suggest vacancies for B.Pharm fresher in Hyderabad" or "Prepare me for Mankind MR interview"`;
    }
    return res.json({ text: mock, mocked: true });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.0-flash';
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => contents.push({ role: h.role, parts: [{ text: h.text }] }));
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: `You are MR Vacancies Hub AI — expert assistant for Medical Representatives in India seeking pharma jobs. You help with job search, resume, interview prep, pharma knowledge, RCPA, detailing. Be concise, friendly, use Indian pharma context (Sun, Cipla, Dr Reddy's, Mankind, Alkem, Torrent, Zydus, Lupin, Abbott, Glenmark, etc). Managed by M Divakar Reddy.`,
      },
    });
    const text = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    res.json({ text });
  } catch (e: any) {
    console.error('Gemini error', e);
    res.status(500).json({ error: e.message || 'Gemini failed', text: 'AI is temporarily unavailable. Please try again.' });
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

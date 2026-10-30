import type { Config } from '@netlify/functions';
import { handleGemini } from '../../lib/gemini';

export default async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const result = await handleGemini(body);
  return Response.json(result.body, { status: result.status });
};

export const config: Config = {
  path: '/api/gemini',
  method: 'POST',
};

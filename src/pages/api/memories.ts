import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';

// GET - load memories
export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get('userId');
  if (!userId) return new Response('[]', { headers: { 'Content-Type': 'application/json' } });

  const db = await getDb();
  const doc = await db.collection('memories').findOne({ userId });
  return new Response(JSON.stringify(doc?.facts || []), { headers: { 'Content-Type': 'application/json' } });
};

// POST - save memories
export const POST: APIRoute = async ({ request }) => {
  const { userId, facts } = await request.json();
  if (!userId) return new Response('Missing userId', { status: 400 });

  const db = await getDb();
  await db.collection('memories').updateOne(
    { userId },
    { $set: { facts, updatedAt: Date.now() } },
    { upsert: true }
  );
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};

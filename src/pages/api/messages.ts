import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';

// GET - load messages
export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get('userId');
  if (!userId) return new Response('Missing userId', { status: 400 });

  const db = await getDb();
  const messages = await db.collection('chats').find({ userId }).sort({ time: 1 }).limit(500).toArray();
  return new Response(JSON.stringify(messages), { headers: { 'Content-Type': 'application/json' } });
};

// POST - save message
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { userId, role, text, time } = body;
  if (!userId || !role || !text) return new Response('Missing fields', { status: 400 });

  const db = await getDb();
  await db.collection('chats').insertOne({ userId, role, text, time: time || Date.now() });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};

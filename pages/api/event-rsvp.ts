import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "rsvps.json");

async function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function readRsvps(): Promise<any[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRsvps(rsvps: any[]) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(rsvps, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { name, email, plus_ones, event_slug } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const rsvp = {
        id: `rsvp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        plus_ones: plus_ones || 0,
        event_slug: event_slug || "unknown",
        created_at: new Date().toISOString(),
      };

      const rsvps = await readRsvps();
      rsvps.push(rsvp);
      await writeRsvps(rsvps);

      return res.status(200).json({ data: rsvp, error: null });
    } catch (err: any) {
      console.error("RSVP error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "GET") {
    // Admin can view RSVPs
    const rsvps = await readRsvps();
    return res.status(200).json(rsvps);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

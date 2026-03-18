/**
 * Sync local MongoDB collections from the already-working Vercel deployment.
 *
 * One-time recovery for local dev.
 *
 * Run:
 *   node scripts/syncFromVercel.js
 *
 * Uses:
 * - MONGODB_URI from your project .env.local
 * - VERCEL_BASE_URL (optional), default:
 *   https://admin-pannel-rootkit.vercel.app
 */

require('dotenv').config({ path: '.env.local' });
require('ts-node/register/transpile-only');

const mongoose = require('mongoose');

const Client = require('../models/Client').default;
const Team = require('../models/Team').default;
const Project = require('../models/Project').default;
const Revenue = require('../models/Revenue').default;
const Event = require('../models/Event').default;
const Settings = require('../models/Settings').default;

const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://admin-pannel-rootkit.vercel.app';

async function fetchJson(path) {
  const url = `${VERCEL_BASE_URL}${path}`;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        // Retry temporary server errors
        if (res.status >= 500 && attempt < 3) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw new Error(`Fetch failed: ${path} -> ${res.status} ${res.statusText}`);
      }
      return res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
    }
  }
  // If an endpoint is failing consistently, don't crash the whole sync.
  console.warn(`⚠️ Sync warning: endpoint failed (${path}). Using empty fallback.`);
  console.warn(lastErr && lastErr.message ? lastErr.message : lastErr);
  return [];
}

function normalizeEmail(email) {
  return (email || '').toLowerCase().trim();
}

function toDateOrUndefined(value) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in .env.local');

  await mongoose.connect(MONGODB_URI);

  // Fetch sequentially to avoid occasional Vercel 5xx under concurrent load.
  const remoteClients = await fetchJson('/api/clients');
  const remoteTeam = await fetchJson('/api/team');
  const remoteProjects = await fetchJson('/api/projects');
  const remoteRevenue = await fetchJson('/api/revenue');
  const remoteEvents = await fetchJson('/api/events');
  const remoteSettings = await fetchJson('/api/settings');

  const clients = Array.isArray(remoteClients) ? remoteClients : [];
  const team = Array.isArray(remoteTeam) ? remoteTeam : [];
  const projects = Array.isArray(remoteProjects) ? remoteProjects : [];
  const revenue = Array.isArray(remoteRevenue) ? remoteRevenue : [];
  const events = Array.isArray(remoteEvents) ? remoteEvents : [];

  // 1) Team (Employees)
  for (const member of team) {
    if (!member?.email) continue;
    const email = normalizeEmail(member.email);

    await Team.updateOne(
      { email },
      {
        $set: {
          name: member.name,
          email,
          contact: member.contact || '',
          employmentType: member.employmentType,
          role: member.role,
          subRole: member.subRole || '',
          skills: Array.isArray(member.skills) ? member.skills : [],
          hourlyRate: Number(member.hourlyRate || 0),
          hoursWorkedThisWeek: Number(member.hoursWorkedThisWeek || 0),
          avatar: member.avatar || '',
          assignedProjects: Array.isArray(member.assignedProjects) ? member.assignedProjects : [],
        },
      },
      { upsert: true }
    );
  }

  const localTeam = await Team.find({
    email: { $in: team.map((m) => normalizeEmail(m?.email)).filter(Boolean) },
  });
  const emailToTeamId = new Map(localTeam.map((t) => [normalizeEmail(t.email), t._id]));

  // 2) Clients
  for (const c of clients) {
    if (!c?.email) continue;
    const email = normalizeEmail(c.email);

    await Client.updateOne(
      { email },
      {
        $set: {
          name: c.name,
          email,
          phone: c.phone || '',
          company: c.company || '',
          address: c.address || '',
          status: c.status || 'Lead',
          notes: c.notes || '',
        },
      },
      { upsert: true }
    );
  }

  // 3) Projects
  for (const p of projects) {
    const startDate = toDateOrUndefined(p?.startDate);
    const deadline = toDateOrUndefined(p?.deadline);
    if (!startDate || !deadline) continue;

    const assigned = Array.isArray(p?.assignedTeam) ? p.assignedTeam : [];
    const assignedTeamIds = assigned
      .map((t) => emailToTeamId.get(normalizeEmail(t?.email)))
      .filter(Boolean);

    const query = {
      name: p?.name,
      client: p?.client,
      startDate,
      deadline,
      budget: Number(p?.budget || 0),
    };

    await Project.updateOne(
      query,
      {
        $set: {
          name: p?.name,
          description: p?.description || '',
          client: p?.client,
          assignedTeam: assignedTeamIds,
          startDate,
          deadline,
          budget: Number(p?.budget || 0),
          status: p?.status || 'Pending',
          tasks: Array.isArray(p?.tasks) ? p.tasks : [],
        },
      },
      { upsert: true }
    );
  }

  // 4) Revenue
  for (const r of revenue) {
    const date = toDateOrUndefined(r?.date);
    if (!date) continue;

    const query = {
      type: r?.type,
      description: r?.description,
      date,
      amount: Number(r?.amount || 0),
    };

    await Revenue.updateOne(
      query,
      {
        $set: {
          type: r?.type,
          amount: Number(r?.amount || 0),
          description: r?.description || '',
          date,
          status: r?.status || 'pending',
          invoiceNumber: r?.invoiceNumber || '',
        },
      },
      { upsert: true }
    );
  }

  // 5) Events
  for (const e of events) {
    const start = toDateOrUndefined(e?.start);
    const end = toDateOrUndefined(e?.end);
    if (!start || !end) continue;

    await Event.updateOne(
      { title: e?.title, start, end },
      {
        $set: {
          title: e?.title,
          description: e?.description || '',
          start,
          end,
          type: e?.type || 'event',
        },
      },
      { upsert: true }
    );
  }

  // 6) Settings (singleton)
  if (remoteSettings) {
    const has = (await Settings.countDocuments({})) > 0;
    if (!has) {
      await Settings.create({
        agencyName: remoteSettings.agencyName || 'Rootkit Development',
        agencyLogo: remoteSettings.agencyLogo || '',
        emailSignature: remoteSettings.emailSignature || 'Best regards,\nRootkit Development Team',
        taxRate: Number(remoteSettings.taxRate || 0),
        invoiceSettings: remoteSettings.invoiceSettings || { prefix: 'INV', nextNumber: 1, paymentTerms: 30 },
        teamStructure: remoteSettings.teamStructure || { roles: [], departments: [] },
      });
    } else {
      await Settings.updateOne(
        {},
        {
          $set: {
            agencyName: remoteSettings.agencyName || 'Rootkit Development',
            agencyLogo: remoteSettings.agencyLogo || '',
            emailSignature: remoteSettings.emailSignature || 'Best regards,\nRootkit Development Team',
            taxRate: Number(remoteSettings.taxRate || 0),
            invoiceSettings: remoteSettings.invoiceSettings,
            teamStructure: remoteSettings.teamStructure,
          },
        }
      );
    }
  }

  const [cCount, tCount, pCount, rCount, eCount] = await Promise.all([
    Client.countDocuments(),
    Team.countDocuments(),
    Project.countDocuments(),
    Revenue.countDocuments(),
    Event.countDocuments(),
  ]);

  console.log('✅ Sync complete from Vercel');
  console.log({ clients: cCount, team: tCount, projects: pCount, revenue: rCount, events: eCount });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Sync failed:', err && err.message ? err.message : err);
  process.exit(1);
});


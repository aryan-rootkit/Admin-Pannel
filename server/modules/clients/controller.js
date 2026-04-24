const { Client } = require("./model");

function normalizeContactBody(body) {
  const { contact, phone } = body || {};
  const c = (contact || phone || "").trim();
  return {
    contact: c || undefined,
    phone: (phone && String(phone).trim()) || c || undefined,
  };
}

const getClients = async (_req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 }).lean();
    for (const doc of clients) {
      if (!doc.contact && doc.phone) doc.contact = doc.phone;
    }
    console.log("[GET /api/clients] count:", clients.length);
    return res.json(clients);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).json({ message: "Client not found" });
    if (!client.contact && client.phone) client.contact = client.phone;
    console.log("[GET /api/clients/:id] found:", client._id.toString());
    return res.json(client);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createClient = async (req, res) => {
  try {
    console.log("[POST /api/clients] body:", req.body);
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const name = String(body.name ?? "").trim();
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    const { email, notes, address, company, status } = body;
    const { contact, phone } = normalizeContactBody(body);

    const client = await Client.create({
      name,
      email,
      contact,
      phone,
      notes,
      address,
      company,
      status,
    });
    console.log("[POST /api/clients] created:", client._id.toString());
    return res.status(201).json(client.toObject());
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors || {})
          .map((e) => e.message)
          .join("; ") || "Validation failed",
      });
    }
    console.error("[POST /api/clients] error:", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updateClient = async (req, res) => {
  try {
    const { name, email, notes, address, company, status } = req.body || {};
    const { contact, phone } = normalizeContactBody(req.body);

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = email;
    if (notes !== undefined) patch.notes = notes;
    if (address !== undefined) patch.address = address;
    if (company !== undefined) patch.company = company;
    if (status !== undefined) patch.status = status;
    if (contact !== undefined) patch.contact = contact;
    if (phone !== undefined) patch.phone = phone;
    if (patch.contact && !patch.phone) patch.phone = patch.contact;
    if (patch.phone && !patch.contact) patch.contact = patch.phone;

    const client = await Client.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!client) return res.status(404).json({ message: "Client not found" });
    if (!client.contact && client.phone) client.contact = client.phone;
    return res.json(client);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id).lean();
    if (!client) return res.status(404).json({ message: "Client not found" });
    return res.json({ ok: true, id: req.params.id });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };

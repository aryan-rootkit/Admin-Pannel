const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    contact: { type: String, trim: true },
    /** @deprecated use `contact`; kept so existing documents and writes keep data */
    phone: { type: String, trim: true },
    notes: { type: String },
    address: { type: String, trim: true },
    company: { type: String, trim: true },
    status: { type: String, trim: true },
  },
  { timestamps: true, collection: "clients" }
);

// Mongoose 9: use async middleware — never call legacy `next()` (causes "next is not a function").
ClientSchema.pre("save", async function syncContact() {
  if (!this.contact && this.phone) this.contact = this.phone;
  if (!this.phone && this.contact) this.phone = this.contact;
});

const Client = mongoose.models.Client || mongoose.model("Client", ClientSchema);

module.exports = { Client };

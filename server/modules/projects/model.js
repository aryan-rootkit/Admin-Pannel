const mongoose = require("mongoose");

const { Types } = mongoose.Schema;

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    clientId: { type: Types.ObjectId, ref: "Client", required: true, index: true },
    /** Full contract / deal value (used for pending revenue) */
    totalValue: { type: Number, min: 0 },
    budget: { type: Number, min: 0 },
    assignedTeam: [{ type: Types.ObjectId, ref: "People", index: true }],
    /** Per-member % of contract (totalValue) allocated as labour share; remainder = consultancy. */
    teamMemberShares: [
      {
        peopleId: { type: Types.ObjectId, ref: "People", required: true },
        sharePercent: { type: Number, min: 0, max: 100, default: 0 },
      },
    ],
    /** @deprecated prefer `assignedTeam` */
    peopleIds: [{ type: Types.ObjectId, ref: "People", index: true }],
    /** @deprecated prefer `assignedTeam` */
    teamIds: [{ type: Types.ObjectId, ref: "People", index: true }],
    status: { type: String, trim: true, default: "Active" },
    /** Set when status is Completed; used to order finished projects. */
    completedAt: { type: Date },
  },
  { timestamps: true, collection: "projects" }
);

const Project =
  mongoose.models.Project || mongoose.model("Project", ProjectSchema);

module.exports = { Project };

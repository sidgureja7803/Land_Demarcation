import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  employeeId: varchar("employee_id").unique(),
  role: varchar("role").notNull().default("officer"), // citizen, officer, supervisor, administrator
  circleId: integer("circle_id").references(() => circles.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const circles = pgTable("circles", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  code: varchar("code").unique().notNull(),
  districtId: integer("district_id").references(() => districts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  code: varchar("code").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const villages = pgTable("villages", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  code: varchar("code").unique().notNull(),
  circleId: integer("circle_id").references(() => circles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plots = pgTable("plots", {
  id: serial("id").primaryKey(),
  plotId: varchar("plot_id").unique().notNull(),
  villageId: integer("village_id").references(() => villages.id),
  plotType: varchar("plot_type").notNull(), // agricultural, residential, commercial, industrial
  area: decimal("area", { precision: 10, scale: 4 }),
  areaUnit: varchar("area_unit").default("acres"),
  ownerName: varchar("owner_name"),
  ownerContact: varchar("owner_contact"),
  ownerId: varchar("owner_id").references(() => users.id),
  assignedOfficerId: varchar("assigned_officer_id").references(() => users.id),
  currentStatus: varchar("current_status").default("pending"), // pending, in_progress, completed, disputed, on_hold
  priority: varchar("priority").default("medium"), // low, medium, high, critical
  latitude: decimal("latitude", { precision: 10, scale: 6 }), // Geographic coordinates for map integration
  longitude: decimal("longitude", { precision: 10, scale: 6 }), // Geographic coordinates for map integration
  villageName: varchar("village_name"), // Store village name directly for easier access
  circleName: varchar("circle_name"), // Store circle name directly for easier access
  isDuplicate: boolean("is_duplicate").default(false),
  duplicateOfId: integer("duplicate_of_id").references(() => plots.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const demarcationLogs = pgTable("demarcation_logs", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id").references(() => plots.id),
  officerId: varchar("officer_id").references(() => users.id),
  activityType: varchar("activity_type").notNull(), // initial_survey, boundary_marking, dispute_resolution, final_verification, documentation
  description: text("description").notNull(),
  activityDate: timestamp("activity_date").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  stakeholdersPresent: text("stakeholders_present"),
  governmentOfficials: text("government_officials"),
  currentStatus: varchar("current_status").notNull(), // completed, in_progress, pending, disputed, on_hold
  priority: varchar("priority").default("medium"),
  issuesEncountered: text("issues_encountered"),
  nextSteps: text("next_steps"),
  targetCompletionDate: timestamp("target_completion_date"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plotAssignments = pgTable("plot_assignments", {
  id: serial("id").primaryKey(),
  plotId: integer("plot_id").references(() => plots.id),
  officerId: varchar("officer_id").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
});

// Document uploads for plots and demarcation processes
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: varchar("filename").notNull(),
  originalFilename: varchar("original_filename").notNull(),
  fileSize: integer("file_size").notNull(), // Size in bytes
  mimeType: varchar("mime_type").notNull(),
  filePath: varchar("file_path").notNull(),
  fileUrl: varchar("file_url"),
  documentType: varchar("document_type").notNull(), // ownership_proof, id_proof, survey_map, no_objection_certificate, land_records, official_notice, etc.
  plotId: integer("plot_id").references(() => plots.id),
  logId: integer("log_id").references(() => demarcationLogs.id),
  uploadedById: varchar("uploaded_by_id").references(() => users.id).notNull(),
  verifiedById: varchar("verified_by_id").references(() => users.id),
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, rejected
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  isPublic: boolean("is_public").default(false), // Whether document can be viewed by citizens
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  circle: one(circles, {
    fields: [users.circleId],
    references: [circles.id],
  }),
  assignedPlots: many(plots),
  demarcationLogs: many(demarcationLogs),
  plotAssignments: many(plotAssignments),
}));

export const circlesRelations = relations(circles, ({ one, many }) => ({
  district: one(districts, {
    fields: [circles.districtId],
    references: [districts.id],
  }),
  users: many(users),
  villages: many(villages),
}));

export const districtsRelations = relations(districts, ({ many }) => ({
  circles: many(circles),
}));

export const villagesRelations = relations(villages, ({ one, many }) => ({
  circle: one(circles, {
    fields: [villages.circleId],
    references: [circles.id],
  }),
  plots: many(plots),
}));

export const plotsRelations = relations(plots, ({ one, many }) => ({
  village: one(villages, {
    fields: [plots.villageId],
    references: [villages.id],
  }),
  assignedOfficer: one(users, {
    fields: [plots.assignedOfficerId],
    references: [users.id],
  }),
  duplicateOf: one(plots, {
    fields: [plots.duplicateOfId],
    references: [plots.id],
  }),
  demarcationLogs: many(demarcationLogs),
  assignments: many(plotAssignments),
}));

export const demarcationLogsRelations = relations(demarcationLogs, ({ one }) => ({
  plot: one(plots, {
    fields: [demarcationLogs.plotId],
    references: [plots.id],
  }),
  officer: one(users, {
    fields: [demarcationLogs.officerId],
    references: [users.id],
  }),
}));

export const plotAssignmentsRelations = relations(plotAssignments, ({ one }) => ({
  plot: one(plots, {
    fields: [plotAssignments.plotId],
    references: [plots.id],
  }),
  officer: one(users, {
    fields: [plotAssignments.officerId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [plotAssignments.assignedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCircleSchema = createInsertSchema(circles).omit({
  id: true,
  createdAt: true,
});

export const insertDistrictSchema = createInsertSchema(districts).omit({
  id: true,
  createdAt: true,
});

export const insertVillageSchema = createInsertSchema(villages).omit({
  id: true,
  createdAt: true,
});

export const insertPlotSchema = createInsertSchema(plots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDemarcationLogSchema = createInsertSchema(demarcationLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlotAssignmentSchema = createInsertSchema(plotAssignments).omit({
  id: true,
  assignedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Circle = typeof circles.$inferSelect;
export type District = typeof districts.$inferSelect;
export type Village = typeof villages.$inferSelect;
export type Plot = typeof plots.$inferSelect;
export type DemarcationLog = typeof demarcationLogs.$inferSelect;
export type PlotAssignment = typeof plotAssignments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type InsertVillage = z.infer<typeof insertVillageSchema>;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type InsertDemarcationLog = z.infer<typeof insertDemarcationLogSchema>;
export type InsertPlotAssignment = z.infer<typeof insertPlotAssignmentSchema>;

import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("tutors.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tutor_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    subject TEXT NOT NULL,
    subjects_taught TEXT,
    price_online_remedial INTEGER,
    price_online_exam INTEGER,
    price_offline_remedial INTEGER,
    price_offline_exam INTEGER,
    achievements TEXT,
    availability TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS community_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    caption TEXT,
    sender TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Initialize default config if not exists
const defaultConfig = {
  heroTitle: 'Belajar Lebih Asik Bareng Teman Seangkatan',
  heroSubtitle: 'Tingkatkan prestasimu dengan bimbingan dari teman-teman terbaik di sekolah. Mudah, santai, dan pastinya seru!'
};

Object.entries(defaultConfig).forEach(([key, value]) => {
  db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES (?, ?)").run(key, value);
});

import { google } from "googleapis";

async function appendToGoogleSheet(data: any) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.warn("Google Sheets credentials missing. Skipping append.");
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || "1mQheHBr5e1Mul-L_I2X6HwkyDamUo6i6psqj9MCsDrQ";

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            data.name,
            data.class,
            data.whatsapp,
            data.subject,
            data.subjects_taught,
            data.price_online_remedial,
            data.price_online_exam,
            data.price_offline_remedial,
            data.price_offline_exam,
            data.availability,
            data.achievements,
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Google Sheets Error:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/register-tutor", async (req, res) => {
    const { 
      name, 
      class: tutorClass, 
      whatsapp, 
      subject, 
      subjects_taught,
      price_online_remedial,
      price_online_exam,
      price_offline_remedial,
      price_offline_exam,
      achievements,
      availability
    } = req.body;
    
    if (!name || !tutorClass || !whatsapp || !subject) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      console.log("Registering tutor:", { name, tutorClass, whatsapp });
      const stmt = db.prepare(`
        INSERT INTO tutor_registrations (
          name, class, whatsapp, subject, subjects_taught, 
          price_online_remedial, price_online_exam, 
          price_offline_remedial, price_offline_exam, 
          achievements, availability
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        name, 
        tutorClass, 
        whatsapp, 
        subject, 
        subjects_taught,
        price_online_remedial,
        price_online_exam,
        price_offline_remedial,
        price_offline_exam,
        achievements,
        availability
      );

      // Also append to Google Sheets in background
      appendToGoogleSheet(req.body).catch(error => console.error("Background Google Sheets Error:", error));

      res.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to register tutor" });
    }
  });

  app.get("/api/tutor-registrations", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM tutor_registrations ORDER BY created_at DESC").all();
      res.json(rows);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  app.get("/api/community-messages/:communityName", (req, res) => {
    const { communityName } = req.params;
    try {
      const rows = db.prepare("SELECT * FROM community_messages WHERE community_name = ? ORDER BY timestamp ASC").all();
      res.json(rows);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch community messages" });
    }
  });

  app.post("/api/community-messages", (req, res) => {
    const { community_name, type, content, caption, sender } = req.body;
    
    // In a real app, verify admin token here
    
    try {
      const stmt = db.prepare(`
        INSERT INTO community_messages (community_name, type, content, caption, sender)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(community_name, type, content, caption, sender);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to save community message" });
    }
  });

  app.get("/api/site-config", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM site_config").all();
      const config = rows.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      res.json(config);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch site config" });
    }
  });

  app.post("/api/site-config", (req, res) => {
    const config = req.body;
    try {
      const stmt = db.prepare("INSERT OR REPLACE INTO site_config (key, value) VALUES (?, ?)");
      Object.entries(config).forEach(([key, value]) => {
        stmt.run(key, value);
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to save site config" });
    }
  });

  // Export to CSV (Spreadsheet format)
  app.get("/api/export-csv", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM tutor_registrations ORDER BY created_at DESC").all();
      const headers = ["ID", "Nama", "Kelas", "WhatsApp", "Mapel", "Materi Detail", "Online Remedial", "Online Ujian", "Offline Remedial", "Offline Ujian", "Pencapaian", "Ketersediaan", "Tanggal"];
      const csvContent = [
        headers.join(","),
        ...rows.map((row: any) => [
          row.id,
          `"${row.name}"`,
          `"${row.class}"`,
          `"${row.whatsapp}"`,
          `"${row.subject}"`,
          `"${row.subjects_taught?.replace(/"/g, '""')}"`,
          row.price_online_remedial,
          row.price_online_exam,
          row.price_offline_remedial,
          row.price_offline_exam,
          `"${row.achievements?.replace(/"/g, '""')}"`,
          `"${row.availability?.replace(/"/g, '""')}"`,
          row.created_at
        ].join(","))
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=tutor_registrations.csv");
      res.send(csvContent);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).send("Failed to export CSV");
    }
  });

  // Admin Routes
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (password === adminPassword) {
      res.json({ success: true, token: "admin-token-xyz" }); // Simple token for demo
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.delete("/api/tutor-registrations/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM tutor_registrations WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to delete registration" });
    }
  });

  app.put("/api/tutor-registrations/:id", (req, res) => {
    const { id } = req.params;
    const { 
      name, class: tutorClass, whatsapp, subject, subjects_taught,
      price_online_remedial, price_online_exam, 
      price_offline_remedial, price_offline_exam, 
      achievements, availability 
    } = req.body;

    try {
      db.prepare(`
        UPDATE tutor_registrations SET 
          name = ?, class = ?, whatsapp = ?, subject = ?, subjects_taught = ?,
          price_online_remedial = ?, price_online_exam = ?, 
          price_offline_remedial = ?, price_offline_exam = ?, 
          achievements = ?, availability = ?
        WHERE id = ?
      `).run(
        name, tutorClass, whatsapp, subject, subjects_taught,
        price_online_remedial, price_online_exam, 
        price_offline_remedial, price_offline_exam, 
        achievements, availability, id
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to update registration" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

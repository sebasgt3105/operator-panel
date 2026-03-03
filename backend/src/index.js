import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database (SQLite - restaurado)
const db = new Database(path.join(__dirname, 'data.db'));

// Initialize tables (solo runs - sesiones del navegador eliminadas)
db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    playbook TEXT,
    params TEXT,
    plan_json TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );
`);

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Playbooks endpoints
app.post('/api/playbooks/generate', (req, res) => {
  const { playbook, params } = req.body;
  
  // Generate plan based on playbook type
  const plan = generatePlan(playbook, params);
  
  const runId = uuidv4();
  db.prepare(
    'INSERT INTO runs (id, playbook, params, plan_json, status) VALUES (?, ?, ?, ?, ?)'
  ).run(runId, playbook, JSON.stringify(params), JSON.stringify(plan), 'generated');
  
  res.json({ runId, plan });
});

app.get('/api/runs', (req, res) => {
  const runs = db.prepare(
    'SELECT * FROM runs ORDER BY created_at DESC LIMIT 20'
  ).all();
  res.json(runs.map(r => ({ ...r, params: JSON.parse(r.params || '{}'), plan_json: JSON.parse(r.plan_json || '{}') })));
});

// Playbooks list endpoint
app.get('/api/playbooks', (req, res) => {
  res.json([
    { id: 'whatsapp-leads', name: '💬 Leads WhatsApp', desc: 'Generación de leads con mensaje directo a WhatsApp' },
    { id: 'ecommerce-sales', name: '🛒 Ventas Ecommerce', desc: 'Conversiones para tienda online' },
    { id: 'retargeting', name: '🎯 Retargeting', desc: 'Recuperar visitantes que no convirtieron' },
    { id: 'prospecting', name: '🌐 Prospecting Broad', desc: 'Audiencias amplias por intereses' },
  ]);
});

// Plan generation logic
function generatePlan(playbook, params) {
  const { businessName, product, country, objective, dailyBudget, pixelId } = params;
  
  const plans = {
    'whatsapp-leads': {
      name: `Leads WhatsApp - ${product}`,
      campaign: {
        objective: 'LEAD_GENERATION',
        name: `${businessName} - Leads WhatsApp`,
        dailyBudget: dailyBudget || 50,
        country,
      },
      adsets: [{
        name: 'Interest - Engaged Users',
        targeting: {
          interests: ['Motorcycles', 'Agriculture', 'Hardware'],
          locations: [country],
        },
        budget: (dailyBudget || 50) * 0.6,
      }],
      ads: [{
        name: 'WhatsApp Lead Ad',
        format: 'carousel',
        cta: 'WHATSAPP_MESSAGE',
        message: `Hola! Me interesa información sobre ${product}. ¿Pueden ayudarme?`,
      }],
    },
    'ecommerce-sales': {
      name: `Ventas Ecommerce - ${product}`,
      campaign: {
        objective: 'CONVERSIONS',
        name: `${businessName} - Ventas ${product}`,
        dailyBudget: dailyBudget || 100,
        country,
        pixelId,
      },
      adsets: [
        {
          name: 'Lookalike - Purchasers',
          targeting: {
            customAudiences: ['purchasers'],
            locations: [country],
          },
          budget: (dailyBudget || 100) * 0.5,
        },
        {
          name: 'Interest - Related',
          targeting: {
            interests: ['E-commerce', 'Online Shopping'],
            locations: [country],
          },
          budget: (dailyBudget || 100) * 0.5,
        },
      ],
      ads: [{
        name: 'Product Ad',
        format: 'single_image',
        cta: 'SHOP_NOW',
      }],
    },
    'retargeting': {
      name: `Retargeting - ${product}`,
      campaign: {
        objective: 'CONVERSIONS',
        name: `${businessName} - Retargeting`,
        dailyBudget: (dailyBudget || 30),
        country,
        pixelId,
      },
      adsets: [
        {
          name: 'View Content',
          targeting: { customAudiences: ['view_content'] },
          budget: (dailyBudget || 30) * 0.5,
        },
        {
          name: 'Add to Cart',
          targeting: { customAudiences: ['add_to_cart'] },
          budget: (dailyBudget || 30) * 0.5,
        },
      ],
      ads: [{
        name: 'Retargeting Ad',
        format: 'dynamic',
        cta: 'SHOP_NOW',
      }],
    },
    'prospecting': {
      name: `Prospecting - ${product}`,
      campaign: {
        objective: 'REACH',
        name: `${businessName} - Prospecting Broad`,
        dailyBudget: dailyBudget || 40,
        country,
      },
      adsets: [{
        name: 'Broad - Interests',
        targeting: {
          interests: ['Motorcycles', 'Tools', 'Machinery'],
          locations: [country],
          ageMin: 25,
          ageMax: 55,
        },
        budget: dailyBudget || 40,
      }],
      ads: [{
        name: 'Brand Awareness',
        format: 'video',
        cta: 'LEARN_MORE',
      }],
    },
  };
  
  return plans[playbook] || plans['ecommerce-sales'];
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OperatorPanel API running on port ${PORT}`);
});

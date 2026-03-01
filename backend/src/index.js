import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
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

// Database
const db = new Database(path.join(__dirname, 'data.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    url TEXT
  );
  
  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    action_type TEXT,
    selector TEXT,
    value TEXT,
    result TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );

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

// In-memory browser instances
const browsers = new Map();

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create browser session
app.post('/api/sessions', async (req, res) => {
  try {
    const sessionId = uuidv4();
    
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    
    browsers.set(sessionId, { browser, context, page });
    
    db.prepare('INSERT INTO sessions (id, status) VALUES (?, ?)').run(sessionId, 'active');
    
    // Take initial screenshot
    await page.goto('about:blank');
    const screenshot = await page.screenshot();
    
    res.json({ 
      sessionId, 
      status: 'active',
      screenshot: `data:image/png;base64,${screenshot.toString('base64')}`
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session status and screenshot
app.get('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const session = browsers.get(id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    const screenshot = await session.page.screenshot();
    const url = session.page.url();
    
    res.json({
      sessionId: id,
      status: 'active',
      url,
      screenshot: `data:image/png;base64,${screenshot.toString('base64')}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute action in browser
app.post('/api/sessions/:id/actions', async (req, res) => {
  const { id } = req.params;
  const { action, selector, value, url } = req.body;
  
  const session = browsers.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    let result = '';
    const page = session.page;
    
    switch (action) {
      case 'navigate':
        await page.goto(url);
        result = `Navigated to ${url}`;
        break;
        
      case 'click':
        await page.click(selector);
        result = `Clicked ${selector}`;
        break;
        
      case 'type':
        await page.fill(selector, value);
        result = `Typed "${value}" in ${selector}`;
        break;
        
      case 'wait':
        await page.waitForTimeout(parseInt(value) || 1000);
        result = `Waited ${value}ms`;
        break;
        
      case 'screenshot':
        // Just return screenshot
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Take screenshot after action
    const screenshot = await page.screenshot();
    
    // Log action
    db.prepare(
      'INSERT INTO actions (session_id, action_type, selector, value, result) VALUES (?, ?, ?, ?, ?)'
    ).run(id, action, selector, value, result);
    
    res.json({
      success: true,
      action,
      result,
      screenshot: `data:image/png;base64,${screenshot.toString('base64')}`,
      url: page.url()
    });
  } catch (error) {
    res.status(500).json({ error: error.message, action });
  }
});

// Close session
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const session = browsers.get(id);
  
  if (session) {
    await session.browser.close();
    browsers.delete(id);
    db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run('closed', id);
  }
  
  res.json({ success: true });
});

// Get action logs
app.get('/api/sessions/:id/logs', (req, res) => {
  const { id } = req.params;
  const logs = db.prepare(
    'SELECT * FROM actions WHERE session_id = ? ORDER BY timestamp DESC LIMIT 100'
  ).all(id);
  
  res.json(logs);
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

import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PLAYBOOKS = [
  { id: 'whatsapp-leads', name: '💬 Leads WhatsApp', desc: 'Generación de leads con mensaje directo a WhatsApp' },
  { id: 'ecommerce-sales', name: '🛒 Ventas Ecommerce', desc: 'Conversiones para tienda online' },
  { id: 'retargeting', name: '🎯 Retargeting', desc: 'Recuperar visitantes que no convirtieron' },
  { id: 'prospecting', name: '🌐 Prospecting Broad', desc: 'Audiencias amplias por intereses' },
];

function App() {
  const [session, setSession] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [activeTab, setActiveTab] = useState('browser');
  const [playbook, setPlaybook] = useState(null);
  const [params, setParams] = useState({ businessName: '', product: '', country: 'CO', objective: 'sales', dailyBudget: 50, pixelId: '' });
  const [plan, setPlan] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(() => session && fetchScreenshot(), 3000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (logs.length) logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sessions`, { method: 'POST' });
      const data = await res.json();
      setSession(data.sessionId);
      setScreenshot(data.screenshot);
      addLog('info', `Sesión creada: ${data.sessionId}`);
    } catch (e) {
      addLog('error', `Error: ${e.message}`);
    }
    setLoading(false);
  };

  const fetchScreenshot = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/api/sessions/${session}`);
      const data = await res.json();
      setScreenshot(data.screenshot);
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/api/sessions/${session}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (e) { console.error(e); }
  };

  const fetchRuns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/runs`);
      const data = await res.json();
      setRuns(data);
    } catch (e) { console.error(e); }
  };

  const sendCommand = async () => {
    if (!command.trim() || !session) return;
    
    const cmd = command.trim().toLowerCase();
    addLog('user', command);
    setCommand('');

    try {
      let action, selector = '', value = '', url = '';

      if (cmd.startsWith('ir ') || cmd.startsWith('go ') || cmd.startsWith('navegar ')) {
        url = cmd.replace(/^(ir|go|navegar)\s+/, '').trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        action = 'navigate';
      } else if (cmd.startsWith('click ') || cmd.startsWith('clic ')) {
        selector = cmd.replace(/^(click|clic)\s+/, '').trim();
        action = 'click';
      } else if (cmd.startsWith('escribir ') || cmd.startsWith('type ')) {
        const parts = cmd.replace(/^(escribir|type)\s+/, '').split(' en ');
        value = parts[0];
        selector = parts[1] || '';
        action = 'type';
      } else if (cmd.startsWith('esperar ') || cmd.startsWith('wait ')) {
        value = cmd.replace(/^(esperar|wait)\s+/, '').replace('ms', '');
        action = 'wait';
      } else {
        addLog('error', `Comando desconocido: ${cmd}`);
        return;
      }

      const res = await fetch(`${API_URL}/api/sessions/${session}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, selector, value, url })
      });
      const data = await res.json();
      
      if (data.screenshot) setScreenshot(data.screenshot);
      addLog('system', data.result || data.error);
      fetchLogs();
    } catch (e) {
      addLog('error', `Error: ${e.message}`);
    }
  };

  const addLog = (type, msg) => {
    setLogs(prev => [...prev, { action_type: type, result: msg, timestamp: new Date().toISOString() }]);
  };

  const generatePlan = async () => {
    try {
      const res = await fetch(`${API_URL}/api/playbooks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbook: playbook.id, params })
      });
      const data = await res.json();
      setPlan(data.plan);
      addLog('info', `Plan generado para ${playbook.name}`);
    } catch (e) {
      addLog('error', `Error: ${e.message}`);
    }
  };

  const executePlan = async () => {
    if (!session || !plan) return;
    addLog('info', 'Ejecutando plan en navegador...');
    
    const steps = [
      { action: 'navigate', url: 'https://www.facebook.com' },
      { action: 'wait', value: '2000' },
    ];
    
    for (const step of steps) {
      try {
        const res = await fetch(`${API_URL}/api/sessions/${session}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(step)
        });
        const data = await res.json();
        if (data.screenshot) setScreenshot(data.screenshot);
        addLog('system', data.result);
      } catch (e) {
        addLog('error', `Error en paso: ${e.message}`);
      }
    }
    addLog('info', 'Plan ejecutado (demo)');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>🔄 OperatorPanel</h1>
        <div style={styles.headerRight}>
          {!session ? (
            <button style={styles.btnPrimary} onClick={createSession} disabled={loading}>
              {loading ? 'Creando...' : '🚀 Nueva Sesión'}
            </button>
          ) : (
            <span style={styles.badge}>Sesión: {session.slice(0,8)}...</span>
          )}
        </div>
      </header>

      <div style={styles.main}>
        {/* Zona 1: Visor Browser */}
        <div style={styles.browserPanel}>
          <div style={styles.panelHeader}>
            <span>🌐 Visor Browser</span>
            {session && <button style={styles.btnSmall} onClick={fetchScreenshot}>🔄 Refresh</button>}
          </div>
          <div style={styles.browserContent}>
            {screenshot ? (
              <img src={screenshot} alt="Browser" style={styles.screenshot} />
            ) : (
              <div style={styles.placeholder}>
                <p>Crea una sesión para ver el navegador</p>
              </div>
            )}
          </div>
        </div>

        {/* Zona 2: Chat / Control */}
        <div style={styles.chatPanel}>
          <div style={styles.tabs}>
            <button style={{...styles.tab, ...(activeTab === 'browser' ? styles.tabActive : {})}} onClick={() => setActiveTab('browser')}>💬 Chat</button>
            <button style={{...styles.tab, ...(activeTab === 'playbook' ? styles.tabActive : {})}} onClick={() => setActiveTab('playbook')}>📋 Playbooks</button>
            <button style={{...styles.tab, ...(activeTab === 'runs' ? styles.tabActive : {})}} onClick={() => { setActiveTab('runs'); fetchRuns(); }}>📊 Runs</button>
          </div>

          {activeTab === 'browser' && (
            <>
              <div style={styles.logs}>
                {logs.map((log, i) => (
                  <div key={i} style={{...styles.log, ...(log.action_type === 'error' ? styles.logError : log.action_type === 'user' ? styles.logUser : {})}}>
                    <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>{log.result}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
              <div style={styles.inputArea}>
                <input 
                  style={styles.input}
                  placeholder="Ej: ir a facebook.com | click boton | escribir texto en input"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCommand()}
                />
                <button style={styles.btnSend} onClick={sendCommand}>➤</button>
              </div>
              <div style={styles.help}>
                <small>Comandos: ir [url], click [selector], escribir [texto] en [selector], esperar [ms]</small>
              </div>
            </>
          )}

          {activeTab === 'playbook' && (
            <div style={styles.playbookPanel}>
              {!playbook ? (
                <div style={styles.playbookList}>
                  <h3>Selecciona un Playbook</h3>
                  {PLAYBOOKS.map(p => (
                    <div key={p.id} style={styles.playbookItem} onClick={() => setPlaybook(p)}>
                      <strong>{p.name}</strong>
                      <p>{p.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.playbookConfig}>
                  <button style={styles.btnBack} onClick={() => { setPlaybook(null); setPlan(null); }}>← Volver</button>
                  <h3>{playbook.name}</h3>
                  
                  <div style={styles.formGroup}>
                    <label>Nombre del Negocio</label>
                    <input style={styles.input} value={params.businessName} onChange={e => setParams({...params, businessName: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Producto</label>
                    <input style={styles.input} value={params.product} onChange={e => setParams({...params, product: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>País</label>
                    <select style={styles.input} value={params.country} onChange={e => setParams({...params, country: e.target.value})}>
                      <option value="CO">Colombia</option>
                      <option value="MX">México</option>
                      <option value="AR">Argentina</option>
                      <option value="US">Estados Unidos</option>
                      <option value="ES">España</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Objetivo</label>
                    <select style={styles.input} value={params.objective} onChange={e => setParams({...params, objective: e.target.value})}>
                      <option value="sales">Ventas</option>
                      <option value="leads">Leads</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="traffic">Tráfico</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Presupuesto Diario ($)</label>
                    <input style={styles.input} type="number" value={params.dailyBudget} onChange={e => setParams({...params, dailyBudget: parseInt(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Pixel ID (opcional)</label>
                    <input style={styles.input} value={params.pixelId} onChange={e => setParams({...params, pixelId: e.target.value})} />
                  </div>
                  
                  {!plan ? (
                    <button style={styles.btnPrimary} onClick={generatePlan}>Generar Plan</button>
                  ) : (
                    <>
                      <pre style={styles.codeBlock}>{JSON.stringify(plan, null, 2)}</pre>
                      <button style={styles.btnExecute} onClick={executePlan}>▶ Ejecutar en Navegador</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'runs' && (
            <div style={styles.runsPanel}>
              <h3>Últimas Ejecuciones</h3>
              {runs.length === 0 ? <p>No hay ejecuciones</p> : runs.map(r => (
                <div key={r.id} style={styles.runItem}>
                  <strong>{r.playbook}</strong>
                  <span style={styles.badgeStatus}>{r.status}</span>
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f0f' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#1a1a1a', borderBottom: '1px solid #333' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#00d4ff' },
  headerRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  badge: { padding: '6px 12px', background: '#252525', borderRadius: '6px', fontSize: '12px', color: '#888' },
  btnPrimary: { padding: '10px 20px', background: '#00d4ff', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 'bold', cursor: 'pointer' },
  btnSmall: { padding: '6px 12px', background: '#333', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '12px' },
  main: { flex: 1, display: 'flex', overflow: 'hidden' },
  browserPanel: { flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: '#1a1a1a', borderBottom: '1px solid #333', fontSize: '14px' },
  browserContent: { flex: 1, background: '#000', overflow: 'hidden', position: 'relative' },
  screenshot: { width: '100%', height: '100%', objectFit: 'contain' },
  placeholder: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' },
  chatPanel: { flex: 1, minWidth: '350px', maxWidth: '450px', display: 'flex', flexDirection: 'column', background: '#141414' },
  tabs: { display: 'flex', borderBottom: '1px solid #333' },
  tab: { flex: 1, padding: '12px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' },
  tabActive: { color: '#00d4ff', borderBottom: '2px solid #00d4ff' },
  logs: { flex: 1, overflow: 'auto', padding: '10px' },
  log: { padding: '6px 10px', margin: '4px 0', background: '#1e1e1e', borderRadius: '4px', fontSize: '12px', display: 'flex', gap: '8px' },
  logError: { background: '#3a1e1e', color: '#ff6b6b' },
  logUser: { background: '#1e2a3a', color: '#6baaff' },
  logTime: { color: '#555', fontSize: '10px' },
  inputArea: { display: 'flex', padding: '10px', gap: '8px', borderTop: '1px solid #333' },
  input: { flex: 1, padding: '10px', background: '#222', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '13px' },
  btnSend: { padding: '10px 16px', background: '#00d4ff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' },
  help: { padding: '8px 12px', color: '#555', fontSize: '11px', textAlign: 'center' },
  playbookPanel: { flex: 1, overflow: 'auto', padding: '15px' },
  playbookList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  playbookItem: { padding: '15px', background: '#1e1e1e', borderRadius: '8px', cursor: 'pointer', border: '1px solid #333' },
  playbookConfig: { display: 'flex', flexDirection: 'column', gap: '12px' },
  btnBack: { padding: '8px 16px', background: 'transparent', border: '1px solid #444', borderRadius: '6px', color: '#888', cursor: 'pointer', alignSelf: 'flex-start' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  codeBlock: { padding: '12px', background: '#0d1117', borderRadius: '6px', fontSize: '10px', overflow: 'auto', maxHeight: '200px', color: '#c9d1d9' },
  btnExecute: { padding: '12px', background: '#2ea043', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  runsPanel: { flex: 1, overflow: 'auto', padding: '15px' },
  runItem: { padding: '12px', background: '#1e1e1e', borderRadius: '6px', margin: '6px 0', display: 'flex', flexDirection: 'column', gap: '4px' },
  badgeStatus: { padding: '2px 8px', background: '#333', borderRadius: '4px', fontSize: '10px', width: 'fit-content' },
};

export default App;

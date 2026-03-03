import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PLAYBOOKS = [
  { id: 'whatsapp-leads', name: '💬 Leads WhatsApp', desc: 'Generación de leads con mensaje directo a WhatsApp' },
  { id: 'ecommerce-sales', name: '🛒 Ventas Ecommerce', desc: 'Conversiones para tienda online' },
  { id: 'retargeting', name: '🎯 Retargeting', desc: 'Recuperar visitantes que no convirtieron' },
  { id: 'prospecting', name: '🌐 Prospecting Broad', desc: 'Audiencias amplias por intereses' },
];

function App() {
  const [activeTab, setActiveTab] = useState('playbook');
  const [playbook, setPlaybook] = useState(null);
  const [params, setParams] = useState({ 
    businessName: '', 
    product: '', 
    country: 'CO', 
    objective: 'sales', 
    dailyBudget: 50, 
    pixelId: '' 
  });
  const [plan, setPlan] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/runs`);
      if (!res.ok) throw new Error('Error al cargar runs');
      const data = await res.json();
      setRuns(data);
    } catch (e) {
      setError('No se pudo conectar al backend');
    }
  };

  const generatePlan = async () => {
    if (!playbook) {
      setError('Selecciona un playbook');
      return;
    }
    if (!params.businessName || !params.product) {
      setError('Completa el nombre del negocio y producto');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/playbooks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbook: playbook.id, params })
      });
      
      if (!res.ok) throw new Error('Error al generar plan');
      
      const data = await res.json();
      setPlan(data.plan);
      setSuccess('✅ Plan generado correctamente');
      fetchRuns();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const resetPlaybook = () => {
    setPlaybook(null);
    setPlan(null);
    setSuccess(null);
    setError(null);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>🔄 OperatorPanel</h1>
        <div style={styles.headerRight}>
          <span style={styles.badge}>Playbooks + Runs</span>
        </div>
      </header>

      <div style={styles.main}>
        {/* Panel Principal */}
        <div style={styles.contentPanel}>
          <div style={styles.tabs}>
            <button 
              style={{...styles.tab, ...(activeTab === 'playbook' ? styles.tabActive : {})}} 
              onClick={() => setActiveTab('playbook')}
            >
              📋 Playbooks
            </button>
            <button 
              style={{...styles.tab, ...(activeTab === 'runs' ? styles.tabActive : {})}} 
              onClick={() => { setActiveTab('runs'); fetchRuns(); }}
            >
              📊 Runs ({runs.length})
            </button>
          </div>

          {/* MENSAJES */}
          {error && (
            <div style={styles.errorMsg}>
              {error}
              <button style={styles.closeBtn} onClick={() => setError(null)}>×</button>
            </div>
          )}
          {success && (
            <div style={styles.successMsg}>
              {success}
              <button style={styles.closeBtn} onClick={() => setSuccess(null)}>×</button>
            </div>
          )}

          {/* TAB: PLAYBOOKS */}
          {activeTab === 'playbook' && (
            <div style={styles.playbookPanel}>
              {!playbook ? (
                <div style={styles.playbookList}>
                  <h3 style={styles.sectionTitle}>Selecciona un Playbook</h3>
                  {PLAYBOOKS.map(p => (
                    <div 
                      key={p.id} 
                      style={styles.playbookItem} 
                      onClick={() => setPlaybook(p)}
                    >
                      <strong>{p.name}</strong>
                      <p style={styles.playbookDesc}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.playbookConfig}>
                  <button style={styles.btnBack} onClick={resetPlaybook}>← Volver</button>
                  <h3>{playbook.name}</h3>
                  
                  <div style={styles.formGroup}>
                    <label>Nombre del Negocio *</label>
                    <input 
                      style={styles.input} 
                      placeholder="Ej: Motosierra Pro"
                      value={params.businessName} 
                      onChange={e => setParams({...params, businessName: e.target.value})} 
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Producto *</label>
                    <input 
                      style={styles.input} 
                      placeholder="Ej: Espadas de Motosierra"
                      value={params.product} 
                      onChange={e => setParams({...params, product: e.target.value})} 
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>País</label>
                    <select 
                      style={styles.input} 
                      value={params.country} 
                      onChange={e => setParams({...params, country: e.target.value})}
                    >
                      <option value="CO">Colombia</option>
                      <option value="MX">México</option>
                      <option value="AR">Argentina</option>
                      <option value="US">Estados Unidos</option>
                      <option value="ES">España</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Objetivo</label>
                    <select 
                      style={styles.input} 
                      value={params.objective} 
                      onChange={e => setParams({...params, objective: e.target.value})}
                    >
                      <option value="sales">Ventas</option>
                      <option value="leads">Leads</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="traffic">Tráfico</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Presupuesto Diario ($)</label>
                    <input 
                      style={styles.input} 
                      type="number" 
                      value={params.dailyBudget} 
                      onChange={e => setParams({...params, dailyBudget: parseInt(e.target.value) || 50})} 
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Pixel ID (opcional)</label>
                    <input 
                      style={styles.input} 
                      placeholder="Ej: 1234567890"
                      value={params.pixelId} 
                      onChange={e => setParams({...params, pixelId: e.target.value})} 
                    />
                  </div>
                  
                  {!plan ? (
                    <button 
                      style={styles.btnPrimary} 
                      onClick={generatePlan}
                      disabled={loading}
                    >
                      {loading ? 'Generando...' : '🚀 Generar Plan'}
                    </button>
                  ) : (
                    <>
                      <pre style={styles.codeBlock}>{JSON.stringify(plan, null, 2)}</pre>
                      <button style={styles.btnSecondary} onClick={() => { setPlan(null); }}>
                        ✏️ Editar Parámetros
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: RUNS */}
          {activeTab === 'runs' && (
            <div style={styles.runsPanel}>
              <div style={styles.runsHeader}>
                <h3>Historial de Ejecuciones</h3>
                <button style={styles.btnSmall} onClick={fetchRuns}>🔄 Actualizar</button>
              </div>
              {runs.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>No hay ejecuciones aún</p>
                  <small>Genera un plan para ver el historial aquí</small>
                </div>
              ) : (
                <div style={styles.runsList}>
                  {runs.map(r => (
                    <div key={r.id} style={styles.runItem}>
                      <div style={styles.runHeader}>
                        <strong>{r.playbook}</strong>
                        <span style={styles.badgeStatus}>{r.status}</span>
                      </div>
                      <div style={styles.runDetails}>
                        <span>📅 {new Date(r.created_at).toLocaleString()}</span>
                        {r.params?.businessName && <span>🏪 {r.params.businessName}</span>}
                        {r.params?.product && <span>📦 {r.params.product}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    background: '#0f0f0f',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '12px 20px', 
    background: '#1a1a1a', 
    borderBottom: '1px solid #333' 
  },
  logo: { 
    fontSize: '20px', 
    fontWeight: 'bold', 
    color: '#00d4ff',
    margin: 0 
  },
  headerRight: { 
    display: 'flex', 
    gap: '10px', 
    alignItems: 'center' 
  },
  badge: { 
    padding: '6px 12px', 
    background: '#252525', 
    borderRadius: '6px', 
    fontSize: '12px', 
    color: '#888' 
  },
  main: { 
    flex: 1, 
    display: 'flex', 
    overflow: 'hidden' 
  },
  contentPanel: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%' 
  },
  tabs: { 
    display: 'flex', 
    borderBottom: '1px solid #333',
    background: '#141414'
  },
  tab: { 
    flex: 1, 
    padding: '16px', 
    background: 'transparent', 
    border: 'none', 
    color: '#888', 
    cursor: 'pointer', 
    fontSize: '14px',
    fontWeight: '500'
  },
  tabActive: { 
    color: '#00d4ff', 
    borderBottom: '2px solid #00d4ff' 
  },
  errorMsg: { 
    margin: '12px', 
    padding: '12px 16px', 
    background: '#3a1e1e', 
    borderRadius: '6px', 
    color: '#ff6b6b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  successMsg: { 
    margin: '12px', 
    padding: '12px 16px', 
    background: '#1e3a2e', 
    borderRadius: '6px', 
    color: '#4ade80',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px'
  },
  playbookPanel: { 
    flex: 1, 
    overflow: 'auto', 
    padding: '20px' 
  },
  sectionTitle: {
    color: '#fff',
    marginBottom: '16px'
  },
  playbookList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px' 
  },
  playbookItem: { 
    padding: '20px', 
    background: '#1e1e1e', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    border: '1px solid #333',
    transition: 'border-color 0.2s'
  },
  playbookDesc: {
    color: '#888',
    margin: '4px 0 0',
    fontSize: '13px'
  },
  playbookConfig: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px' 
  },
  btnBack: { 
    padding: '10px 16px', 
    background: 'transparent', 
    border: '1px solid #444', 
    borderRadius: '6px', 
    color: '#888', 
    cursor: 'pointer', 
    alignSelf: 'flex-start',
    fontSize: '13px'
  },
  formGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  input: { 
    flex: 1, 
    padding: '12px', 
    background: '#222', 
    border: '1px solid #333', 
    borderRadius: '6px', 
    color: '#fff', 
    fontSize: '14px'
  },
  btnPrimary: { 
    padding: '14px 24px', 
    background: '#00d4ff', 
    border: 'none', 
    borderRadius: '6px', 
    color: '#000', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    fontSize: '14px'
  },
  btnSecondary: { 
    padding: '12px', 
    background: '#333', 
    border: 'none', 
    borderRadius: '6px', 
    color: '#fff', 
    cursor: 'pointer',
    fontSize: '13px'
  },
  btnSmall: { 
    padding: '8px 12px', 
    background: '#333', 
    border: 'none', 
    borderRadius: '4px', 
    color: '#fff', 
    cursor: 'pointer', 
    fontSize: '12px' 
  },
  codeBlock: { 
    padding: '16px', 
    background: '#0d1117', 
    borderRadius: '8px', 
    fontSize: '11px', 
    overflow: 'auto', 
    maxHeight: '300px', 
    color: '#c9d1d9',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  runsPanel: { 
    flex: 1, 
    overflow: 'auto', 
    padding: '20px' 
  },
  runsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  runsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  runItem: { 
    padding: '16px', 
    background: '#1e1e1e', 
    borderRadius: '8px',
    border: '1px solid #333'
  },
  runHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  runDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#888'
  },
  badgeStatus: { 
    padding: '4px 10px', 
    background: '#333', 
    borderRadius: '4px', 
    fontSize: '11px',
    color: '#4ade80'
  },
};

export default App;

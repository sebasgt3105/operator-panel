# 🔄 OperatorPanel

> MVP - Panel de automatización con navegador remoto + Playbooks para campañas de ads

## ⚡ Quick Start

```bash
# Clonar y entrar
git clone https://github.com/sebasgt3105/operator-panel.git
cd operator-panel

# Instalar dependencias
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Levantar todo (backend + frontend)
npm run dev
```

Luego abre: **http://localhost:5173**

---

## 🎯 ¿Qué es?

OperatorPanel es un sistema que combina:

1. **Visor de navegador remoto** — Controla un navegador Chromium desde la UI
2. **Chat de comandos** — Envía instrucciones en lenguaje natural (ir, click, escribir)
3. **Playbooks** — Genera estructura de campañas automáticamente
4. **Dashboard** — Historial de ejecuciones y logs

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────┐ │
│  │  Visor   │   │   Chat   │   │   Playbooks / Plan   │ │
│  │ Browser  │   │ Commands │   │   Generation         │ │
│  └──────────┘   └──────────┘   └──────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                    Backend (Node.js)                     │
│  ┌─────────────┐   ┌─────────────┐   ┌────────────────┐  │
│  │  Express    │   │  Playwright │   │    SQLite      │  │
│  │  API        │   │  Browser    │   │    (logs/run)  │  │
│  └─────────────┘   └─────────────┘   └────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/sessions` | Crear sesión de navegador |
| GET | `/api/sessions/:id` | Obtener estado + screenshot |
| POST | `/api/sessions/:id/actions` | Ejecutar acción (navigate, click, type, wait) |
| DELETE | `/api/sessions/:id` | Cerrar sesión |
| POST | `/api/playbooks/generate` | Generar plan JSON |
| GET | `/api/runs` | Ver historial de ejecuciones |

---

## 💬 Comandos del Chat

```
ir facebook.com          → Navegar a URL
click #boton-login       → Clic en elemento CSS
escribir texto en input  → Rellenar campo
esperar 2000ms           → Esperar (ms)
```

---

## 📋 Playbooks Disponibles

| Playbook | Descripción |
|----------|-------------|
| 💬 Leads WhatsApp | Generación de leads con mensaje a WhatsApp |
| 🛒 Ventas Ecommerce | Conversiones para tienda online |
| 🎯 Retargeting | View Content / Add to Cart |
| 🌐 Prospecting Broad | Audiencias amplias por intereses |

---

## 🐳 Docker (Opcional)

```bash
docker-compose up --build
```

---

## 📁 Estructura

```
operator-panel/
├── backend/
│   ├── src/index.js      # API + Playwright + SQLite
│   └── package.json
├── frontend/
│   ├── src/App.jsx       # UI React
│   ├── index.html
│   └── package.json
├── docs/
│   └── research_saleads.md  # Investigación competidor
├── docker-compose.yml
└── README.md
```

---

## ✅ Checklist "Listo"

- [x] Crear sesión de navegador
- [x] Ver navegador en tiempo real
- [x] Enviar comandos (navegar, click, escribir)
- [x] Seleccionar playbook y configurar parámetros
- [x] Generar Plan JSON
- [x] Ejecutar plan en navegador
- [x] Ver logs de acciones

---

## 🔜 Siguiente Fase (v2)

- [ ] Integración real con Meta Ads API
- [ ] Editor visual de selectores
- [ ] Grabador de macros
- [ ] Scheduler de campañas
- [ ] Métricas desde Meta Business

---

## 📄 Licencia

MIT - Sebastián García

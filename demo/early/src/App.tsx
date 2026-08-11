import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  BarChart3, Bell, Boxes, Braces, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Clock3, CloudUpload, Code2, Copy, Database, ExternalLink, Eye,
  FileText, Filter, Gauge, GitBranch, Globe2, KeyRound, Layers3, LayoutDashboard,
  LifeBuoy, Menu, MoreHorizontal, Pause, Play, Plus, RefreshCw, RotateCcw,
  Search, ServerCog, Settings, ShieldCheck, Sparkles, TerminalSquare, Trash2,
  TrendingUp, UserRound, Users, WandSparkles, X, Zap,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

type Page = 'overview' | 'models' | 'deployments' | 'observability' | 'consumers';
type ToastState = { id: number; title: string; detail?: string; kind?: 'success' | 'info' | 'danger' };
type ReleaseState = 'canary' | 'promoted' | 'rolledback';

type Model = {
  name: string; slug: string; useCase: string; framework: string; version: string;
  versions: number; updated: string; owner: string; status: 'Healthy' | 'Warning' | 'Inactive';
  endpoint: string; requests: string; p95: string;
};

const trafficData = [
  { t: '00:00', requests: 210, latency: 82 }, { t: '02:00', requests: 184, latency: 79 },
  { t: '04:00', requests: 168, latency: 76 }, { t: '06:00', requests: 228, latency: 83 },
  { t: '08:00', requests: 412, latency: 91 }, { t: '10:00', requests: 586, latency: 88 },
  { t: '12:00', requests: 642, latency: 86 }, { t: '14:00', requests: 711, latency: 84 },
  { t: '16:00', requests: 668, latency: 87 }, { t: '18:00', requests: 724, latency: 85 },
  { t: '20:00', requests: 603, latency: 82 }, { t: '22:00', requests: 492, latency: 81 },
];

const latencyData = [
  { t: '10:00', v231: 84, v240: 92, p99: 142 }, { t: '10:05', v231: 82, v240: 89, p99: 138 },
  { t: '10:10', v231: 86, v240: 94, p99: 145 }, { t: '10:15', v231: 81, v240: 88, p99: 136 },
  { t: '10:20', v231: 83, v240: 91, p99: 140 }, { t: '10:25', v231: 80, v240: 87, p99: 134 },
  { t: '10:30', v231: 82, v240: 90, p99: 137 }, { t: '10:35', v231: 81, v240: 86, p99: 133 },
  { t: '10:40', v231: 83, v240: 88, p99: 136 }, { t: '10:45', v231: 82, v240: 87, p99: 135 },
];

const metricData = [
  { t: '09:00', throughput: 482, errors: .14, latency: 82 }, { t: '10:00', throughput: 518, errors: .16, latency: 86 },
  { t: '11:00', throughput: 592, errors: .13, latency: 84 }, { t: '12:00', throughput: 640, errors: .18, latency: 88 },
  { t: '13:00', throughput: 612, errors: .17, latency: 85 }, { t: '14:00', throughput: 676, errors: .15, latency: 83 },
  { t: '15:00', throughput: 701, errors: .19, latency: 87 }, { t: '16:00', throughput: 668, errors: .16, latency: 84 },
  { t: '17:00', throughput: 722, errors: .18, latency: 86 }, { t: '18:00', throughput: 694, errors: .14, latency: 82 },
];

const models: Model[] = [
  { name: 'Fraud Detector', slug: 'fraud-detector', useCase: 'Real-time payments', framework: 'XGBoost 2.0', version: 'v2.4.0', versions: 8, updated: '18 min ago', owner: 'Risk ML', status: 'Healthy', endpoint: '/v1/predict/fraud-detector', requests: '4.82M', p95: '87 ms' },
  { name: 'Recommendations Ranker', slug: 'recommendations-ranker', useCase: 'Home feed ranking', framework: 'PyTorch 2.3', version: 'v7.1.2', versions: 14, updated: '2h ago', owner: 'Discovery', status: 'Healthy', endpoint: '/v1/predict/recommendations-ranker', requests: '2.14M', p95: '112 ms' },
  { name: 'Churn Predictor', slug: 'churn-predictor', useCase: 'Retention scoring', framework: 'LightGBM 4.3', version: 'v3.8.1', versions: 6, updated: 'Yesterday', owner: 'Growth Data', status: 'Warning', endpoint: '/v1/predict/churn-predictor', requests: '936K', p95: '64 ms' },
  { name: 'Demand Forecast', slug: 'demand-forecast', useCase: '14-day SKU forecast', framework: 'TensorFlow 2.16', version: 'v4.1.0', versions: 11, updated: 'Aug 8', owner: 'Supply AI', status: 'Healthy', endpoint: '/v1/predict/demand-forecast', requests: '318K', p95: '148 ms' },
  { name: 'Support Intent Router', slug: 'support-intent-router', useCase: 'Ticket classification', framework: 'ONNX Runtime', version: 'v1.6.3', versions: 4, updated: 'Jul 29', owner: 'CX Platform', status: 'Inactive', endpoint: '/v1/predict/support-intent-router', requests: '—', p95: '—' },
];

const navItems: { id: Page; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'models', label: 'Model registry', icon: Boxes },
  { id: 'deployments', label: 'Deployments', icon: GitBranch },
  { id: 'observability', label: 'Observability', icon: BarChart3 },
  { id: 'consumers', label: 'API consumers', icon: KeyRound },
];

function cx(...classes: (string | false | undefined)[]) { return classes.filter(Boolean).join(' '); }

function Avatar({ name, tone = 'purple' }: { name: string; tone?: 'purple' | 'green' | 'orange' | 'blue' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return <span className={`avatar avatar-${tone}`} title={name}>{initials}</span>;
}

function Badge({ children, tone = 'neutral', dot }: { children: React.ReactNode; tone?: string; dot?: boolean }) {
  return <span className={`badge badge-${tone}`}>{dot && <span className="badge-dot" />}{children}</span>;
}

function Button({ children, variant = 'primary', size = 'md', icon: Icon, onClick, disabled, className, type = 'button' }:
  { children?: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'; size?: 'sm' | 'md'; icon?: typeof Activity; onClick?: () => void; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  return <button type={type} className={cx('button', `button-${variant}`, `button-${size}`, className)} onClick={onClick} disabled={disabled}>
    {Icon && <Icon size={size === 'sm' ? 14 : 16} />}{children}
  </button>;
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return <header className="page-header">
    <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><p>{description}</p></div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}

function ChartTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><div className="tooltip-label">{label}</div>{payload.map((p: any) =>
    <div className="tooltip-row" key={p.dataKey}><span><i style={{ background: p.color }} />{p.name}</span><strong>{p.value}{p.dataKey === 'requests' || p.dataKey === 'throughput' ? ' req/s' : suffix}</strong></div>
  )}</div>;
}

function CardTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="card-title"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return <div className="skeleton-wrap">{Array.from({ length: rows }).map((_, i) => <div className="skeleton-row" key={i}><span /><span /><span /></div>)}</div>;
}

function Modal({ open, onClose, children, size = 'md', labelledBy }: { open: boolean; onClose: () => void; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; labelledBy?: string }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', fn); return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className={`modal modal-${size}`}>{children}</div>
  </div>;
}

function Toasts({ toasts, dismiss }: { toasts: ToastState[]; dismiss: (id: number) => void }) {
  return <div className="toast-stack" aria-live="polite">{toasts.map(t => <div className={cx('toast', `toast-${t.kind || 'success'}`)} key={t.id}>
    <div className="toast-icon">{t.kind === 'danger' ? <AlertTriangle size={17} /> : t.kind === 'info' ? <Sparkles size={17} /> : <Check size={17} />}</div>
    <div><strong>{t.title}</strong>{t.detail && <p>{t.detail}</p>}</div><button onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={15} /></button>
  </div>)}</div>;
}

function Sidebar({ page, onNavigate, collapsed, onClose }: { page: Page; onNavigate: (p: Page) => void; collapsed: boolean; onClose: () => void }) {
  return <aside className={cx('sidebar', collapsed && 'sidebar-open')}>
    <div className="brand"><div className="brand-mark"><Layers3 size={20} /></div><div><strong>ModelForge</strong><span>Serving control plane</span></div><button className="mobile-close" onClick={onClose}><X size={20} /></button></div>
    <div className="workspace-switch"><div className="workspace-icon">AC</div><div><strong>Acme Cloud</strong><span>Enterprise workspace</span></div><ChevronDown size={15} /></div>
    <nav className="primary-nav" aria-label="Primary navigation">
      <div className="nav-label">Platform</div>
      {navItems.map(item => <button key={item.id} className={cx('nav-item', page === item.id && 'active')} onClick={() => { onNavigate(item.id); onClose(); }}>
        <item.icon size={18} /><span>{item.label}</span>{item.id === 'observability' && <i className="nav-alert">2</i>}
      </button>)}
    </nav>
    <div className="sidebar-grow" />
    <nav className="secondary-nav"><button className="nav-item"><FileText size={18} /><span>API reference</span><ExternalLink size={13} className="nav-end" /></button><button className="nav-item"><Settings size={18} /><span>Settings</span></button></nav>
    <div className="sidebar-user"><Avatar name="A.M.Janjan" /><div><strong>A.M.Janjan</strong><span>Platform engineer</span></div><MoreHorizontal size={17} /></div>
  </aside>;
}

function Topbar({ onMenu, onCommand, showNotifications, setShowNotifications }:
  { onMenu: () => void; onCommand: () => void; showNotifications: boolean; setShowNotifications: (v: boolean) => void }) {
  return <div className="topbar">
    <button className="menu-button" onClick={onMenu}><Menu size={20} /></button>
    <div className="environment"><span className="live-dot" /><select aria-label="Environment" defaultValue="Production"><option>Production</option><option>Staging</option><option>Development</option></select><ChevronDown size={13} /></div>
    <button className="command-search" onClick={onCommand}><Search size={16} /><span>Search models, deployments…</span><kbd>⌘ K</kbd></button>
    <div className="topbar-actions"><button title="Help"><CircleHelp size={18} /></button><button className="notification-button" title="Notifications" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18} /><i /></button><Avatar name="A.M.Janjan" /></div>
    {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
  </div>;
}

function Notifications({ onClose }: { onClose: () => void }) {
  return <div className="popover notifications-panel">
    <div className="popover-head"><div><h3>Notifications</h3><p>2 need your attention</p></div><button onClick={onClose}><X size={17} /></button></div>
    <div className="notification-item unread"><div className="event-icon event-warning"><AlertTriangle size={16} /></div><div><strong>Feature drift detected</strong><p>Churn Predictor · age_band PSI reached 0.27</p><span>12 minutes ago</span></div></div>
    <div className="notification-item unread"><div className="event-icon event-info"><GitBranch size={16} /></div><div><strong>Canary ready for review</strong><p>Fraud Detector v2.4.0 passed all guardrails</p><span>18 minutes ago</span></div></div>
    <div className="notification-item"><div className="event-icon event-success"><Check size={16} /></div><div><strong>Deployment completed</strong><p>Recommendations Ranker v7.1.2 is serving</p><span>2 hours ago</span></div></div>
    <button className="popover-footer">View all activity <ArrowRight size={14} /></button>
  </div>;
}

function StatCard({ label, value, change, icon: Icon, tone = 'purple', direction = 'up', hint }:
  { label: string; value: string; change: string; icon: typeof Activity; tone?: string; direction?: 'up' | 'down'; hint?: string }) {
  return <div className="card stat-card"><div className={`stat-icon stat-${tone}`}><Icon size={18} /></div><div className="stat-label">{label}<CircleHelp size={13} /></div><div className="stat-value">{value}</div><div className="stat-foot"><span className={cx('trend', direction === 'up' ? 'trend-up' : 'trend-down')}>{direction === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{change}</span><span>{hint || 'vs previous 24h'}</span></div></div>;
}

function Overview({ onNavigate, onDeploy, onOpenFraud, onDiagnose, refreshing, setRefreshing }:
  { onNavigate: (p: Page) => void; onDeploy: () => void; onOpenFraud: () => void; onDiagnose: () => void; refreshing: boolean; setRefreshing: (v: boolean) => void }) {
  const [chartMetric, setChartMetric] = useState<'requests' | 'latency'>('requests');
  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 850); };
  return <>
    <PageHeader title="Production overview" description="Health and performance across your model serving fleet." actions={<><span className="last-updated"><span className="live-dot" /> Live · updated 8s ago</span><Button variant="secondary" icon={RefreshCw} onClick={refresh} className={refreshing ? 'spin-icon' : ''}>Refresh</Button><Button icon={Plus} onClick={onDeploy}>Deploy model</Button></>} />
    {refreshing ? <Skeleton rows={5} /> : <>
      <section className="stats-grid">
        <StatCard label="Requests today" value="8.42M" change="12.8%" icon={Activity} tone="purple" />
        <StatCard label="Fleet p95 latency" value="86 ms" change="4.2%" icon={Gauge} tone="blue" direction="down" />
        <StatCard label="Error rate" value="0.18%" change="0.03%" icon={AlertTriangle} tone="orange" direction="down" />
        <StatCard label="Active endpoints" value="12" change="3 healthy" icon={ServerCog} tone="green" hint="canary deployments" />
      </section>
      <section className="overview-grid">
        <div className="card traffic-card">
          <CardTitle title="Serving traffic" subtitle="Aggregate throughput · last 24 hours" action={<div className="segmented"><button className={chartMetric === 'requests' ? 'active' : ''} onClick={() => setChartMetric('requests')}>Requests</button><button className={chartMetric === 'latency' ? 'active' : ''} onClick={() => setChartMetric('latency')}>Latency</button></div>} />
          <div className="chart-summary"><div><strong>{chartMetric === 'requests' ? '724' : '91 ms'}</strong><span>{chartMetric === 'requests' ? 'req/s peak' : 'p95 peak'}</span></div><div><strong>99.982%</strong><span>availability</span></div><div className="chart-legend"><i className="legend-purple" /> {chartMetric === 'requests' ? 'Requests/s' : 'p95 latency'}</div></div>
          <div className="chart-wrap overview-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -26, bottom: 0 }}><defs><linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6d5dfc" stopOpacity={.25} /><stop offset="1" stopColor="#6d5dfc" stopOpacity={.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef3" /><XAxis dataKey="t" tickLine={false} axisLine={false} tick={{ fill: '#8b91a1', fontSize: 11 }} interval={1} /><YAxis domain={chartMetric === 'latency' ? [60, 100] : undefined} tickLine={false} axisLine={false} tick={{ fill: '#8b91a1', fontSize: 11 }} /><Tooltip content={<ChartTooltip suffix={chartMetric === 'latency' ? ' ms' : ''} />} /><Area type="monotone" dataKey={chartMetric} name={chartMetric === 'requests' ? 'Requests' : 'p95 latency'} stroke="#6d5dfc" strokeWidth={2.5} fill="url(#trafficFill)" activeDot={{ r: 5, fill: '#6d5dfc', stroke: '#fff', strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="card fleet-card"><CardTitle title="Fleet health" subtitle="12 endpoints across 3 teams" action={<button className="text-button" onClick={() => onNavigate('deployments')}>View all <ArrowRight size={14} /></button>} />
          <div className="health-summary"><div className="health-ring"><span>12</span><small>total</small></div><div className="health-bars"><div><span><i className="health-green" />Healthy</span><strong>10</strong></div><div><span><i className="health-amber" />Degraded</span><strong>1</strong></div><div><span><i className="health-gray" />Paused</span><strong>1</strong></div></div></div>
          <div className="fleet-list">
            <button onClick={onOpenFraud}><span className="model-mini-icon purple"><ShieldCheck size={15} /></span><span><strong>fraud-detector</strong><small>v2.4.0 · canary 10%</small></span><Badge tone="purple" dot>Canary</Badge><ChevronRight size={15} /></button>
            <button onClick={() => onNavigate('models')}><span className="model-mini-icon blue"><Sparkles size={15} /></span><span><strong>recommendations-ranker</strong><small>v7.1.2 · 184 req/s</small></span><Badge tone="green" dot>Healthy</Badge><ChevronRight size={15} /></button>
            <button onClick={() => onNavigate('observability')}><span className="model-mini-icon orange"><TrendingUp size={15} /></span><span><strong>churn-predictor</strong><small>v3.8.1 · drift warning</small></span><Badge tone="amber" dot>Warning</Badge><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
      <section className="bottom-grid">
        <div className="card attention-card"><CardTitle title="Needs attention" subtitle="Actionable signals from the last 24 hours" action={<Badge tone="amber">2 open</Badge>} />
          <div className="alert-row"><div className="event-icon event-warning"><AlertTriangle size={17} /></div><div className="alert-content"><div><strong>Feature drift detected</strong><Badge tone="amber">Medium</Badge></div><p><b>churn-predictor</b> · <code>age_band</code> moved beyond its training baseline.</p><div className="alert-meta"><span>PSI 0.27</span><span>Threshold 0.20</span><span>First seen 12m ago</span></div></div><Button variant="secondary" size="sm" onClick={onDiagnose}>Investigate</Button></div>
          <div className="alert-row"><div className="event-icon event-info"><GitBranch size={17} /></div><div className="alert-content"><div><strong>Canary ready to promote</strong><Badge tone="purple">Review</Badge></div><p><b>fraud-detector v2.4.0</b> has passed every health guardrail for 18 minutes.</p><div className="alert-meta"><span>10% traffic</span><span>0.11% errors</span><span>87 ms p95</span></div></div><Button variant="secondary" size="sm" onClick={onOpenFraud}>Review canary</Button></div>
        </div>
        <div className="card activity-card"><CardTitle title="Recent activity" subtitle="Workspace events" action={<MoreHorizontal size={18} />} />
          <div className="timeline">
            <div><span className="timeline-dot purple"><GitBranch size={12} /></span><p><strong>Canary started</strong><br />Maya deployed fraud-detector v2.4.0</p><time>18m</time></div>
            <div><span className="timeline-dot green"><Check size={12} /></span><p><strong>Scale-up completed</strong><br />recommendations-ranker · 6 → 10 replicas</p><time>1h</time></div>
            <div><span className="timeline-dot blue"><KeyRound size={12} /></span><p><strong>API key rotated</strong><br />Checkout Production</p><time>4h</time></div>
            <div><span className="timeline-dot gray"><CloudUpload size={12} /></span><p><strong>Model registered</strong><br />demand-forecast v4.2.0 by Elena Rossi</p><time>6h</time></div>
          </div>
        </div>
      </section>
    </>}
  </>;
}

function ModelsPage({ onDeploy, onToast }: { onDeploy: () => void; onToast: (title: string, detail?: string) => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All status');
  const [selected, setSelected] = useState<Model | null>(null);
  const [copied, setCopied] = useState('');
  const filtered = models.filter(m => (m.name + m.slug + m.owner).toLowerCase().includes(search.toLowerCase()) && (filter === 'All status' || m.status === filter));
  const copy = (text: string) => { navigator.clipboard?.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1500); };
  return <>
    <PageHeader eyebrow="Registry" title="Models" description="Version, govern, and deploy model artifacts from one place." actions={<><Button variant="secondary" icon={CloudUpload} onClick={() => onToast('Upload initialized', 'Drop zone opened for a new MLflow or OCI artifact.')}>Register artifact</Button><Button icon={Plus} onClick={onDeploy}>New deployment</Button></>} />
    <div className="registry-summary"><div><span>Registered models</span><strong>18</strong><small><ArrowUp size={12} /> 3 this month</small></div><div><span>Model versions</span><strong>64</strong><small>Across 5 teams</small></div><div><span>In production</span><strong>12</strong><small><span className="live-dot" /> All responding</small></div></div>
    <div className="card table-card">
      <div className="table-toolbar"><div className="field search-field"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models or owners…" />{search && <button onClick={() => setSearch('')}><X size={14} /></button>}</div><div className="toolbar-spacer" /><div className="select-wrap"><Filter size={14} /><select value={filter} onChange={e => setFilter(e.target.value)}><option>All status</option><option>Healthy</option><option>Warning</option><option>Inactive</option></select><ChevronDown size={13} /></div><Button variant="ghost" size="sm" icon={RefreshCw}>Sync MLflow</Button></div>
      <div className="table-scroll"><table><thead><tr><th>Model</th><th>Latest version</th><th>Status</th><th>Owner</th><th>Traffic (24h)</th><th>Updated</th><th /></tr></thead><tbody>{filtered.map((m, i) => <tr key={m.slug} onClick={() => setSelected(m)}><td><div className="model-cell"><span className={`model-logo logo-${i % 4}`}><Braces size={17} /></span><span><strong>{m.name}</strong><small>{m.slug} · {m.useCase}</small></span></div></td><td><div className="version-cell"><code>{m.version}</code><small>{m.framework}</small></div></td><td><Badge tone={m.status === 'Healthy' ? 'green' : m.status === 'Warning' ? 'amber' : 'neutral'} dot>{m.status}</Badge></td><td><div className="owner-cell"><Avatar name={m.owner} tone={i % 2 ? 'blue' : 'purple'} /><span>{m.owner}</span></div></td><td><strong>{m.requests}</strong><small className="block-muted">p95 {m.p95}</small></td><td><span>{m.updated}</span></td><td><button className="icon-button" onClick={e => { e.stopPropagation(); setSelected(m); }}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>
      {filtered.length === 0 && <div className="empty-state"><div><Search size={22} /></div><h3>No models match your search</h3><p>Try a different model name, owner, or status.</p><Button variant="secondary" onClick={() => { setSearch(''); setFilter('All status'); }}>Clear filters</Button></div>}
      <div className="table-footer"><span>Showing {filtered.length} of {models.length} models</span><span>Last synced with MLflow 2 minutes ago</span></div>
    </div>
    {selected && <div className="drawer-layer" onMouseDown={e => e.target === e.currentTarget && setSelected(null)}><aside className="drawer">
      <div className="drawer-head"><div className="model-title"><span className="model-logo logo-0"><Braces size={19} /></span><div><span className="eyebrow">MODEL DETAILS</span><h2>{selected.name}</h2></div></div><button onClick={() => setSelected(null)}><X size={20} /></button></div>
      <div className="drawer-body"><div className="details-status"><Badge tone={selected.status === 'Warning' ? 'amber' : selected.status === 'Inactive' ? 'neutral' : 'green'} dot>{selected.status}</Badge><span>Production</span><span>Updated {selected.updated}</span></div>
        <div className="endpoint-block"><label>Inference endpoint</label><div><code>POST {selected.endpoint}</code><button onClick={() => copy(selected.endpoint)}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div></div>
        <div className="drawer-metrics"><div><span>Requests · 24h</span><strong>{selected.requests}</strong></div><div><span>p95 latency</span><strong>{selected.p95}</strong></div><div><span>Error rate</span><strong>{selected.status === 'Inactive' ? '—' : '0.18%'}</strong></div></div>
        <section className="drawer-section"><CardTitle title="Active version" subtitle="Currently receiving production traffic" /><div className="version-card"><div><code>{selected.version}</code><Badge tone="green">Stable</Badge></div><p>{selected.framework} · linux/amd64 · 482 MB</p><div className="version-health"><span><CheckCircle2 size={14} /> Readiness passed</span><span><Activity size={14} /> 3 replicas</span></div></div></section>
        <section className="drawer-section"><CardTitle title="Recent versions" action={<button className="text-button">View all {selected.versions}</button>} /><div className="mini-version-list"><div><code>{selected.version}</code><span>Production</span><time>{selected.updated}</time></div><div><code>v{selected.version.slice(1).split('.').map((x,j) => j === 2 ? Math.max(0, Number(x)-1) : x).join('.')}</code><span>Archived</span><time>9 days ago</time></div><div><code>v{selected.version.slice(1).split('.').map((x,j) => j === 1 ? Math.max(0, Number(x)-1) : x).join('.')}</code><span>Archived</span><time>3 weeks ago</time></div></div></section>
        <section className="drawer-section"><CardTitle title="Artifact metadata" /><dl className="meta-list"><div><dt>Registry</dt><dd>mlflow://production/{selected.slug}</dd></div><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Input schema</dt><dd>validated · 18 fields</dd></div><div><dt>Artifact digest</dt><dd><code>sha256:8f2c…49ad</code></dd></div></dl></section>
      </div><div className="drawer-footer"><Button variant="secondary" icon={Eye}>View lineage</Button><Button icon={GitBranch} onClick={() => { setSelected(null); onDeploy(); }}>Deploy version</Button></div>
    </aside></div>}
  </>;
}

function DeploymentsPage({ onDeploy, onOpenFraud, newDeployment, onToast }: { onDeploy: () => void; onOpenFraud: () => void; newDeployment: boolean; onToast: (title: string, detail?: string) => void }) {
  const [tab, setTab] = useState('Active');
  return <>
    <PageHeader eyebrow="Release management" title="Deployments" description="Control traffic, validate canaries, and roll back safely." actions={<Button icon={Plus} onClick={onDeploy}>Create deployment</Button>} />
    <div className="tabs"><button className={tab === 'Active' ? 'active' : ''} onClick={() => setTab('Active')}>Active <span>4</span></button><button className={tab === 'History' ? 'active' : ''} onClick={() => setTab('History')}>History</button></div>
    {tab === 'History' ? <div className="card table-card history-table"><div className="table-scroll"><table><thead><tr><th>Deployment</th><th>Strategy</th><th>Outcome</th><th>Started by</th><th>Duration</th><th>Completed</th></tr></thead><tbody>
      <tr><td><strong>recommendations-ranker <code>v7.1.2</code></strong></td><td>Canary → promote</td><td><Badge tone="green">Succeeded</Badge></td><td>Jon Bell</td><td>24m 18s</td><td>2 hours ago</td></tr>
      <tr><td><strong>fraud-detector <code>v2.3.1</code></strong></td><td>Blue / green</td><td><Badge tone="green">Succeeded</Badge></td><td>A.M.Janjan</td><td>8m 04s</td><td>9 days ago</td></tr>
      <tr><td><strong>churn-predictor <code>v3.8.0</code></strong></td><td>Canary</td><td><Badge tone="red">Rolled back</Badge></td><td>Priya Rao</td><td>12m 42s</td><td>12 days ago</td></tr>
    </tbody></table></div></div> : <div className="deployment-list">
      {newDeployment && <div className="card deployment-row new-row"><div className="deployment-main"><span className="model-logo logo-3"><TrendingUp size={18} /></span><div><div className="deployment-name"><strong>demand-forecast</strong><code>v4.2.0</code><Badge tone="purple" dot>Canary</Badge></div><p>14-day SKU forecast · Production</p></div></div><div className="traffic-mini"><span>Traffic</span><div><i style={{ width: '10%' }} /></div><strong>10%</strong></div><div className="deployment-stat"><span>p95 latency</span><strong>151 ms</strong><small className="positive">Within guardrail</small></div><div className="deployment-stat"><span>Error rate</span><strong>0.09%</strong><small>1,284 requests</small></div><div className="deployment-actions"><Button size="sm" variant="secondary" onClick={() => onToast('Canary is still warming', 'Promotion unlocks after 5 minutes of healthy traffic.')}>View rollout</Button><MoreHorizontal size={17} /></div></div>}
      <div className="card deployment-row featured-row" onClick={onOpenFraud}><div className="deployment-main"><span className="model-logo logo-0"><ShieldCheck size={18} /></span><div><div className="deployment-name"><strong>fraud-detector</strong><code>v2.4.0</code><Badge tone="purple" dot>Canary</Badge></div><p>Real-time payments · Production</p></div></div><div className="traffic-mini"><span>Traffic</span><div><i style={{ width: '10%' }} /></div><strong>10%</strong></div><div className="deployment-stat"><span>p95 latency</span><strong>87 ms</strong><small className="positive">↓ 3.2% vs stable</small></div><div className="deployment-stat"><span>Error rate</span><strong>0.11%</strong><small>8,432 requests</small></div><div className="deployment-actions"><Button size="sm" variant="secondary" onClick={onOpenFraud}>Review canary</Button><MoreHorizontal size={17} /></div></div>
      <div className="card deployment-row"><div className="deployment-main"><span className="model-logo logo-1"><Sparkles size={18} /></span><div><div className="deployment-name"><strong>recommendations-ranker</strong><code>v7.1.2</code><Badge tone="green" dot>Stable</Badge></div><p>Home feed ranking · Production</p></div></div><div className="traffic-mini"><span>Traffic</span><div><i style={{ width: '100%', background: '#21a67a' }} /></div><strong>100%</strong></div><div className="deployment-stat"><span>p95 latency</span><strong>112 ms</strong><small className="positive">↓ 8.6% this week</small></div><div className="deployment-stat"><span>Error rate</span><strong>0.07%</strong><small>2.14M requests</small></div><div className="deployment-actions"><Button size="sm" variant="ghost">View metrics</Button><MoreHorizontal size={17} /></div></div>
      <div className="card deployment-row"><div className="deployment-main"><span className="model-logo logo-2"><TrendingUp size={18} /></span><div><div className="deployment-name"><strong>churn-predictor</strong><code>v3.8.1</code><Badge tone="amber" dot>Degraded</Badge></div><p>Retention scoring · Production</p></div></div><div className="traffic-mini"><span>Traffic</span><div><i style={{ width: '100%', background: '#e99b31' }} /></div><strong>100%</strong></div><div className="deployment-stat"><span>p95 latency</span><strong>64 ms</strong><small>Stable performance</small></div><div className="deployment-stat"><span>Feature drift</span><strong>PSI 0.27</strong><small className="warning-text">Above threshold</small></div><div className="deployment-actions"><Button size="sm" variant="ghost">Investigate</Button><MoreHorizontal size={17} /></div></div>
      <div className="card deployment-row paused"><div className="deployment-main"><span className="model-logo logo-4"><Braces size={18} /></span><div><div className="deployment-name"><strong>support-intent-router</strong><code>v1.6.3</code><Badge tone="neutral">Paused</Badge></div><p>Ticket classification · Staging</p></div></div><div className="traffic-mini"><span>Traffic</span><div><i style={{ width: '0%' }} /></div><strong>0%</strong></div><div className="deployment-stat"><span>Replicas</span><strong>0 / 3</strong><small>Scaled to zero</small></div><div className="deployment-stat"><span>Last request</span><strong>Jul 29</strong><small>13 days ago</small></div><div className="deployment-actions"><Button size="sm" variant="secondary" icon={Play}>Resume</Button><MoreHorizontal size={17} /></div></div>
    </div>}
  </>;
}

function DeploymentDetail({ split, setSplit, releaseState, setReleaseState, onBack, onToast }:
  { split: number; setSplit: (n: number) => void; releaseState: ReleaseState; setReleaseState: (s: ReleaseState) => void; onBack: () => void; onToast: (title: string, detail?: string, kind?: ToastState['kind']) => void }) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [tempSplit, setTempSplit] = useState(split);
  const [applying, setApplying] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [tab, setTab] = useState('Metrics');
  const apply = () => { setApplying(true); setTimeout(() => { setSplit(tempSplit); setReleaseState('canary'); setApplying(false); setAdjustOpen(false); onToast('Traffic split updated', `v2.4.0 is now receiving ${tempSplit}% of production traffic.`); }, 900); };
  const promote = () => { setPromoting(true); setTimeout(() => { setSplit(100); setReleaseState('promoted'); setPromoting(false); setPromoteOpen(false); onToast('v2.4.0 promoted to stable', 'All production traffic is now routed to the new model version.'); }, 1800); };
  const rollback = () => { setApplying(true); setTimeout(() => { setSplit(0); setReleaseState('rolledback'); setApplying(false); setRollbackOpen(false); onToast('Rollback completed', 'Traffic was restored to v2.3.1 with no dropped requests.', 'info'); }, 1200); };
  const statusTone = releaseState === 'rolledback' ? 'neutral' : releaseState === 'promoted' ? 'green' : 'purple';
  const statusText = releaseState === 'rolledback' ? 'Rolled back' : releaseState === 'promoted' ? 'Stable' : 'Canary running';
  return <>
    <button className="back-button" onClick={onBack}><ArrowLeft size={15} /> Deployments</button>
    <header className="detail-header"><div className="detail-title"><span className="model-logo logo-0 large"><ShieldCheck size={21} /></span><div><div className="title-row"><h1>fraud-detector</h1><code>v2.4.0</code><Badge tone={statusTone} dot>{statusText}</Badge></div><p>Production · Real-time payments · Started 18 minutes ago by A.M.Janjan</p></div></div><div className="page-actions"><Button variant="secondary" icon={RotateCcw} onClick={() => setRollbackOpen(true)} disabled={releaseState === 'rolledback'}>Rollback</Button><Button icon={CheckCircle2} onClick={() => setPromoteOpen(true)} disabled={releaseState !== 'canary'}>{releaseState === 'promoted' ? 'Promoted' : 'Promote to stable'}</Button></div></header>
    <div className="guardrail-banner"><div className="guardrail-icon"><ShieldCheck size={19} /></div><div><strong>{releaseState === 'canary' ? 'All promotion guardrails are passing' : releaseState === 'promoted' ? 'Release completed successfully' : 'Previous stable version restored'}</strong><p>{releaseState === 'canary' ? 'The canary has been healthy for 18 minutes and is ready to promote.' : releaseState === 'promoted' ? 'v2.4.0 now serves 100% of production traffic.' : 'v2.3.1 now serves 100% of production traffic.'}</p></div><span>{releaseState === 'canary' ? '4 / 4 passed' : 'No action needed'}</span></div>
    <section className="detail-summary-grid">
      <div className="card traffic-split-card"><CardTitle title="Traffic allocation" subtitle="Weighted routing · production" action={<Button size="sm" variant="secondary" icon={Settings} onClick={() => { setTempSplit(split); setAdjustOpen(true); }} disabled={releaseState === 'rolledback'}>Adjust traffic</Button>} />
        <div className="split-bar"><span className="stable-segment" style={{ width: `${100 - split}%` }} /><span className="canary-segment" style={{ width: `${split}%` }} /></div>
        <div className="split-labels"><div><i className="stable-color" /><span><strong>v2.3.1</strong><small>Previous stable</small></span><b>{100 - split}%</b></div><div><i className="canary-color" /><span><strong>v2.4.0</strong><small>{releaseState === 'promoted' ? 'Current stable' : releaseState === 'rolledback' ? 'Stopped' : 'Canary'}</small></span><b>{split}%</b></div></div>
      </div>
      <div className="card release-health"><CardTitle title="Release health" subtitle="Canary compared with stable" /><div className="compare-row"><span>p95 latency</span><strong>87 ms</strong><span className="metric-good"><ArrowDown size={12} /> 3.2%</span></div><div className="compare-row"><span>Error rate</span><strong>0.11%</strong><span className="metric-good"><ArrowDown size={12} /> 0.04%</span></div><div className="compare-row"><span>Throughput</span><strong>47 req/s</strong><span>expected</span></div><div className="compare-row"><span>Predictions</span><strong>8,432</strong><span>since start</span></div></div>
      <div className="card guardrails-card"><CardTitle title="Promotion guardrails" subtitle="Automatic release criteria" /><div className="guardrail-list"><div><Check size={14} /><span>Error rate below 0.5%</span><strong>0.11%</strong></div><div><Check size={14} /><span>p95 latency below 150 ms</span><strong>87 ms</strong></div><div><Check size={14} /><span>At least 5,000 requests</span><strong>8,432</strong></div><div><Check size={14} /><span>No input drift detected</span><strong>PSI 0.04</strong></div></div></div>
    </section>
    <div className="tabs detail-tabs"><button className={tab === 'Metrics' ? 'active' : ''} onClick={() => setTab('Metrics')}>Metrics</button><button className={tab === 'Logs' ? 'active' : ''} onClick={() => setTab('Logs')}>Request logs</button><button className={tab === 'Configuration' ? 'active' : ''} onClick={() => setTab('Configuration')}>Configuration</button><button className={tab === 'Events' ? 'active' : ''} onClick={() => setTab('Events')}>Events <span>7</span></button></div>
    {tab === 'Metrics' && <section className="detail-metrics-grid"><div className="card latency-card"><CardTitle title="Latency by version" subtitle="p95 latency · last 45 minutes" action={<div className="chart-legend multi"><span><i className="legend-navy" />v2.3.1 stable</span><span><i className="legend-purple" />v2.4.0 canary</span></div>} /><div className="chart-wrap detail-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={latencyData} margin={{ top: 12, right: 10, left: -28, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef3" /><XAxis dataKey="t" tickLine={false} axisLine={false} tick={{ fill: '#8b91a1', fontSize: 11 }} /><YAxis domain={[60, 110]} tickLine={false} axisLine={false} tick={{ fill: '#8b91a1', fontSize: 11 }} unit=" ms" /><Tooltip content={<ChartTooltip suffix=" ms" />} /><Line type="monotone" dataKey="v231" name="v2.3.1" stroke="#27314a" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="v240" name="v2.4.0" stroke="#6d5dfc" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }} /></LineChart></ResponsiveContainer></div></div>
      <div className="card prediction-card"><CardTitle title="Prediction distribution" subtitle="Canary confidence · live sample" /><div className="confidence-stat"><strong>0.921</strong><span>Median confidence <b>+1.8%</b></span></div><div className="distribution-bars">{[18,31,47,68,92,79,52,28].map((v,i) => <span key={i} style={{ height: `${v}%` }} />)}</div><div className="distribution-axis"><span>0.50</span><span>0.75</span><span>1.00</span></div><div className="distribution-note"><CheckCircle2 size={15} /> Within training baseline</div></div></section>}
    {tab === 'Logs' && <div className="card logs-panel"><div className="logs-toolbar"><div className="field search-field"><Search size={15} /><input placeholder="Filter by request ID or status…" /></div><Badge tone="green" dot>Streaming</Badge><Button variant="ghost" size="sm" icon={Pause}>Pause</Button></div><div className="log-head"><span>Timestamp</span><span>Request ID</span><span>Version</span><span>Status</span><span>Latency</span><span>Cache</span></div>{[
      ['18:42:08.381','req_8fa2c19d','v2.4.0','200','83 ms','MISS'],['18:42:08.227','req_4d90b812','v2.3.1','200','79 ms','HIT'],['18:42:07.996','req_7c138d4a','v2.3.1','200','86 ms','MISS'],['18:42:07.842','req_120a6f4c','v2.4.0','200','91 ms','MISS'],['18:42:07.684','req_392bd170','v2.3.1','200','80 ms','HIT']].map((r,i) => <div className="log-row" key={i}>{r.map((c,j) => <span key={j} className={j === 3 ? 'status-code' : ''}>{c}</span>)}</div>)}</div>}
    {tab === 'Configuration' && <div className="card config-panel"><CardTitle title="Runtime configuration" subtitle="Immutable deployment specification" /><div className="config-grid"><div><span>Artifact</span><code>mlflow://fraud-detector/2.4.0</code></div><div><span>Image</span><code>registry.acme.ai/model:8f2c49ad</code></div><div><span>Replicas</span><strong>3 (min) · 12 (max)</strong></div><div><span>Resources</span><strong>2 vCPU · 4 GiB memory</strong></div><div><span>Autoscaling target</span><strong>65% CPU utilization</strong></div><div><span>Request timeout</span><strong>2,000 ms</strong></div></div></div>}
    {tab === 'Events' && <div className="card events-panel">{['Artifact signature verified','Container image pulled','Readiness probes passed','Canary routing enabled','1,000 prediction milestone reached','All guardrails passing'].map((x,i) => <div key={x}><span className="timeline-dot green"><Check size={12} /></span><div><strong>{x}</strong><p>{i === 3 ? 'Traffic router committed weights 90 / 10' : 'Deployment controller reported successful status'}</p></div><time>{18-i*3}m ago</time></div>)}</div>}
    <Modal open={adjustOpen} onClose={() => !applying && setAdjustOpen(false)} size="md" labelledBy="adjust-title"><div className="modal-head"><div><span className="eyebrow">ROUTING CONFIGURATION</span><h2 id="adjust-title">Adjust production traffic</h2><p>Move traffic gradually while health guardrails stay active.</p></div><button onClick={() => setAdjustOpen(false)}><X size={20} /></button></div><div className="modal-body"><div className="routing-preview"><div><span>v2.3.1</span><strong>{100-tempSplit}%</strong></div><div><span>v2.4.0</span><strong className="purple-text">{tempSplit}%</strong></div></div><div className="range-wrap"><input type="range" min="0" max="100" step="5" value={tempSplit} onChange={e => setTempSplit(Number(e.target.value))} style={{ '--range': `${tempSplit}%` } as React.CSSProperties} /><div><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div></div><div className="quick-splits"><span>Quick select</span>{[5,10,25,50,100].map(v => <button className={tempSplit === v ? 'active' : ''} onClick={() => setTempSplit(v)} key={v}>{v}%</button>)}</div><div className="info-box"><ShieldCheck size={17} /><p><strong>Safe rollout enabled</strong><br />Routing changes are atomic. If a guardrail fails, traffic automatically returns to v2.3.1.</p></div></div><div className="modal-footer"><Button variant="ghost" onClick={() => setAdjustOpen(false)}>Cancel</Button><Button onClick={apply} disabled={applying}>{applying ? <><RefreshCw size={15} className="spin" /> Applying…</> : 'Apply traffic split'}</Button></div></Modal>
    <Modal open={promoteOpen} onClose={() => !promoting && setPromoteOpen(false)} size="sm" labelledBy="promote-title"><div className="modal-head compact"><div className="confirm-icon success"><CheckCircle2 size={24} /></div><button onClick={() => setPromoteOpen(false)}><X size={20} /></button></div><div className="confirm-content"><h2 id="promote-title">Promote v2.4.0 to stable?</h2><p>This will route 100% of production traffic to the canary and mark v2.3.1 as the rollback version.</p><div className="promotion-summary"><div><span>Current</span><code>v2.3.1</code></div><ArrowRight size={18} /><div><span>New stable</span><code>v2.4.0</code></div></div><label className="check-row"><input type="checkbox" defaultChecked /><span><Check size={12} /></span>Keep v2.3.1 warm for 24 hours for instant rollback</label></div><div className="modal-footer"><Button variant="ghost" onClick={() => setPromoteOpen(false)}>Cancel</Button><Button icon={CheckCircle2} onClick={promote} disabled={promoting}>{promoting ? 'Promoting safely…' : 'Promote to stable'}</Button></div>{promoting && <div className="modal-progress"><i /></div>}</Modal>
    <Modal open={rollbackOpen} onClose={() => !applying && setRollbackOpen(false)} size="sm" labelledBy="rollback-title"><div className="modal-head compact"><div className="confirm-icon warning"><RotateCcw size={23} /></div><button onClick={() => setRollbackOpen(false)}><X size={20} /></button></div><div className="confirm-content"><h2 id="rollback-title">Roll back this release?</h2><p>All traffic will return to <code>v2.3.1</code>. In-flight requests will complete before v2.4.0 is drained.</p><div className="warning-box"><AlertTriangle size={16} /><span>This action changes live production traffic.</span></div></div><div className="modal-footer"><Button variant="ghost" onClick={() => setRollbackOpen(false)}>Cancel</Button><Button variant="danger" icon={RotateCcw} onClick={rollback} disabled={applying}>{applying ? 'Rolling back…' : 'Roll back release'}</Button></div></Modal>
  </>;
}

function ObservabilityPage({ onDiagnose, onToast }: { onDiagnose: () => void; onToast: (title: string, detail?: string) => void }) {
  const [range, setRange] = useState('6h'); const [model, setModel] = useState('All production models');
  return <>
    <PageHeader eyebrow="Observability" title="Serving performance" description="Correlate model health, infrastructure, and prediction quality." actions={<><div className="select-wrap"><Globe2 size={14} /><select value={model} onChange={e => setModel(e.target.value)}><option>All production models</option><option>fraud-detector</option><option>recommendations-ranker</option><option>churn-predictor</option></select><ChevronDown size={13} /></div><div className="segmented range-control">{['1h','6h','24h','7d'].map(r => <button className={range === r ? 'active' : ''} onClick={() => setRange(r)} key={r}>{r}</button>)}</div></>} />
    <div className="service-strip"><div><span className="status-orb good"><Check size={14} /></span><p><strong>Gateway</strong><span>Operational · 99.99%</span></p></div><div><span className="status-orb good"><Check size={14} /></span><p><strong>Traffic router</strong><span>Operational · 4.2 ms</span></p></div><div><span className="status-orb good"><Check size={14} /></span><p><strong>Model runtime</strong><span>12 / 12 ready</span></p></div><div><span className="status-orb warn"><AlertTriangle size={14} /></span><p><strong>Drift monitor</strong><span>1 active alert</span></p></div></div>
    <div className="observability-kpis"><div><span>Throughput</span><strong>668 <small>req/s</small></strong><em className="positive"><ArrowUp size={12} /> 9.4%</em></div><div><span>p50 latency</span><strong>42 <small>ms</small></strong><em className="positive"><ArrowDown size={12} /> 2.1%</em></div><div><span>p95 latency</span><strong>86 <small>ms</small></strong><em className="positive"><ArrowDown size={12} /> 4.2%</em></div><div><span>Error rate</span><strong>0.18<small>%</small></strong><em className="neutral-change">Within SLO</em></div><div><span>Cache hit rate</span><strong>34.7<small>%</small></strong><em className="positive"><ArrowUp size={12} /> 3.8%</em></div></div>
    <div className="observability-grid"><div className="card wide-chart"><CardTitle title="Throughput & latency" subtitle={`${model} · ${range} window`} action={<div className="chart-legend multi"><span><i className="legend-purple" />Requests/s</span><span><i className="legend-green" />p95 latency</span></div>} /><div className="chart-wrap obs-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={metricData} margin={{ top: 12, right: -5, left: -25, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef3" /><XAxis dataKey="t" tickLine={false} axisLine={false} tick={{ fill: '#8b91a1', fontSize: 11 }} /><YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#8b91a1', fontSize: 11 }} /><YAxis yAxisId="right" orientation="right" domain={[60, 100]} tickLine={false} axisLine={false} tick={{ fill: '#8b91a1', fontSize: 11 }} unit="ms" /><Tooltip content={<ChartTooltip />} /><Bar yAxisId="left" dataKey="throughput" name="Throughput" fill="#d9d5ff" radius={[4,4,0,0]} barSize={25} /><Line yAxisId="right" type="monotone" dataKey="latency" name="Latency" stroke="#21a67a" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer></div></div>
      <div className="card slo-card"><CardTitle title="SLO budget" subtitle="30-day rolling window" action={<Badge tone="green">On track</Badge>} /><div className="slo-gauge"><div className="slo-ring"><span><strong>92.4%</strong><small>remaining</small></span></div></div><div className="slo-details"><div><span>Availability SLO</span><strong>99.95%</strong></div><div><span>Current</span><strong>99.982%</strong></div><div><span>Budget remaining</span><strong>33m 08s</strong></div></div></div>
      <div className="card alert-table"><CardTitle title="Active alerts" subtitle="Signals requiring attention" action={<Badge tone="amber">2 active</Badge>} /><div className="obs-alert"><span className="severity medium">MED</span><div><strong>Feature drift above threshold</strong><p>churn-predictor · age_band · PSI 0.27</p></div><span>12m</span><Button size="sm" variant="secondary" onClick={onDiagnose}>Diagnose</Button></div><div className="obs-alert"><span className="severity low">LOW</span><div><strong>Replica saturation projected</strong><p>recommendations-ranker · peak forecast in 34m</p></div><span>28m</span><Button size="sm" variant="ghost" onClick={() => onToast('Autoscaling policy opened', 'Current policy scales from 6 to 18 replicas at 65% CPU.')}>Review</Button></div></div>
      <div className="card endpoint-table"><CardTitle title="Endpoint performance" subtitle="Sorted by request volume" action={<button className="text-button">View traces <ArrowRight size={14} /></button>} /><div className="endpoint-head"><span>Endpoint</span><span>Req/s</span><span>p95</span><span>Errors</span><span>Health</span></div>{[['fraud-detector','386','87 ms','0.11%','Healthy'],['recommendations-ranker','184','112 ms','0.07%','Healthy'],['churn-predictor','72','64 ms','0.24%','Drift'],['demand-forecast','26','148 ms','0.09%','Healthy']].map(r => <div className="endpoint-row" key={r[0]}><span><code>{r[0]}</code></span><strong>{r[1]}</strong><span>{r[2]}</span><span>{r[3]}</span><Badge tone={r[4] === 'Drift' ? 'amber' : 'green'} dot>{r[4]}</Badge></div>)}</div>
    </div>
  </>;
}

function ConsumersPage({ onToast }: { onToast: (title: string, detail?: string, kind?: ToastState['kind']) => void }) {
  const [createOpen, setCreateOpen] = useState(false); const [keyOpen, setKeyOpen] = useState(false); const [created, setCreated] = useState(false); const [copied, setCopied] = useState(false);
  const create = () => { setCreated(true); setTimeout(() => { setCreateOpen(false); setKeyOpen(true); }, 700); };
  return <>
    <PageHeader eyebrow="Gateway security" title="API consumers" description="Manage credentials, rate limits, and endpoint access." actions={<Button icon={Plus} onClick={() => { setCreated(false); setCreateOpen(true); }}>Create consumer</Button>} />
    <div className="security-banner"><ShieldCheck size={21} /><div><strong>Gateway protection is active</strong><p>Every request is authenticated, rate-limited, and logged with a correlation ID.</p></div><Badge tone="green" dot>All systems operational</Badge></div>
    <div className="consumer-grid"><div className="card consumer-card"><div className="consumer-head"><div className="consumer-logo checkout"><Zap size={18} /></div><div><h3>Checkout Production</h3><p>Payments platform · Production</p></div><Badge tone="green" dot>Active</Badge><MoreHorizontal size={17} /></div><div className="consumer-key"><span>API key</span><code>mf_live_••••••••••••7H2K</code><button onClick={() => setKeyOpen(true)}><RotateCcw size={14} /> Rotate</button></div><div className="quota"><div><span>Quota usage</span><strong>6.8M / 10M requests</strong></div><div><i style={{ width: '68%' }} /></div><small>Resets in 19 days</small></div><div className="consumer-meta"><span><Gauge size={14} /> 2,500 req/min</span><span><Boxes size={14} /> 2 models</span><span><Clock3 size={14} /> Used 38s ago</span></div></div>
      <div className="card consumer-card"><div className="consumer-head"><div className="consumer-logo feed"><Sparkles size={18} /></div><div><h3>Home Feed Service</h3><p>Discovery platform · Production</p></div><Badge tone="green" dot>Active</Badge><MoreHorizontal size={17} /></div><div className="consumer-key"><span>API key</span><code>mf_live_••••••••••••P9QD</code><button onClick={() => setKeyOpen(true)}><RotateCcw size={14} /> Rotate</button></div><div className="quota"><div><span>Quota usage</span><strong>3.2M / 8M requests</strong></div><div><i style={{ width: '40%' }} /></div><small>Resets in 19 days</small></div><div className="consumer-meta"><span><Gauge size={14} /> 1,800 req/min</span><span><Boxes size={14} /> 1 model</span><span><Clock3 size={14} /> Used 4m ago</span></div></div>
      <div className="card consumer-card"><div className="consumer-head"><div className="consumer-logo analyst"><UserRound size={18} /></div><div><h3>Risk Analytics Sandbox</h3><p>Risk ML · Development</p></div><Badge tone="amber" dot>Rate limited</Badge><MoreHorizontal size={17} /></div><div className="consumer-key"><span>API key</span><code>mf_test_••••••••••••M4XR</code><button onClick={() => setKeyOpen(true)}><RotateCcw size={14} /> Rotate</button></div><div className="quota"><div><span>Quota usage</span><strong>92K / 100K requests</strong></div><div><i className="warning-fill" style={{ width: '92%' }} /></div><small>Resets in 7 hours</small></div><div className="consumer-meta"><span><Gauge size={14} /> 120 req/min</span><span><Boxes size={14} /> 3 models</span><span><Clock3 size={14} /> Used 16m ago</span></div></div>
    </div>
    <div className="card access-table"><CardTitle title="Recent gateway activity" subtitle="Authentication and rate-limit events" action={<Button variant="ghost" size="sm" icon={ExternalLink}>Audit log</Button>} /><div className="endpoint-head activity-head"><span>Consumer</span><span>Event</span><span>Endpoint</span><span>Source IP</span><span>Time</span></div>{[
      ['Checkout Production','Request allowed','fraud-detector','34.88.142.17','38s ago'],['Home Feed Service','Request allowed','recommendations-ranker','10.24.8.91','4m ago'],['Risk Analytics Sandbox','Rate limit exceeded','fraud-detector','10.18.4.22','16m ago'],['Unknown credential','Authentication failed','—','185.32.9.104','41m ago']].map((r,i) => <div className="endpoint-row activity-row" key={i}><strong>{r[0]}</strong><Badge tone={i === 2 ? 'amber' : i === 3 ? 'red' : 'green'}>{r[1]}</Badge><code>{r[2]}</code><code>{r[3]}</code><span>{r[4]}</span></div>)}</div>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} size="md"><div className="modal-head"><div><span className="eyebrow">NEW API CONSUMER</span><h2>Create gateway credential</h2><p>Define who can call which model endpoints.</p></div><button onClick={() => setCreateOpen(false)}><X size={20} /></button></div><div className="modal-body form-stack"><label>Consumer name<input defaultValue="Inventory Planning Service" /></label><label>Environment<select defaultValue="Production"><option>Production</option><option>Staging</option><option>Development</option></select></label><label>Allowed model endpoints<div className="permission-list"><label><input type="checkbox" defaultChecked /> demand-forecast <code>/v1/predict/demand-forecast</code></label><label><input type="checkbox" /> fraud-detector <code>/v1/predict/fraud-detector</code></label><label><input type="checkbox" /> churn-predictor <code>/v1/predict/churn-predictor</code></label></div></label><div className="two-fields"><label>Rate limit<input type="number" defaultValue="600" /></label><label>Window<select><option>requests / minute</option><option>requests / hour</option></select></label></div></div><div className="modal-footer"><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button icon={KeyRound} onClick={create}>{created ? 'Creating…' : 'Create credential'}</Button></div></Modal>
    <Modal open={keyOpen} onClose={() => setKeyOpen(false)} size="sm"><div className="modal-head compact"><div className="confirm-icon success"><KeyRound size={23} /></div><button onClick={() => setKeyOpen(false)}><X size={20} /></button></div><div className="confirm-content"><h2>API key generated</h2><p>Copy this key now. For security, it will not be shown again.</p><div className="secret-key"><code>mf_live_4Kp9Yw8X2qN7cR6H</code><button onClick={() => { navigator.clipboard?.writeText('mf_live_4Kp9Yw8X2qN7cR6H'); setCopied(true); onToast('API key copied', 'Store it securely in your secret manager.'); }}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div><div className="warning-box"><AlertTriangle size={16} /><span>The previous key remains valid for a 24-hour grace period.</span></div></div><div className="modal-footer"><Button onClick={() => setKeyOpen(false)}>Done</Button></div></Modal>
  </>;
}

function DriftDiagnostics({ open, onClose, onToast }: { open: boolean; onClose: () => void; onToast: (title: string, detail?: string) => void }) {
  const [loading, setLoading] = useState(true); const [sample, setSample] = useState(false);
  useEffect(() => { if (open) { setLoading(true); const t = setTimeout(() => setLoading(false), 1100); return () => clearTimeout(t); } }, [open]);
  return <Modal open={open} onClose={onClose} size="lg"><div className="modal-head"><div><span className="eyebrow">DRIFT DIAGNOSTICS</span><h2>churn-predictor · v3.8.1</h2><p>Comparing the last 6 hours against the training baseline.</p></div><button onClick={onClose}><X size={20} /></button></div>{loading ? <div className="diagnostic-loading"><div className="scan-icon"><WandSparkles size={24} /></div><h3>Analyzing prediction inputs…</h3><p>Computing feature distributions across 118,420 requests.</p><div className="progress-bar"><i /></div></div> : <><div className="modal-body diagnostics-body"><div className="diagnostic-verdict"><div className="event-icon event-warning"><AlertTriangle size={18} /></div><div><strong>Moderate feature drift detected</strong><p>One feature crossed its warning threshold. Model performance remains inside the business SLO.</p></div><Badge tone="amber">PSI 0.27</Badge></div><div className="diagnostic-grid"><div className="drift-chart"><CardTitle title="age_band distribution" subtitle="Training baseline vs live traffic" /><div className="bars-comparison">{[['18–24',26,17],['25–34',42,29],['35–44',58,45],['45–54',49,61],['55–64',31,54],['65+',18,37]].map(r => <div key={r[0]}><span>{r[0]}</span><div><i className="baseline" style={{ height: `${r[1]}px` }} /><i className="current" style={{ height: `${r[2]}px` }} /></div></div>)}</div><div className="chart-legend multi center"><span><i className="legend-gray" />Training baseline</span><span><i className="legend-purple" />Live · 6h</span></div></div><div className="diagnostic-findings"><h3>Findings</h3><div><span>Population stability index</span><strong className="warning-text">0.27</strong></div><div><span>Warning threshold</span><strong>0.20</strong></div><div><span>Affected requests</span><strong>31.4%</strong></div><div><span>Prediction delta</span><strong>+2.3%</strong></div><div className="suggestion"><Sparkles size={16} /><p><strong>Recommended action</strong><br />Monitor for 12 more hours. Sample affected requests for labeling before retraining.</p></div></div></div><label className="check-row sample-check"><input type="checkbox" checked={sample} onChange={e => setSample(e.target.checked)} /><span><Check size={12} /></span>Capture 5% of affected requests for the next training dataset</label></div><div className="modal-footer"><Button variant="ghost" onClick={onClose}>Close</Button><Button variant="secondary" icon={Bell} onClick={() => onToast('Alert threshold updated', 'You will be notified if PSI exceeds 0.35.')}>Tune alert</Button><Button icon={Database} onClick={() => { onToast('Drift sample created', sample ? 'Sampling 5% of affected requests with PII redaction enabled.' : 'A snapshot of affected requests is ready for review.'); onClose(); }}>Create data sample</Button></div></>}</Modal>;
}

function DeployWizard({ open, onClose, onComplete }: { open: boolean; onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1); const [strategy, setStrategy] = useState('canary'); const [traffic, setTraffic] = useState(10); const [stage, setStage] = useState(-1); const [done, setDone] = useState(false);
  useEffect(() => { if (open) { setStep(1); setStrategy('canary'); setTraffic(10); setStage(-1); setDone(false); } }, [open]);
  const launch = () => { setStage(0); [1,2,3,4].forEach((s,i) => setTimeout(() => { setStage(s); if (s === 4) setTimeout(() => setDone(true), 350); }, (i+1)*700)); };
  const close = () => { if (stage >= 0 && !done) return; onClose(); };
  const stages = ['Validating artifact signature', 'Scheduling model containers', 'Waiting for readiness probes', 'Updating traffic router'];
  return <Modal open={open} onClose={close} size="xl"><div className="wizard-shell"><aside className="wizard-sidebar"><div className="brand wizard-brand"><div className="brand-mark"><Layers3 size={19} /></div><strong>New deployment</strong></div><div className="wizard-steps">{[['1','Select version','Choose an artifact'],['2','Configure rollout','Set traffic strategy'],['3','Review & deploy','Confirm safeguards']].map((s,i) => <div className={cx(i+1 === step && 'active', i+1 < step && 'complete')} key={s[0]}><span>{i+1 < step ? <Check size={14} /> : s[0]}</span><p><strong>{s[1]}</strong><small>{s[2]}</small></p></div>)}</div><div className="wizard-tip"><ShieldCheck size={17} /><p><strong>Zero-downtime deploy</strong><br />ModelForge waits for healthy replicas before changing traffic.</p></div></aside><main className="wizard-main">{!done && stage < 0 && <><div className="wizard-head"><div><span className="eyebrow">STEP {step} OF 3</span><h2>{step === 1 ? 'Select a model version' : step === 2 ? 'Choose a rollout strategy' : 'Review your deployment'}</h2><p>{step === 1 ? 'Pick a registered artifact to deploy into production.' : step === 2 ? 'Control how the new version receives live traffic.' : 'Validate the release plan before it changes production.'}</p></div><button onClick={onClose}><X size={20} /></button></div><div className="wizard-body">
          {step === 1 && <div className="form-stack"><label>Model<div className="select-input"><span className="model-logo logo-3"><TrendingUp size={17} /></span><select defaultValue="demand-forecast"><option value="demand-forecast">Demand Forecast</option><option>Fraud Detector</option><option>Churn Predictor</option></select><ChevronDown size={15} /></div></label><div className="two-fields"><label>Version<select defaultValue="v4.2.0"><option>v4.2.0</option><option>v4.1.0</option><option>v4.0.2</option></select></label><label>Environment<select defaultValue="Production"><option>Production</option><option>Staging</option></select></label></div><div className="artifact-card"><div><CloudUpload size={19} /><span><strong>demand-forecast · v4.2.0</strong><small>Registered 6 hours ago by Elena Rossi</small></span><Badge tone="green"><Check size={12} /> Verified</Badge></div><dl><div><dt>Framework</dt><dd>TensorFlow 2.16</dd></div><div><dt>Artifact size</dt><dd>684 MB</dd></div><div><dt>Input schema</dt><dd>42 features · valid</dd></div><div><dt>Model signature</dt><dd><code>8f2c…49ad</code></dd></div></dl></div><label className="field-label">Deployment name<input defaultValue="demand-forecast-v4-2-production" /></label></div>}
          {step === 2 && <><div className="strategy-list"><button className={strategy === 'canary' ? 'active' : ''} onClick={() => setStrategy('canary')}><span className="strategy-icon"><GitBranch size={19} /></span><div><strong>Canary rollout</strong><p>Send a small percentage to v4.2.0, then promote when healthy.</p><Badge tone="purple">Recommended</Badge></div><span className="radio"><i /></span></button><button className={strategy === 'bluegreen' ? 'active' : ''} onClick={() => setStrategy('bluegreen')}><span className="strategy-icon blue"><Layers3 size={19} /></span><div><strong>Blue / green</strong><p>Prepare the new version, then switch all traffic atomically.</p></div><span className="radio"><i /></span></button><button className={strategy === 'shadow' ? 'active' : ''} onClick={() => setStrategy('shadow')}><span className="strategy-icon gray"><Eye size={19} /></span><div><strong>Shadow traffic</strong><p>Mirror requests without returning new predictions to clients.</p></div><span className="radio"><i /></span></button></div>{strategy === 'canary' && <div className="traffic-config"><div><label>Initial canary traffic</label><strong>{traffic}%</strong></div><input type="range" min="5" max="50" step="5" value={traffic} onChange={e => setTraffic(Number(e.target.value))} style={{ '--range': `${(traffic-5)/45*100}%` } as React.CSSProperties} /><div className="range-labels"><span>5% safest</span><span>50% fastest</span></div></div>}</>}
          {step === 3 && <div className="review-layout"><div className="review-card"><h3>Release plan</h3><div><span>Model</span><strong>demand-forecast</strong></div><div><span>Version</span><code>v4.2.0</code></div><div><span>Environment</span><Badge tone="green" dot>Production</Badge></div><div><span>Strategy</span><strong>{strategy === 'canary' ? `Canary · ${traffic}% initial` : strategy === 'bluegreen' ? 'Blue / green' : 'Shadow traffic'}</strong></div><div><span>Compute</span><strong>3–12 replicas · CPU</strong></div></div><div className="safeguard-card"><h3>Automated safeguards</h3><label><span><Check size={13} /></span><p><strong>Readiness gate</strong><small>All replicas must pass health checks</small></p><input type="checkbox" defaultChecked /></label><label><span><Check size={13} /></span><p><strong>Automatic rollback</strong><small>On error rate &gt; 0.5% for 2 min</small></p><input type="checkbox" defaultChecked /></label><label><span><Check size={13} /></span><p><strong>Latency guardrail</strong><small>p95 must remain below 250 ms</small></p><input type="checkbox" defaultChecked /></label><label><span><Check size={13} /></span><p><strong>Keep previous version warm</strong><small>Instant rollback for 24 hours</small></p><input type="checkbox" defaultChecked /></label></div><div className="deploy-command"><div><TerminalSquare size={16} /><span>Equivalent CLI command</span><button><Copy size={14} /></button></div><code>mf deploy demand-forecast@v4.2.0 --strategy canary --traffic {traffic}</code></div></div>}
        </div><div className="wizard-footer"><Button variant="ghost" onClick={() => step === 1 ? onClose() : setStep(step-1)}>{step === 1 ? 'Cancel' : 'Back'}</Button><div className="wizard-footer-note"><ShieldCheck size={14} /> Changes are recorded in the audit log</div><Button icon={step === 3 ? CloudUpload : ArrowRight} onClick={() => step < 3 ? setStep(step+1) : launch()}>{step === 3 ? 'Deploy to production' : 'Continue'}</Button></div></>}
        {stage >= 0 && !done && <div className="deployment-progress"><div className="progress-visual"><div className="pulse-rings"><CloudUpload size={26} /></div></div><span className="eyebrow">DEPLOYING TO PRODUCTION</span><h2>Launching demand-forecast v4.2.0</h2><p>ModelForge is preparing a zero-downtime canary release.</p><div className="stage-list">{stages.map((s,i) => <div className={cx(i < stage && 'complete', i === stage && 'running')} key={s}><span>{i < stage ? <Check size={13} /> : i === stage ? <RefreshCw size={13} className="spin" /> : i+1}</span><p>{s}</p>{i < stage && <small>Done</small>}</div>)}</div></div>}
        {done && <div className="deployment-success"><div className="success-check"><Check size={31} /></div><span className="eyebrow">DEPLOYMENT STARTED</span><h2>Your canary is live</h2><p>demand-forecast v4.2.0 is receiving {traffic}% of production traffic. Health guardrails are monitoring every request.</p><div className="success-details"><div><span>Deployment ID</span><code>dep_9f4a2c81</code></div><div><span>Ready replicas</span><strong>3 / 3</strong></div><div><span>Traffic</span><strong>{traffic}% canary</strong></div></div><Button icon={BarChart3} onClick={onComplete}>View deployment</Button><button className="text-button" onClick={onComplete}>Return to deployments</button></div>}
      </main></div></Modal>;
}

function CommandPalette({ open, onClose, onNavigate, onOpenFraud, onDeploy }: { open: boolean; onClose: () => void; onNavigate: (p: Page) => void; onOpenFraud: () => void; onDeploy: () => void }) {
  const [q, setQ] = useState(''); useEffect(() => { if (open) setQ(''); }, [open]);
  const items = [
    { label: 'Open fraud-detector canary', hint: 'Deployment', icon: GitBranch, action: onOpenFraud },
    { label: 'Deploy a model version', hint: 'Action', icon: CloudUpload, action: onDeploy },
    { label: 'View model registry', hint: 'Navigation', icon: Boxes, action: () => onNavigate('models') },
    { label: 'Investigate serving metrics', hint: 'Navigation', icon: BarChart3, action: () => onNavigate('observability') },
    { label: 'Manage API consumers', hint: 'Navigation', icon: KeyRound, action: () => onNavigate('consumers') },
  ].filter(i => i.label.toLowerCase().includes(q.toLowerCase()));
  return <Modal open={open} onClose={onClose} size="md"><div className="palette-search"><Search size={19} /><input autoFocus placeholder="Search models, deployments, or actions…" value={q} onChange={e => setQ(e.target.value)} /><kbd>ESC</kbd></div><div className="palette-body"><span className="palette-label">{q ? 'RESULTS' : 'QUICK ACTIONS'}</span>{items.map((item,i) => <button key={item.label} onClick={() => { item.action(); onClose(); }}><span><item.icon size={17} /></span><p><strong>{item.label}</strong><small>{item.hint}</small></p>{i === 0 && !q && <kbd>↵</kbd>}<ChevronRight size={15} /></button>)}{!items.length && <div className="palette-empty">No results for “{q}”</div>}</div><div className="palette-footer"><span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span><span><kbd>↵</kbd> to select</span></div></Modal>;
}

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [detail, setDetail] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [palette, setPalette] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [diagnostics, setDiagnostics] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [split, setSplit] = useState(10);
  const [releaseState, setReleaseState] = useState<ReleaseState>('canary');
  const [newDeployment, setNewDeployment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const toast = (title: string, detail?: string, kind: ToastState['kind'] = 'success') => { const id = Date.now(); setToasts(t => [...t, { id, title, detail, kind }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000); };
  const navigate = (p: Page) => { setPage(p); setDetail(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openFraud = () => { setPage('deployments'); setDetail(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => { const fn = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); } }; document.addEventListener('keydown', fn); return () => document.removeEventListener('keydown', fn); }, []);
  let content: React.ReactNode;
  if (page === 'overview') content = <Overview onNavigate={navigate} onDeploy={() => setWizard(true)} onOpenFraud={openFraud} onDiagnose={() => setDiagnostics(true)} refreshing={refreshing} setRefreshing={setRefreshing} />;
  else if (page === 'models') content = <ModelsPage onDeploy={() => setWizard(true)} onToast={toast} />;
  else if (page === 'deployments' && detail) content = <DeploymentDetail split={split} setSplit={setSplit} releaseState={releaseState} setReleaseState={setReleaseState} onBack={() => setDetail(false)} onToast={toast} />;
  else if (page === 'deployments') content = <DeploymentsPage onDeploy={() => setWizard(true)} onOpenFraud={openFraud} newDeployment={newDeployment} onToast={toast} />;
  else if (page === 'observability') content = <ObservabilityPage onDiagnose={() => setDiagnostics(true)} onToast={toast} />;
  else content = <ConsumersPage onToast={toast} />;
  return <div className="app-shell">
    <Sidebar page={page} onNavigate={navigate} collapsed={mobileNav} onClose={() => setMobileNav(false)} />
    {mobileNav && <div className="mobile-scrim" onClick={() => setMobileNav(false)} />}
    <div className="app-main"><Topbar onMenu={() => setMobileNav(true)} onCommand={() => setPalette(true)} showNotifications={notifications} setShowNotifications={setNotifications} /><main className="page-content">{content}<footer className="app-footer"><span>ModelForge Control Plane</span><span><i className="live-dot" /> All systems operational</span><span>API v1.18.4</span></footer></main></div>
    <DeployWizard open={wizard} onClose={() => setWizard(false)} onComplete={() => { setWizard(false); setNewDeployment(true); navigate('deployments'); toast('Deployment is live', 'demand-forecast v4.2.0 is receiving 10% production traffic.'); }} />
    <DriftDiagnostics open={diagnostics} onClose={() => setDiagnostics(false)} onToast={toast} />
    <CommandPalette open={palette} onClose={() => setPalette(false)} onNavigate={navigate} onOpenFraud={openFraud} onDeploy={() => setWizard(true)} />
    <Toasts toasts={toasts} dismiss={id => setToasts(t => t.filter(x => x.id !== id))} />
  </div>;
}

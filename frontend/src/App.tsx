import { useState, useEffect, useCallback, useContext, useRef } from 'react'
import {
  useAccount, useReadContract, useReadContracts, useWriteContract,
  useWaitForTransactionReceipt, useSwitchChain, useConnect, useDisconnect,
} from 'wagmi'
import { erc20Abi } from 'viem'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus, Trophy, Users, Clock, Ticket,
  CheckCircle, XCircle, Loader2, Zap,
  Share2, Copy, Moon, Sun, Globe, ChevronDown, ChevronUp, ChevronRight,
  LogOut, Wallet,
} from 'lucide-react'
import { RAFFLE_ABI, RAFFLE_ADDRESS, TREASURY_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from './raffle-abi'
import { LANGUAGES, type Lang, useTranslation } from './i18n'
import { type Theme, light, dark, goldGradient, goldGradientHoriz } from './theme'
import { ThemeCtx, LangCtx } from './contexts'
import { HomePage } from './HomePage'

// ─── Chain ────────────────────────────────────────────────────────────────────
const ARC_CHAIN_ID = 5042
const EXPLORER = 'https://explorer.arc.io'
const APP_URL = 'https://lottoarc.vercel.app'
const PAGE_SIZE = 20
const GOLD = '#C9A84C'
const GOLD_BRIGHT = '#E5C566'
const GOLD_DARK = '#A07820'
// APP_URL kept for reference; ShareModal uses window.location.origin for portability
void (typeof APP_URL)

// ─── Context hooks ────────────────────────────────────────────────────────────
function useTheme() { return useContext(ThemeCtx) }
function useLang() { return useContext(LangCtx) }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (raw: bigint, dec = USDC_DECIMALS) =>
  (Number(raw) / 10 ** dec).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
const countdown = (secs: number) => {
  if (secs <= 0) return '—'
  if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
  if (secs >= 60) return `${Math.floor(secs / 60)}m ${secs % 60}s`
  return `${secs}s`
}
function parseError(err: unknown): string {
  const m = (err as { message?: string })?.message?.toLowerCase() ?? ''
  if (m.includes('user rejected') || m.includes('user denied')) return 'Cancelled.'
  if (m.includes('insufficient')) return 'Insufficient USDC.'
  const r = m.match(/reason="([^"]+)"/)
  if (r) return r[1]
  if (m.includes('reverted')) return 'Transaction reverted.'
  return 'Something went wrong.'
}

type PoolData = {
  poolId: bigint; maxTickets: bigint; entryFee: bigint; durationSeconds: bigint
  createdAt: bigint; deadlineTimestamp: bigint; tickets: readonly string[]
  drawBlock: bigint; commitDeadlineBlock: bigint; firstTicketTimestamp: bigint
  autoDrawTimestamp: bigint; status: number
}
const STATUS_OPEN = 0
const STATUS_DRAW_SCHEDULED = 1
const STATUS_CLOSED = 2
const STATUS_CANCELLED = 3

// ─── CSS helpers ──────────────────────────────────────────────────────────────
const display: React.CSSProperties = { fontFamily: "'Cinzel','Playfair Display',serif", letterSpacing: '-0.01em' }
const body: React.CSSProperties = { fontFamily: "'DM Sans',sans-serif" }
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono','Menlo',monospace" }

function goldCard(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'rgba(20,16,0,0.65)' : 'rgba(255,250,235,0.88)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: `1px solid ${isDark ? 'rgba(201,168,76,0.22)' : 'rgba(160,120,32,0.22)'}`,
    boxShadow: isDark
      ? '0 8px 40px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(201,168,76,0.1) inset'
      : '0 4px 20px rgba(100,70,0,0.1)',
  }
}
function innerBox(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'rgba(201,168,76,0.05)' : 'rgba(160,120,32,0.06)',
    border: `1px solid ${isDark ? 'rgba(201,168,76,0.14)' : 'rgba(160,120,32,0.18)'}`,
  }
}

// ─── Spin ─────────────────────────────────────────────────────────────────────
function Spin({ size = 14 }: { size?: number }) {
  return <Loader2 size={size} style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
}

// ─── Logo SVG ─────────────────────────────────────────────────────────────────
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_DARK}/>
          <stop offset="40%" stopColor={GOLD}/>
          <stop offset="70%" stopColor={GOLD_BRIGHT}/>
          <stop offset="100%" stopColor={GOLD_DARK}/>
        </linearGradient>
      </defs>
      <path d="M20 100 L20 57 Q20 16 60 16 Q100 16 100 57 L100 100" stroke="url(#lg)" strokeWidth="8.5" strokeLinecap="round" fill="none"/>
      <path d="M60 33 C60 33 37 52 37 67 C37 75.5 43.5 80 52 77.5 C49 83.5 45.5 87.5 41 90 L79 90 C74.5 87.5 71 83.5 68 77.5 C76.5 80 83 75.5 83 67 C83 52 60 33 60 33Z" fill="url(#lg)"/>
    </svg>
  )
}

// ─── GoldBtn ──────────────────────────────────────────────────────────────────
function GoldBtn({ children, onClick, disabled, outline, danger, full }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
  outline?: boolean; danger?: boolean; full?: boolean
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const base: React.CSSProperties = {
    ...body, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
    borderRadius: 12, fontWeight: 700, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    width: full ? '100%' : undefined,
    padding: '11px 18px', border: 'none', transition: 'opacity 0.15s, transform 0.1s',
  }
  if (danger) return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: 'transparent', border: '1.5px solid rgba(248,113,113,0.35)', color: '#F87171' }}>{children}</button>
  )
  if (outline) return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: 'transparent', border: `1.5px solid ${isDark ? 'rgba(201,168,76,0.3)' : 'rgba(160,120,32,0.3)'}`, color: isDark ? GOLD : GOLD_DARK }}>{children}</button>
  )
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: goldGradient, color: '#0D0D0D', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>{children}</button>
  )
}

// ─── Wallet icon SVGs (inline, no external dep) ───────────────────────────────
function WalletIcon({ name, size = 22 }: { name: string; size?: number }) {
  const n = name.toLowerCase()
  // MetaMask — fox orange
  if (n.includes('metamask')) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#F6851B"/>
      <path d="M26 6L18.2 11.8l1.5-3.5L26 6z" fill="#E2761B" stroke="#E2761B" strokeWidth=".2"/>
      <path d="M6 6l7.7 5.9-1.4-3.5L6 6z" fill="#E4761B" stroke="#E4761B" strokeWidth=".2"/>
      <path d="M23.3 21.4l-2.1 3.2 4.5 1.2 1.3-4.3-3.7-.1z" fill="#E4761B"/>
      <path d="M5 21.5l1.2 4.3 4.5-1.2-2.1-3.2-3.6.1z" fill="#E4761B"/>
      <path d="M10.4 14.6l-1.2 1.8 4.3.2-.1-4.7-3 2.7z" fill="#E4761B"/>
      <path d="M21.6 14.6l-3-2.8-.1 4.8 4.3-.2-1.2-1.8z" fill="#E4761B"/>
      <path d="M10.5 24.6l2.6-1.3-2.2-1.7-.4 3z" fill="#E4761B"/>
      <path d="M18.9 23.3l2.6 1.3-.4-3-2.2 1.7z" fill="#E4761B"/>
    </svg>
  )
  // Coinbase — blue
  if (n.includes('coinbase')) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0052FF"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <rect x="12" y="13.5" width="8" height="5" rx="2.5" fill="#0052FF"/>
    </svg>
  )
  // WalletConnect — blue gradient
  if (n.includes('walletconnect') || n.includes('wallet connect')) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#3B99FC"/>
      <path d="M9.6 13.2c3.5-3.4 9.3-3.4 12.8 0l.4.4c.2.2.2.5 0 .7l-1.4 1.4c-.1.1-.3.1-.4 0l-.6-.6c-2.5-2.4-6.4-2.4-8.9 0l-.6.6c-.1.1-.3.1-.4 0L9.1 14c-.2-.2-.2-.5 0-.7l.5-.1zm15.8 2.9l1.3 1.2c.2.2.2.5 0 .7l-5.6 5.5c-.2.2-.5.2-.7 0l-4-3.9c-.1-.1-.2-.1-.4 0l-4 3.9c-.2.2-.5.2-.7 0L5.6 18c-.2-.2-.2-.5 0-.7l1.3-1.2c.2-.2.5-.2.7 0l4 3.9c.1.1.2.1.4 0l4-3.9c.2-.2.5-.2.7 0l4 3.9c.1.1.2.1.4 0l4-3.9c.1-.2.4-.2.6 0z" fill="white"/>
    </svg>
  )
  // Trust Wallet
  if (n.includes('trust')) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#3375BB"/>
      <path d="M16 6l8 3.5v6c0 5-3.5 9.2-8 10.5C11.5 24.7 8 20.5 8 15.5v-6L16 6z" fill="white" fillOpacity=".9"/>
      <path d="M13 16l2 2 4-4" stroke="#3375BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  // Brave Wallet
  if (n.includes('brave')) return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FF5500"/>
      <path d="M16 5l2.5 1.5 3 6-1 2.5 1.5 3.5-1 3L16 26l-5-4.5-1-3 1.5-3.5-1-2.5 3-6L16 5z" fill="white" fillOpacity=".9"/>
    </svg>
  )
  // Default injected
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={GOLD}/>
      <rect x="7" y="12" width="18" height="13" rx="3" stroke="#0D0D0D" strokeWidth="2" fill="none"/>
      <path d="M10 12V10a6 6 0 0112 0v2" stroke="#0D0D0D" strokeWidth="2" fill="none"/>
      <circle cx="16" cy="18" r="2" fill="#0D0D0D"/>
    </svg>
  )
}

// ─── WalletButton ─────────────────────────────────────────────────────────────
function WalletButton() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { t } = useLang()
  const isWrongChain = isConnected && chainId !== ARC_CHAIN_ID

  // ALL hooks must be at top level — no hooks after conditional return
  const [open, setOpen] = useState(false)
  const [showConnectors, setShowConnectors] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const connRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (!showConnectors) return
    const h = (e: MouseEvent) => { if (connRef.current && !connRef.current.contains(e.target as Node)) setShowConnectors(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showConnectors])

  const dropBg = isDark ? '#1A1A0F' : '#FFFBEF'
  const dropBorder = isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'

  // Deduplicate connectors by name
  const seen = new Set<string>()
  const uniqueConns = connectors.filter(c => { if (seen.has(c.name)) return false; seen.add(c.name); return true })

  // Wrong chain
  if (isConnected && isWrongChain) {
    return (
      <button onClick={() => switchChain({ chainId: ARC_CHAIN_ID })} style={{
        ...body, fontSize: 12, fontWeight: 800, padding: '8px 14px', borderRadius: 10,
        background: 'rgba(248,113,113,0.12)', border: '1.5px solid rgba(248,113,113,0.5)',
        color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        animation: 'pulse 2s infinite',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F87171', display: 'inline-block' }} />
        Switch to Arc
      </button>
    )
  }

  // Connected — address + dropdown
  if (isConnected && address) {
    const btnBg = isDark ? 'rgba(201,168,76,0.1)' : 'rgba(160,120,32,0.08)'
    const btnBorder = isDark ? 'rgba(201,168,76,0.3)' : 'rgba(160,120,32,0.3)'
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          ...body, fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10,
          background: btnBg, border: `1.5px solid ${btnBorder}`,
          color: isDark ? GOLD : GOLD_DARK, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
          {shortAddr(address)}
          <ChevronDown size={11} />
        </button>
        {open && (
          <div style={{
            position: 'absolute', top: '110%', right: 0, zIndex: 200,
            background: dropBg, border: `1.5px solid ${dropBorder}`,
            borderRadius: 12, padding: 6, minWidth: 190,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          }}>
            <div style={{ ...body, fontSize: 11, color: isDark ? GOLD : GOLD_DARK, padding: '8px 12px', fontWeight: 700, borderBottom: `1px solid ${dropBorder}`, marginBottom: 4, display:'flex', alignItems:'center', gap:6 }}>
              <Wallet size={11} />
              {address.slice(0,10)}…{address.slice(-6)}
            </div>
            <button onClick={() => { switchChain({ chainId: ARC_CHAIN_ID }); setOpen(false) }} style={{
              ...body, width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8,
              background: 'transparent', border: 'none', fontSize: 12, color: isDark ? '#E5C566' : GOLD_DARK,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Zap size={12} /> Arc Mainnet
            </button>
            <button onClick={() => { disconnect(); setOpen(false) }} style={{
              ...body, width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8,
              background: 'transparent', border: 'none', fontSize: 12, color: '#F87171',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        )}
      </div>
    )
  }

  // Not connected — connector picker
  return (
    <div ref={connRef} style={{ position: 'relative' }}>
      <button onClick={() => setShowConnectors(o => !o)} style={{
        ...body, fontSize: 13, fontWeight: 800, padding: '9px 18px', borderRadius: 10,
        background: goldGradient, border: 'none', color: '#0D0D0D', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Wallet size={13} /> {t('connectWallet')}
      </button>
      {showConnectors && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 200,
          background: dropBg, border: `1.5px solid ${dropBorder}`,
          borderRadius: 14, padding: 8, minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ ...body, fontSize: 10, color: isDark ? 'rgba(201,168,76,0.6)' : GOLD_DARK, padding: '4px 10px 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Choose Wallet
          </div>
          {uniqueConns.map(c => (
            <button key={c.id} onClick={() => { connect({ connector: c }); setShowConnectors(false) }} style={{
              ...body, width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
              background: 'transparent', border: 'none', fontSize: 13,
              color: isDark ? '#F0E4C0' : '#1A1200',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(201,168,76,0.08)' : 'rgba(160,120,32,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <WalletIcon name={c.name} size={28} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button onClick={toggle} style={{
      background: isDark ? 'rgba(201,168,76,0.08)' : 'rgba(160,120,32,0.08)',
      border: `1.5px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.25)'}`,
      borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
      color: isDark ? GOLD : GOLD_DARK, display: 'flex', alignItems: 'center',
    }}>
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

// ─── LangPicker ───────────────────────────────────────────────────────────────
function LangPicker() {
  const { lang, setLang } = useLang()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [open, setOpen] = useState(false)
  const cur = LANGUAGES.find(l => l.code === lang)!
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        ...body, background: isDark ? 'rgba(201,168,76,0.08)' : 'rgba(160,120,32,0.08)',
        border: `1.5px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.25)'}`,
        borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
        color: isDark ? GOLD : GOLD_DARK,
        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
      }}>
        <Globe size={13} />{cur.flag} {cur.label.slice(0, 2)}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 300,
          ...goldCard(isDark), borderRadius: 14, padding: 6, minWidth: 145,
        }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false) }} style={{
              ...body, display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: l.code === lang ? (isDark ? 'rgba(201,168,76,0.14)' : 'rgba(160,120,32,0.1)') : 'transparent',
              color: l.code === lang ? (isDark ? GOLD_BRIGHT : GOLD_DARK) : (isDark ? '#C9B890' : '#3D2E00'),
              fontSize: 13, fontWeight: 600,
            }}>{l.flag} {l.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ShareModal ───────────────────────────────────────────────────────────────
function ShareModal({ poolId, onClose }: { poolId: bigint; onClose: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { t } = useLang()
  const url = `${window.location.origin}/?pool=${poolId}`
  const text = encodeURIComponent(`LOTTO ARC — Pool #${poolId} — ${url}`)
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ ...goldCard(isDark), borderRadius:'24px 24px 0 0', width:'100%', maxWidth:500, padding:'20px 20px 40px' }}>
        <div style={{ height: 3, background: goldGradientHoriz, borderRadius: 2, marginBottom: 18 }} />
        <p style={{ ...display, fontSize: 16, fontWeight: 800, color: isDark ? GOLD_BRIGHT : GOLD_DARK, marginBottom: 14 }}>{t('inviteTitle')}</p>
        <div style={{ ...innerBox(isDark), borderRadius: 10, padding: '10px 12px', marginBottom: 12, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ ...mono, fontSize: 11, color: isDark ? '#7A6840' : '#8C7040', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{url}</span>
          <button onClick={() => { navigator.clipboard.writeText(url); toast.success(t('copied')) }} style={{ ...body, background: goldGradient, color:'#0D0D0D', border:'none', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
            <Copy size={11} />{t('copyLink')}
          </button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { label:'X / Twitter', color:'#000', url:`https://x.com/intent/tweet?text=${text}` },
            { label:'Telegram', color:'#0088cc', url:`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}` },
            { label:'LINE', color:'#06c755', url:`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}` },
          ].map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ ...body, flex:1, textAlign:'center', padding:'11px 0', borderRadius:10, background:s.color, color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none' }}>{s.label}</a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function GoldDivider() {
  return <div style={{ height: 1, background: goldGradientHoriz, borderRadius: 1, margin: '14px 0', opacity: 0.4 }} />
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ status, autoDrawTs, deadlineTs }: { status: number; autoDrawTs: bigint; deadlineTs: bigint }) {
  const { t } = useLang()
  const now = Math.floor(Date.now() / 1000)
  let label = ''; let color = '#7A6840'
  if (status === STATUS_OPEN) {
    if (Number(autoDrawTs) > 0) { label = t('autoDrawIn'); color = '#F59E0B' }
    else if (now > Number(deadlineTs)) { label = t('expired'); color = '#F87171' }
    else { label = t('open'); color = '#4ADE80' }
  } else if (status === STATUS_DRAW_SCHEDULED) { label = t('drawScheduled'); color = '#F59E0B' }
  else if (status === STATUS_CLOSED) { label = t('closed2'); color = GOLD }
  else if (status === STATUS_CANCELLED) { label = t('cancelled2'); color = '#F87171' }
  return (
    <span style={{
      ...body, fontSize: 9, fontWeight: 800, letterSpacing: '0.09em',
      color, background: color + '1a', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase',
    }}>{label}</span>
  )
}

// ─── CreatePoolModal ──────────────────────────────────────────────────────────
function CreatePoolModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { t } = useLang()
  const [maxTickets, setMaxTickets] = useState(10)
  const [feeStr, setFeeStr] = useState('1')
  const [preset, setPreset] = useState<string>('h1')
  const [customH, setCustomH] = useState(2)
  const goldColor = isDark ? GOLD : GOLD_DARK
  const mutedColor = isDark ? '#7A6840' : '#8C7040'
  const inkColor = isDark ? '#F5E6C0' : '#1A1200'

  const presets = [
    { key:'min15', label:t('min15'), secs:900 },
    { key:'min30', label:t('min30'), secs:1800 },
    { key:'h1', label:t('h1'), secs:3600 },
    { key:'h24', label:t('h24'), secs:86400 },
    { key:'h72', label:t('h72'), secs:259200 },
    { key:'custom', label:t('custom'), secs:0 },
  ]
  const durSecs = preset === 'custom' ? Math.max(900, Math.min(604800, customH * 3600)) : (presets.find(p => p.key === preset)?.secs ?? 3600)
  const fee = BigInt(Math.round((parseFloat(feeStr) || 1) * 10 ** USDC_DECIMALS))
  const maxPot = BigInt(maxTickets) * fee

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  useEffect(() => { if (isSuccess) { toast.success('Pool created!'); onCreated() } }, [isSuccess, onCreated])
  const busy = isPending || confirming

  const inputStyle: React.CSSProperties = {
    ...body, border: `1.5px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.22)'}`,
    borderRadius: 10, padding: '9px 12px', background: 'transparent',
    color: inkColor, fontSize: 14, width: '100%', boxSizing: 'border-box',
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px' }}>
      <motion.div initial={{ scale:.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.95, opacity:0 }}
        onClick={e => e.stopPropagation()}
        style={{ ...goldCard(isDark), borderRadius:24, padding:'22px 20px 24px', width:'100%', maxWidth:420 }}>
        <div style={{ height:2, background:goldGradientHoriz, borderRadius:2, marginBottom:18 }} />
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <LogoMark size={28} />
          <p style={{ ...display, fontSize:18, fontWeight:700, color:goldColor, margin:0 }}>{t('newPool')}</p>
        </div>

        <p style={{ ...body, fontSize:10, fontWeight:800, color:mutedColor, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:7 }}>{t('maxTickets')}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
          {[2,5,10,20,30,50,100].map(n => (
            <button key={n} onClick={() => setMaxTickets(n)} style={{
              ...body, padding:'7px 12px', borderRadius:9,
              border:`1.5px solid ${maxTickets===n ? (isDark ? 'rgba(201,168,76,0.6)' : 'rgba(160,120,32,0.5)') : (isDark ? 'rgba(201,168,76,0.15)' : 'rgba(160,120,32,0.15)')}`,
              background: maxTickets===n ? (isDark ? 'rgba(201,168,76,0.15)' : 'rgba(160,120,32,0.1)') : 'none',
              color: maxTickets===n ? goldColor : mutedColor, cursor:'pointer', fontSize:13, fontWeight:700,
            }}>{n}</button>
          ))}
          <input type="number" min={2} max={100} value={maxTickets}
            onChange={e => setMaxTickets(Math.max(2, Math.min(100, parseInt(e.target.value)||2)))}
            style={{ ...inputStyle, width:64, padding:'7px 8px' }} />
        </div>

        <p style={{ ...body, fontSize:10, fontWeight:800, color:mutedColor, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:7 }}>{t('duration')}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: preset==='custom' ? 8 : 16 }}>
          {presets.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)} style={{
              ...body, padding:'7px 12px', borderRadius:9,
              border:`1.5px solid ${preset===p.key ? (isDark ? 'rgba(201,168,76,0.6)' : 'rgba(160,120,32,0.5)') : (isDark ? 'rgba(201,168,76,0.15)' : 'rgba(160,120,32,0.15)')}`,
              background: preset===p.key ? (isDark ? 'rgba(201,168,76,0.15)' : 'rgba(160,120,32,0.1)') : 'none',
              color: preset===p.key ? goldColor : mutedColor, cursor:'pointer', fontSize:13, fontWeight:700,
            }}>{p.label}</button>
          ))}
        </div>
        {preset === 'custom' && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <input type="number" min={0.25} max={168} step={0.25} value={customH}
              onChange={e => setCustomH(Math.max(0.25, Math.min(168, parseFloat(e.target.value)||1)))}
              style={{ ...inputStyle, flex:1 }} />
            <span style={{ ...body, fontSize:12, color:mutedColor }}>{t('customUnit')}</span>
          </div>
        )}

        <p style={{ ...body, fontSize:10, fontWeight:800, color:mutedColor, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:7 }}>{t('fee')} (USDC)</p>
        <input type="number" min="1" step="0.5" value={feeStr} onChange={e => setFeeStr(e.target.value)} style={{ ...inputStyle, marginBottom:16 }} />

        <div style={{ ...innerBox(isDark), borderRadius:12, padding:'11px 14px', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ ...body, fontSize:12, color:mutedColor }}>{t('previewMaxPot')}</span>
            <span style={{ ...mono, fontSize:12, fontWeight:700, color:goldColor }}>{fmt(maxPot)} USDC</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ ...body, fontSize:12, color:mutedColor }}>{t('previewWinner')}</span>
            <span style={{ ...mono, fontSize:12, fontWeight:700, color:'#4ADE80' }}>{fmt(maxPot * 9402n / 10000n)} USDC</span>
          </div>
        </div>
        <GoldBtn full disabled={busy} onClick={() => {
          if (fee < 1_000_000n) { toast.error('Min 1 USDC'); return }
          writeContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'createPool', args: [BigInt(maxTickets), fee, BigInt(durSecs)], chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) })
        }}>
          {busy ? <Spin /> : <Plus size={15} />}{busy ? t('creating') : t('create')}
        </GoldBtn>
      </motion.div>
    </div>
  )
}

// ─── PoolCard ─────────────────────────────────────────────────────────────────
// ─── Live clock — ticks every second so countdowns update without refresh ─────
function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function PoolCard({ poolId, myAddress, isOwner, onAction }: {
  poolId: bigint; myAddress?: string; isOwner: boolean; onAction: () => void
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { t } = useLang()
  const [qty, setQty] = useState(1)
  const [showShare, setShowShare] = useState(false)
  const now = useNow()

  const { data: pool, refetch } = useReadContract({
    address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'getPool',
    args: [poolId], chainId: ARC_CHAIN_ID,
  })
  const { data: myRefund } = useReadContract({
    address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'pendingRefunds',
    args: myAddress ? [myAddress as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID, query: { enabled: !!myAddress },
  })
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'allowance',
    args: myAddress ? [myAddress as `0x${string}`, RAFFLE_ADDRESS] : undefined,
    chainId: ARC_CHAIN_ID, query: { enabled: !!myAddress },
  })
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  useEffect(() => {
    if (isSuccess) { refetch(); refetchAllowance(); onAction(); toast.success('Done!') }
  }, [isSuccess, refetch, refetchAllowance, onAction])

  if (!pool) return null
  const p = pool as unknown as PoolData
  const remaining = Number(p.maxTickets) - p.tickets.length
  const pot = p.tickets.length * Number(p.entryFee)
  const maxPot = Number(p.maxTickets) * Number(p.entryFee)
  const pct = p.tickets.length / Number(p.maxTickets)
  const deadline = Number(p.deadlineTimestamp)
  const autoTs = Number(p.autoDrawTimestamp)
  const isOpen = p.status === STATUS_OPEN
  const isDrawScheduled = p.status === STATUS_DRAW_SCHEDULED
  const isClosed = p.status === STATUS_CLOSED
  const isCancelled = p.status === STATUS_CANCELLED
  const isTimedOut = isOpen && now > deadline && p.tickets.length < Number(p.maxTickets)
  const isAutoDrawPending = isOpen && autoTs > 0
  const autoDrawReady = isAutoDrawPending && now >= autoTs
  const canDraw = isAutoDrawPending && autoDrawReady
  const canSchedule = isOwner && isOpen && !isAutoDrawPending && p.tickets.length >= 2 && now <= deadline
  const myTickets = myAddress ? p.tickets.filter(a => a.toLowerCase() === myAddress.toLowerCase()).length : 0
  const needApprove = isOpen && remaining > 0 && !!myAddress && now <= deadline && !isAutoDrawPending &&
    (usdcAllowance === undefined || (usdcAllowance as bigint) < BigInt(qty) * p.entryFee)
  const busy = isPending || confirming
  const do_ = (fn: () => void) => { if (!busy) fn() }

  function doApprove() { do_(() => writeContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [RAFFLE_ADDRESS, BigInt(qty) * p.entryFee * 10n], chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) })) }
  function doEnter() { do_(() => writeContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'enterPool', args: [poolId, BigInt(qty)], chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) })) }
  function doSchedule() { do_(() => writeContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'scheduleDraw', args: [poolId], chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) })) }
  function doExecute() { do_(() => writeContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'executeDraw', args: [poolId], chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) })) }
  function doCancel() {
    const fn = isTimedOut ? 'cancelStalePool' : isAutoDrawPending && now > autoTs + 900 ? 'cancelExpiredAutoDraw' : isOwner ? 'cancelPool' : null
    if (!fn) return
    do_(() => writeContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: fn as 'cancelPool', args: [poolId], chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) }))
  }
  function doClaim() { do_(() => writeContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'claimRefund', chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) })) }

  const claimableHere = (myRefund as bigint | undefined) ?? 0n
  const showClaim = (isClosed || isCancelled || isTimedOut) && claimableHere > 0n
  const goldColor = isDark ? GOLD : GOLD_DARK
  const inkColor = isDark ? '#F5E6C0' : '#1A1200'
  const mutedColor = isDark ? '#7A6840' : '#8C7040'

  return (
    <>
      <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.97 }}
        style={{ ...goldCard(isDark), borderRadius:22, padding:'20px 18px 16px', marginBottom:14 }}>

        {/* Gold top strip */}
        <div style={{ height: 2, background: goldGradientHoriz, borderRadius: 2, marginBottom: 16 }} />

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background: isDark ? 'rgba(201,168,76,0.1)' : 'rgba(160,120,32,0.08)', border:`1px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <LogoMark size={24} />
            </div>
            <div>
              <span style={{ ...display, fontSize:15, fontWeight:700, color: goldColor }}>Pool #{poolId.toString()}</span>
              <div style={{ display:'flex', gap:4, marginTop:3, flexWrap:'wrap' }}>
                <StatusPill status={p.status} autoDrawTs={p.autoDrawTimestamp} deadlineTs={p.deadlineTimestamp} />
                {myTickets > 0 && <span style={{ ...body, fontSize:9, color:goldColor, background: isDark ? 'rgba(201,168,76,0.1)' : 'rgba(160,120,32,0.08)', padding:'3px 8px', borderRadius:6, fontWeight:800, letterSpacing:'0.05em' }}>{myTickets} {t('ticketUnit')}</span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {isOpen && !isTimedOut && <button onClick={() => setShowShare(true)} style={{ background:'none', border:`1.5px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'}`, borderRadius:9, padding:'7px 9px', cursor:'pointer', color:goldColor }}><Share2 size={13} /></button>}
            <a href={`${EXPLORER}/address/${RAFFLE_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', color:mutedColor }}><ChevronRight size={14} /></a>
          </div>
        </div>

        {/* Pot */}
        <div style={{ ...innerBox(isDark), borderRadius:16, padding:'16px', marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:10 }}>
            <div>
              <p style={{ ...body, fontSize:9, fontWeight:800, color:mutedColor, textTransform:'uppercase', letterSpacing:'0.09em', margin:0 }}>{t('pot')}</p>
              <p style={{ ...display, fontSize:28, fontWeight:700, color:goldColor, fontVariantNumeric:'tabular-nums', margin:'2px 0 0', lineHeight:1 }}>
                {fmt(BigInt(pot))} <span style={{ fontSize:13, color:mutedColor, fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>USDC</span>
              </p>
              <p style={{ ...body, fontSize:10, color:mutedColor, margin:'3px 0 0' }}>max {fmt(BigInt(maxPot))} USDC</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ ...body, fontSize:11, color:mutedColor, margin:0, display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}><Users size={11} /> {p.tickets.length}/{p.maxTickets.toString()}</p>
              <p style={{ ...body, fontSize:10, color:mutedColor, margin:'3px 0 0' }}>{fmt(p.entryFee)} USDC/{t('ticketUnit')}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height:5, background: isDark ? 'rgba(201,168,76,0.1)' : 'rgba(160,120,32,0.1)', borderRadius:99 }}>
            <div style={{ width:`${Math.min(100, pct*100)}%`, height:'100%', background:goldGradientHoriz, borderRadius:99, transition:'width 0.6s', boxShadow:'0 0 8px rgba(201,168,76,0.4)' }} />
          </div>
          {/* Prize split */}
          <div style={{ display:'flex', gap:5, marginTop:10 }}>
            {[
              { label:'Winner', pct:'94.02%', amt:(maxPot*9402/10000/1e6).toFixed(2), color:'#4ADE80' },
              { label:'House', pct:'5%', amt:(maxPot*500/10000/1e6).toFixed(2), color:'#F59E0B' },
              { label:'Treasury', pct:'0.98%', amt:(maxPot*98/10000/1e6).toFixed(2), color:goldColor },
            ].map(s => (
              <div key={s.label} style={{ flex:1, ...innerBox(isDark), borderRadius:9, padding:'7px 6px', textAlign:'center' }}>
                <p style={{ ...body, margin:0, fontSize:9, fontWeight:800, color:s.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.pct}</p>
                <p style={{ ...mono, margin:0, fontSize:9, color:mutedColor }}>{s.amt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timer */}
        {isOpen && !isTimedOut && (
          <p style={{ ...body, fontSize:11, color:mutedColor, marginBottom:10, display:'flex', alignItems:'center', gap:4 }}>
            <Clock size={11} color={goldColor} />
            {isAutoDrawPending ? `${t('autoDrawIn')} ${countdown(Math.max(0, autoTs - now))}` : countdown(Math.max(0, deadline - now))}
          </p>
        )}

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {isOpen && remaining > 0 && !!myAddress && now <= deadline && !isAutoDrawPending && (
            <div style={{ ...innerBox(isDark), borderRadius:14, padding:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <p style={{ ...body, fontSize:11, fontWeight:700, color:mutedColor, margin:0 }}>{t('qty')}:</p>
                <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ ...body, width:30, height:30, borderRadius:8, border:`1.5px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'}`, background:'none', cursor:'pointer', color:goldColor, fontSize:17, fontWeight:700 }}>−</button>
                <input type="number" min={1} max={remaining} value={qty}
                  onChange={e => setQty(Math.max(1, Math.min(remaining, parseInt(e.target.value)||1)))}
                  style={{ ...body, width:50, textAlign:'center', border:`1.5px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'}`, borderRadius:8, padding:'5px 0', background:'transparent', color:inkColor, fontSize:15, fontWeight:700 }} />
                <button onClick={() => setQty(q => Math.min(remaining, q+1))} style={{ ...body, width:30, height:30, borderRadius:8, border:`1.5px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'}`, background:'none', cursor:'pointer', color:goldColor, fontSize:17, fontWeight:700 }}>+</button>
                <span style={{ ...body, fontSize:11, color:mutedColor }}>/ {remaining} {t('tickets')}</span>
              </div>
              {needApprove ? (
                <GoldBtn full disabled={busy} onClick={doApprove}>
                  {busy ? <Spin /> : <Ticket size={13} />}{busy ? t('approving') : `${t('approve')} ${fmt(BigInt(qty)*p.entryFee)} USDC`}
                </GoldBtn>
              ) : (
                <GoldBtn full disabled={busy} onClick={doEnter}>
                  {busy ? <Spin /> : <Zap size={13} />}{busy ? t('entering') : `${t('enterCost')} ${fmt(BigInt(qty)*p.entryFee)} USDC`}
                </GoldBtn>
              )}
            </div>
          )}
          {canSchedule && (
            <GoldBtn full outline disabled={busy} onClick={doSchedule}>
              {busy ? <Spin /> : <Clock size={12} />}{busy ? t('scheduling') : t('scheduleDraw')}
            </GoldBtn>
          )}
          {(canDraw || isDrawScheduled) && (
            <GoldBtn full disabled={busy} onClick={doExecute}>
              {busy ? <Spin /> : <Trophy size={13} />}{busy ? t('executing') : t('executeDraw')}
            </GoldBtn>
          )}
          {isOpen && (isTimedOut || (isOwner && !isAutoDrawPending) || (isAutoDrawPending && now > autoTs + 900)) && (
            <GoldBtn full danger disabled={busy} onClick={doCancel}>
              {busy ? <Spin /> : <XCircle size={12} />}{busy ? t('cancelling') : t('cancel')}
            </GoldBtn>
          )}
          {showClaim && (
            <GoldBtn full disabled={busy} onClick={doClaim}>
              {busy ? <Spin /> : <CheckCircle size={13} />}{busy ? t('claiming') : `${t('claimUsdc')} ${fmt(claimableHere)} USDC`}
            </GoldBtn>
          )}
          {(isClosed || isCancelled) && claimableHere === 0n && (
            <div style={{ ...body, textAlign:'center', fontSize:11, color:mutedColor, padding:'6px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <CheckCircle size={11} color="#4ADE80" />{t('claimed')}
            </div>
          )}
        </div>
      </motion.div>
      <AnimatePresence>{showShare && <ShareModal poolId={poolId} onClose={() => setShowShare(false)} />}</AnimatePresence>
    </>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
type DashTab = 'open'|'timeout'|'closed'|'cancelled'|'all'

function Dashboard({ myAddress, isOwner, onAction, refreshKey, highlightPool, onHighlightClear }: {
  myAddress?: string; isOwner: boolean; onAction: () => void; refreshKey: number
  highlightPool?: bigint | null; onHighlightClear?: () => void
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { t } = useLang()
  const [tab, setTab] = useState<DashTab>('open')
  const [page, setPage] = useState(0)
  const goldColor = isDark ? GOLD : GOLD_DARK
  const mutedColor = isDark ? '#7A6840' : '#8C7040'

  const { data: openIds, refetch: refetchOpen } = useReadContract({
    address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'getOpenPools', chainId: ARC_CHAIN_ID,
    query: { refetchInterval: 8_000 },
  })
  const { data: allIds, refetch: refetchAll } = useReadContract({
    address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'getAllPools',
    args: [BigInt(page * PAGE_SIZE), BigInt(PAGE_SIZE)], chainId: ARC_CHAIN_ID,
    query: { refetchInterval: 8_000 },
  })
  const { refetch: refetchMy } = useReadContract({
    address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'getMyPools',
    args: myAddress ? [myAddress as `0x${string}`, BigInt(page * PAGE_SIZE), BigInt(PAGE_SIZE)] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!myAddress, refetchInterval: 8_000 },
  })

  // fire refetch whenever parent increments refreshKey (after create/cancel/draw/claim)
  useEffect(() => {
    refetchOpen(); refetchAll(); if (myAddress) refetchMy()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  // scroll to highlighted pool (shared link ?pool=X)
  useEffect(() => {
    if (!highlightPool) return
    // switch to 'all' tab so the pool is visible regardless of status
    setTab('all')
    // wait a tick for the DOM to render pool cards
    const timer = setTimeout(() => {
      const el = document.getElementById(`pool-${highlightPool.toString()}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.style.outline = '2px solid #C9A84C'
        el.style.outlineOffset = '4px'
        setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; onHighlightClear?.() }, 3000)
      }
    }, 600)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightPool])

  const TABS: { key: DashTab; label: string }[] = [
    { key:'open', label:t('tabOpen') },
    { key:'timeout', label:t('tabTimeout') },
    { key:'closed', label:t('tabClosed') },
    { key:'cancelled', label:t('tabCancelled') },
    { key:'all', label:t('tabAll') },
  ]

  // For 'open' tab use the dedicated openIds list (already filtered by contract)
  // For all other tabs load ALL pool ids then filter by status in PoolFilteredList
  const nowSec = Math.floor(Date.now() / 1000)
  const sourceIds: bigint[] = tab === 'open'
    ? ((openIds as bigint[] | undefined) ?? []).slice().reverse()
    : tab === 'all'
    ? (allIds as bigint[] | undefined) ?? []
    : (allIds as bigint[] | undefined) ?? []

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    ...body, flex:'0 0 auto', padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer',
    fontSize:11, fontWeight:800, letterSpacing:'0.03em', transition:'all 0.15s',
    background: active ? (isDark ? 'rgba(201,168,76,0.14)' : 'rgba(160,120,32,0.1)') : 'transparent',
    color: active ? goldColor : mutedColor,
    boxShadow: active ? '0 2px 10px rgba(201,168,76,0.15)' : 'none',
  })

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display:'flex', gap:3, marginBottom:14, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', borderRadius:14, padding:4, overflowX:'auto', border:`1px solid ${isDark ? 'rgba(201,168,76,0.1)' : 'rgba(160,120,32,0.1)'}` }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPage(0) }} style={tabBtnStyle(tab===tb.key)}>{tb.label}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab+page} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
          {tab === 'open'
            ? <SortedOpenList ids={sourceIds} myAddress={myAddress} isOwner={isOwner} onAction={onAction} />
            : <PoolFilteredList
                allIds={sourceIds}
                tab={tab}
                nowSec={nowSec}
                myAddress={myAddress}
                isOwner={isOwner}
                onAction={onAction}
                mutedColor={mutedColor}
                noHistoryLabel={t('noHistory')}
              />
          }
        </motion.div>
      </AnimatePresence>
      {tab === 'all' && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10 }}>
          {page > 0 && <GoldBtn outline onClick={() => setPage(p => p-1)}>← {t('page')} {page}</GoldBtn>}
          <span style={{ ...body, fontSize:12, color:mutedColor, display:'flex', alignItems:'center' }}>{t('page')} {page+1}</span>
          {sourceIds.length === PAGE_SIZE && <GoldBtn outline onClick={() => setPage(p => p+1)}>{t('page')} {page+2} →</GoldBtn>}
        </div>
      )}
    </div>
  )
}

// ─── SortedOpenList — fetches pool data, sorts by remaining slots then deadline ─
function SortedOpenList({ ids, myAddress, isOwner, onAction }: {
  ids: bigint[]; myAddress?: string; isOwner: boolean; onAction: () => void
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const mutedColor = isDark ? '#7A6840' : '#8C7040'
  const { t } = useLang()

  // Keep the number of React hooks stable when the RPC updates the id list.
  // Calling useReadContract inside ids.map() makes the hook count change from
  // zero to N and crashes production React with error #310.
  const { data: poolReads } = useReadContracts({
    contracts: ids.map(id => ({
      address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'getPool' as const,
      args: [id] as const, chainId: ARC_CHAIN_ID,
    })),
    query: { refetchInterval: 8_000 },
  })
  const poolDataList = ids.map((id, index) => ({
    id,
    data: poolReads?.[index]?.result as PoolData | undefined,
  }))

  const nowSec = useNow()

  // Only truly-open pools: status Open AND deadline not yet passed
  const loaded = poolDataList.filter(p => {
    if (!p.data) return false
    const d = p.data as PoolData
    const isExpired = nowSec > Number(d.deadlineTimestamp) && d.tickets.length < Number(d.maxTickets)
    return d.status === STATUS_OPEN && !isExpired
  })

  // Sort: fewest remaining slots first; tie-break by earliest deadline
  const sorted = [...loaded].sort((a, b) => {
    const aRemain = Number(a.data!.maxTickets) - a.data!.tickets.length
    const bRemain = Number(b.data!.maxTickets) - b.data!.tickets.length
    if (aRemain !== bRemain) return aRemain - bRemain
    return Number(a.data!.deadlineTimestamp) - Number(b.data!.deadlineTimestamp)
  })

  // While data loads show nothing yet; once at least one pool loaded, show sorted
  const allFetched = poolDataList.every(p => p.data !== undefined)
  const display = allFetched ? sorted : poolDataList.filter(p => p.data !== undefined && (() => {
    const d = p.data as PoolData
    return d.status === STATUS_OPEN && nowSec <= Number(d.deadlineTimestamp)
  })())

  if (display.length === 0) return <EmptyState mutedColor={mutedColor} label={t('noHistory')} />

  return (
    <>
      {display.map(({ id }) => (
        <div key={id.toString()} id={`pool-${id.toString()}`}>
          <PoolCard poolId={id} myAddress={myAddress} isOwner={isOwner} onAction={onAction} />
        </div>
      ))}
    </>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ mutedColor, label }: { mutedColor: string; label: string }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 0' }}>
      <LogoMark size={40} />
      <p style={{ ...body, color:mutedColor, fontSize:13, marginTop:12 }}>{label}</p>
    </div>
  )
}

// ─── PoolFilteredList — fetches status of each pool, filters by tab ───────────
function PoolFilteredList({ allIds, tab, nowSec, myAddress, isOwner, onAction, mutedColor, noHistoryLabel }: {
  allIds: bigint[]; tab: DashTab; nowSec: number
  myAddress?: string; isOwner: boolean; onAction: () => void
  mutedColor: string; noHistoryLabel: string
}) {
  // A single batched hook is safe even when allIds changes length.
  const { data: statusReads } = useReadContracts({
    contracts: allIds.map(id => ({
      address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'getPool' as const,
      args: [id] as const, chainId: ARC_CHAIN_ID,
    })),
    query: { refetchInterval: 12_000 },
  })
  const statuses = allIds.map((id, index) => ({
    id,
    data: statusReads?.[index]?.result as PoolData | undefined,
  }))

  const filtered = statuses.filter(({ data }) => {
    if (!data) return false
    const status = data.status
    const deadline = Number(data.deadlineTimestamp)
    const ticketCount = data.tickets.length
    const maxT = Number(data.maxTickets)
    const isTimedOut = status === STATUS_OPEN && nowSec > deadline && ticketCount < maxT

    if (tab === 'timeout')   return isTimedOut
    if (tab === 'closed')    return status === STATUS_CLOSED
    if (tab === 'cancelled') return status === STATUS_CANCELLED
    if (tab === 'all')       return true
    return false
  })

  if (filtered.length === 0) return <EmptyState mutedColor={mutedColor} label={noHistoryLabel} />

  return (
    <>
      {filtered.map(({ id }) => (
        <div key={id.toString()} id={`pool-${id.toString()}`}>
          <PoolCard poolId={id} myAddress={myAddress} isOwner={isOwner} onAction={onAction} />
        </div>
      ))}
    </>
  )
}



// ─── PlayPage ─────────────────────────────────────────────────────────────────
function PlayPage() {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const { theme } = useTheme()
  const { t } = useLang()
  const isDark = theme === 'dark'
  const tk = isDark ? dark : light
  const goldColor = isDark ? GOLD : GOLD_DARK
  const mutedColor = isDark ? '#7A6840' : '#8C7040'
  const isWrongChain = isConnected && chainId !== ARC_CHAIN_ID
  const navigate = useNavigate()
  const location = useLocation()

  // sub-tab: 'play' | 'mydashboard'
  const [subTab, setSubTab] = useState<'play'|'mydashboard'>('play')

  // ?pool=X → highlight on load
  const urlPool = new URLSearchParams(location.search).get('pool')
  const [highlightPool, setHighlightPool] = useState<bigint|null>(() => urlPool ? BigInt(urlPool) : null)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: contractOwner, refetch: refetchOwner } = useReadContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'owner', chainId: ARC_CHAIN_ID })
  const { data: myRefundBal, refetch: refetchRefund } = useReadContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'pendingRefunds', args: address ? [address] : undefined, chainId: ARC_CHAIN_ID, query: { enabled: !!address } })
  const { data: treasuryBalance, refetch: refetchTreasury } = useReadContract({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'treasuryBalance', chainId: ARC_CHAIN_ID, query: { enabled: !!address && address.toLowerCase() === TREASURY_ADDRESS.toLowerCase() } })

  const isOwner = !!address && !!contractOwner && address.toLowerCase() === (contractOwner as string).toLowerCase()
  const isTreasury = !!address && address.toLowerCase() === TREASURY_ADDRESS.toLowerCase()
  const [showCreate, setShowCreate] = useState(false)
  const handleAction = useCallback(() => {
    refetchOwner(); refetchRefund(); refetchTreasury()
    setRefreshKey(k => k + 1)
  }, [refetchOwner, refetchRefund, refetchTreasury])

  const { writeContract: writeT, data: txT, isPending: pendingT } = useWriteContract()
  const { isLoading: confT, isSuccess: succT } = useWaitForTransactionReceipt({ hash: txT })
  useEffect(() => { if (succT) { toast.success('Treasury claimed!'); refetchTreasury() } }, [succT, refetchTreasury])
  const doCTreasury = () => writeT({ address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'claimTreasury', chainId: ARC_CHAIN_ID }, { onError: e => toast.error(parseError(e)) })

  const tbAmt = treasuryBalance as bigint | undefined
  const refundBal = myRefundBal as bigint | undefined

  const topNavBtn = (active: boolean): React.CSSProperties => ({
    ...body, padding: '8px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', transition: 'all 0.15s',
    background: active ? goldGradient : 'transparent',
    color: active ? '#0D0D0D' : (isDark ? 'rgba(201,168,76,0.6)' : GOLD_DARK),
    boxShadow: active ? '0 2px 12px rgba(201,168,76,0.3)' : 'none',
  })

  return (
    <div style={{ minHeight: '100dvh', background: isDark ? '#0D0D0D' : '#F0E4C0', backgroundImage: tk.bgGrad, transition: 'background 0.3s' }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${isDark ? 'rgba(201,168,76,0.07)' : 'rgba(160,120,32,0.06)'} 0%, transparent 65%)`, filter: 'blur(40px)' }} />
      </div>

      {/* Header */}
      <div style={{ ...goldCard(isDark), borderBottom: `1px solid ${isDark ? 'rgba(201,168,76,0.15)' : 'rgba(160,120,32,0.15)'}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Logo — click to go home */}
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <LogoMark size={32} />
            <span style={{ ...display, fontSize: 15, fontWeight: 700, color: goldColor, letterSpacing: '0.03em' }}>LOTTO ARC</span>
          </button>

          {/* Top nav: Play | Dashboard */}
          <div style={{ display: 'flex', gap: 2, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 3, border: `1px solid ${isDark ? 'rgba(201,168,76,0.12)' : 'rgba(160,120,32,0.12)'}` }}>
            <button style={topNavBtn(subTab === 'play')} onClick={() => setSubTab('play')}>
              🎴 Play
            </button>
            <button style={topNavBtn(subTab === 'mydashboard')} onClick={() => setSubTab('mydashboard')}>
              📊 Dashboard
            </button>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <ThemeToggle />
            <LangPicker />
            <WalletButton />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 70px', position: 'relative' }}>

        {/* Wrong network banner */}
        {isWrongChain && (
          <div style={{ ...goldCard(isDark), borderRadius: 14, padding: '12px 16px', marginBottom: 12, border: '1.5px solid rgba(245,158,11,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...body, fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>{t('wrongNetwork')}</span>
            <GoldBtn onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}>{t('switchBtn')}</GoldBtn>
          </div>
        )}

        {/* Claimable alert */}
        {refundBal !== undefined && refundBal > 0n && (
          <div style={{ ...goldCard(isDark), borderRadius: 14, padding: '12px 16px', marginBottom: 12, border: '1.5px solid rgba(74,222,128,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...body, fontSize: 13, fontWeight: 800, color: '#4ADE80' }}>💰 {t('claimable')}: {fmt(refundBal)} USDC</span>
            <span style={{ ...body, fontSize: 11, color: mutedColor }}>Go to Dashboard → Claim</span>
          </div>
        )}

        {/* Owner panel */}
        {isOwner && subTab === 'play' && (
          <div style={{ ...goldCard(isDark), borderRadius: 18, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={14} color={goldColor} />
              <span style={{ ...body, fontSize: 11, fontWeight: 800, color: goldColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('ownerPanel')}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isTreasury && tbAmt !== undefined && tbAmt > 0n && (
                <GoldBtn outline disabled={pendingT || confT} onClick={doCTreasury}>
                  {pendingT || confT ? <Spin size={12} /> : <CheckCircle size={12} />}
                  {pendingT || confT ? t('claiming') : `${t('claimTreasury')} ${fmt(tbAmt)}`}
                </GoldBtn>
              )}
              <GoldBtn onClick={() => setShowCreate(true)}><Plus size={13} />{t('newPool')}</GoldBtn>
            </div>
          </div>
        )}

        {/* PLAY tab — all pools */}
        {subTab === 'play' && (
          <Dashboard
            myAddress={address}
            isOwner={isOwner}
            onAction={handleAction}
            refreshKey={refreshKey}
            highlightPool={highlightPool}
            onHighlightClear={() => setHighlightPool(null)}
          />
        )}

        {/* DASHBOARD tab — my pools only */}
        {subTab === 'mydashboard' && (
          <MyDashboard
            myAddress={address}
            isOwner={isOwner}
            isTreasury={isTreasury}
            tbAmt={tbAmt}
            pendingT={pendingT}
            confT={confT}
            doCTreasury={doCTreasury}
            onAction={handleAction}
            refreshKey={refreshKey}
          />
        )}

        {/* Footer */}
        <GoldDivider />
        <p style={{ ...body, textAlign: 'center', fontSize: 10, color: mutedColor }}>
          LOTTO ARC · Arc Mainnet ·{' '}
          <a href={`${EXPLORER}/address/${RAFFLE_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 9, color: mutedColor }}>
            {shortAddr(RAFFLE_ADDRESS)}
          </a>
        </p>
      </div>

      <AnimatePresence>
        {showCreate && <CreatePoolModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); handleAction() }} />}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.65; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${isDark ? '#0D0D0D' : '#F0E4C0'}; transition: background 0.3s; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        a { text-decoration: none; }
        ::selection { background: rgba(201,168,76,0.25); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.25); border-radius: 9px; }
      `}</style>
    </div>
  )
}

// ─── MyDashboard — shows only pools the connected wallet is involved in ────────
function MyDashboard({ myAddress, isOwner, isTreasury, tbAmt, pendingT, confT, doCTreasury, onAction, refreshKey }: {
  myAddress: string | undefined; isOwner: boolean; isTreasury: boolean
  tbAmt: bigint | undefined; pendingT: boolean; confT: boolean
  doCTreasury: () => void; onAction: () => void; refreshKey: number
}) {
  const { theme } = useTheme()
  const { t } = useLang()
  const isDark = theme === 'dark'
  const goldColor = isDark ? GOLD : GOLD_DARK
  const mutedColor = isDark ? '#7A6840' : '#8C7040'
  const nowSec = useNow()
  const [myTab, setMyTab] = useState<'open'|'timeout'|'closed'|'cancelled'|'all'>('all')

  // My pools from contract (indexed per-user)
  const { data: myIdsRaw, refetch } = useReadContract({
    address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'getMyPools',
    args: myAddress ? [myAddress as `0x${string}`, BigInt(0), BigInt(100)] : undefined,
    chainId: ARC_CHAIN_ID, query: { enabled: !!myAddress, refetchInterval: 8_000 },
  })
  useEffect(() => { refetch() }, [refreshKey, refetch])

  const myIds = (myIdsRaw as bigint[] | undefined) ?? []

  // Refund balance
  const { data: refundRaw } = useReadContract({
    address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'pendingRefunds',
    args: myAddress ? [myAddress as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID, query: { enabled: !!myAddress, refetchInterval: 8_000 },
  })
  const refundBal = refundRaw as bigint | undefined

  if (!myAddress) {
    return (
      <div style={{ ...goldCard(isDark), borderRadius: 20, padding: '32px 20px', textAlign: 'center', marginBottom: 14 }}>
        <p style={{ ...body, fontSize: 14, color: mutedColor }}>{t('connectWallet')} to view your Dashboard</p>
      </div>
    )
  }

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    ...body, flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 800, letterSpacing: '0.03em', transition: 'all 0.15s',
    background: active ? (isDark ? 'rgba(201,168,76,0.14)' : 'rgba(160,120,32,0.1)') : 'transparent',
    color: active ? goldColor : mutedColor,
    boxShadow: active ? '0 2px 10px rgba(201,168,76,0.15)' : 'none',
  })
  return (
    <div>
      {/* Claimable + Treasury */}
      {refundBal !== undefined && refundBal > 0n && (
        <div style={{ ...goldCard(isDark), borderRadius: 14, padding: '12px 16px', marginBottom: 12, border: '1.5px solid rgba(74,222,128,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...body, fontSize: 13, fontWeight: 800, color: '#4ADE80' }}>💰 Claimable: {fmt(refundBal)} USDC</span>
            <ClaimRefundBtn onAction={onAction} />
          </div>
        </div>
      )}
      {isTreasury && tbAmt !== undefined && tbAmt > 0n && (
        <div style={{ ...goldCard(isDark), borderRadius: 14, padding: '12px 16px', marginBottom: 12, border: `1.5px solid ${isDark ? 'rgba(201,168,76,0.3)' : 'rgba(160,120,32,0.3)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...body, fontSize: 13, fontWeight: 800, color: goldColor }}>🏦 Treasury: {fmt(tbAmt)} USDC</span>
            <GoldBtn outline disabled={pendingT || confT} onClick={doCTreasury}>
              {pendingT || confT ? <Spin size={12} /> : <CheckCircle size={12} />}
              {pendingT || confT ? t('claiming') : t('claimTreasury')}
            </GoldBtn>
          </div>
        </div>
      )}

      {/* Owner: new pool */}
      {isOwner && (
        <div style={{ ...goldCard(isDark), borderRadius: 14, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...body, fontSize: 12, color: goldColor, fontWeight: 700 }}>{t('ownerPanel')}</span>
        </div>
      )}

      {/* My pool tabs */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 14, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', borderRadius: 14, padding: 4, border: `1px solid ${isDark ? 'rgba(201,168,76,0.1)' : 'rgba(160,120,32,0.1)'}`, overflowX: 'auto' }}>
        {(['all','open','timeout','closed','cancelled'] as const).map(tab => (
          <button key={tab} style={navBtnStyle(myTab === tab)} onClick={() => setMyTab(tab)}>
            {tab === 'all' ? 'All' : tab === 'open' ? 'Open' : tab === 'timeout' ? 'Timed Out' : tab === 'closed' ? 'Closed' : 'Cancelled'}
          </button>
        ))}
      </div>

      {myIds.length === 0 ? (
        <EmptyState mutedColor={mutedColor} label="You haven't joined any pools yet." />
      ) : (
        <PoolFilteredList
          allIds={myIds}
          tab={myTab === 'open' ? 'open' : myTab}
          nowSec={nowSec}
          myAddress={myAddress}
          isOwner={isOwner}
          onAction={onAction}
          noHistoryLabel="No pools in this category."
          mutedColor={mutedColor}
        />
      )}
    </div>
  )
}

// ─── ClaimRefundBtn ────────────────────────────────────────────────────────────
function ClaimRefundBtn({ onAction }: { onAction: () => void }) {
  const { address } = useAccount()
  const { t } = useLang()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  useEffect(() => { if (isSuccess) { toast.success('Claimed!'); onAction() } }, [isSuccess, onAction])
  return (
    <GoldBtn disabled={isPending || isConfirming || !address} onClick={() => writeContract(
      { address: RAFFLE_ADDRESS, abi: RAFFLE_ABI, functionName: 'claimRefund', chainId: ARC_CHAIN_ID },
      { onError: e => toast.error(parseError(e)) }
    )}>
      {isPending || isConfirming ? <Spin size={12} /> : <CheckCircle size={12} />}
      {isPending || isConfirming ? t('claiming') : t('claimUsdc')}
    </GoldBtn>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) ?? 'dark')
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) ?? 'th')
  const tk = theme === 'dark' ? dark : light
  const toggleTheme = useCallback(() => {
    setTheme(prev => { const n = prev === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', n); return n })
  }, [])
  const handleSetLang = useCallback((l: Lang) => { setLang(l); localStorage.setItem('lang', l) }, [])

  const t = useTranslation(lang)
  return (
    <ThemeCtx.Provider value={{ theme, tokens: tk, toggle: toggleTheme }}>
      <LangCtx.Provider value={{ lang, t, setLang: handleSetLang }}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="*" element={<HomeRoute />} />
        </Routes>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  )
}

// Wrapper so HomePage can use navigate
function HomeRoute() {
  const navigate = useNavigate()
  return <HomePage onEnter={() => navigate('/play')} />
}

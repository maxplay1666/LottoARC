import { useContext } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Zap, Shield, Users, ChevronRight, Coins, Clock } from 'lucide-react'
import { ThemeCtx } from './contexts'
import { LangCtx } from './contexts'

const GOLD = '#C9A84C'
const GOLD_BRIGHT = '#E5C566'

const display: React.CSSProperties = { fontFamily: "'Cinzel','Playfair Display',serif" }
const body: React.CSSProperties = { fontFamily: "'DM Sans',sans-serif" }

function goldGradient(angle = '135deg') {
  return `linear-gradient(${angle}, #A07820 0%, #C9A84C 35%, #E5C566 60%, #C9A84C 80%, #8A6010 100%)`
}

// ─── Logo full ────────────────────────────────────────────────────────────────
function LogoFull({ size = 120 }: { size?: number }) {
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A07820"/>
          <stop offset="35%" stopColor="#C9A84C"/>
          <stop offset="60%" stopColor="#E5C566"/>
          <stop offset="100%" stopColor="#8A6010"/>
        </linearGradient>
      </defs>
      {/* Arc arch */}
      <path d="M100 160 L100 90 Q100 30 160 30 Q220 30 220 90 L220 160" stroke="url(#hg)" strokeWidth="14" fill="none" strokeLinecap="round"/>
      {/* Spade */}
      <path d="M160 145 C160 145 130 118 130 100 C130 87 138 80 148 80 C154 80 159 84 160 88 C161 84 166 80 172 80 C182 80 190 87 190 100 C190 118 160 145 160 145Z" fill="url(#hg)"/>
      <path d="M152 145 L168 145 L165 158 L155 158Z" fill="url(#hg)"/>
      {/* LOTTO ARC text */}
      <text x="160" y="190" textAnchor="middle" fill="url(#hg)" fontSize="22" fontFamily="'Cinzel',serif" fontWeight="700" letterSpacing="4">LOTTO ARC</text>
    </svg>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, isDark }: { icon: React.ReactNode; value: string; label: string; isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        background: isDark ? 'rgba(20,16,0,0.7)' : 'rgba(255,250,230,0.9)',
        border: `1px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'}`,
        borderRadius: 20,
        padding: '32px 28px',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(160,120,32,0.1)',
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ marginBottom: 12, color: GOLD, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ ...display, fontSize: 32, fontWeight: 700, background: goldGradient(), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>{value}</div>
      <div style={{ ...body, fontSize: 13, color: isDark ? '#9A8050' : '#7A5C20', fontWeight: 500 }}>{label}</div>
    </motion.div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, isDark, delay = 0 }: { icon: React.ReactNode; title: string; desc: string; isDark: boolean; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: isDark ? 'rgba(20,16,0,0.55)' : 'rgba(255,250,230,0.85)',
        border: `1px solid ${isDark ? 'rgba(201,168,76,0.18)' : 'rgba(160,120,32,0.18)'}`,
        borderRadius: 20,
        padding: '28px 24px',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: 'rgba(201,168,76,0.12)',
        border: `1px solid rgba(201,168,76,0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, color: GOLD,
      }}>{icon}</div>
      <div style={{ ...display, fontSize: 16, fontWeight: 600, color: isDark ? '#E5C566' : '#5A3A00', marginBottom: 8 }}>{title}</div>
      <div style={{ ...body, fontSize: 14, color: isDark ? '#9A8050' : '#7A5C20', lineHeight: 1.6 }}>{desc}</div>
    </motion.div>
  )
}

// ─── Step ─────────────────────────────────────────────────────────────────────
function Step({ num, title, desc, isDark, delay = 0 }: { num: string; title: string; desc: string; isDark: boolean; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}
    >
      <div style={{
        minWidth: 48, height: 48, borderRadius: '50%',
        background: goldGradient(),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...display, fontSize: 18, fontWeight: 700, color: '#0D0D0D',
        flexShrink: 0,
        boxShadow: '0 4px 16px rgba(201,168,76,0.4)',
      }}>{num}</div>
      <div>
        <div style={{ ...display, fontSize: 16, fontWeight: 600, color: isDark ? '#E5C566' : '#3A2000', marginBottom: 6 }}>{title}</div>
        <div style={{ ...body, fontSize: 14, color: isDark ? '#9A8050' : '#7A5C20', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </motion.div>
  )
}

// ─── HomePage ─────────────────────────────────────────────────────────────────
export function HomePage({ onEnter }: { onEnter: () => void }) {
  const { theme } = useContext(ThemeCtx)
  useContext(LangCtx)
  const isDark = theme === 'dark'
  const bg = isDark ? '#0D0D0D' : '#FAF5E4'
  const textPrimary = isDark ? '#F5E6C0' : '#1A1000'

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textPrimary, ...body, overflowX: 'hidden' }}>

      {/* ── Ambient glow bg ─────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 600, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }} />
      </div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '100px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
          <LogoFull size={140} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div style={{
            display: 'inline-block',
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 999, padding: '6px 20px',
            fontSize: 12, fontWeight: 600, letterSpacing: 2,
            color: GOLD_BRIGHT, ...display,
            marginBottom: 28, marginTop: 8,
          }}>
            POWERED BY ARC MAINNET
          </div>

          <h1 style={{
            ...display,
            fontSize: 'clamp(36px, 7vw, 72px)',
            fontWeight: 700,
            background: goldGradient(),
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15,
            marginBottom: 20,
            maxWidth: 760,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            The Premier USDC<br />Raffle on Arc
          </h1>

          <p style={{
            ...body,
            fontSize: 'clamp(15px, 2vw, 19px)',
            color: isDark ? '#9A8050' : '#7A5C20',
            maxWidth: 540,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Join a pool, get your ticket, and win the pot. Transparent on-chain rules, instant USDC payout, no middleman.
          </p>

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 8px 40px rgba(201,168,76,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            style={{
              background: goldGradient(),
              color: '#0D0D0D',
              border: 'none',
              borderRadius: 14,
              padding: '18px 48px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              ...display,
              letterSpacing: 1.5,
              boxShadow: '0 4px 24px rgba(201,168,76,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            ENTER THE ARENA <ChevronRight size={18} />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <StatCard icon={<Trophy size={28} />} value="100%" label="On-chain transparent" isDark={isDark} />
          <StatCard icon={<Zap size={28} />} value="< 2s" label="Arc block time" isDark={isDark} />
          <StatCard icon={<Shield size={28} />} value="Audited" label="Smart contract verified" isDark={isDark} />
          <StatCard icon={<Coins size={28} />} value="USDC" label="Native Arc gas token" isDark={isDark} />
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: '0 auto 80px', height: 1, background: `linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)` }} />

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '0 24px 80px' }}>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ ...display, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, textAlign: 'center', background: goldGradient(), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}
        >
          How It Works
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ ...body, textAlign: 'center', color: isDark ? '#9A8050' : '#7A5C20', marginBottom: 48 }}>
          Simple, fair, and fully onchain.
        </motion.p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Step num="1" title="Choose a Pool" desc="Browse open pools with different entry fees and player counts. Each pool has a countdown timer." isDark={isDark} delay={0} />
          <Step num="2" title="Buy Your Ticket(s)" desc="Connect MetaMask, approve USDC, and buy 1 or more tickets in a single transaction." isDark={isDark} delay={0.1} />
          <Step num="3" title="Wait for the Draw" desc="When the pool fills, a 10-minute countdown begins. The draw picks one winner randomly from all tickets." isDark={isDark} delay={0.2} />
          <Step num="4" title="Claim Your Prize" desc="Winners and owners claim directly from the dashboard. If a pool is cancelled, all players get a full refund." isDark={isDark} delay={0.3} />
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: '0 auto 80px', height: 1, background: `linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)` }} />

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ ...display, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, textAlign: 'center', background: goldGradient(), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 48 }}
        >
          Why LOTTO ARC
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <FeatureCard icon={<Shield size={22} />} title="Audited Contract" desc="Multiple security audit rounds. 113/113 unit tests pass. No Critical or High vulnerabilities." isDark={isDark} delay={0} />
          <FeatureCard icon={<Zap size={22} />} title="Instant Payout" desc="Win and claim in the same session. USDC goes straight to your wallet, no waiting." isDark={isDark} delay={0.1} />
          <FeatureCard icon={<Users size={22} />} title="Flexible Pools" desc="2–100 players, 15 min to 7 days duration, custom entry fee set by the pool creator." isDark={isDark} delay={0.2} />
          <FeatureCard icon={<Trophy size={22} />} title="Full Refund Guarantee" desc="Pool cancelled or timed out? Every player gets 100% of their entry fee back, no exceptions." isDark={isDark} delay={0.3} />
          <FeatureCard icon={<Coins size={22} />} title="USDC Only" desc="USDC is the native gas token on Arc. No ETH needed. One token for everything." isDark={isDark} delay={0.4} />
          <FeatureCard icon={<Clock size={22} />} title="Auto-Draw" desc="Pool fills? A 10-minute draw countdown starts automatically. No owner action needed." isDark={isDark} delay={0.5} />
        </div>
      </section>

      {/* ── Prize breakdown ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            background: isDark ? 'rgba(20,16,0,0.65)' : 'rgba(255,250,230,0.9)',
            border: `1px solid ${isDark ? 'rgba(201,168,76,0.25)' : 'rgba(160,120,32,0.2)'}`,
            borderRadius: 24,
            padding: '36px 32px',
            backdropFilter: 'blur(20px)',
          }}
        >
          <h3 style={{ ...display, fontSize: 20, fontWeight: 700, textAlign: 'center', background: goldGradient(), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 28 }}>Prize Distribution</h3>
          {[
            { label: 'Winner', pct: '94.02%', color: '#22c55e', bar: '94%' },
            { label: 'House Fee', pct: '5.00%', color: GOLD, bar: '5%' },
            { label: 'Treasury', pct: '0.98%', color: '#60a5fa', bar: '1%' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, ...body, fontSize: 14 }}>
                <span style={{ color: isDark ? '#D0B870' : '#5A3A00' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.color }}>{r.pct}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: r.bar }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 999, background: r.color }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px 120px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div style={{
            maxWidth: 640, margin: '0 auto',
            background: isDark ? 'rgba(20,16,0,0.7)' : 'rgba(255,250,230,0.9)',
            border: `1px solid ${isDark ? 'rgba(201,168,76,0.3)' : 'rgba(160,120,32,0.2)'}`,
            borderRadius: 28,
            padding: '56px 40px',
            backdropFilter: 'blur(24px)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>♠</div>
            <h2 style={{ ...display, fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, background: goldGradient(), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14 }}>
              Ready to Play?
            </h2>
            <p style={{ ...body, color: isDark ? '#9A8050' : '#7A5C20', marginBottom: 32, lineHeight: 1.6 }}>
              Connect your MetaMask to Arc Mainnet and enter a pool now.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 8px 40px rgba(201,168,76,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              style={{
                background: goldGradient(),
                color: '#0D0D0D',
                border: 'none',
                borderRadius: 14,
                padding: '16px 44px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                ...display,
                letterSpacing: 1.5,
                boxShadow: '0 4px 24px rgba(201,168,76,0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              GO TO DASHBOARD <ChevronRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${isDark ? 'rgba(201,168,76,0.12)' : 'rgba(160,120,32,0.12)'}`,
        padding: '32px 24px',
        textAlign: 'center',
        ...body, fontSize: 13,
        color: isDark ? '#5A4820' : '#9A7040',
      }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ ...display, color: GOLD, fontWeight: 600, letterSpacing: 2 }}>LOTTO ARC</span>
          <span style={{ margin: '0 10px', opacity: 0.4 }}>·</span>
          <a href="https://explorer.arc.io/address/0x79F7592E01fA78BdC2810B0860B7a11986280793" target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: 'none', opacity: 0.7 }}>Contract</a>
          <span style={{ margin: '0 10px', opacity: 0.4 }}>·</span>
          <a href="https://github.com/maxplay1666/LottoARC" target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: 'none', opacity: 0.7 }}>GitHub</a>
        </div>
        <div style={{ opacity: 0.4 }}>Arc Mainnet · Chain ID 5042 · USDC native gas</div>
      </footer>
    </div>
  )
}

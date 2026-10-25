import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected, metaMask, coinbaseWallet, walletConnect } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

// Arc Mainnet (chain ID 5042)
const arcMainnet = {
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
} as const

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim()
const connectors = [
  metaMask(),
  injected({ target: 'metaMask' }),
  coinbaseWallet({ appName: 'LottoArc' }),
  injected(),
]

if (walletConnectProjectId) {
  connectors.splice(3, 0, walletConnect({ projectId: walletConnectProjectId }))
}

const config = createConfig({
  chains: [arcMainnet],
  connectors,
  transports: { [arcMainnet.id]: http('https://rpc.mainnet.arc.io') },
})

const queryClient = new QueryClient()

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('LottoARC render failed', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <h1>LOTTO ARC</h1>
          <p>เกิดข้อผิดพลาดในการแสดงผล กรุณาลองโหลดหน้าใหม่อีกครั้ง</p>
          <button onClick={() => window.location.reload()}>โหลดหน้าใหม่</button>
        </main>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
          <Toaster position="top-center" richColors />
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

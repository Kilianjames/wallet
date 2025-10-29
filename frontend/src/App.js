import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivyProvider } from '@privy-io/react-auth';
import { WalletProvider } from './contexts/WalletContext';
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Trading from "./pages/Trading";
import Markets from "./pages/Markets";
import Portfolio from "./pages/Portfolio";
import { Toaster } from "./components/ui/toaster";

const PRIVY_APP_ID = process.env.REACT_APP_PRIVY_APP_ID || 'cmhaixqzc00v7jo0cqqrf5czd';

function App() {
  return (
    <div className="App">
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#7fffd4',
            logo: 'https://customer-assets.emergentagent.com/job_e3912c72-e03b-483a-9a13-e7cb5f99c7ec/artifacts/tpoy6ypf_ZMgOwNQU_400x400.jpg',
            landingHeader: 'Connect to Polynator',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          loginMethods: ['wallet', 'email', 'sms'],
          supportedChains: [
            {
              id: 137,
              name: 'Polygon',
              network: 'polygon',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: {
                default: { http: ['https://polygon-rpc.com'] },
                public: { http: ['https://polygon-rpc.com'] },
              },
            },
          ],
        }}
      >
        <WalletProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/*"
                element={
                  <>
                    <Navbar />
                    <Routes>
                      <Route path="/trade" element={<Trading />} />
                      <Route path="/markets" element={<Markets />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="*" element={<Navigate to="/trade" replace />} />
                    </Routes>
                  </>
                }
              />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </WalletProvider>
      </PrivyProvider>
    </div>
  );
}

export default App;

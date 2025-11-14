import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from "./components/Navbar";
import Trading from "./pages/Trading";
import Markets from "./pages/Markets";
import Portfolio from "./pages/Portfolio";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <WalletProvider>
          <BrowserRouter>
            {/* Security Notice Banner */}
            <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2">
              <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm">
                <span className="text-green-600 dark:text-green-400">🔒</span>
                <p className="text-green-800 dark:text-green-300 font-medium">
                  <span className="font-bold">Secure Site:</span> This is a legitimate prediction market interface. We use official Phantom wallet (never ask for private keys). All data from public Polymarket API.
                </p>
              </div>
            </div>
            <Navbar />
            <Routes>
              <Route path="/" element={<Navigate to="/markets" replace />} />
              <Route path="/trade" element={<Trading />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="*" element={<Navigate to="/markets" replace />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </WalletProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;

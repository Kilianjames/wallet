import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from './contexts/WalletContext';
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Trading from "./pages/Trading";
import Markets from "./pages/Markets";
import Portfolio from "./pages/Portfolio";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <WalletProvider>
        <BrowserRouter>
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
    </div>
  );
}

export default App;

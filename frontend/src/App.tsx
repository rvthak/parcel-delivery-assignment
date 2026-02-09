import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CreateParcel } from './pages/CreateParcel';
import { LiveStatus } from './pages/LiveStatus';
import { ScanParcel } from './pages/ScanParcel';
import { ResetSystem } from './pages/ResetSystem';

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/create" element={<CreateParcel />} />
            <Route path="/status" element={<LiveStatus />} />
            <Route path="/scan" element={<ScanParcel />} />
            <Route path="/reset" element={<ResetSystem />} />
            <Route path="*" element={<Navigate to="/create" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

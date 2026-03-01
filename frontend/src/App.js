import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Analytics from './components/Analytics/Analytics';
import PredictiveMaintenancePage from './components/PredictiveMaintenance/PredictiveMaintenancePage';
import Monitoring from './components/Monitoring/Monitoring';
import Alerts from './components/Alerts/Alerts';
import Reports from './components/Reports/Reports';
import Optimization from './components/Optimization/Optimization';
import Settings from './components/Settings/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/maintenance" element={<Layout><PredictiveMaintenancePage /></Layout>} />
        <Route path="/monitoring" element={<Layout><Monitoring /></Layout>} />
        <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/optimization" element={<Layout><Optimization /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
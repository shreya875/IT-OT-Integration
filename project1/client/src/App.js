// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;



// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import DashboardLayout from './components/DashboardLayout';

// import StatusPage from './pages/StatusPage';
// import ReportsPage from './pages/ReportsPage';
// import DistributePage from './pages/DistributePage';
// import AnalyticsPage from './pages/AnalyticsPage';
// import LoginPage from "./pages/LoginPage";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route element={<DashboardLayout />}>
//           <Route path="/" element={<Navigate to="/status" />} />
//           <Route path="/status" element={<StatusPage />} />
//           <Route path="/reports" element={<ReportsPage />} />
//           <Route path="/distribute" element={<DistributePage />} />
//           <Route path="/analytics" element={<AnalyticsPage />} />
//           <Route path="/login" element={<LoginPage />} />
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';

import StatusPage from './pages/StatusPage';
import ReportsPage from './pages/ReportsPage';
import DistributePage from './pages/DistributePage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from './components/ProtectedRoute';
import SignupPage from "./pages/SignupPage";
import CapacityPage from "./pages/CapacityPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public login page, no dashboard layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected dashboard routes */}
         <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/status" />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/erp" element={<ReportsPage />} />
          <Route path="/mes" element={<DistributePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/shopfloors" element={<CapacityPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;


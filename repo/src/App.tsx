import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SessionsList from './pages/SessionsList';
import SessionDetail from './pages/SessionDetail';
import SessionCreate from './pages/SessionCreate';
import DogsPage from './pages/DogsPage';
import HandlersPage from './pages/HandlersPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sessions" element={<SessionsList />} />
        <Route path="/sessions/new" element={<SessionCreate />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/dogs" element={<DogsPage />} />
        <Route path="/handlers" element={<HandlersPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

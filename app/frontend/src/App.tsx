import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import ModelDetail from './pages/ModelDetail';
import RegisterModel from './pages/RegisterModel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="models" element={<Models />} />
          <Route path="models/:version" element={<ModelDetail />} />
          <Route path="register" element={<RegisterModel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
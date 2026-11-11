import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Predict from './pages/Predict'
import Batch from './pages/Batch'
import Models from './pages/Models'
import Insights from './pages/Insights'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Predict />} />
          <Route path="batch" element={<Batch />} />
          <Route path="models" element={<Models />} />
          <Route path="insights" element={<Insights />} />
          <Route path="*" element={<Predict />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import HangulList from './pages/HangulList';
import HangulDetail from './pages/HangulDetail';
import PhraseList from './pages/PhraseList';
import PhraseDetail from './pages/PhraseDetail';
import Pronunciation from './pages/Pronunciation';
import Puzzle from './pages/Puzzle';
import ProgressPage from './pages/ProgressPage';
import RoleplayList from './pages/RoleplayList';
import RoleplayChat from './pages/RoleplayChat';
import Settings from './pages/Settings';
import { getDB } from './lib/db';

// 初回アクセス時に IndexedDB のストア（progress / cache）を作成しておく
void getDB();

// 画面一覧は requirements.md §5 に準拠
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/hangul', element: <HangulList /> },
      { path: '/hangul/:id', element: <HangulDetail /> },
      { path: '/phrases', element: <PhraseList /> },
      { path: '/phrases/:id', element: <PhraseDetail /> },
      { path: '/pronunciation/:id', element: <Pronunciation /> },
      { path: '/puzzle', element: <Puzzle /> },
      { path: '/progress', element: <ProgressPage /> },
      { path: '/roleplay', element: <RoleplayList /> },
      { path: '/roleplay/:id', element: <RoleplayChat /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { bootSchemeDataset } from './lib/data/schemeSync';

// Phase 1 backend: hydrate the scheme dataset from the remote Schemes API
// before first render when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set.
// With the env vars unset (default) this resolves instantly and boot is
// identical to before — the bundled dataset stays active.
bootSchemeDataset().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

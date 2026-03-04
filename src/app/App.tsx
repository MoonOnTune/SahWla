import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './components/auth/AuthContext';
import { RevealPage } from './components/game/RevealPage';
import { router } from './routes';

function decodeRevealParam(): string | null {
  const hash = window.location.hash;
  if (hash.startsWith('#/reveal/')) {
    const encoded = hash.slice('#/reveal/'.length);
    try {
      return decodeURIComponent(encoded);
    } catch {
      return null;
    }
  }
  return null;
}

export default function App() {
  const [revealMovie, setRevealMovie] = useState<string | null>(null);

  useEffect(() => {
    const movie = decodeRevealParam();
    if (movie) setRevealMovie(movie);

    const handleHash = () => {
      const m = decodeRevealParam();
      if (m) setRevealMovie(m);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // If opened via QR code with a reveal param, show the reveal page
  if (revealMovie) {
    return (
      <div className="size-full" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <RevealPage movieName={revealMovie} />
      </div>
    );
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Splash() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(user ? '/dashboard' : '/login');
    }, 2200);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-brand-bg">
      {/* Animated radar icon */}
      <div className="relative w-28 h-28 mb-10">
        {[60, 90, 112].map((size, i) => (
          <div
            key={i}
            className="radar-ring"
            style={{
              width: size, height: size,
              animationDelay: `${i * 0.6}s`
            }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-cyan" />
      </div>

      <h1 className="font-display text-4xl font-bold text-brand-cyan tracking-wide mb-3">
        DriveMind AI
      </h1>
      <p className="text-brand-muted text-sm tracking-wider">Personalized Road Memory</p>

      <button
        onClick={() => navigate(user ? '/dashboard' : '/login')}
        className="mt-16 dm-btn-primary"
        style={{ width: 220 }}
      >
        Get Started
      </button>
    </div>
  );
}

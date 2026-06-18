import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-cyan/10 border border-brand-cyan mb-4">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="dm-title">Welcome Back</h1>
          <p className="dm-subtitle mt-2">Sign in to DriveMind AI</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
          {error && (
            <Alert variant="danger" icon="⚠" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            error={errors.password}
            required
          />

          <Button 
            variant="primary" 
            size="full" 
            disabled={loading}
            className="mt-6"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-brand-muted text-sm mt-6">
          New to DriveMind?{' '}
          <Link to="/register" className="text-brand-cyan hover:text-brand-cyan-light transition-colors font-semibold">
            Create account
          </Link>
        </p>

        {/* Demo info */}
        <div className="mt-8 pt-6 border-t border-brand-border text-center">
          <p className="text-brand-muted text-xs mb-3">Demo Credentials</p>
          <div className="space-y-1 text-xs text-brand-text-dark">
            <p>📧 <code className="bg-brand-surface px-2 py-1 rounded">demo@example.com</code></p>
            <p>🔑 <code className="bg-brand-surface px-2 py-1 rounded">password123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

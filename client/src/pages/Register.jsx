import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Full name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="dm-title">Create Account</h1>
          <p className="dm-subtitle mt-2">Start building your road memory</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
          {error && (
            <Alert variant="danger" icon="⚠" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Input
            label="Full Name"
            type="text"
            placeholder="Arjun Kumar"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name}
            required
          />

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
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            error={errors.password}
            helperText={form.password && form.password.length >= 6 ? '✓ Strong password' : ''}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            error={errors.confirmPassword}
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
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-brand-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-cyan hover:text-brand-cyan-light transition-colors font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

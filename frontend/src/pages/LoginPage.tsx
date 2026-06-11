import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../utils/helpers';
import { Eye, EyeOff, Zap, TicketCheck, Users, BarChart3, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({
        email: form.email.toLowerCase(),
        password: form.password,
      });

      login(data);
      toast.success(`Welcome back, ${data.fullName}!`);
      navigate(data.role === 'CUSTOMER' ? '/dashboard' : '/agent', {
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'customer' | 'agent') => {
    setForm({
      email: role === 'customer' ? 'customer1@example.com' : 'agent1@example.com',
      password: 'password123',
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div
        style={{
          display: 'none',
          width: '52%',
          background: 'linear-gradient(160deg, #0a1628 0%, #0d1f3c 50%, #091a14 100%)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="lg-flex"
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-80px',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '-40px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              height: '40px',
              width: '40px',
              background: '#16a34a',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap style={{ height: '20px', width: '20px', color: '#fff' }} />
          </div>

          <div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px' }}>
              SupportDesk
            </span>
            <p style={{ color: '#4ade80', fontSize: '11px', margin: 0, fontWeight: 500, letterSpacing: '0.5px' }}>
              Ticket Intelligence
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: '999px',
              marginBottom: '24px',
            }}
          >
            <div style={{ height: '7px', width: '7px', background: '#4ade80', borderRadius: '50%' }} />
            <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 500 }}>
              Customer Self-Service Portal
            </span>
          </div>

          <h2
            style={{
              fontSize: '42px',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.15,
              margin: '0 0 20px',
              letterSpacing: '-1px',
            }}
          >
            Submit. <span style={{ color: '#4ade80' }}>Track.</span>
            <br />
            Resolve.
          </h2>

          <p
            style={{
              color: '#94a3b8',
              fontSize: '15px',
              lineHeight: 1.6,
              maxWidth: '360px',
              margin: '0 0 40px',
            }}
          >
            Create your customer account to submit support tickets, monitor progress,
            and receive faster responses from the support team.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '400px' }}>
            {[
              { icon: TicketCheck, stat: 'Tickets', label: 'Create easily' },
              { icon: BarChart3, stat: 'Tracking', label: 'Live status' },
              { icon: Users, stat: 'Support', label: 'Agent replies' },
            ].map(({ icon: Icon, stat, label }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '14px 12px',
                }}
              >
                <Icon style={{ height: '16px', width: '16px', color: '#4ade80', marginBottom: '8px' }} />
                <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '13px', margin: '0 0 2px' }}>
                  {stat}
                </p>
                <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '20px' }}>
          {['Secure Auth', 'Ticket History', 'AI Assisted'].map((badge) => (
            <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ height: '6px', width: '6px', background: '#4ade80', borderRadius: '50%' }} />
              <span style={{ color: '#64748b', fontSize: '12px' }}>{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel untouched */}
      <div
        style={{
          flex: 1,
          background: '#0c1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' }} className="lg-hide">
            <div
              style={{
                height: '36px',
                width: '36px',
                background: '#16a34a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap style={{ height: '18px', width: '18px', color: '#fff' }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
              SupportDesk
            </span>
          </div>

          <h1 style={{ color: '#f1f5f9', fontSize: '26px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Welcome back
          </h1>

          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 32px' }}>
            Sign in to your workspace
          </p>

          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 14px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#fca5a5',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                Email address
              </label>

              <input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#161d2a',
                  border: '1px solid #1e2d40',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#22c55e')}
                onBlur={(e) => (e.target.style.borderColor = '#1e2d40')}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#161d2a',
                    border: '1px solid #1e2d40',
                    borderRadius: '10px',
                    padding: '12px 42px 12px 14px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#22c55e')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e2d40')}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#475569',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ height: '16px', width: '16px' }} />
                  ) : (
                    <Eye style={{ height: '16px', width: '16px' }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#15803d' : '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '13px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s',
                letterSpacing: '-0.2px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#15803d';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#16a34a';
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight style={{ height: '16px', width: '16px' }} />}
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #1e2a3a' }}>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Try a demo account
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button type="button" onClick={() => fillDemo('customer')} style={demoButtonStyle}>
                👤 Customer
              </button>

              <button type="button" onClick={() => fillDemo('agent')} style={demoButtonStyle}>
                🎧 Agent
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '24px' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-flex { display: flex !important; }
          .lg-hide { display: none !important; }
        }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}

const demoButtonStyle: React.CSSProperties = {
  padding: '9px',
  background: 'transparent',
  border: '1px solid #1e2d40',
  borderRadius: '8px',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};
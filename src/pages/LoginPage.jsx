import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, User } from 'lucide-react';

const LoginPage = ({ onLogin, onBack, mode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (email === 'admin@gmail.com' && password === 'admin123') {
      onLogin('admin');
    } else if (email === 'sport@gmail.com' && password === 'sport123') {
      onLogin('user');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto',
            boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)'
          }}>
            <User color="white" size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>
            {mode === 'admin' ? 'Admin console login' : 'User login'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {mode === 'admin' ? 'Sign in with administrator credentials' : 'Sign in to access AI analysis'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ 
              background: 'rgba(255, 50, 50, 0.1)', 
              border: '1px solid rgba(255, 50, 50, 0.3)', 
              borderRadius: '12px', 
              padding: '12px', 
              color: '#ff6b6b', 
              fontSize: '0.85rem',
              textAlign: 'center'
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px 16px 14px 48px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }} 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px 16px 14px 48px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }} 
            />
          </div>

          <button 
            type="submit" 
            className="glow-btn" 
            style={{ 
              marginTop: '12px', 
              padding: '14px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '10px' 
            }}
          >
            <span>Sign In</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={onBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '0.85rem', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

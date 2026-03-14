import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { IS_CLERK_BYPASS } from '../data/constants';
import { Shield, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import './LandingPage.css';

// Reusable animated shape
function ElegantShape({ className, delay = 0, width = 400, height = 100, rotate = 0, glowClassName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate: rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={`elegant-shape ${className}`}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ width, height }}
        className="elegant-shape__inner"
      >
        <div className={`elegant-shape__glow ${glowClassName}`} />
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [authMode, setAuthMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const { theme, toggleTheme } = useTheme();

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  return (
    <div className="landing-page">
      {/* Floating Theme Toggle */}
      <button 
        className={`landing-page__theme-toggle ${theme === 'light' ? 'landing-page__theme-toggle--light' : ''}`}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="theme-toggle-icon theme-toggle-icon--sun">
          <Sun size={18} strokeWidth={2} />
        </span>
        <span className="theme-toggle-icon theme-toggle-icon--moon">
          <Moon size={18} strokeWidth={2} />
        </span>
        <span className="theme-toggle-slider" />
      </button>

      {/* Background Gradient Blur */}
      <div className="landing-page__ambient-blur" />

      {/* Geometric Floating Shapes */}
      <div className="landing-page__shapes-container">
        <ElegantShape
          delay={0.3} width={600} height={140} rotate={12}
          glowClassName="shape-glow--indigo"
          className="shape-1"
        />
        <ElegantShape
          delay={0.5} width={500} height={120} rotate={-15}
          glowClassName="shape-glow--rose"
          className="shape-2"
        />
        <ElegantShape
          delay={0.4} width={300} height={80} rotate={-8}
          glowClassName="shape-glow--violet"
          className="shape-3"
        />
        <ElegantShape
          delay={0.6} width={200} height={60} rotate={20}
          glowClassName="shape-glow--amber"
          className="shape-4"
        />
        <ElegantShape
          delay={0.7} width={150} height={40} rotate={-25}
          glowClassName="shape-glow--cyan"
          className="shape-5"
        />
      </div>

      <div className="landing-page__content">
        {/* Left Side: Hero Copy */}
        <div className="landing-page__hero">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="landing-page__badge glass-card"
          >
            <Sparkles size={14} className="badge-icon" />
            <span>Next-Gen Financial Intelligence</span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="landing-page__title">
              <span className="title-white">Master Your</span>
              <br />
              <span className="title-gradient">Financial Future.</span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="landing-page__subtitle">
              Join FinAdvisor today. AI-driven insights, stunning 3D analytics, and proactive SOS alerts that protect your wealth in real-time.
            </p>
            
            <div className="landing-page__trust">
              <Shield size={20} className="trust-icon" />
              <span>Bank-level 256-bit encryption</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Authentication */}
        <motion.div
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="landing-page__auth-container"
        >
          <div className="auth-box glass-card">
            <div className="auth-toggle">
              <button 
                className={`auth-toggle-btn ${authMode === 'sign-in' ? 'active' : ''}`}
                onClick={() => setAuthMode('sign-in')}
              >
                Sign In
              </button>
              <button 
                className={`auth-toggle-btn ${authMode === 'sign-up' ? 'active' : ''}`}
                onClick={() => setAuthMode('sign-up')}
              >
                Sign Up
              </button>
            </div>
            
            <div className="auth-component-wrapper">
              {/* Pre-render SignIn but hide it if not active */}
              <div style={{ display: authMode === 'sign-in' ? 'block' : 'none', width: '100%' }}>
                {!IS_CLERK_BYPASS ? (
                  <SignIn 
                    routing="hash" 
                    appearance={{
                      elements: {
                        rootBox: "clerk-root-box",
                        card: "clerk-card",
                        headerTitle: "clerk-header",
                        headerSubtitle: "clerk-subtitle",
                        socialButtonsBlockButton: "clerk-social-btn",
                        dividerLine: "clerk-divider-line",
                        dividerText: "clerk-divider-text",
                        formFieldLabel: "clerk-label",
                        formFieldInput: "clerk-input",
                        formButtonPrimary: "clerk-primary-btn btn btn-primary",
                        footer: "clerk-footer hidden",
                      }
                    }}
                  />
                ) : (
                  <div className="clerk-bypass-msg glass-card">
                    <p>Clerk Bypassed (Local Dev)</p>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
                  </div>
                )}
              </div>
              
              {/* Pre-render SignUp but hide it if not active */}
              <div style={{ display: authMode === 'sign-up' ? 'block' : 'none', width: '100%' }}>
                {!IS_CLERK_BYPASS ? (
                  <SignUp 
                    routing="hash" 
                    appearance={{
                      elements: {
                        rootBox: "clerk-root-box",
                        card: "clerk-card",
                        headerTitle: "clerk-header",
                        headerSubtitle: "clerk-subtitle",
                        socialButtonsBlockButton: "clerk-social-btn",
                        dividerLine: "clerk-divider-line",
                        dividerText: "clerk-divider-text",
                        formFieldLabel: "clerk-label",
                        formFieldInput: "clerk-input",
                        formButtonPrimary: "clerk-primary-btn btn btn-primary",
                        footer: "clerk-footer hidden",
                      }
                    }}
                  />
                ) : (
                  <div className="clerk-bypass-msg glass-card">
                    <p>Clerk Bypassed (Local Dev)</p>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom fade out over background */}
      <div className="landing-page__bottom-fade" />
    </div>
  );
}

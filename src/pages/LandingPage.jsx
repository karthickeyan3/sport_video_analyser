import { motion } from 'framer-motion'
import { Play, Activity, Cpu, BarChart3 } from 'lucide-react'

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-page" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Background blobs */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        right: '-10%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(112, 0, 255, 0.08) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <header style={{ zIndex: 10, padding: '32px 0' }}>
        <div className="max-width-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'var(--primary)', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)'
            }}>
              <Activity color="#050505" size={24} />
            </div>
            <span style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: 700, fontFamily: 'Outfit' }}>Sports Analysis<span style={{ color: 'var(--primary)' }}> AI</span></span>
          </div>
   {/*admin acess*/}
   <button 
            onClick={() => onStart('admin')}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              color: 'rgba(255,255,255,0.6)', 
              padding: '10px 20px', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            className="hover-fade"
          >
            <Cpu size={16} /> Admin Access
          </button>
        </div>
      </header>

      <main className="max-width-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        <section className="hero-section" style={{ flex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', maxWidth: '1000px' }}
          >
            <div style={{ textAlign: 'center', margin: '0 auto' }}>
              <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', lineHeight: 1.05, marginBottom: '24px' }} className="text-gradient">
                Analyze Your Performance <br /> with Precision AI
              </h1>
              <p style={{ fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', color: 'rgba(255,255,255,0.6)', maxWidth: '700px', margin: '0 auto 48px', lineHeight: 1.6, padding: '0 16px', boxSizing: 'border-box' }}>
                Track biomechanics, joint angles, and movement efficiency in real-time. 
                Upload your footage and get professional-grade insights instantly.
              </p>

              <button onClick={onStart} className="glow-btn" style={{ padding: 'clamp(16px, 4vw, 24px) clamp(32px, 8vw, 80px)', fontSize: 'clamp(1rem, 4vw, 1.2rem)', borderRadius: '100px', margin: '0 auto' }}>
                <Play fill="white" size={20} /> Analyze Now
              </button>
            </div>
          </motion.div>
        </section>

        <div className="feature-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '32px', 
          paddingBottom: '100px',
          width: '100%' 
        }}>
          {[
            { icon: <Cpu />, title: 'Real-time Tracking', desc: 'Instant pose estimation and joint angle calculation using advanced neural networks.' },
            { icon: <Activity />, title: 'Biomechanics', desc: 'Detailed metrics for knee, hip, and ankle alignment to optimize your technique.' },
            { icon: <BarChart3 />, title: 'Export Data', desc: 'Download comprehensive CSV datasets for deeper analysis and progress tracking.' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              style={{ padding: 'clamp(24px, 5vw, 40px)', textAlign: 'left', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ 
                color: 'var(--primary)', 
                marginBottom: '24px',
                width: '48px',
                height: '48px',
                background: 'rgba(0, 229, 255, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{feature.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default LandingPage;

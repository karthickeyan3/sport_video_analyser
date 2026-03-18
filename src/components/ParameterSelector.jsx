import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const ParameterSelector = ({ metrics, value, onChange, sportConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMetric = metrics.find(m => m.key === value) || metrics[0];
  const primaryColor = sportConfig?.primaryColor || 'var(--primary)';

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: '220px', zIndex: 90 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          color: 'white',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          height: '40px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
           <span style={{ color: primaryColor, opacity: 0.8, fontSize: '0.6rem' }}>●</span>
           {selectedMetric.label}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          style={{ display: 'flex' }}
        >
          <ChevronDown size={16} style={{ opacity: 0.5 }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="hide-scrollbar"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px',
              zIndex: 1000,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {metrics.map((m) => {
              const isSelected = m.key === value;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    onChange(m.key);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: isSelected ? primaryColor : 'rgba(255,255,255,0.7)',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    marginBottom: '2px',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase'
                  }}
                  className="param-dropdown-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSelected && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: primaryColor }} />}
                    {m.label}
                  </div>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .param-dropdown-item:hover {
          background: rgba(255,255,255,0.08) !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default ParameterSelector;

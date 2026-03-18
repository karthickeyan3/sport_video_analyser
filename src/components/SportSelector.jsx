import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const SportSelector = ({ value, onChange, config }) => {
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

  const selectedSport = config[value];

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: '180px', zIndex: 100 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          height: '42px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           {selectedSport.name}
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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '6px',
              zIndex: 1000,
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden'
            }}
          >
            {Object.keys(config).map((key) => {
              const sport = config[key];
              const isSelected = key === value;
              return (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    marginBottom: '2px',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  className="dropdown-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSelected && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />}
                    {sport.name}
                  </div>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .dropdown-item:hover {
          background: rgba(255,255,255,0.05) !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default SportSelector;

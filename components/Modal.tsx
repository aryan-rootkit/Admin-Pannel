'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Premium Enterprise Modal Component
 * Scale-up animation, clean white design
 * Orange accent highlights
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col border border-slate-200`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Premium Style */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-xl font-bold text-navy-900 font-display">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

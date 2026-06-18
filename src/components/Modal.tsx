import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  icon?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="glass-card rounded-[2rem] max-w-md w-full p-6 space-y-6 text-left border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
};

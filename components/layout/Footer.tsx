
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface FooterProps {
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  const { t } = useAppContext();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-colors duration-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-start">
            <h2 className="text-2xl font-bold tracking-tighter text-black dark:text-white">ASHUS</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Baghdad, Iraq</p>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm font-medium">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm font-medium">
              WhatsApp
            </a>
            <a href="#" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm font-medium">
              Email
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-900 text-center flex flex-col items-center gap-2">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            &copy; {year} ASHUS Custom Printing. All rights reserved.
          </p>
          {onAdminClick && (
            <button 
              onClick={onAdminClick}
              className="text-[10px] text-gray-300 dark:text-gray-800 hover:text-accent transition-colors uppercase tracking-widest"
            >
              Admin Access
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

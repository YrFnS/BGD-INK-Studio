import React from 'react';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
}

export const Magnetic: React.FC<MagneticProps> = ({ children }) => (
  <div className="inline-block">{children}</div>
);


import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center py-8 md:py-10">
      <h1 className="text-4xl md:text-5xl font-bold text-brand-primary mb-2 tracking-tight">
        DocuShare
      </h1>
      <p className="text-lg md:text-xl text-subtle-text font-medium">
        Print documents without sharing personal information
      </p>
    </header>
  );
};
    

import React from 'react';
import { Header } from '@/components/Header';
import { ConfidentialitySettings } from '@/components/casf/confidentiality/ConfidentialitySettings';
import { AppSidebar } from '@/components/AppSidebar';

export default function ConfidentialitySettingsPage() {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Paramètres de confidentialité</h1>
          <ConfidentialitySettings />
        </main>
      </div>
    </div>
  );
}

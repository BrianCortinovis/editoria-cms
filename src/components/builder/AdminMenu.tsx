'use client';

import { useState } from 'react';
import { Settings, Menu, X, Download, LogOut, HardDrive } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface AdminMenuProps {
  projectId?: string;
}

function SettingsPanel({ onClose, projectId }: { onClose: () => void; projectId?: string }) {
  const handleBackup = () => {
    window.location.href = '/dashboard/tecnico';
  };

  const handleExport = async () => {
    if (!projectId) {
      window.location.href = '/dashboard/tecnico';
      return;
    }

    try {
      const response = await fetch(`/api/export/${projectId}`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.html) {
        throw new Error(data.error || 'Export failed');
      }

      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename || 'page.html';
      link.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Errore export');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleBackup}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)' }}
      >
        <HardDrive size={14} />
        Backup Database
      </button>
      <button
        onClick={handleExport}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)' }}
      >
        <Download size={14} />
        Export Data
      </button>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        style={{ background: 'var(--c-bg-1)', color: '#ef4444' }}
      >
        <LogOut size={14} />
        Logout
      </button>
    </div>
  );
}

export function AdminMenu({ projectId }: AdminMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on first render
  useState(() => {
    setIsMobile(window.innerWidth < 768);
  });

  if (isMobile) {
    // Mobile: slide-out panel
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg transition-colors"
          style={{ background: isOpen ? 'var(--c-bg-1)' : 'transparent', color: 'var(--c-text-0)' }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}

        <div
          className={cn(
            'fixed left-0 top-0 h-full w-64 shadow-lg z-50 transition-transform duration-300',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{ background: 'var(--c-bg-0)' }}
        >
          <div className="p-4 space-y-4 h-full overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex justify-end"
            >
              <X size={20} />
            </button>

            {showSettings ? (
              <>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-xs mb-4"
                  style={{ color: 'var(--c-text-1)' }}
                >
                  ← Back
                </button>
                <SettingsPanel projectId={projectId} onClose={() => setShowSettings(false)} />
              </>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)' }}
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop: inline buttons
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 rounded-lg transition-colors"
        style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)' }}
        title="Admin Settings"
      >
        <Settings size={16} />
      </button>

      {showSettings && (
        <div
          className="fixed top-12 right-4 w-56 rounded-lg shadow-lg z-40 p-3"
          style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
        >
          <SettingsPanel projectId={projectId} onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  );
}

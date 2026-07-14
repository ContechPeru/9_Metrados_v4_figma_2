import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ActiveUser {
  id: string;
  nombre_completo: string;
  iniciales: string;
  color: string;
  joined_at: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ActiveUsers() {
  const { user } = useAuthStore();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!user) return;

    // Create a color based on user ID to keep it consistent
    const colorIndex = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLORS.length;
    const myColor = COLORS[colorIndex];

    const channel = supabase.channel('room_metrados', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: ActiveUser[] = [];
        
        // Flatten state
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences.length > 0) {
            users.push(presences[0] as ActiveUser);
          }
        });

        // Sort so the current user is always last (or first)
        users.sort((a, b) => a.joined_at.localeCompare(b.joined_at));
        setActiveUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            nombre_completo: user.nombre_completo,
            iniciales: user.iniciales || user.nombre_completo.substring(0, 2).toUpperCase(),
            color: myColor,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || activeUsers.length === 0) return null;

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center -space-x-1.5 hover:opacity-80 transition-opacity"
        title={`${activeUsers.length} usuarios en línea`}
      >
        {activeUsers.slice(0, 3).map((u) => (
          <div 
            key={u.id}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white shadow-sm"
            style={{ backgroundColor: u.color, fontFamily: 'DM Sans, sans-serif' }}
          >
            {u.iniciales}
          </div>
        ))}
        {activeUsers.length > 3 && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-600 bg-slate-100 border-2 border-white shadow-sm z-0">
            +{activeUsers.length - 3}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-slate-100 border border-slate-200 shadow-xl rounded-xl z-50 flex flex-col min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 mb-1 border-b border-slate-100 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {activeUsers.length} en línea
            </span>
          </div>
          
          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {activeUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: u.color, fontFamily: 'DM Sans, sans-serif' }}
                >
                  {u.iniciales}
                </div>
                <span className="text-[11px] font-medium text-slate-700 truncate" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {u.id === user.id ? 'Tú' : u.nombre_completo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

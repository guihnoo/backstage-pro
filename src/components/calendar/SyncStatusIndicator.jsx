import React, { useState, useEffect } from 'react';
import { UserSettings } from '@/api/entities';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SyncStatusIndicator({ user }) {
  const [syncStatus, setSyncStatus] = useState({ connected: false, lastSync: null });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const settingsList = await UserSettings.filter({ user_id: user.id });
        const settings = settingsList && settingsList.length > 0 ? settingsList[0] : null;
        if (settings) {
          setSyncStatus({
            connected: settings.google_calendar_connected,
            lastSync: settings.last_sync_date
          });
        }
      } catch (error) {
        console.error("Failed to fetch sync status", error);
      }
    };
    fetchStatus();
  }, [user]);

  const { connected, lastSync } = syncStatus;
  const lastSyncText = lastSync 
    ? `Última sincronização ${formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: ptBR })}`
    : 'Nunca sincronizado';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {connected ? (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <Wifi className="w-4 h-4" />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 border-slate-700 text-white">
          <p>Google Calendar: {connected ? lastSyncText : 'Desconectado'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
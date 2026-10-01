'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AnalyticsPanels, RangeSwitch, type AnalyticsRangeValue } from '@/components/analytics/analytics-panels';
import { useToast } from '@/components/ui/toast';
import type { ClientLink, LinkAnalytics } from '@/lib/client-types';

export default function AnalyticsTab({ link, initialData }: { link: ClientLink; initialData: LinkAnalytics }) {
  const { showToast } = useToast();
  const [range, setRange] = useState<AnalyticsRangeValue>('30d');
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const changeRange = async (next: AnalyticsRangeValue) => {
    setRange(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?link_id=${link.id}&range=${next}`);
      const json = await res.json();
      if (json.success) setData(json);
      else showToast('error', json.error || 'Maʼlumotlarni yuklab bo‘lmadi');
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">
          Tanlangan davrda <span className="font-mono font-bold text-white">{data.totalClicks}</span> ta bosish
        </p>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
          <RangeSwitch value={range} onChange={changeRange} />
        </div>
      </div>
      <AnalyticsPanels data={data} totalClicks={data.totalClicks} timelineTitle="Bosishlar dinamikasi" />
    </div>
  );
}

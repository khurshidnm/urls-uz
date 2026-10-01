'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

/** For a user who lost both the phone and the recovery codes. Two-step click. */
export default function ResetTwoFactorButton({ userId }: { userId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [armed, setArmed] = useState(false);

  const reset = async () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setArmed(false);
    const data = await (await fetch(`/api/admin/users/${userId}/2fa`, { method: 'DELETE' })).json();
    if (!data.success) return showToast('error', data.error || 'Bajarilmadi');
    showToast('success', 'Foydalanuvchining 2FA himoyasi o‘chirildi');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={reset}
      className={`text-[11px] px-2.5 py-1.5 rounded-lg border ${armed ? 'bg-rose-600 text-white border-rose-600' : 'text-rose-300 border-rose-500/30 hover:bg-rose-500/10'}`}
    >
      {armed ? 'Tasdiqlash: shaxsini tekshirdim, 2FA ni o‘chirish' : '2FA ni tiklash (telefon va kodlar yo‘qolgan)'}
    </button>
  );
}

'use client';

import { useState } from 'react';
import type { Group } from '@/lib/types';

interface Props {
  groups: Group[];
  userId: string;
}

export default function GroupsSection({ groups: initialGroups, userId }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const group = await res.json();
      setGroups(prev => [...prev, group]);
      setGroupName(''); setShowCreate(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
    if (memberId === userId) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      {groups.map(g => (
        <div key={g.id} className="bg-[#0f1923] border border-white/8 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-[#f1f5f9]">{g.name}</p>
              {g.admin_id === userId && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">Admin</span>
              )}
            </div>
            <button
              onClick={() => copyCode(g.invite_code)}
              className="bg-[#1a2535] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-[#94a3b8]"
            >
              {copied === g.invite_code ? 'Copied!' : `Code: ${g.invite_code}`}
            </button>
          </div>
          {g.admin_id !== userId && (
            <button
              onClick={() => removeMember(g.id, userId)}
              className="text-xs text-[#475569] hover:text-[#ef4444] mt-1"
            >
              Leave group
            </button>
          )}
        </div>
      ))}

      {/* Create / Join */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
          className="flex-1 bg-[#f59e0b] text-[#080c14] font-bold rounded-xl py-3 text-xs uppercase tracking-widest"
        >
          + Create
        </button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
          className="flex-1 bg-[#0f1923] border border-white/8 text-[#94a3b8] font-bold rounded-xl py-3 text-xs uppercase tracking-widest"
        >
          Join
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-2">
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group name"
            className="flex-1 bg-[#1a2535] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/50"
          />
          <button
            onClick={createGroup}
            disabled={loading}
            className="bg-[#f59e0b] text-[#080c14] font-bold rounded-xl px-4 text-xs disabled:opacity-50"
          >
            {loading ? '…' : 'Create'}
          </button>
        </div>
      )}

      {showJoin && (
        <div className="flex gap-2">
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Invite code"
            maxLength={6}
            className="flex-1 bg-[#1a2535] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/50 uppercase font-mono tracking-widest"
          />
          <button
            onClick={joinGroup}
            disabled={loading}
            className="bg-[#f59e0b] text-[#080c14] font-bold rounded-xl px-4 text-xs disabled:opacity-50"
          >
            {loading ? '…' : 'Join'}
          </button>
        </div>
      )}

      {error && <p className="text-[#ef4444] text-xs">{error}</p>}
    </div>
  );
}

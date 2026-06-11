'use client';

import { useState } from 'react';
import type { Group } from '@/lib/types';

interface Member {
  user_id: string;
  joined_at: string;
  nickname: string | null;
  profile: { display_name: string } | null;
}

interface Props {
  groups: Group[];
  userId: string;
  memberNicknames: Record<string, string | null>;
}

export default function GroupsSection({ groups: initialGroups, userId, memberNicknames: initialNicknames }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Manage members state
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [membersByGroup, setMembersByGroup] = useState<Record<string, Member[]>>({});
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Nickname state
  const [nicknames, setNicknames] = useState<Record<string, string | null>>(initialNicknames);
  const [editingNicknameGroupId, setEditingNicknameGroupId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);

  // Score predictor state
  const [scorePredictorMap, setScorePredictorMap] = useState<Record<string, boolean>>(
    Object.fromEntries(initialGroups.map(g => [g.id, g.score_predictor ?? false]))
  );
  const [togglingScorePredictor, setTogglingScorePredictor] = useState<string | null>(null);

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

  const toggleManage = async (groupId: string) => {
    if (managingGroupId === groupId) {
      setManagingGroupId(null);
      return;
    }
    setManagingGroupId(groupId);
    if (membersByGroup[groupId]) return; // already fetched
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`);
      if (res.ok) { const data = await res.json(); setMembersByGroup(prev => ({ ...prev, [groupId]: data })); }
    } finally {
      setMembersLoading(false);
    }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
      if (!res.ok) return;
      if (memberId === userId) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setManagingGroupId(null);
      } else {
        setMembersByGroup(prev => ({
          ...prev,
          [groupId]: prev[groupId].filter(m => m.user_id !== memberId),
        }));
      }
    } finally {
      setRemovingId(null);
    }
  };

  const toggleScorePredictor = async (groupId: string) => {
    const next = !scorePredictorMap[groupId];
    setTogglingScorePredictor(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score_predictor: next }),
      });
      if (res.ok) setScorePredictorMap(prev => ({ ...prev, [groupId]: next }));
    } finally {
      setTogglingScorePredictor(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const startEditNickname = (groupId: string) => {
    setNicknameDraft(nicknames[groupId] ?? '');
    setEditingNicknameGroupId(groupId);
  };

  const saveNickname = async (groupId: string) => {
    setSavingNickname(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nicknameDraft }),
      });
      if (res.ok) {
        setNicknames(prev => ({ ...prev, [groupId]: nicknameDraft.trim() || null }));
      }
    } finally {
      setSavingNickname(false);
      setEditingNicknameGroupId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {groups.map(g => {
        const isAdmin = g.admin_id === userId;
        const isManaging = managingGroupId === g.id;
        const members = membersByGroup[g.id] ?? [];

        return (
          <div key={g.id} className="bg-[#0f1923] border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-[#f1f5f9]">{g.name}</p>
                {isAdmin && (
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

            <div className="flex items-center justify-between">
              {isAdmin ? (
                <button
                  onClick={() => toggleManage(g.id)}
                  className="text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors flex items-center gap-1"
                >
                  {isManaging ? '▲ Hide members' : '▼ Manage members'}
                </button>
              ) : (
                <button
                  onClick={() => removeMember(g.id, userId)}
                  className="text-xs text-[#94a3b8] hover:text-[#ef4444] transition-colors"
                >
                  Leave group
                </button>
              )}
            </div>

            {/* Score predictor toggle — admin only */}
            {isAdmin && (
              <div className="mt-2 pt-2 border-t border-white/8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#f1f5f9]">Score predictor</p>
                  <p className="text-[10px] text-[#94a3b8]">Members earn +1pt for exact scores</p>
                </div>
                <button
                  onClick={() => toggleScorePredictor(g.id)}
                  disabled={togglingScorePredictor === g.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50 ${
                    scorePredictorMap[g.id] ? 'bg-[#f59e0b]' : 'bg-[#1a2535] border border-white/10'
                  }`}
                >
                  <span className={`inline-block size-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    scorePredictorMap[g.id] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            )}

            {/* Per-group nickname */}
            <div className="mt-2 pt-2 border-t border-white/8">
              {editingNicknameGroupId === g.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nicknameDraft}
                    onChange={e => setNicknameDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveNickname(g.id); if (e.key === 'Escape') setEditingNicknameGroupId(null); }}
                    placeholder="Your nickname here"
                    maxLength={40}
                    className="flex-1 bg-[#1a2535] border border-[#f59e0b]/50 rounded-lg px-3 py-1.5 text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]"
                  />
                  <button
                    onClick={() => saveNickname(g.id)}
                    disabled={savingNickname}
                    className="text-xs font-bold text-[#f59e0b] disabled:opacity-50 flex-shrink-0"
                  >
                    {savingNickname ? '…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingNicknameGroupId(null)}
                    className="text-xs text-[#94a3b8] flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditNickname(g.id)}
                  className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {nicknames[g.id]
                    ? <span>Nickname: <span className="text-[#f1f5f9] font-semibold">{nicknames[g.id]}</span></span>
                    : 'Set nickname for this group'
                  }
                </button>
              )}
            </div>

            {/* Member list for admin */}
            {isAdmin && isManaging && (
              <div className="mt-3 pt-3 border-t border-white/8">
                {membersLoading && members.length === 0 ? (
                  <p className="text-xs text-[#94a3b8]">Loading…</p>
                ) : members.length === 0 ? (
                  <p className="text-xs text-[#94a3b8]">No members yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {members.map(m => {
                      const name = m.profile?.display_name ?? 'Unknown';
                      const isSelf = m.user_id === userId;
                      return (
                        <li key={m.user_id} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-[#f1f5f9]">
                            {name}
                            {isSelf && <span className="ml-1.5 text-[10px] text-[#f59e0b] font-bold uppercase tracking-widest">you</span>}
                          </span>
                          {!isSelf && (
                            <button
                              onClick={() => removeMember(g.id, m.user_id)}
                              disabled={removingId === m.user_id}
                              className="text-xs font-semibold text-[#ef4444] border border-[#ef4444]/30 rounded-lg px-2.5 py-1 hover:bg-[#ef4444]/10 disabled:opacity-40 transition-colors"
                            >
                              {removingId === m.user_id ? '…' : 'Remove'}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}

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

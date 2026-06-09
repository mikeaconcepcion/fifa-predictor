import Link from 'next/link';

const sections = [
  {
    icon: '⚽',
    title: 'Make Your Picks',
    items: [
      'Go to the Matches tab and tap any upcoming match.',
      'Choose the team you think will win — or predict a Draw.',
      'Tap Lock In Pick to save your prediction.',
      'You can change your pick any time before kickoff.',
    ],
  },
  {
    icon: '🔒',
    title: 'Pick Deadline',
    items: [
      'Picks lock the moment a match kicks off.',
      'Locked matches show a padlock — no changes allowed.',
      'Make sure you pick before the whistle!',
    ],
  },
  {
    icon: '🏆',
    title: 'How Points Work',
    items: [
      'Correct outcome (right win or draw): 3 points.',
      'Exact scoreline on the Final: 5 points.',
      'Wrong prediction: 0 points.',
      'Points update automatically after each match finishes.',
    ],
  },
  {
    icon: '👥',
    title: 'Private Groups',
    items: [
      'Go to Profile and tap + Create to start a group.',
      'Share your invite code with friends.',
      'Friends tap Join and enter the code to join.',
      'Compete on your own group leaderboard.',
    ],
  },
  {
    icon: '📊',
    title: 'Leaderboard',
    items: [
      'The global leaderboard ranks all players by total points.',
      'Switch between Global and your group views.',
      'Top 3 players earn gold, silver, and bronze on the podium.',
      'Your rank is always visible even if you\'re outside the top 10.',
    ],
  },
  {
    icon: '🔭',
    title: 'Spoiler Mode',
    items: [
      'Toggle Spoiler Mode in Profile → Settings.',
      'Finished match scores will be blurred until you turn it off.',
      'Great if you\'re watching matches on delay.',
    ],
  },
];

export default function HowToPlayPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <Link href="/profile" className="text-xs text-[#94a3b8] mb-3 block">← Back to Profile</Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">Guide</p>
        <h1 className="font-[family-name:var(--font-bebas)] text-4xl text-[#f1f5f9] tracking-wide mt-0.5">How to Play</h1>
        <p className="text-sm text-[#94a3b8] mt-2">Everything you need to know to compete in the World Cup 2026 Predictor.</p>
      </div>

      {/* Scoring summary card */}
      <div className="mx-4 mb-6 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b] mb-3">Points at a glance</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Correct outcome', pts: '3 pts', color: 'text-[#22c55e]' },
            { label: 'Exact scoreline (Final only)', pts: '5 pts', color: 'text-[#f59e0b]' },
            { label: 'Wrong prediction', pts: '0 pts', color: 'text-[#94a3b8]' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-[#f1f5f9]">{row.label}</span>
              <span className={`font-[family-name:var(--font-bebas)] text-xl ${row.color}`}>{row.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 flex flex-col gap-4 pb-8">
        {sections.map(s => (
          <div key={s.title} className="bg-[#0f1923] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{s.icon}</span>
              <h2 className="font-[family-name:var(--font-bebas)] text-xl text-[#f1f5f9] tracking-wide">{s.title}</h2>
            </div>
            <ul className="flex flex-col gap-2">
              {s.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                  <span className="text-[#f59e0b] mt-0.5 flex-shrink-0">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

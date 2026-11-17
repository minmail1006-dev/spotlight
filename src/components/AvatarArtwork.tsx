import type { ReactNode } from 'react'

type Props = { avatarId?: string | null; size?: number; className?: string }

const ink = '#25343A'
const cream = '#F6E8C9'
const rust = '#C65F3D'
const mustard = '#D9A83F'
const teal = '#397C78'
const pink = '#D98D82'

function drawing(id: string): ReactNode {
  const line = { fill: 'none', stroke: ink, strokeWidth: 3.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'cycling': return <><circle cx="28" cy="66" r="15" {...line}/><circle cx="72" cy="66" r="15" {...line}/><path d="M28 66 43 42 55 66H28L47 66 72 66 58 39" {...line}/><circle cx="56" cy="22" r="6" fill={rust}/><path d="m53 31-10 13 12 9 9-13m-21 0-10-2" {...line}/></>
    case 'swimming': return <><circle cx="56" cy="29" r="8" fill={rust}/><path d="m48 38 14 7 12-8m-27 1-10 13 14 6 9-8" {...line}/><path d="M15 67q10-9 20 0t20 0 20 0 20 0M15 78q10-9 20 0t20 0 20 0 20 0" {...line}/></>
    case 'sauna': return <><path d="M22 68h56M28 68V48h40v20M34 48V40h28v8" {...line}/><path d="M36 31q-8-9 0-17m12 17q-8-9 0-17m12 17q-8-9 0-17" {...line}/><path d="M25 76h46" {...line}/></>
    case 'yoga': return <><circle cx="50" cy="24" r="8" fill={rust}/><path d="M50 34v20m0-12-19 9m19-9 19 9M50 54 34 69m16-15 16 15M25 74h50" {...line}/></>
    case 'coffee': return <><path d="M25 42h42v28H25z" fill={cream} stroke={ink} strokeWidth="3.5"/><path d="M67 48h8q12 0 7 12-3 7-15 5" {...line}/><path d="M36 32q-7-8 0-15m14 15q-7-8 0-15m14 15q-7-8 0-15" {...line}/><path d="M22 75h58" {...line}/></>
    case 'beer': return <><path d="M29 38h39v39H29z" fill={mustard} stroke={ink} strokeWidth="3.5"/><path d="M68 47h8q12 0 8 14-3 8-16 7" {...line}/><path d="M29 39q-3-13 8-13 5-13 15-4 12-8 16 5" fill={cream} stroke={ink} strokeWidth="3.5" strokeLinejoin="round"/></>
    case 'cocktail': return <><path d="M22 27h56L50 54z" fill={pink} stroke={ink} strokeWidth="3.5" strokeLinejoin="round"/><path d="M50 54v21m-16 0h32" {...line}/><path d="m66 27 9-9m-5 0 5 9" {...line}/><circle cx="36" cy="34" r="4" fill={mustard}/></>
    case 'pastry': return <><path d="M18 63q3-30 25-39 21-8 35 14 8 13-2 29-11 15-29 11-17-2-29-15Z" fill={mustard} stroke={ink} strokeWidth="3.5"/><path d="M30 59q5-18 17-25m-9 37q6-19 20-29m-4 36q5-13 16-19" {...line}/></>
    case 'cooking': return <><path d="M24 47h52v27H24z" fill={teal} stroke={ink} strokeWidth="3.5"/><path d="M18 48h64M34 40q-5-13 5-13 2-13 13-8 12-6 14 8 8 0 5 13" {...line}/><path d="M42 59h16" stroke={cream} strokeWidth="4" strokeLinecap="round"/></>
    case 'running': return <><circle cx="59" cy="22" r="7" fill={rust}/><path d="m54 32-13 15 15 7 12-12m-27 5-12 13m27-6-9 17m9-17 17 13" {...line}/></>
    case 'tennis': return <><ellipse cx="43" cy="42" rx="17" ry="25" transform="rotate(32 43 42)" fill={teal} stroke={ink} strokeWidth="3.5"/><path d="m55 60 19 19" {...line}/><path d="M29 29q19 7 28 25M31 52q17-10 25-25" stroke={cream} strokeWidth="2.5" fill="none"/><circle cx="74" cy="24" r="8" fill={mustard}/></>
    case 'dance': return <><circle cx="38" cy="23" r="7" fill={rust}/><circle cx="66" cy="29" r="7" fill={mustard}/><path d="m38 32-7 19 15 8 9-15m-24 7-12 15m21-7-9 17m35-35-8 17-13 7m13-7 12 17" {...line}/></>
    case 'kayaking': return <><path d="M15 66q35-26 66 0-31 21-66 0Z" fill={rust} stroke={ink} strokeWidth="3.5"/><path d="m35 24 27 53m-9-53L26 77" {...line}/><path d="M16 81q10-6 20 0t20 0 20 0" {...line}/></>
    case 'climbing': return <><path d="M18 76 33 25l18 26 14-31 14 56Z" fill={teal} stroke={ink} strokeWidth="3.5" strokeLinejoin="round"/><circle cx="37" cy="43" r="4" fill={mustard}/><circle cx="62" cy="59" r="5" fill={pink}/><circle cx="52" cy="30" r="4" fill={cream}/></>
    case 'camera': return <><path d="M20 37h56v38H20z" fill={teal} stroke={ink} strokeWidth="3.5"/><path d="m34 37 6-9h16l6 9" {...line}/><circle cx="48" cy="56" r="13" fill={cream} stroke={ink} strokeWidth="3.5"/><circle cx="48" cy="56" r="6" fill={rust}/><circle cx="67" cy="46" r="3" fill={mustard}/></>
    case 'jazz': return <><path d="M52 18v37q0 14-15 14-10 0-10-9 0-8 10-8h8V29q0-8 7-11Z" fill={mustard} stroke={ink} strokeWidth="3.5"/><path d="M52 28q17-8 23 7l-8 9q-7-7-15-4" fill={rust} stroke={ink} strokeWidth="3.5"/><circle cx="37" cy="57" r="3" fill={ink}/></>
    case 'vinyl': return <><circle cx="49" cy="49" r="31" fill={ink}/><circle cx="49" cy="49" r="21" fill="none" stroke={cream} strokeWidth="2"/><circle cx="49" cy="49" r="12" fill="none" stroke={cream} strokeWidth="2"/><circle cx="49" cy="49" r="6" fill={rust}/><circle cx="49" cy="49" r="2" fill={ink}/></>
    case 'books': return <><path d="M19 30q16-8 30 2v42q-14-10-30-2Zm62 0q-16-8-32 2v42q15-10 32-2Z" fill={cream} stroke={ink} strokeWidth="3.5" strokeLinejoin="round"/><path d="M27 39q9-3 15 1m-15 8q9-3 15 1m18-9q9-4 15-1m-15 10q9-4 15-1" {...line}/></>
    case 'art': return <><path d="M48 17q-31 0-33 29-3 30 28 33 11 1 8-10-4-10 8-10 24 1 24-17-1-25-35-25Z" fill={pink} stroke={ink} strokeWidth="3.5"/><circle cx="34" cy="38" r="5" fill={mustard}/><circle cx="51" cy="31" r="5" fill={teal}/><circle cx="67" cy="42" r="5" fill={cream}/><circle cx="34" cy="57" r="5" fill={rust}/></>
    case 'dog': return <><path d="M28 39 18 26q-4 24 10 29m40-16 11-13q5 24-11 30" fill={rust} stroke={ink} strokeWidth="3.5" strokeLinejoin="round"/><circle cx="49" cy="48" r="25" fill={mustard} stroke={ink} strokeWidth="3.5"/><circle cx="40" cy="45" r="3" fill={ink}/><circle cx="58" cy="45" r="3" fill={ink}/><ellipse cx="49" cy="57" rx="8" ry="6" fill={cream} stroke={ink} strokeWidth="2.5"/><path d="M49 56v5m0 0q-6 7-11 0m11 0q6 7 11 0" {...line}/></>
    case 'cat': return <><path d="m25 39 2-19 16 11 12 0 16-11 2 19q9 30-24 38-33-8-24-38Z" fill={teal} stroke={ink} strokeWidth="3.5" strokeLinejoin="round"/><circle cx="39" cy="48" r="3" fill={cream}/><circle cx="59" cy="48" r="3" fill={cream}/><path d="m45 58 4 4 4-4m-4 4v5m-8-5-14-3m14 9-14 3m30-9 14-3m-14 9 14 3" {...line}/></>
    case 'gardening': return <><path d="M29 53h42l-5 27H34z" fill={rust} stroke={ink} strokeWidth="3.5"/><path d="M50 54V28m0 12q-24 0-22-20 20-3 22 20Zm0-7q1-23 23-24 3 20-23 24Z" fill={teal} stroke={ink} strokeWidth="3.5" strokeLinejoin="round"/></>
    case 'theatre': return <><path d="M17 30q19-16 34 0v33q-15 17-34 0Zm28 0q19-16 34 0v33q-15 17-34 0Z" fill={mustard} stroke={ink} strokeWidth="3.5"/><path d="M27 44h5m9 0h-5m20 0h5m9 0h-5M27 57q7 8 14 0m14 0q7 8 14 0" {...line}/></>
    case 'gaming': return <><path d="M25 38q-12 0-15 25-2 15 12 13l15-13h23l15 13q14 2 12-13-3-25-15-25Z" fill={teal} stroke={ink} strokeWidth="3.5"/><path d="M30 48v17m-8-8h16" {...line}/><circle cx="63" cy="53" r="4" fill={mustard}/><circle cx="73" cy="62" r="4" fill={rust}/></>
    case 'cinema': return <><rect x="18" y="30" width="62" height="44" rx="5" fill={ink}/><path d="M18 42h62M18 62h62" stroke={cream} strokeWidth="3"/><path d="m40 43 20 10-20 10Z" fill={mustard}/><path d="M28 30v12m15-12v12m15-12v12m15-12v12M28 62v12m15-12v12m15-12v12m15-12v12" stroke={rust} strokeWidth="3"/></>
    case 'boardgames': return <><rect x="22" y="22" width="52" height="52" rx="8" fill={rust} stroke={ink} strokeWidth="3.5" transform="rotate(-8 48 48)"/><g fill={cream}><circle cx="37" cy="38" r="4"/><circle cx="59" cy="38" r="4"/><circle cx="48" cy="49" r="4"/><circle cx="37" cy="61" r="4"/><circle cx="59" cy="61" r="4"/></g></>
    case 'theatre': return <><path d="M17 30q19-16 34 0v33q-15 17-34 0Zm28 0q19-16 34 0v33q-15 17-34 0Z" fill={mustard} stroke={ink} strokeWidth="3.5"/><path d="M27 44h5m9 0h-5m20 0h5m9 0h-5M27 57q7 8 14 0m14 0q7 8 14 0" {...line}/></>
    default: return <><path d="M25 70q22-47 46 0" {...line}/><circle cx="49" cy="35" r="15" fill={rust} stroke={ink} strokeWidth="3.5"/></>
  }
}

export function AvatarArtwork({ avatarId = 'cycling', size = 48, className = '' }: Props) {
  const bg = AVATARS.find((item) => item.id === avatarId)?.color ?? cream
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" role="img" aria-label={AVATARS.find((item) => item.id === avatarId)?.name ?? 'Spotlight interest'}>
      <rect x="2" y="2" width="92" height="92" rx="24" fill={bg} />
      <path d="M9 18q19-10 34-5M65 83q12-4 20-15" fill="none" stroke={cream} strokeWidth="2" opacity=".65" strokeLinecap="round"/>
      {drawing(avatarId ?? 'cycling')}
      <circle cx="82" cy="15" r="2" fill={ink} opacity=".35"/>
      <circle cx="14" cy="81" r="2" fill={ink} opacity=".25"/>
    </svg>
  )
}

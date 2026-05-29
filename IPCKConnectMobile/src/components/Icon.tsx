import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { tokens } from '../theme/tokens';

export type IconName =
  | 'today' | 'community' | 'give' | 'watch' | 'profile' | 'verse' | 'pray'
  | 'flame' | 'sparkle' | 'check' | 'close' | 'chevron' | 'chevronL' | 'chevronD'
  | 'arrow' | 'plus' | 'bell' | 'share' | 'bookmark' | 'search' | 'translate'
  | 'download' | 'upload' | 'send' | 'cal' | 'lock' | 'globe' | 'eye' | 'eyeOff'
  | 'edit' | 'trash' | 'help' | 'mic' | 'camera' | 'play' | 'pause' | 'phone'
  | 'mail' | 'filter' | 'sort' | 'open' | 'dots' | 'pin' | 'flag' | 'wifiOff'
  | 'whatsapp' | 'church' | 'heart' | 'book';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color = tokens.text, strokeWidth = 1.6 }: IconProps) {
  const p = { stroke: color, strokeWidth, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const v = '0 0 24 24';
  switch (name) {
    case 'today':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M5 4h14v16l-7-3-7 3z"/><Path {...p} d="M9 9h6M9 12h4"/></Svg>;
    case 'community': return <Svg width={size} height={size} viewBox={v}><Circle {...p} cx={9} cy={8} r={3.4}/><Circle {...p} cx={17} cy={9} r={2.6}/><Path {...p} d="M3 19c0-3.2 2.9-5.5 6-5.5s6 2.3 6 5.5M14.5 19c0-2 2-3.6 4-3.6"/></Svg>;
    case 'give':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10Z"/></Svg>;
    case 'watch':     return <Svg width={size} height={size} viewBox={v}><Rect {...p} x={3} y={5} width={18} height={14} rx={2}/><Path d="m10 9 6 3-6 3z" fill={color}/></Svg>;
    case 'profile':   return <Svg width={size} height={size} viewBox={v}><Circle {...p} cx={12} cy={8} r={4}/><Path {...p} d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"/></Svg>;
    case 'verse':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M4 4h11a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H4z"/><Path {...p} d="M8 9h7M8 13h5"/></Svg>;
    case 'pray':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M9 21V13c0-1 .5-2 1.5-2.5L13 9V5a2 2 0 1 1 4 0v6.5c0 2-1 3.5-3 4.5l-2 1v4M9 13H6a2 2 0 0 0 0 4h3"/></Svg>;
    case 'flame':     return <Svg width={size} height={size} viewBox={v}><Path d="M12 3c1.5 3 5 4.5 5 8.5a5 5 0 0 1-10 0c0-2 .8-3.4 2-4.5.8 2 1.5 2 2 1.5C11.2 7 11 5 12 3Z" fill={color}/></Svg>;
    case 'sparkle':   return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4"/></Svg>;
    case 'check':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="m4 12.5 5 5L20 6"/></Svg>;
    case 'close':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M6 6l12 12M18 6 6 18"/></Svg>;
    case 'chevron':   return <Svg width={size} height={size} viewBox={v}><Path {...p} d="m9 6 6 6-6 6"/></Svg>;
    case 'chevronL':  return <Svg width={size} height={size} viewBox={v}><Path {...p} d="m15 6-6 6 6 6"/></Svg>;
    case 'chevronD':  return <Svg width={size} height={size} viewBox={v}><Path {...p} d="m6 9 6 6 6-6"/></Svg>;
    case 'arrow':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M5 12h14M13 6l6 6-6 6"/></Svg>;
    case 'plus':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M12 5v14M5 12h14"/></Svg>;
    case 'bell':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M6 9a6 6 0 1 1 12 0c0 5 1.5 6 1.5 6h-15S6 14 6 9ZM10 19a2 2 0 0 0 4 0"/></Svg>;
    case 'share':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/></Svg>;
    case 'bookmark':  return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M6 3h12v18l-6-4-6 4z"/></Svg>;
    case 'search':    return <Svg width={size} height={size} viewBox={v}><Circle {...p} cx={11} cy={11} r={6.5}/><Path {...p} d="m20 20-4.5-4.5"/></Svg>;
    case 'translate': return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M3 6h12M9 3v3M5 10c1 4 3 6 6 7M13 10c-1 4-3 6-6 7M14 20l4-8 4 8M16 17h4"/></Svg>;
    case 'download':  return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/></Svg>;
    case 'upload':    return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M12 16V4m0 0-4 4m4-4 4 4M5 20h14"/></Svg>;
    case 'send':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></Svg>;
    case 'cal':       return <Svg width={size} height={size} viewBox={v}><Rect {...p} x={3} y={5} width={18} height={16} rx={2}/><Path {...p} d="M3 10h18M8 3v4M16 3v4"/></Svg>;
    case 'lock':      return <Svg width={size} height={size} viewBox={v}><Rect {...p} x={5} y={11} width={14} height={10} rx={2}/><Path {...p} d="M8 11V7a4 4 0 0 1 8 0v4"/></Svg>;
    case 'globe':     return <Svg width={size} height={size} viewBox={v}><Circle {...p} cx={12} cy={12} r={9}/><Path {...p} d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></Svg>;
    case 'eye':       return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><Circle {...p} cx={12} cy={12} r={3}/></Svg>;
    case 'eyeOff':    return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M3 3l18 18M10.5 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a14 14 0 0 1-2.6 3.4M6.6 6.7C3.6 8.6 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3.6-.7M9.9 9.9a3 3 0 1 0 4.2 4.2"/></Svg>;
    case 'edit':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M15 4l5 5L9 20H4v-5z"/><Path {...p} d="M13 6l5 5"/></Svg>;
    case 'trash':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></Svg>;
    case 'help':      return <Svg width={size} height={size} viewBox={v}><Circle {...p} cx={12} cy={12} r={9}/><Path {...p} d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8M12 17h.01"/></Svg>;
    case 'mic':       return <Svg width={size} height={size} viewBox={v}><Rect {...p} x={9} y={3} width={6} height={11} rx={3}/><Path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Svg>;
    case 'camera':    return <Svg width={size} height={size} viewBox={v}><Rect {...p} x={3} y={6} width={18} height={14} rx={2}/><Circle {...p} cx={12} cy={13} r={4}/><Path {...p} d="M8 6l2-3h4l2 3"/></Svg>;
    case 'play':      return <Svg width={size} height={size} viewBox={v}><Path d="M7 4.5 19 12 7 19.5z" fill={color}/></Svg>;
    case 'pause':     return <Svg width={size} height={size} viewBox={v}><Rect x={6} y={4} width={4} height={16} fill={color}/><Rect x={14} y={4} width={4} height={16} fill={color}/></Svg>;
    case 'phone':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></Svg>;
    case 'mail':      return <Svg width={size} height={size} viewBox={v}><Rect {...p} x={3} y={5} width={18} height={14} rx={2}/><Path {...p} d="m3 7 9 7 9-7"/></Svg>;
    case 'filter':    return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M4 5h16l-6 8v7l-4-2v-5z"/></Svg>;
    case 'sort':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M7 4v16M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4"/></Svg>;
    case 'open':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M14 4h6v6M10 14 20 4M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></Svg>;
    case 'dots':      return <Svg width={size} height={size} viewBox={v}><Circle cx={5} cy={12} r={1.5} fill={color}/><Circle cx={12} cy={12} r={1.5} fill={color}/><Circle cx={19} cy={12} r={1.5} fill={color}/></Svg>;
    case 'pin':       return <Svg width={size} height={size} viewBox={v}><Circle {...p} cx={12} cy={10} r={3}/><Path {...p} d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11Z"/></Svg>;
    case 'flag':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M5 21V4M5 4h12l-2 4 2 4H5"/></Svg>;
    case 'wifiOff':   return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M2 8a14 14 0 0 1 6-3M22 8a14 14 0 0 0-6-3M5 12a9 9 0 0 1 4-2M19 12a9 9 0 0 0-4-2M9 16a4 4 0 0 1 6 0M12 20h.01M2 2l20 20"/></Svg>;
    case 'whatsapp':  return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M20 12a8 8 0 1 1-3.5-6.6L20 5l-1 3a8 8 0 0 1 1 4Z"/><Path {...p} d="M9 9.5c.5-.5 1.5-.5 2 0 .5 1 1 2 1 2s2.5 2 4 2.5 1.5-1 2-1.5"/></Svg>;
    case 'church':    return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M12 3v6M9 6h6M5 21V11l7-4 7 4v10M9 21v-5h6v5"/></Svg>;
    case 'heart':     return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10Z"/></Svg>;
    case 'book':      return <Svg width={size} height={size} viewBox={v}><Path {...p} d="M4 4h10a4 4 0 0 1 4 4v13H8a4 4 0 0 1-4-4z"/><Path {...p} d="M4 17h14"/></Svg>;
    default: return <Svg width={size} height={size} viewBox={v}><Circle {...p} cx={12} cy={12} r={9}/></Svg>;
  }
}

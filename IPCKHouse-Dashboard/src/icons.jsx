// Carbon-style line icons — 16/20/24 px, stroke 1.5
// All icons share viewBox 0 0 32 32 (Carbon convention)

function CIcon({ name, size = 20, color = 'currentColor', className }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const v = '0 0 32 32';
  const s = { width: size, height: size, className };
  switch (name) {
    // Brand / shell
    case 'menu':       return <svg {...s} viewBox={v}><path {...p} d="M4 8h24M4 16h24M4 24h24"/></svg>;
    case 'switcher':   return <svg {...s} viewBox={v}><rect {...p} x="4" y="4" width="8" height="8"/><rect {...p} x="20" y="4" width="8" height="8"/><rect {...p} x="4" y="20" width="8" height="8"/><rect {...p} x="20" y="20" width="8" height="8"/></svg>;
    case 'notification': return <svg {...s} viewBox={v}><path {...p} d="M8 12a8 8 0 0 1 16 0c0 6 2 8 2 8H6s2-2 2-8ZM13 26a3 3 0 0 0 6 0"/></svg>;
    case 'help':       return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="12"/><path {...p} d="M12 13a4 4 0 1 1 5.7 3.6c-1.3.6-1.7 1.5-1.7 2.9M16 23h.01"/></svg>;
    case 'search':     return <svg {...s} viewBox={v}><circle {...p} cx="14" cy="14" r="8"/><path {...p} d="m26 26-6-6"/></svg>;
    case 'settings':   return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="3"/><path {...p} d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M24.5 7.5l-2 2M9.5 22.5l-2 2"/></svg>;
    case 'logout':     return <svg {...s} viewBox={v}><path {...p} d="M14 4H6v24h8M22 22l6-6-6-6M28 16H12"/></svg>;

    // Nav
    case 'dashboard':  return <svg {...s} viewBox={v}><rect {...p} x="4" y="4" width="10" height="12"/><rect {...p} x="18" y="4" width="10" height="6"/><rect {...p} x="18" y="14" width="10" height="14"/><rect {...p} x="4" y="20" width="10" height="8"/></svg>;
    case 'live':       return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="3"/><path {...p} d="M8 8a11 11 0 0 0 0 16M24 8a11 11 0 0 1 0 16M4 4a16 16 0 0 0 0 24M28 4a16 16 0 0 1 0 24"/></svg>;
    case 'members':    return <svg {...s} viewBox={v}><circle {...p} cx="12" cy="11" r="4.5"/><circle {...p} cx="22" cy="12" r="3.5"/><path {...p} d="M4 26c0-4 3.7-7 8-7s8 3 8 7M19 26c0-3 2.5-5 5-5s4 1 4 1"/></svg>;
    case 'groups':     return <svg {...s} viewBox={v}><rect {...p} x="4" y="6" width="24" height="20"/><path {...p} d="M4 12h24M10 17h6M10 21h8"/></svg>;
    case 'sermons':    return <svg {...s} viewBox={v}><path {...p} d="M5 4h15a5 5 0 0 1 5 5v18a4 4 0 0 0-4-4H5z"/><path {...p} d="M10 12h10M10 17h7"/></svg>;
    case 'devo':       return <svg {...s} viewBox={v}><path {...p} d="M6 4h20v24l-10-4-10 4z"/><path {...p} d="M12 12h8M12 16h5"/></svg>;
    case 'prayer':     return <svg {...s} viewBox={v}><path {...p} d="M12 28V17c0-1.3.7-2.7 2-3.3L17 12V7a2.5 2.5 0 1 1 5 0v9c0 2.7-1.3 4.7-4 6l-3 1.3V28M12 17H8a2.5 2.5 0 0 0 0 5h4"/></svg>;
    case 'events':     return <svg {...s} viewBox={v}><rect {...p} x="4" y="6" width="24" height="22"/><path {...p} d="M4 13h24M10 4v5M22 4v5"/></svg>;
    case 'appts':      return <svg {...s} viewBox={v}><rect {...p} x="4" y="6" width="24" height="22"/><path {...p} d="M4 13h24M10 4v5M22 4v5M10 18h4M18 18h4M10 22h8"/></svg>;
    case 'give':       return <svg {...s} viewBox={v}><path {...p} d="M16 28S5 22 5 13a5 5 0 0 1 11-3 5 5 0 0 1 11 3c0 9-11 15-11 15Z"/></svg>;
    case 'funds':      return <svg {...s} viewBox={v}><rect {...p} x="4" y="9" width="24" height="18"/><path {...p} d="M4 14h24M10 22h5"/></svg>;
    case 'broadcast':  return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="3"/><path {...p} d="M11 16a5 5 0 0 1 10 0M8 16a8 8 0 0 1 16 0M5 16a11 11 0 0 1 22 0"/></svg>;
    case 'insights':   return <svg {...s} viewBox={v}><path {...p} d="M4 28V12M11 28V18M19 28V8M27 28V14"/></svg>;

    // Actions
    case 'add':        return <svg {...s} viewBox={v}><path {...p} d="M16 4v24M4 16h24"/></svg>;
    case 'check':      return <svg {...s} viewBox={v}><path {...p} d="m6 16 6 6L26 8"/></svg>;
    case 'close':      return <svg {...s} viewBox={v}><path {...p} d="M6 6l20 20M26 6 6 26"/></svg>;
    case 'arrow':      return <svg {...s} viewBox={v}><path {...p} d="M6 16h20M18 8l8 8-8 8"/></svg>;
    case 'arrowU':     return <svg {...s} viewBox={v}><path {...p} d="M8 18l8-8 8 8"/></svg>;
    case 'arrowD':     return <svg {...s} viewBox={v}><path {...p} d="M8 14l8 8 8-8"/></svg>;
    case 'chevron':    return <svg {...s} viewBox={v}><path {...p} d="m12 6 10 10-10 10"/></svg>;
    case 'chevronD':   return <svg {...s} viewBox={v}><path {...p} d="m6 12 10 10 10-10"/></svg>;
    case 'download':   return <svg {...s} viewBox={v}><path {...p} d="M16 4v20m0 0-7-7m7 7 7-7M5 28h22"/></svg>;
    case 'upload':     return <svg {...s} viewBox={v}><path {...p} d="M16 24V4m0 0-7 7m7-7 7 7M5 28h22"/></svg>;
    case 'edit':       return <svg {...s} viewBox={v}><path {...p} d="M20 4l8 8L12 28H4v-8z"/><path {...p} d="M18 6l8 8"/></svg>;
    case 'filter':     return <svg {...s} viewBox={v}><path {...p} d="M6 6h20l-8 10v10l-4-2V16z"/></svg>;
    case 'overflow':   return <svg {...s} viewBox={v}><circle cx="16" cy="6" r="2" fill={color}/><circle cx="16" cy="16" r="2" fill={color}/><circle cx="16" cy="26" r="2" fill={color}/></svg>;
    case 'send':       return <svg {...s} viewBox={v}><path {...p} d="M28 4 16 16M28 4l-8 24-4-12-12-4z"/></svg>;
    case 'lock':       return <svg {...s} viewBox={v}><rect {...p} x="7" y="14" width="18" height="14"/><path {...p} d="M11 14V9a5 5 0 0 1 10 0v5"/></svg>;
    case 'globe':      return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="12"/><path {...p} d="M4 16h24M16 4a17 17 0 0 1 0 24M16 4a17 17 0 0 0 0 24"/></svg>;
    case 'phone':      return <svg {...s} viewBox={v}><path {...p} d="M6 6h5l3 7-4 3a15 15 0 0 0 6 6l3-4 7 3v5a2 2 0 0 1-2 2A20 20 0 0 1 4 8a2 2 0 0 1 2-2Z"/></svg>;
    case 'mail':       return <svg {...s} viewBox={v}><rect {...p} x="4" y="7" width="24" height="18"/><path {...p} d="m4 9 12 9 12-9"/></svg>;
    case 'flame':      return <svg {...s} viewBox={v}><path d="M16 4c2 4 7 6 7 11.5a7 7 0 0 1-14 0c0-2.5 1-4.5 2.5-6 1 2.5 2 2.5 2.5 2C14.5 9 14 6.5 16 4Z" fill={color}/></svg>;
    case 'play':       return <svg {...s} viewBox={v}><path d="M9 5 26 16 9 27z" fill={color}/></svg>;
    case 'pause':      return <svg {...s} viewBox={v}><rect x="9" y="5" width="5" height="22" fill={color}/><rect x="18" y="5" width="5" height="22" fill={color}/></svg>;
    case 'mic':        return <svg {...s} viewBox={v}><rect {...p} x="12" y="4" width="8" height="14" rx="4"/><path {...p} d="M7 15a9 9 0 0 0 18 0M16 24v4"/></svg>;
    case 'flag':       return <svg {...s} viewBox={v}><path {...p} d="M7 28V5M7 5h16l-3 5 3 5H7"/></svg>;
    case 'star':       return <svg {...s} viewBox={v}><path {...p} d="M16 4l4 8 9 1-6.5 6 1.5 9-8-4-8 4 1.5-9-6.5-6 9-1z"/></svg>;
    case 'pin':        return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="13" r="4"/><path {...p} d="M16 28S6 19 6 13a10 10 0 0 1 20 0c0 6-10 15-10 15Z"/></svg>;
    case 'video':      return <svg {...s} viewBox={v}><rect {...p} x="4" y="8" width="18" height="16"/><path {...p} d="m22 13 6-3v12l-6-3"/></svg>;
    case 'kids':       return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="11" r="5"/><path {...p} d="M6 28c0-5 4.5-9 10-9s10 4 10 9M12 11h.01M20 11h.01"/></svg>;
    case 'church':     return <svg {...s} viewBox={v}><path {...p} d="M16 4v8M12 8h8M6 28V14l10-5 10 5v14M12 28v-7h8v7"/></svg>;
    case 'time':       return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="12"/><path {...p} d="M16 9v7l4 3"/></svg>;
    case 'check-circle': return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="12"/><path {...p} d="m10 16 4 4 8-8"/></svg>;
    case 'warning':    return <svg {...s} viewBox={v}><path {...p} d="M16 4 28 26H4z"/><path {...p} d="M16 13v6M16 23h.01"/></svg>;
    case 'info':       return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="12"/><path {...p} d="M16 14v8M16 10h.01"/></svg>;
    case 'doc':        return <svg {...s} viewBox={v}><path {...p} d="M8 4h12l6 6v18H8z"/><path {...p} d="M20 4v6h6M12 16h8M12 20h6"/></svg>;
    default: return <svg {...s} viewBox={v}><circle {...p} cx="16" cy="16" r="12"/></svg>;
  }
}

window.CIcon = CIcon;

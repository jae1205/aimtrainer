export default function RangeArt() {
  return <svg className="af-range-art" viewBox="0 0 680 600" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="range-wall" x1="340" y1="0" x2="340" y2="600" gradientUnits="userSpaceOnUse"><stop stopColor="#343934"/><stop offset="1" stopColor="#111714"/></linearGradient>
      <linearGradient id="range-floor" x1="340" y1="275" x2="340" y2="600" gradientUnits="userSpaceOnUse"><stop stopColor="#4a4c3e"/><stop offset="1" stopColor="#141c18"/></linearGradient>
      <linearGradient id="range-shade"><stop stopColor="#111612" stopOpacity=".8"/><stop offset=".5" stopColor="#111612" stopOpacity="0"/><stop offset="1" stopColor="#111612" stopOpacity=".5"/></linearGradient>
      <pattern id="range-grain" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 1h1M4 5h1" stroke="#d3d8bb" strokeOpacity=".07"/></pattern>
    </defs>
    <path fill="url(#range-wall)" d="M0 0h680v600H0z"/>
    <path d="M0 0h680L455 168H225Z" fill="#202822"/>
    <path d="M0 600h680L455 318H225Z" fill="url(#range-floor)"/>
    <path d="M225 168h230v150H225z" fill="#141d18"/><path d="M250 185h180v114H250z" fill="#253127"/>
    <g stroke="#626958" strokeOpacity=".35"><path d="M0 0 225 168v150L0 600M680 0 455 168v150l225 282M0 130l225 72M680 130l-225 72M0 330l225-65M680 330l-225-65M0 494l225-192M680 494l-225-192"/><path d="M63 0v521M147 108v307M530 108v307M615 0v521"/><path d="m120 600 150-282m290 282L410 318M340 600V318M0 528h680M83 434h514M155 363h370"/></g>
    <g fill="#919a7c"><path d="m85 0 22 0 154 171h-7z"/><path d="m573 0 22 0L426 171h-7z"/></g>
    <g fill="#d4d5b3"><path d="m99 0 4 0 155 168h-3z"/><path d="m577 0 4 0L423 168h-3z"/><path d="M285 180h110v3H285z"/></g>
    <g fill="#b5b695" opacity=".12"><path d="m183 83 6 4 21 333-96 68z"/><path d="m494 83-6 4-21 333 96 68z"/></g>
    <g stroke="#9d9f7b" strokeWidth="2" opacity=".35"><path d="M270 318 170 600M410 318l100 282"/></g>
    <path d="m190 553 12-29h276l13 29z" fill="#aba875" opacity=".12"/>
    <g stroke="#777e67" strokeWidth="3"><path d="M306 168v85M389 168v71M454 126v112M205 151v169"/></g>
    <g transform="translate(287 220)"><path d="M0 0h38v55H0z" fill="#9a9c80"/><path d="m6 4 26 0 0 43H6z" fill="#383f31"/><ellipse cx="19" cy="26" rx="11" ry="16" stroke="#b2b295"/><ellipse cx="19" cy="26" rx="6" ry="9" stroke="#b2b295"/><circle cx="19" cy="26" r="3" fill="#ef7a40"/></g>
    <g transform="translate(375 202)"><path d="M0 0h30v44H0z" fill="#93967b"/><ellipse cx="15" cy="22" rx="10" ry="16" stroke="#424935"/><ellipse cx="15" cy="22" rx="5" ry="9" stroke="#424935"/><circle cx="15" cy="22" r="3" fill="#ef7a40"/></g>
    <g transform="translate(422 227) rotate(-8)"><path d="M0 0h67v86H0z" fill="#b0ad8a"/><path d="M4 4h59v78H4z" stroke="#666b50"/><ellipse cx="33" cy="42" rx="24" ry="31" stroke="#4f5842" strokeWidth="2"/><ellipse cx="33" cy="42" rx="17" ry="23" stroke="#4f5842"/><ellipse cx="33" cy="42" rx="10" ry="14" fill="#ef7a40"/><circle cx="33" cy="42" r="4" fill="#353f30"/></g>
    <g transform="translate(174 298) rotate(8)"><path d="M0 0h62v82H0z" fill="#8b9277"/><ellipse cx="31" cy="40" rx="23" ry="30" stroke="#3e4935" strokeWidth="2"/><ellipse cx="31" cy="40" rx="14" ry="20" stroke="#3e4935"/><ellipse cx="31" cy="40" rx="6" ry="9" fill="#ef7a40"/></g>
    <g fill="#121a15" stroke="#434c39"><path d="M0 443 93 386l55 28v186H0Z"/><path d="m680 443-94-57-55 28v186h149Z"/></g>
    <path d="m0 443 93-57 55 28-97 67zM680 443l-94-57-55 28 97 67z" fill="#50563f"/>
    <g fill="#dd7845" opacity=".7"><path d="m12 449 19-12 10 9-20 12zM46 428l19-12 10 9-20 12zM641 437l19 12-10 9-20-12zM607 416l19 12-10 9-20-12z"/></g>
    <path fill="url(#range-shade)" d="M0 0h680v600H0z"/><path fill="url(#range-grain)" d="M0 0h680v600H0z"/>
    <g stroke="#e6e7cc" strokeOpacity=".75"><path d="M331 277h-9m27 0h9M340 268v-9m0 27v9"/><circle cx="340" cy="277" r="2"/></g>
    <text x="511" y="355" fill="#a1a58b" fontSize="12" fontFamily="monospace" transform="rotate(22 511 355)">LANE 01</text>
  </svg>
}

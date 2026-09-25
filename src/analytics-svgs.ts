const clipboardFrame = '<path d="M11 7H9a5 5 0 0 0-5 5v17a5 5 0 0 0 5 5h18a5 5 0 0 0 5-5V12a5 5 0 0 0-5-5h-2"/><path d="M14 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5Z"/>'

function icon(paths: string, color: string): string {
  return `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}

export const ANALYTICS_SVGS = {
  clipboardCheck: icon(`${clipboardFrame}<path d="m13 21 4 4 7-7"/>`, "#0ABAB5"),
  clipboardText: icon(`${clipboardFrame}<path d="M13 20h10M13 26h7"/>`, "#0ABAB5"),
  workSamples: icon('<path d="M8 3h13l10 10v17a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z"/><path d="M21 3v7a3 3 0 0 0 3 3h7M11 23h9"/>', "#696D70"),
  moments: icon('<path d="M11 8.5 13 4h10l2 4.5h4a5 5 0 0 1 5 5V30a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V13.5a5 5 0 0 1 5-5h4Z"/><path d="M16 8h4"/><circle cx="18" cy="22" r="5"/>', "#696D70"),
} as const

export const ANALYTICS_NOTE_SVGS = {
  progress: '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="4" width="34" height="40" rx="5" fill="#F7FAFF" stroke="#75AFFF" stroke-width="1.5"/><path d="M12 34 21 25l6 5 11-15" stroke="#81C767" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 39h25" stroke="#BED8FA" stroke-width="1.5"/></svg>',
  help: '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="24" cy="30" rx="18" ry="7" fill="#B7F2E5"/><ellipse cx="24" cy="24" rx="17" ry="11" fill="#A37AE9"/><ellipse cx="24" cy="23" rx="12" ry="7" fill="#E969A9"/><ellipse cx="24" cy="22" rx="7" ry="4" fill="#F8CE5A"/><path d="M8 30c5 10 27 10 32 0" stroke="#5BC6C7" stroke-width="2" stroke-linecap="round"/></svg>',
  observed: '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 35h33l-3 6H5l3-6Z" fill="#64C6F0"/><path d="M12 20h9v15h-9z" fill="#5A98DC"/><path d="M23 13h8v22h-8z" fill="#EF8A72"/><path d="M31 18h7v17h-7z" fill="#F5C75F"/><path d="M11 25h10M23 19h8M31 25h7" stroke="#FFFFFF" stroke-width="1.5"/><path d="M6 42h36" stroke="#5A98DC" stroke-width="2" stroke-linecap="round"/></svg>',
  coachNote: '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m10 9 28 4-4 31-28-4 4-31Z" fill="#9E7BEA"/><path d="m15 5 26 5-5 29-26-5 5-29Z" fill="#5D4BC2"/><path d="m20 8 18 3-4 23-18-3 4-23Z" fill="#E8DAFF"/><path d="m23 15 11 2M22 20l10 2M21 25l9 2" stroke="#845FCF" stroke-width="2" stroke-linecap="round"/><path d="m4 36 29 5" stroke="#3F2C89" stroke-width="2"/></svg>',
} as const

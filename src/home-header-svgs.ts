/** Figma Main header icons (file GmdFYzfDwKyURdqdeUnGx2) — vector XML for SvgXml */

function normalizeSvg(raw: string): string {
  return raw
    .trim()
    .replace(/\sstyle="[^"]*"/g, "")
    .replace(/\spreserveAspectRatio="none"/g, ' preserveAspectRatio="xMidYMid meet"')
    .replace(/\soverflow="visible"/g, "")
}

export const HOME_HEADER_SVGS = {
  notification: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="notification">
<path id="Vector" d="M8.01398 1.93984C5.80731 1.93984 4.01398 3.73318 4.01398 5.93984V7.86651C4.01398 8.27318 3.84064 8.89318 3.63398 9.23984L2.86731 10.5132C2.39398 11.2998 2.72064 12.1732 3.58731 12.4665C6.46064 13.4265 9.56064 13.4265 12.434 12.4665C13.2406 12.1998 13.594 11.2465 13.154 10.5132L12.3873 9.23984C12.1873 8.89318 12.014 8.27318 12.014 7.86651V5.93984C12.014 3.73984 10.214 1.93984 8.01398 1.93984Z" stroke="#7A7A7A" stroke-miterlimit="10" stroke-linecap="round"/>
<path id="Vector_2" d="M9.24792 2.13336C9.04125 2.07336 8.82792 2.02669 8.60792 2.00003C7.96792 1.92003 7.35458 1.96669 6.78125 2.13336C6.97458 1.64003 7.45458 1.29336 8.01458 1.29336C8.57458 1.29336 9.05458 1.64003 9.24792 2.13336Z" stroke="#7A7A7A" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_3" d="M10.0125 12.7066C10.0125 13.8066 9.1125 14.7066 8.0125 14.7066C7.46583 14.7066 6.95917 14.48 6.59917 14.12C6.23917 13.76 6.0125 13.2533 6.0125 12.7066" stroke="#7A7A7A" stroke-miterlimit="10"/>
</g>
</svg>`),
  inbox: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="message-2">
<path id="Vector" d="M5.66875 7H10.3354" stroke="#7A7A7A" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path id="Vector_2" d="M4.66458 12.2866H7.33125L10.2979 14.2599C10.7379 14.5533 11.3312 14.2399 11.3312 13.7066V12.2866C13.3312 12.2866 14.6646 10.9533 14.6646 8.95325V4.95326C14.6646 2.95326 13.3312 1.61992 11.3312 1.61992H4.66458C2.66458 1.61992 1.33125 2.95326 1.33125 4.95326V8.95325C1.33125 10.9533 2.66458 12.2866 4.66458 12.2866Z" stroke="#7A7A7A" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</g>
</svg>`),
} as const

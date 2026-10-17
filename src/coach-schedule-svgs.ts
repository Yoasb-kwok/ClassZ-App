/** Figma coach centre / schedule icons (file 6duxd0GT6WS1ECLvtsv8Tk) — vector XML for SvgXml */

function normalizeSvg(raw: string): string {
  return raw
    .trim()
    .replace(/\sstyle="[^"]*"/g, "")
    .replace(/\spreserveAspectRatio="none"/g, ' preserveAspectRatio="xMidYMid meet"')
    .replace(/\soverflow="visible"/g, "")
}

export const COACH_SCHEDULE_SVGS = {
  back: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="arrow-left">
<path id="Vector" d="M6.38 3.95345L2.33333 8.00012L6.38 12.0468" stroke-width="1.6" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#7A7A7A"/>
<path id="Vector_2" d="M13.6679 8H2.44792" stroke-width="1.6" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#7A7A7A"/>
<path id="Vector_3" opacity="0" d="M15.2 15.2L0.8 15.2L0.8 0.8L15.2 0.8L15.2 15.2Z" stroke-width="1.6" stroke="#7A7A7A"/>
</g>
</svg>`),
  book: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="vuesax/bold/book">
<path id="Vector" d="M22.9167 5.05174V17.4372C22.9167 18.4476 22.0938 19.3747 21.0834 19.4997L20.7605 19.5413C19.0522 19.7705 16.6459 20.4788 14.7084 21.2913C14.0313 21.5726 13.2813 21.0622 13.2813 20.3226V5.83299C13.2813 5.44757 13.5001 5.0934 13.8438 4.9059C15.7501 3.87465 18.6355 2.95799 20.5938 2.79132H20.6563C21.9063 2.79132 22.9167 3.80174 22.9167 5.05174Z" fill="#222222"/>
<path id="Vector_2" d="M11.1563 4.9059C9.25006 3.87465 6.36465 2.95799 4.40631 2.79132H4.3334C3.0834 2.79132 2.07298 3.80174 2.07298 5.05174V17.4372C2.07298 18.4476 2.8959 19.3747 3.90631 19.4997L4.22923 19.5413C5.93756 19.7705 8.34381 20.4788 10.2813 21.2913C10.9584 21.5726 11.7084 21.0622 11.7084 20.3226V5.83299C11.7084 5.43715 11.5001 5.0934 11.1563 4.9059ZM5.2084 8.06215H7.55215C7.97923 8.06215 8.3334 8.41632 8.3334 8.8434C8.3334 9.2809 7.97923 9.62465 7.55215 9.62465H5.2084C4.78131 9.62465 4.42715 9.2809 4.42715 8.8434C4.42715 8.41632 4.78131 8.06215 5.2084 8.06215ZM8.3334 12.7497H5.2084C4.78131 12.7497 4.42715 12.4059 4.42715 11.9684C4.42715 11.5413 4.78131 11.1872 5.2084 11.1872H8.3334C8.76048 11.1872 9.11465 11.5413 9.11465 11.9684C9.11465 12.4059 8.76048 12.7497 8.3334 12.7497Z" fill="#222222"/>
<g id="Vector_3" opacity="0">
</g>
</g>
</svg>`),
  calendarAdd: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="calendar-add">
<g id="Vector" opacity="0">
</g>
<path id="Vector_2" d="M16.75 3.56V2C16.75 1.59 16.41 1.25 16 1.25C15.59 1.25 15.25 1.59 15.25 2V3.5H8.75V2C8.75 1.59 8.41 1.25 8 1.25C7.59 1.25 7.25 1.59 7.25 2V3.56C4.55 3.81 3.24 5.42 3.04 7.81C3.02 8.1 3.26 8.34 3.54 8.34H20.46C20.75 8.34 20.99 8.09 20.96 7.81C20.76 5.42 19.45 3.81 16.75 3.56Z" fill="#222222"/>
<path id="Vector_3" d="M20 9.84H4C3.45 9.84 3 10.29 3 10.84V17C3 20 4.5 22 8 22H12.93C13.62 22 14.1 21.33 13.88 20.68C13.68 20.1 13.51 19.46 13.51 19C13.51 15.97 15.98 13.5 19.01 13.5C19.3 13.5 19.59 13.52 19.87 13.57C20.47 13.66 21.01 13.19 21.01 12.59V10.85C21 10.29 20.55 9.84 20 9.84ZM9.21 17.71C9.11 17.8 9 17.87 8.88 17.92C8.76 17.97 8.63 18 8.5 18C8.37 18 8.24 17.97 8.12 17.92C8 17.87 7.89 17.8 7.79 17.71C7.61 17.52 7.5 17.26 7.5 17C7.5 16.94 7.51 16.87 7.52 16.81C7.53 16.74 7.55 16.68 7.58 16.62C7.6 16.56 7.63 16.5 7.67 16.44C7.7 16.39 7.75 16.34 7.79 16.29C7.89 16.2 8 16.13 8.12 16.08C8.36 15.98 8.64 15.98 8.88 16.08C9 16.13 9.11 16.2 9.21 16.29C9.25 16.34 9.3 16.39 9.33 16.44C9.37 16.5 9.4 16.56 9.42 16.62C9.45 16.68 9.47 16.74 9.48 16.81C9.49 16.87 9.5 16.94 9.5 17C9.5 17.26 9.39 17.52 9.21 17.71ZM9.21 14.21C9.11 14.3 9 14.37 8.88 14.42C8.76 14.47 8.63 14.5 8.5 14.5C8.37 14.5 8.24 14.47 8.12 14.42C7.99 14.37 7.89 14.3 7.79 14.21C7.61 14.02 7.5 13.76 7.5 13.5C7.5 13.24 7.61 12.98 7.79 12.79C7.89 12.7 8 12.63 8.12 12.58C8.36 12.48 8.64 12.48 8.88 12.58C9 12.63 9.11 12.7 9.21 12.79C9.25 12.84 9.3 12.89 9.33 12.94C9.37 13 9.4 13.06 9.42 13.12C9.45 13.18 9.47 13.24 9.48 13.3C9.49 13.37 9.5 13.44 9.5 13.5C9.5 13.76 9.39 14.02 9.21 14.21ZM12.71 14.21C12.52 14.39 12.27 14.5 12 14.5C11.87 14.5 11.74 14.47 11.62 14.42C11.49 14.37 11.39 14.3 11.29 14.21C11.11 14.02 11 13.76 11 13.5C11 13.44 11.01 13.37 11.02 13.3C11.03 13.24 11.05 13.18 11.08 13.12C11.1 13.06 11.13 13 11.17 12.94C11.21 12.89 11.25 12.84 11.29 12.79C11.66 12.42 12.33 12.42 12.71 12.79C12.75 12.84 12.79 12.89 12.83 12.94C12.87 13 12.9 13.06 12.92 13.12C12.95 13.18 12.97 13.24 12.98 13.3C12.99 13.37 13 13.44 13 13.5C13 13.76 12.89 14.02 12.71 14.21Z" fill="#222222"/>
<path id="Vector_4" d="M21.83 16.17C20.27 14.61 17.73 14.61 16.17 16.17C14.61 17.73 14.61 20.27 16.17 21.83C17.73 23.39 20.27 23.39 21.83 21.83C23.39 20.27 23.39 17.73 21.83 16.17ZM21.07 19.56C20.94 19.7 20.75 19.78 20.54 19.78H19.8V20.56C19.8 20.77 19.72 20.95 19.58 21.09C19.44 21.23 19.26 21.31 19.05 21.31C18.64 21.31 18.3 20.97 18.3 20.56V19.78H17.55C17.14 19.78 16.8 19.45 16.8 19.03C16.8 18.62 17.14 18.28 17.55 18.28H18.3V17.57C18.3 17.16 18.63 16.82 19.05 16.82C19.46 16.82 19.8 17.16 19.8 17.57V18.28H20.54C20.96 18.28 21.29 18.62 21.29 19.03C21.29 19.24 21.21 19.43 21.07 19.56Z" fill="#222222"/>
</g>
</svg>`),
  announce: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="volume-low">
<path id="Vector" d="M19.33 16.75C19.17 16.75 19.02 16.7 18.88 16.6C18.55 16.35 18.48 15.88 18.73 15.55C20.3 13.46 20.3 10.54 18.73 8.45C18.48 8.12 18.55 7.65 18.88 7.4C19.21 7.15 19.68 7.22 19.93 7.55C21.9 10.17 21.9 13.83 19.93 16.45C19.79 16.65 19.56 16.75 19.33 16.75Z" fill="#222222"/>
<path id="Vector_2" d="M15.35 3.78C14.23 3.16 12.8 3.32 11.34 4.23L8.42 6.06C8.22 6.18 7.99 6.25 7.76 6.25H6.83H6.33C3.91 6.25 2.58 7.58 2.58 10V14C2.58 16.42 3.91 17.75 6.33 17.75H6.83H7.76C7.99 17.75 8.22 17.82 8.42 17.94L11.34 19.77C12.22 20.32 13.08 20.59 13.88 20.59C14.4 20.59 14.9 20.47 15.35 20.22C16.46 19.6 17.08 18.31 17.08 16.59V7.41C17.08 5.69 16.46 4.4 15.35 3.78Z" fill="#222222"/>
<g id="Vector_3" opacity="0">
</g>
</g>
</svg>`),
  tick: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="tick-circle">
<path id="Vector" d="M7 12.8333C10.2083 12.8333 12.8333 10.2083 12.8333 7C12.8333 3.79167 10.2083 1.16667 7 1.16667C3.79167 1.16667 1.16667 3.79167 1.16667 7C1.16667 10.2083 3.79167 12.8333 7 12.8333Z" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#1B1A1F"/>
<path id="Vector_2" d="M4.52083 6.99995L6.17167 8.65079L9.47917 5.34912" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#1B1A1F"/>
<g id="Vector_3" opacity="0">
</g>
</g>
</svg>`),
  trash: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="18.5455" height="18.5455" viewBox="0 0 18.5455 18.5455" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="trash">
<path id="Vector" d="M16.2273 4.62129C13.6541 4.36629 11.0655 4.23493 8.48456 4.23493C6.95456 4.23493 5.42456 4.3122 3.89456 4.46675L2.3182 4.62129" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_2" d="M6.5682 3.84048L6.7382 2.8282C6.86184 2.09411 6.95456 1.54548 8.26047 1.54548H10.285C11.5909 1.54548 11.6914 2.12502 11.8073 2.83593L11.9773 3.84048" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_3" d="M14.5659 7.06248L14.0636 14.8438C13.9786 16.057 13.9091 16.9997 11.7532 16.9997H6.79228C4.63637 16.9997 4.56682 16.057 4.48182 14.8438L3.97955 7.06248" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_4" d="M7.98229 12.75H10.5555" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_5" d="M7.34093 9.65911H11.2046" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_6" opacity="0" d="M0.5 0.5H18.0455V18.0455H0.5V0.5Z" stroke="#5E5E5E"/>
</g>
</svg>`),
  people: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="profile-2user">
<path id="Vector" d="M5.25 1.16667C3.72167 1.16667 2.47917 2.40917 2.47917 3.9375C2.47917 5.43667 3.65167 6.65 5.18 6.7025C5.22667 6.69667 5.27333 6.69667 5.30833 6.7025C5.32 6.7025 5.32583 6.7025 5.3375 6.7025C5.34333 6.7025 5.34333 6.7025 5.34917 6.7025C6.8425 6.65 8.015 5.43667 8.02083 3.9375C8.02083 2.40917 6.77833 1.16667 5.25 1.16667Z" fill="#222222"/>
<path id="Vector_2" d="M8.21333 8.25417C6.58583 7.16917 3.93167 7.16917 2.2925 8.25417C1.55167 8.75 1.14333 9.42083 1.14333 10.1383C1.14333 10.8558 1.55167 11.5208 2.28667 12.0108C3.10333 12.5592 4.17667 12.8333 5.25 12.8333C6.32333 12.8333 7.39667 12.5592 8.21333 12.0108C8.94833 11.515 9.35667 10.85 9.35667 10.1267C9.35083 9.40917 8.94833 8.74417 8.21333 8.25417Z" fill="#222222"/>
<path id="Vector_3" d="M11.6608 4.28167C11.7542 5.41333 10.9492 6.405 9.835 6.53917C9.82917 6.53917 9.82917 6.53917 9.82333 6.53917H9.80583C9.77083 6.53917 9.73583 6.53917 9.70667 6.55083C9.14083 6.58 8.62167 6.39917 8.23083 6.06667C8.83167 5.53 9.17583 4.725 9.10583 3.85C9.065 3.3775 8.90167 2.94583 8.65667 2.57833C8.87833 2.4675 9.135 2.3975 9.3975 2.37417C10.5408 2.275 11.5617 3.12667 11.6608 4.28167Z" fill="#222222"/>
<path id="Vector_4" d="M12.8275 9.6775C12.7808 10.2433 12.4192 10.7333 11.8125 11.0658C11.2292 11.3867 10.4942 11.5383 9.765 11.5208C10.185 11.1417 10.43 10.6692 10.4767 10.1675C10.535 9.44417 10.1908 8.75 9.5025 8.19583C9.11167 7.88667 8.65667 7.64167 8.16083 7.46083C9.45 7.0875 11.0717 7.33833 12.0692 8.14333C12.6058 8.575 12.88 9.1175 12.8275 9.6775Z" fill="#222222"/>
<g id="Vector_5" opacity="0">
</g>
</g>
</svg>`),
  arrowDown: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="arrow-down">
<path id="Vector" d="M13.2818 5.96639L8.93514 10.3131C8.42181 10.8264 7.58181 10.8264 7.06848 10.3131L2.72181 5.96639" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<g id="Vector_2" opacity="0">
</g>
</g>
</svg>`),
  global: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="global">
<path id="Vector" d="M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_2" d="M5.32855 1.99977H5.99522C4.69522 5.8931 4.69522 10.1064 5.99522 13.9998H5.32855" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_3" d="M9.99448 1.99977C11.2945 5.8931 11.2945 10.1064 9.99448 13.9998" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_4" d="M2.00061 10.667V10.0004C5.89395 11.3004 10.1073 11.3004 14.0006 10.0004V10.667" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_5" d="M2.00061 5.99943C5.89395 4.69943 10.1073 4.69943 14.0006 5.99943" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_6" opacity="0" d="M15.6136 15.6136L0.386364 15.6136L0.386364 0.386364L15.6136 0.386364L15.6136 15.6136Z" stroke-width="0.772727" stroke="#5E5E5E"/>
</g>
</svg>`),
  location: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="location">
<path id="Vector" d="M10.08 6.8734C10.08 8.02215 9.14875 8.9534 8 8.9534C6.85125 8.9534 5.92 8.02215 5.92 6.8734C5.92 5.72465 6.85125 4.7934 8 4.7934C9.14875 4.7934 10.08 5.72465 10.08 6.8734Z" stroke-width="1.15909" stroke="#5E5E5E"/>
<path id="Vector_2" d="M2.4133 5.66C3.72663 -0.113333 12.28 -0.106667 13.5866 5.66667C14.3533 9.05333 12.2466 11.92 10.4 13.6933C9.05997 14.9867 6.93997 14.9867 5.5933 13.6933C3.7533 11.92 1.64663 9.04667 2.4133 5.66Z" stroke-width="1.15909" stroke="#5E5E5E"/>
<g id="Vector_3" opacity="0">
</g>
</g>
</svg>`),
  star: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="13.9913" height="13.3556" viewBox="0 0 13.9913 13.3556" fill="none" xmlns="http://www.w3.org/2000/svg">
<path id="Star 1" d="M6.54356 0.286448C6.72397 -0.0954823 7.26736 -0.0954828 7.44776 0.286447L9.16868 3.92971C9.24156 4.08402 9.38811 4.19049 9.55739 4.21213L13.5541 4.72298C13.9731 4.77654 14.141 5.29333 13.8335 5.58293L10.9004 8.34545C10.7762 8.46245 10.7202 8.63473 10.7519 8.8024L11.5011 12.7614C11.5797 13.1764 11.1401 13.4958 10.7696 13.2929L7.2359 11.3569C7.08623 11.2749 6.90509 11.2749 6.75543 11.3569L3.22172 13.2929C2.85127 13.4958 2.41166 13.1764 2.4902 12.7614L3.23941 8.8024C3.27114 8.63473 3.21517 8.46245 3.09094 8.34545L0.157779 5.58293C-0.149709 5.29333 0.0182067 4.77654 0.437193 4.72298L4.43394 4.21213C4.60321 4.19049 4.74976 4.08402 4.82264 3.92971L6.54356 0.286448Z" fill="#222222"/>
</svg>`),
  info: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="information">
<path id="Vector" d="M10.7501 2.45037C11.4501 1.86037 12.5801 1.86037 13.2601 2.45037L14.8401 3.80037C15.1401 4.05037 15.7101 4.26037 16.1101 4.26037H17.8101C18.8701 4.26037 19.7401 5.13037 19.7401 6.19037V7.89037C19.7401 8.29037 19.9501 8.85037 20.2001 9.15037L21.5501 10.7304C22.1401 11.4304 22.1401 12.5604 21.5501 13.2404L20.2001 14.8204C19.9501 15.1204 19.7401 15.6804 19.7401 16.0804V17.7804C19.7401 18.8404 18.8701 19.7104 17.8101 19.7104H16.1101C15.7101 19.7104 15.1501 19.9204 14.8501 20.1704L13.2701 21.5204C12.5701 22.1104 11.4401 22.1104 10.7601 21.5204L9.18007 20.1704C8.88007 19.9204 8.31007 19.7104 7.92007 19.7104H6.17007C5.11007 19.7104 4.24007 18.8404 4.24007 17.7804V16.0704C4.24007 15.6804 4.04007 15.1104 3.79007 14.8204L2.44007 13.2304C1.86007 12.5404 1.86007 11.4204 2.44007 10.7304L3.79007 9.14037C4.04007 8.84037 4.24007 8.28037 4.24007 7.89037V6.20037C4.24007 5.14037 5.11007 4.27037 6.17007 4.27037H7.90007C8.30007 4.27037 8.86007 4.06037 9.16007 3.81037L10.7501 2.45037Z" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="white"/>
<path id="Vector_2" d="M12 8.12994V12.9599" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="white"/>
<path id="Vector_3" d="M11.9945 16.0001H12.0035" stroke-width="1.54545" stroke-linecap="round" stroke-linejoin="round" stroke="white"/>
<path id="Vector_4" opacity="0" d="M0.386364 0.386364H23.6136V23.6136H0.386364V0.386364Z" stroke-width="0.772727" stroke="white"/>
</g>
</svg>`),
  camera: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="camera">
<path id="Vector" d="M5.63333 18.3333H14.3667C16.6667 18.3333 17.5833 16.925 17.6917 15.2083L18.125 8.325C18.2417 6.525 16.8083 5 15 5C14.4917 5 14.025 4.70833 13.7917 4.25833L13.1917 3.05C12.8083 2.29167 11.8083 1.66667 10.9583 1.66667H9.05C8.19167 1.66667 7.19167 2.29167 6.80833 3.05L6.20833 4.25833C5.975 4.70833 5.50833 5 5 5C3.19167 5 1.75833 6.525 1.875 8.325L2.30833 15.2083C2.40833 16.925 3.33333 18.3333 5.63333 18.3333Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#B0B0B0"/>
<path id="Vector_2" d="M8.75 6.66667H11.25" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#B0B0B0"/>
<path id="Vector_3" d="M10 15C11.4917 15 12.7083 13.7833 12.7083 12.2917C12.7083 10.8 11.4917 9.58333 10 9.58333C8.50833 9.58333 7.29167 10.8 7.29167 12.2917C7.29167 13.7833 8.50833 15 10 15Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#B0B0B0"/>
<g id="Vector_4" opacity="0">
</g>
</g>
</svg>`),
  send: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="send-2">
<path id="Vector" d="M16.14 2.96L7.11 5.96C1.04 7.99 1.04 11.3 7.11 13.32L9.79 14.21L10.68 16.89C12.7 22.96 16.02 22.96 18.04 16.89L21.05 7.87C22.39 3.82 20.19 1.61 16.14 2.96ZM16.46 8.34L12.66 12.16C12.51 12.31 12.32 12.38 12.13 12.38C11.94 12.38 11.75 12.31 11.6 12.16C11.31 11.87 11.31 11.39 11.6 11.1L15.4 7.28C15.69 6.99 16.17 6.99 16.46 7.28C16.75 7.57 16.75 8.05 16.46 8.34Z" fill="white"/>
<g id="Vector_2" opacity="0">
</g>
</g>
</svg>`),
  warning: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Warning / Triangle_Warning">
<path id="Vector" d="M11.0018 8.25005V11.9167M4.01579 13.9332C3.18214 15.3771 2.76544 16.0994 2.8277 16.6918C2.88201 17.2085 3.15322 17.678 3.57357 17.9834C4.05532 18.3334 4.88845 18.3334 6.55461 18.3334H15.449C17.1151 18.3334 17.9481 18.3334 18.4299 17.9834C18.8502 17.678 19.1216 17.2085 19.1759 16.6918C19.2381 16.0994 18.8216 15.3771 17.9879 13.9332L13.5423 6.23321C12.7087 4.78929 12.2917 4.06745 11.7475 3.82517C11.2728 3.61383 10.7305 3.61383 10.2558 3.82517C9.71184 4.06735 9.29509 4.78919 8.46213 6.23191L4.01579 13.9332ZM11.0483 14.6667V14.7584L10.9561 14.7586V14.6667H11.0483Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="#EB913B"/>
</g>
</svg>`),
  warningSm: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Warning / Triangle_Warning">
<path id="Vector" d="M10.0016 7.50005V10.8334M3.65072 12.6666C2.89285 13.9792 2.51403 14.6358 2.57064 15.1743C2.62001 15.6441 2.86656 16.0709 3.2487 16.3485C3.68666 16.6667 4.44405 16.6667 5.95874 16.6667H14.0445C15.5592 16.6667 16.3165 16.6667 16.7544 16.3485C17.1366 16.0709 17.3832 15.6441 17.4326 15.1743C17.4892 14.6358 17.1105 13.9792 16.3526 12.6666L12.3112 5.66655C11.5533 4.3539 11.1742 3.69769 10.6795 3.47742C10.248 3.2853 9.75497 3.2853 9.32345 3.47742C8.82895 3.69759 8.45008 4.35381 7.69285 5.66537L3.65072 12.6666ZM10.0439 13.3334V13.4167L9.96012 13.4169V13.3334H10.0439Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="#EB913B"/>
</g>
</svg>`),
  folder: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="folder-2">
<path id="Vector" d="M14.6667 7.33343V11.3334C14.6667 14.0001 14 14.6668 11.3334 14.6668H4.6667C2.00003 14.6668 1.33337 14.0001 1.33337 11.3334V4.66676C1.33337 2.0001 2.00003 1.33343 4.6667 1.33343H5.6667C6.6667 1.33343 6.8867 1.62676 7.2667 2.13343L8.2667 3.46676C8.52003 3.8001 8.6667 4.0001 9.33337 4.0001H11.3334C14 4.0001 14.6667 4.66676 14.6667 7.33343Z" stroke-width="1.15909" stroke-miterlimit="10" stroke="#5E5E5E"/>
<path id="Vector_2" d="M5.33334 1.33343H11.3333C12.6667 1.33343 13.3333 2.0001 13.3333 3.33343V4.25343" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<g id="Vector_3" opacity="0">
</g>
</g>
</svg>`),
  menuBoard: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="menu-board">
<path id="Vector" d="M14.6227 4.50633L12.376 13.5263C12.216 14.1997 11.616 14.6663 10.9227 14.6663H2.16265C1.15599 14.6663 0.435996 13.6796 0.735996 12.713L3.54266 3.69969C3.73599 3.07302 4.316 2.63963 4.96933 2.63963H13.1693C13.8027 2.63963 14.3293 3.0263 14.5493 3.55963C14.676 3.8463 14.7027 4.173 14.6227 4.50633Z" stroke-width="1.15909" stroke-miterlimit="10" stroke="#5E5E5E"/>
<path id="Vector_2" d="M10.6697 14.667H13.8564C14.7164 14.667 15.3897 13.9403 15.3297 13.0803L14.6697 4.00031" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_3" d="M6.45037 4.25328L7.14371 1.37331" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_4" d="M10.9191 4.25989L11.5458 1.36657" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_5" d="M5.13603 7.99977H10.4694" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<path id="Vector_6" d="M4.46875 10.6664H9.80208" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
<g id="Vector_7" opacity="0">
</g>
</g>
</svg>`),
  cloudUpload: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="File / Cloud_Upload">
<path id="Vector" d="M12 16V10M15 12L12 10L9 12M23 15C23 12.7909 21.2091 11 19 11C18.9764 11 18.9532 11.0002 18.9297 11.0006C18.4447 7.60802 15.5267 5 12 5C9.20335 5 6.79019 6.64004 5.66895 9.01082C3.06206 9.18144 1 11.3498 1 13.9999C1 16.7613 3.23858 19.0001 6 19.0001L19 19C21.2091 19 23 17.2091 23 15Z" stroke-linecap="round" stroke-linejoin="round" stroke="#5E5E5E"/>
</g>
</svg>`),
  closeMd: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Menu / Close_MD">
<path id="Vector" d="M10.5 10.5L3.5 3.5M10.5 3.5L3.5 10.5" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
</g>
</svg>`),
  tickOn: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="18.5455" height="18.5455" viewBox="0 0 18.5455 18.5455" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="tick-circle">
<path id="Vector" d="M9.27273 17C13.5227 17 17 13.5227 17 9.27275C17 5.02275 13.5227 1.54548 9.27273 1.54548C5.02273 1.54548 1.54545 5.02275 1.54545 9.27275C1.54545 13.5227 5.02273 17 9.27273 17Z" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#B0B0B0"/>
<path id="Vector_2" d="M5.98864 9.27269L8.17545 11.4595L12.5568 7.08587" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#0ABAB5"/>
<path id="Vector_3" opacity="0" d="M0.386364 0.386364H18.1591V18.1591H0.386364V0.386364Z" stroke-width="0.772727" stroke="#B0B0B0"/>
</g>
</svg>`),
  tickOff: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="18.5455" height="18.5455" viewBox="0 0 18.5455 18.5455" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="tick-circle">
<path id="Vector" d="M9.27273 17C13.5227 17 17 13.5227 17 9.27275C17 5.02275 13.5227 1.54548 9.27273 1.54548C5.02273 1.54548 1.54545 5.02275 1.54545 9.27275C1.54545 13.5227 5.02273 17 9.27273 17Z" stroke-width="1.15909" stroke-linecap="round" stroke-linejoin="round" stroke="#B0B0B0"/>
<g id="Vector_2">
</g>
<path id="Vector_3" opacity="0" d="M0.386364 0.386364H18.1591V18.1591H0.386364V0.386364Z" stroke-width="0.772727" stroke="#B0B0B0"/>
</g>
</svg>`),
  optionCheck: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
<path id="Vector" d="M0.500004 3.5L3.82942 6.5L10.5 0.500004" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
</svg>`),
  selectArrow: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="18.5455" height="18.5455" viewBox="0 0 18.5455 18.5455" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="arrow-down">
<path id="Vector" d="M15.3928 6.91631L10.3546 11.9545C9.75959 12.5495 8.78595 12.5495 8.19095 11.9545L3.15277 6.91631" stroke-width="1.15909" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
<g id="Vector_2" opacity="0">
</g>
</g>
</svg>`),
  checkWhite: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="Interface / Check">
<path id="Vector" d="M2.5 4.89278L4.26777 6.66055L7.80311 3.125" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" stroke="white"/>
</g>
</svg>`),
  peopleSm: normalizeSvg(`<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="people">
<g id="Group">
<path id="Vector" d="M12 4.77334C11.96 4.76667 11.9133 4.76667 11.8733 4.77334C10.9533 4.74 10.22 3.98667 10.22 3.05333C10.22 2.1 10.9867 1.33333 11.94 1.33333C12.8933 1.33333 13.66 2.10667 13.66 3.05333C13.6533 3.98667 12.92 4.74 12 4.77334Z" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
<path id="Vector_2" d="M11.3133 9.62667C12.2267 9.78001 13.2333 9.62001 13.94 9.14667C14.88 8.52001 14.88 7.49334 13.94 6.86667C13.2267 6.39334 12.2067 6.23334 11.2933 6.39334" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
</g>
<g id="Group_2">
<path id="Vector_3" d="M3.98 4.77334C4.02 4.76667 4.06667 4.76667 4.10667 4.77334C5.02667 4.74 5.76 3.98667 5.76 3.05333C5.76 2.1 4.99333 1.33333 4.04 1.33333C3.08667 1.33333 2.32 2.10667 2.32 3.05333C2.32667 3.98667 3.06 4.74 3.98 4.77334Z" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
<path id="Vector_4" d="M4.66667 9.62667C3.75333 9.78001 2.74667 9.62001 2.04 9.14667C1.1 8.52001 1.1 7.49334 2.04 6.86667C2.75334 6.39334 3.77333 6.23334 4.68667 6.39334" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
</g>
<g id="Group_3">
<path id="Vector_5" d="M8 9.75334C7.96 9.74667 7.91333 9.74667 7.87333 9.75334C6.95333 9.72 6.22 8.96667 6.22 8.03334C6.22 7.08 6.98667 6.31333 7.94 6.31333C8.89333 6.31333 9.66 7.08667 9.66 8.03334C9.65333 8.96667 8.92 9.72667 8 9.75334Z" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
<path id="Vector_6" d="M6.06 11.8533C5.12 12.48 5.12 13.5067 6.06 14.1333C7.12667 14.8467 8.87333 14.8467 9.94 14.1333C10.88 13.5067 10.88 12.48 9.94 11.8533C8.88 11.1467 7.12667 11.1467 6.06 11.8533Z" stroke-linecap="round" stroke-linejoin="round" stroke="#222222"/>
</g>
<g id="Vector_7" opacity="0">
</g>
</g>
</svg>`),
  female: `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7.5" cy="5.5" r="4.25" stroke="#F178B6" stroke-width="1.5"/><path d="M7.5 9.75V14.25M5 12H10" stroke="#F178B6" stroke-width="1.5" stroke-linecap="round"/></svg>`,
} as const

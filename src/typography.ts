// App-wide font size scale. Every Text style should reference a token here
// instead of a raw number so sizes stay consistent across screens.
export const FONT = {
  brand: 34, // logo wordmark
  display: 28, // large page titles (Search)
  title: 22, // standard page titles
  heading: 20, // screen-level headings (detail titles, KPI values)
  headerTitle: 17, // header bar titles (Program, Review, Member Profile)
  headline: 16, // card titles / section titles
  bodyLg: 15, // emphasised body text (buttons, list rows)
  body: 14, // body copy / card meta
  secondary: 13, // secondary meta
  caption: 12, // small labels, helper text
  micro: 10, // tiny meta (dates, category pills)
} as const

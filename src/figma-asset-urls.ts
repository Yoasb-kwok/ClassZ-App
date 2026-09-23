import { Asset } from "expo-asset"

const toUri = (asset: number | string): string => Asset.fromModule(asset).uri

export const FIGMA_ASSETS = {
  login: {
    logoMark: toUri(require("../assets/figma/login/logoMark.svg")),
    logoWord: toUri(require("../assets/figma/login/logoWord.svg")),
  },
  main: {
    recommend1: toUri(require("../assets/figma/main/recommend1.jpg")),
    recommend2: toUri(require("../assets/figma/main/recommend2.jpg")),
    trending1: toUri(require("../assets/figma/main/trending1.jpg")),
    trending2: toUri(require("../assets/figma/main/trending2.jpg")),
    banner: toUri(require("../assets/figma/main/banner.png")),
    categoryMusic: toUri(require("../assets/figma/main/categoryMusic.svg")),
    categoryArt: toUri(require("../assets/figma/main/categoryArt.svg")),
    categoryStem: toUri(require("../assets/figma/main/categoryStem.svg")),
    categoryAcademic: toUri(require("../assets/figma/main/categoryAcademic.svg")),
    notification: toUri(require("../assets/figma/main/notification.svg")),
    inbox: toUri(require("../assets/figma/main/inbox.svg")),
  },
  search: {
    stem: toUri(require("../assets/figma/search/stem.png")),
    sports: toUri(require("../assets/figma/search/sports.png")),
    academic: toUri(require("../assets/figma/search/academic.png")),
    art: toUri(require("../assets/figma/search/art.png")),
    music: toUri(require("../assets/figma/search/music.png")),
    others: toUri(require("../assets/figma/search/others.png")),
  },
  reservation: {
    program: toUri(require("../assets/figma/reservation/program.jpg")),
    host: toUri(require("../assets/figma/reservation/host.jpg")),
    coach: toUri(require("../assets/figma/reservation/coach.jpg")),
    child: toUri(require("../assets/figma/reservation/child.jpg")),
    paymentVisa: toUri(require("../assets/figma/reservation/paymentVisa.svg")),
    paymentAmex: toUri(require("../assets/figma/reservation/paymentAmex.svg")),
    paymentPayPal: toUri(require("../assets/figma/reservation/paymentPayPal.svg")),
    paymentApplePay: toUri(require("../assets/figma/reservation/paymentApplePay.svg")),
    paymentMastercard: toUri(require("../assets/figma/reservation/paymentMastercard.svg")),
    paymentAlipay: toUri(require("../assets/figma/reservation/paymentAlipay.svg")),
    paymentWechat: toUri(require("../assets/figma/reservation/paymentWechat.svg")),
    paymentUnionPay: toUri(require("../assets/figma/reservation/paymentUnionPay.svg")),
    paymentJcb: toUri(require("../assets/figma/reservation/paymentJcb.svg")),
  },
  nav: {
    home: toUri(require("../assets/figma/nav/home.png")),
    search: toUri(require("../assets/figma/nav/search.png")),
    calendar: toUri(require("../assets/figma/nav/calendar.png")),
    chart: toUri(require("../assets/figma/nav/chart.png")),
    profile: toUri(require("../assets/figma/nav/profile.png")),
  },
} as const

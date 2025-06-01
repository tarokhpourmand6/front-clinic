// تبدیل تاریخ میلادی به شمسی
export function getToday() {
  const gregorianToday = new Date();
  const gYear = gregorianToday.getFullYear();
  const gMonth = gregorianToday.getMonth() + 1;
  const gDay = gregorianToday.getDate();

  const g2j = (gy, gm, gd) => {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy - 621;
    let days =
      g_d_m[gm - 1] + gd + (gy % 4 === 0 && gm > 2 ? 1 : 0) - 79;

    if (days < 0) {
      jy--;
      days += 365 + (gy % 4 === 0 ? 1 : 0);
    }

    let jm, jd;
    if (days > 186) {
      jm = Math.ceil((days - 186) / 30);
      jd = (days - 186) % 30;
      if (jd === 0) jd = 30;
    } else {
      jm = Math.ceil(days / 31);
      jd = days % 31;
      if (jd === 0) jd = 31;
    }

    return { year: jy, month: jm, day: jd };
  };

  return g2j(gYear, gMonth, gDay);
}
import menuImages from "./menu-images.json";

export const money = (v) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(v));
export const thaiDate = (v) =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(v.slice(0, 10) + "T12:00:00+07:00"));
export const statusText = {
  pending: "รอร้านรับรายการ",
  confirmed: "ยืนยันแล้ว",
  preparing: "กำลังปรุง",
  ready: "พร้อมรับอาหาร",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิกแล้ว",
};
export const photos = {
  hero: menuImages["ข้าวกะเพราไก่"],
  main: menuImages["ข้าวผัดกุ้ง"],
  drink: menuImages["น้ำมะนาว"],
  soup: menuImages["ต้มยำกุ้งน้ำข้น + ข้าว"],
  dessert:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=85",
  salad:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=85",
};
export const photoFor = (item) =>
  item.image_url ||
  menuImages[item.name] ||
  (/^(ชามะนาว|น้ำ|แดงมะนาว)|เครื่องดื่ม/.test(item.name)
    ? photos.drink
    : /^(ต้ม|แกง)/.test(item.name)
      ? photos.soup
      : photos.main);

export const categoryPhoto = (name) =>
  /เครื่องดื่ม/.test(name) ? photos.drink : /ต้ม|แกง/.test(name) ? photos.soup : photos.main;

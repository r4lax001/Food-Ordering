import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 12000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("phungpong.token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/")
    )
      window.dispatchEvent(new Event("phungpong:expired"));
    return Promise.reject(error);
  },
);
const messages = {
  "Invalid email or password": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "Record already exists":
    "ข้อมูลนี้มีอยู่แล้ว กรุณาตรวจสอบอีเมลหรือชื่ออีกครั้ง",
  "Table is already booked for this slot":
    "โต๊ะนี้มีผู้จองแล้ว กรุณาเลือกโต๊ะหรือเวลาอื่น",
  "Table capacity exceeded": "จำนวนผู้เข้าร่วมเกินที่นั่งของโต๊ะ",
  "Cancel linked orders before cancelling the reservation":
    "กรุณายกเลิกคำสั่งซื้อที่ผูกกับการจองนี้ก่อน",
  "Only your pending orders can be cancelled":
    "ยกเลิกได้เฉพาะคำสั่งซื้อที่รอรับรายการ",
  "Cannot delete a table with active reservations":
    "โต๊ะนี้ยังมีการจอง จึงปิดใช้งานไม่ได้",
  "Record is still referenced by menu items or history":
    "ข้อมูลนี้ยังถูกใช้งานอยู่ จึงลบไม่ได้",
  "Invalid or expired token": "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
};
export const errorText = (e) =>
  messages[e.response?.data?.error] ||
  (!e.response
    ? "เชื่อมต่อร้านไม่ได้ กรุณาลองใหม่อีกครั้ง"
    : e.response.status === 400
      ? "กรุณาตรวจสอบข้อมูล วันเวลา และรายการที่เลือก"
      : e.response.status === 403
        ? "คุณไม่มีสิทธิ์ทำรายการนี้"
        : e.response.status === 404
          ? "ไม่พบรายการที่ต้องการ"
          : e.response.status === 409
            ? "รายการขัดแย้งกับข้อมูลปัจจุบัน กรุณาโหลดใหม่"
            : e.response.status === 429
              ? "ทำรายการถี่เกินไป กรุณารอสักครู่"
              : "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง");

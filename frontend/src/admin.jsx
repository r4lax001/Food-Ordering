import React, { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useData, useStore } from "./state";
import { api, errorText } from "./services/api";
import { money, statusText, thaiDate } from "./utils";
import { Feedback } from "./components";
const tabs = {
  menu: "เมนูอาหาร",
  categories: "หมวดหมู่",
  tables: "โต๊ะอาหาร",
  orders: "คำสั่งซื้อ",
  reservations: "การจอง",
};
const transitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};
export default function Admin() {
  const [tab, setTab] = useState("menu");
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow orange">PHUNGPONG · สำหรับผู้ดูแล</span>
        <h1>ดูแลร้านพุงป่อง</h1>
        <p>จัดการความอร่อยและทุกการจองในที่เดียว</p>
      </div>
      <div className="filter-row admin-tabs">
        {Object.entries(tabs).map(([key, name]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {name}
          </button>
        ))}
      </div>
      <Manager key={tab} tab={tab} />
    </section>
  );
}
function Manager({ tab }) {
  const collection = useData(
      `/${["orders", "reservations"].includes(tab) ? "admin/" : ""}${tab}?limit=100`,
    ),
    categories = useData("/categories?limit=100");
  const [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(null);
  const { setNotice } = useStore();
  const managed = ["menu", "categories", "tables"].includes(tab);
  async function save(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    if (tab === "menu") {
      d.price = Number(d.price);
      d.category_id = Number(d.category_id);
      d.is_available = d.is_available === "on";
      d.image_url = d.image_url || null;
    }
    if (tab === "tables") {
      d.capacity = Number(d.capacity);
      d.is_active = d.is_active === "on";
    }
    setBusy(true);
    setError("");
    try {
      if (edit.id) await api.put(`/${tab}/${edit.id}`, d);
      else await api.post(`/${tab}`, d);
      setEdit(null);
      collection.reload();
      setNotice("บันทึกเรียบร้อย");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function destroy() {
    setBusy(true);
    setError("");
    try {
      await api.delete(`/${tab}/${remove.id}`);
      setRemove(null);
      collection.reload();
      setNotice("ลบหรือปิดใช้งานรายการเรียบร้อย");
    } catch (e) {
      setError(errorText(e));
      setRemove(null);
    } finally {
      setBusy(false);
    }
  }
  async function status(id, value) {
    if (!value) return;
    setBusy(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: value });
      collection.reload();
      setNotice("อัปเดตสถานะแล้ว");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-title">
        <h2>
          {tabs[tab]} <small>({collection.data.length})</small>
        </h2>
        {managed && (
          <button
            className="btn small"
            onClick={() => {
              setError("");
              setEdit({ is_available: true, is_active: true });
            }}
          >
            <Plus size={16} /> เพิ่มรายการ
          </button>
        )}
      </div>
      <Feedback
        loading={collection.loading}
        error={error || collection.error}
        reload={collection.reload}
      />
      {edit && (
        <form className="admin-form" onSubmit={save}>
          <div className="admin-title">
            <h2>{edit.id ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="ปิดแบบฟอร์ม"
              onClick={() => setEdit(null)}
            >
              <X />
            </button>
          </div>
          {tab === "tables" ? (
            <>
              <label>
                หมายเลขโต๊ะ
                <input
                  name="table_number"
                  defaultValue={edit.table_number}
                  required
                  maxLength={20}
                />
              </label>
              <label>
                จำนวนที่นั่ง
                <input
                  name="capacity"
                  type="number"
                  defaultValue={edit.capacity || 2}
                  min="1"
                  max="20"
                  required
                />
              </label>
              <label className="checkbox">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={!!edit.is_active}
                />{" "}
                เปิดใช้งาน
              </label>
            </>
          ) : (
            <label>
              ชื่อ{tab === "menu" ? "เมนู" : "หมวดหมู่"}
              <input
                name="name"
                required
                defaultValue={edit.name}
                maxLength={tab === "menu" ? 150 : 100}
              />
            </label>
          )}
          {tab === "menu" && (
            <>
              <label>
                หมวดหมู่
                <select
                  name="category_id"
                  required
                  defaultValue={edit.category_id || ""}
                >
                  <option value="" disabled>
                    เลือกหมวดหมู่
                  </option>
                  {categories.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                ราคา (บาท)
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  max="999999.99"
                  step="0.01"
                  required
                  defaultValue={edit.price}
                />
              </label>
              <label>
                รายละเอียด
                <textarea
                  name="description"
                  maxLength={2000}
                  defaultValue={edit.description}
                />
              </label>
              <label>
                ลิงก์รูปภาพ
                <input
                  name="image_url"
                  type="url"
                  maxLength={1000}
                  defaultValue={edit.image_url || ""}
                  placeholder="https://…"
                />
              </label>
              <label className="checkbox">
                <input
                  name="is_available"
                  type="checkbox"
                  defaultChecked={!!edit.is_available}
                />{" "}
                พร้อมจำหน่าย
              </label>
            </>
          )}
          <button className="btn" disabled={busy}>
            <Check size={17} /> บันทึกข้อมูล
          </button>
        </form>
      )}
      {remove && (
        <div className="confirm-box" role="alert">
          <p>
            ยืนยัน{tab === "tables" ? "ปิดใช้งาน" : "ลบ"} “
            {remove.name || remove.table_number}” หรือไม่?
          </p>
          <button className="btn small" disabled={busy} onClick={destroy}>
            ยืนยัน
          </button>
          <button
            className="btn secondary small"
            disabled={busy}
            onClick={() => setRemove(null)}
          >
            กลับ
          </button>
        </div>
      )}
      <div className="admin-list">
        {collection.data.map((row) => (
          <article key={row.id} className="admin-row">
            <div>
              <span className="eyebrow">#{row.id}</span>
              <h3>
                {row.name ||
                  row.table_number ||
                  `${tab === "orders" ? "คำสั่งซื้อ" : "การจอง"} #${row.id}`}
              </h3>
              <p>
                {tab === "menu"
                  ? `${money(row.price)} · ${row.is_available ? "พร้อมขาย" : "ปิดขาย"}`
                  : tab === "tables"
                    ? `${row.capacity} ที่นั่ง`
                    : tab === "orders"
                      ? `${money(row.total)} · ${statusText[row.status]}`
                      : tab === "reservations"
                        ? `${thaiDate(row.reservation_date)} ${row.slot} น. · โต๊ะ #${row.table_id} · ${row.guests} คน · ${statusText[row.status]}`
                        : ""}
              </p>
            </div>
            {managed ? (
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`แก้ไข ${row.name || row.table_number}`}
                  onClick={() => setEdit(row)}
                >
                  <Pencil size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`ลบ ${row.name || row.table_number}`}
                  onClick={() => setRemove(row)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : tab === "orders" && transitions[row.status]?.length > 0 ? (
              <select
                aria-label={`เปลี่ยนสถานะคำสั่งซื้อ ${row.id}`}
                value=""
                disabled={busy}
                onChange={(e) => status(row.id, e.target.value)}
              >
                <option value="">เปลี่ยนสถานะ</option>
                {transitions[row.status].map((s) => (
                  <option key={s} value={s}>
                    {statusText[s]}
                  </option>
                ))}
              </select>
            ) : null}
          </article>
        ))}
      </div>
      <Feedback
        empty={
          !collection.loading && !collection.error && !collection.data.length
        }
      />
      <p className="fine-print">
        แสดงสูงสุด 100 รายการ
        {tab === "tables" ? " · แสดงเฉพาะโต๊ะที่เปิดใช้งาน" : ""}
        {tab === "reservations"
          ? " · การยกเลิกการจองทำได้โดยเจ้าของการจองเท่านั้น"
          : ""}
      </p>
    </>
  );
}

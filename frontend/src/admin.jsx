import AnimatedHeading from "./components/AnimatedHeading";
import React, { useState, useEffect, useRef } from "react";
import { Plus, Check, X, Search, RefreshCw, ArrowUpRight } from "lucide-react";
import { useData, useStore } from "./state";
import { api, errorText } from "./services/api";
import { statusText } from "./utils";
import { Feedback } from "./components";
import { useSearchParams, Link } from "react-router-dom";
import { adminSections, Overview, AdminRecords } from "./admin-panels";
import "./admin.css";
import AdminUsers from "./admin-users";
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
  const [params, setParams] = useSearchParams();
  const tab = adminSections[params.get('section')] ? params.get('section') : 'overview';
  const navigate = (section, category) => setParams({section, ...(category ? {category:String(category)} : {})});
  const {user} = useStore();
  return <section className="page admin-workspace">
    <div className="admin-welcome"><div><span className="eyebrow orange">PHUNGPONG · จัดการร้าน</span><AnimatedHeading>ครัวพร้อม ร้านพร้อม</AnimatedHeading><p>สวัสดี {user?.name} ดูแลทุกมื้อได้จากที่เดียว</p></div><Link className="btn secondary small" to="/menu">ดูหน้าร้าน <ArrowUpRight size={16}/></Link></div>
    <div className="admin-layout">
      <nav className="admin-nav" aria-label="ส่วนจัดการร้าน">{Object.entries(adminSections).map(([key,item])=>{const Icon=item.icon;return <button key={key} aria-current={tab===key?'page':undefined} className={tab===key?'active':''} onClick={()=>navigate(key)}><Icon size={21}/><span><strong>{item.name}</strong><small>{item.description}</small></span></button>})}<p>พุงป่อง · หลังบ้านของมื้ออร่อย</p></nav>
      <div className={'admin-content section-'+tab}>
        {tab==='overview'?<Overview navigate={navigate}/>:tab==='users'?<AdminUsers/>:<Manager key={tab+':'+(params.get('category')||'')} tab={tab} initialCategory={params.get('category')||''} onCategory={id=>navigate('menu',id)}/>}
      </div>
    </div>
  </section>;
}
function Manager({ tab, initialCategory, onCategory }) {
  const collection = useData(
      `/${["orders", "reservations"].includes(tab) ? "admin/" : ""}${tab}?limit=100`,
    ),
    categories = useData("/categories?limit=100"),
    menuData = useData("/menu?limit=100"),
    tableData = useData("/tables?limit=100");
  const [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(null);
  const { setNotice } = useStore();
  const [query,setQuery]=useState(''), [filter,setFilter]=useState(''), [categoryFilter,setCategoryFilter]=useState(initialCategory), [date,setDate]=useState('');
  const formRef=useRef(null), confirmRef=useRef(null);
  useEffect(()=>{if(edit){formRef.current?.scrollIntoView({block:'nearest'});formRef.current?.querySelector('input')?.focus();}},[edit]);
  useEffect(()=>{if(remove){confirmRef.current?.scrollIntoView({block:'nearest'});confirmRef.current?.querySelector('button')?.focus();}},[remove]);
  const filtered=collection.data.filter(row=>{
    const hay=[row.name,row.table_number,row.id,row.user_id,row.note].filter(v=>v!=null).join(' ').toLowerCase();
    return hay.includes(query.trim().toLowerCase()) && (!categoryFilter||tab!=='menu'||String(row.category_id)===categoryFilter)
      && (!date||tab!=='reservations'||row.reservation_date.slice(0,10)===date)
      && (!filter || (tab==='menu'?(filter==='available'?!!row.is_available:!row.is_available):tab==='tables'?String(row.capacity)===filter:row.status===filter));
  });
  const resetFilters=()=>{setQuery('');setFilter('');setCategoryFilter('');setDate('');};
  const managed = ["menu", "categories", "tables"].includes(tab);
  async function save(e) {
    e.preventDefault();
    if (tab === "tables" && !edit?.id) {
      setError("ไม่อนุญาตให้เพิ่มโต๊ะใหม่");
      return;
    }
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
    setError("");
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
        <AnimatedHeading as="h2">
          {tabs[tab]} <small>({collection.data.length})</small>
        </AnimatedHeading>
        {managed && tab !== "tables" && (
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
        <form ref={formRef} className="admin-form" onSubmit={save}>
          <div className="admin-title">
            <AnimatedHeading as="h2">{edit.id ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</AnimatedHeading>
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
        <div ref={confirmRef} className="confirm-box" role="alert">
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
      {!collection.loading && !collection.error && <>
        <div className="admin-searchbar">
          <label className="admin-search"><Search size={18}/><input aria-label="ค้นหาในหมวดนี้" placeholder={tab==='orders'||tab==='reservations'?'ค้นหาเลขรายการ / รหัสลูกค้า':'ค้นหาชื่อหรือหมายเลข'} value={query} onChange={e=>setQuery(e.target.value)}/></label>
          {tab==='menu'&&<select aria-label="กรองหมวดอาหาร" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">ทุกหมวดอาหาร</option>{categories.data.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
          {tab!=='categories'&&<select aria-label="กรองสถานะหรือที่นั่ง" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">{tab==='tables'?'ทุกขนาดโต๊ะ':'ทุกสถานะ'}</option>{(tab==='menu'?[['available','พร้อมขาย'],['unavailable','ปิดขาย']]:tab==='tables'?[...new Set(collection.data.map(t=>t.capacity))].sort((a,b)=>a-b).map(c=>[String(c),c+' ที่นั่ง']):Object.entries(statusText).filter(([k])=>tab==='orders'||['confirmed','cancelled'].includes(k))).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}
          {tab==='reservations'&&<input type="date" aria-label="กรองวันจอง" value={date} onChange={e=>setDate(e.target.value)}/>}
          <button className="admin-refresh" aria-label="โหลดรายการใหม่" onClick={collection.reload}><RefreshCw size={18}/></button>
        </div>
        <div className="admin-results"><span>แสดง {filtered.length} จาก {collection.data.length} รายการ</span>{(query||filter||categoryFilter||date)&&<button onClick={resetFilters}>ล้างตัวกรอง</button>}</div>
        {(tab==='categories'||tab==='reservations')&&<Feedback error={tab==='categories'?menuData.error:tableData.error} reload={tab==='categories'?menuData.reload:tableData.reload}/>}
        <AdminRecords tab={tab} rows={filtered} categories={categories.data} menuData={menuData.data} menuLoading={menuData.loading} menuError={menuData.error} tableData={tableData.data} busy={busy} onEdit={row=>{setError('');setEdit(row)}} onRemove={setRemove} onStatus={status} transitions={transitions} onCategory={onCategory}/>
        {!filtered.length&&<div className="admin-empty"><Search size={30}/><h3>ยังไม่มีรายการที่ตรงกัน</h3><p>ลองเปลี่ยนคำค้นหาหรือเลือกตัวกรองอื่น</p><button className="btn secondary small" onClick={resetFilters}>แสดงรายการทั้งหมด</button></div>}
      </>}
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

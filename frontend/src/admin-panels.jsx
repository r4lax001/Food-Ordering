import React, { useState } from 'react';
import { LayoutDashboard, Utensils, Shapes, Armchair, ShoppingBag, CalendarDays, ArrowUpRight, Users, Pencil, Trash2 } from 'lucide-react';
import { useData } from './state';
import { FoodImage, Feedback } from './components';
import { money, photoFor, categoryPhoto, thaiDate, statusText } from './utils';
import { Badge } from './components/reui/badge';
import CountUp from './components/reactbits/CountUp';
import AnimatedContent from './components/reactbits/AnimatedContent';
export const adminSections = {
 overview: {name:'ภาพรวมร้าน', description:'งานสำคัญที่รอคุณดูแล', icon:LayoutDashboard},
 orders: {name:'คำสั่งซื้อ', description:'รับรายการและติดตามงานครัว', icon:ShoppingBag},
 reservations: {name:'การจอง', description:'เตรียมโต๊ะให้พร้อมต้อนรับ', icon:CalendarDays},
 menu: {name:'เมนูอาหาร', description:'จัดการรูป ราคา และการขาย', icon:Utensils},
 categories: {name:'หมวดหมู่', description:'จัดกลุ่มเมนูให้เลือกง่าย', icon:Shapes},
 tables: {name:'โต๊ะอาหาร', description:'ดูแลโต๊ะเดิมและจำนวนที่นั่ง', icon:Armchair},
 users: {name:'ผู้ใช้งาน', description:'ค้นหาบัญชีและตรวจสอบสิทธิ์', icon:Users},
};
export function Status({value}) { return <Badge radius="full" variant={value==='cancelled'?'secondary':['completed','confirmed','ready'].includes(value)?'success-light':'warning-light'}>{statusText[value] || value}</Badge>; }
export function Overview({navigate}) {
 const orders=useData('/admin/orders?limit=100'), reservations=useData('/admin/reservations?limit=100'), menus=useData('/menu?limit=100'), tables=useData('/tables?limit=100');
 const sources=[orders,reservations,menus,tables];
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
 const todayBookings=reservations.data.filter(r=>r.reservation_date.slice(0,10)===today && r.status==='confirmed');
 const pending=orders.data.filter(o=>!['completed','cancelled'].includes(o.status));
 return <>
   <Feedback loading={sources.some(s=>s.loading)} error={sources.find(s=>s.error)?.error} reload={()=>sources.forEach(s=>s.reload())} />
   {!sources.some(s=>s.loading||s.error) && <>
   <AnimatedContent distance={36} duration={0.8} trigger="mount" stagger={0.08}>
   <div className="admin-metrics">{[
     ['orders',pending.length,'ออเดอร์กำลังดำเนินการ','รับรายการและส่งต่อให้ครัว'],
     ['reservations',todayBookings.length,'การจองวันนี้ที่ยืนยันแล้ว','ดูรอบเวลาและจำนวนคน'],
     ['menu',menus.data.filter(m=>m.is_available).length,'เมนูพร้อมขาย','เตรียมเมนูให้ลูกค้าเลือก'],
     ['tables',tables.data.length,'โต๊ะเปิดใช้งาน','ตรวจสอบความจุของโต๊ะ'],
   ].map(([key,value,label,hint])=><button key={key} className={'admin-metric tone-'+key} onClick={()=>navigate(key)}><span>{label}<ArrowUpRight size={17}/></span><strong><CountUp to={value} duration={1.6} trigger="load" separator="," /></strong><small>{hint}</small></button>)}</div>
   </AnimatedContent>
   <div className="admin-overview-columns"><section className="admin-surface"><div className="admin-section-title"><h3>คิวที่ต้องดูแล</h3><button onClick={()=>navigate('orders')}>ดูทั้งหมด →</button></div>{pending.slice(0,5).map(o=><button className="admin-queue-link" key={o.id} onClick={()=>navigate('orders')}><span>ออเดอร์ #{o.id}<small>{money(o.total)}</small></span><Status value={o.status}/></button>)}{!pending.length&&<p className="admin-calm">ยังไม่มีออเดอร์ค้าง พร้อมรับมื้อถัดไปแล้ว</p>}</section>
   <section className="admin-surface"><div className="admin-section-title"><h3>นัดอร่อยวันนี้</h3><button onClick={()=>navigate('reservations')}>ดูการจอง →</button></div>{todayBookings.sort((a,b)=>a.slot.localeCompare(b.slot)).slice(0,5).map(r=><div className="admin-agenda-line" key={r.id}><strong>{r.slot}</strong><span>การจอง #{r.id}<small>{r.guests} คน · โต๊ะรหัส #{r.table_id}</small></span></div>)}{!todayBookings.length&&<p className="admin-calm">ยังไม่มีการจองที่ยืนยันสำหรับวันนี้</p>}</section></div>
   <p className="fine-print">ภาพรวมคำนวณจากข้อมูลล่าสุดสูงสุดหมวดละ 100 รายการ · จำนวนโต๊ะเปิดใช้งานไม่ใช่จำนวนโต๊ะว่างตามรอบเวลา</p>
   </>}
 </>;
}
function OrderDetail({id}) {
 const detail=useData('/orders/'+id);
 return <div className="admin-order-detail"><Feedback loading={detail.loading} error={detail.error} reload={detail.reload}/>{!detail.loading&&!detail.error&&<>{detail.data.items?.map(i=><div key={i.id}><span>{i.menu_name} × {i.quantity}</span><strong>{money(Number(i.unit_price)*i.quantity)}</strong></div>)}{detail.data.note&&<p>หมายเหตุ: {detail.data.note}</p>}</>}</div>;
}
export function AdminRecords({tab, rows, categories, menuData, menuLoading, menuError, tableData, busy, onEdit, onRemove, onStatus, transitions, onCategory}) {
 const [expanded,setExpanded]=useState(null);
 const controls=row=><div className="admin-card-actions"><button disabled={busy} onClick={()=>onEdit(row)} aria-label={`แก้ไข ${row.name||row.table_number}`}><Pencil size={15}/>แก้ไข</button><button disabled={busy} onClick={()=>onRemove(row)} aria-label={`${tab==='tables'?'ปิดใช้งาน':'ลบ'} ${row.name||row.table_number}`}><Trash2 size={15}/>{tab==='tables'?'ปิดใช้งาน':'ลบ'}</button></div>;
 if(tab==='menu')return <div className="admin-menu-cards">{rows.map(row=><article key={row.id} className="admin-menu-card"><div className="admin-food-image"><FoodImage src={photoFor(row)} alt={row.name}/><Badge radius="full" variant={row.is_available?'success-light':'secondary'}>{row.is_available?'พร้อมขาย':'ปิดขาย'}</Badge></div><div className="admin-card-body"><small>{row.category_name||categories.find(c=>c.id===row.category_id)?.name}</small><h3>{row.name}</h3><strong className="admin-price">{money(row.price)}</strong>{controls(row)}</div></article>)}</div>;
 if(tab==='categories')return <div className="admin-category-cards">{rows.map((row,i)=>{const count=menuData.filter(m=>m.category_id===row.id).length;return <article key={row.id} className={'admin-category-card category-tone-'+i%3}><FoodImage src={categoryPhoto(row.name)} alt=""/><div><span className="eyebrow">หมวดอาหาร</span><h3>{row.name}</h3><p>{menuLoading?"กำลังนับเมนู…":menuError?"ยังโหลดจำนวนเมนูไม่ได้":`${count} เมนูในรายการที่โหลด`}</p><button className="text-button" onClick={()=>onCategory(row.id)}>เปิดดูเมนูในหมวด →</button></div>{controls(row)}</article>})}</div>;
 if(tab==='tables')return <><div className="admin-inline-note"><Armchair size={20}/><span>จัดการโต๊ะเดิมของร้าน · ไม่เปิดให้เพิ่มโต๊ะใหม่</span></div><div className="admin-table-cards">{rows.map(row=><article key={row.id} className="admin-table-card"><div className="admin-table-symbol"><Armchair size={34}/></div><h3>โต๊ะ {row.table_number}</h3><strong>{row.capacity} <small>ที่นั่ง</small></strong><Badge variant="success-light" radius="full">เปิดใช้งาน</Badge>{controls(row)}</article>)}</div></>;
 if(tab==='orders')return <div className="admin-order-cards">{rows.map(row=><article className={'admin-order-card order-'+row.status} key={row.id}><div className="admin-card-top"><span className="eyebrow">ออเดอร์ #{row.id}</span><Status value={row.status}/></div><div className="admin-order-total"><strong>{money(row.total)}</strong><small>{thaiDate(row.created_at)} · ลูกค้ารหัส #{row.user_id}</small></div><div className="admin-order-actions"><button className="btn secondary small" aria-expanded={expanded===row.id} onClick={()=>setExpanded(expanded===row.id?null:row.id)}>{expanded===row.id?'ซ่อนรายการ':'ดูรายการอาหาร'}</button>{transitions[row.status]?.length>0&&<select aria-label={`เปลี่ยนสถานะคำสั่งซื้อ ${row.id}`} value="" disabled={busy} onChange={e=>onStatus(row.id,e.target.value)}><option value="">เปลี่ยนสถานะ…</option>{transitions[row.status].map(s=><option value={s} key={s}>{statusText[s]}</option>)}</select>}</div>{expanded===row.id&&<OrderDetail id={row.id}/>}</article>)}</div>;
 const groups=[...rows].sort((a,b)=>a.reservation_date.localeCompare(b.reservation_date)||a.slot.localeCompare(b.slot)).reduce((result,row)=>{const day=row.reservation_date.slice(0,10);(result[day] ||= []).push(row);return result;},{});
 return <div className="admin-booking-days">{Object.entries(groups).map(([date,bookings])=><section key={date}><h3><CalendarDays size={18}/>{thaiDate(date)}<small>{bookings.length} รายการ</small></h3>{bookings.map(row=><article className="admin-booking-row" key={row.id}><div className="admin-booking-time">{row.slot}<small>90 นาที</small></div><div><h4>โต๊ะ {tableData.find(t=>t.id===row.table_id)?.table_number||'#'+row.table_id}</h4><p>{row.guests} คน · การจอง #{row.id} · ลูกค้ารหัส #{row.user_id}</p>{row.note&&<p className="admin-booking-note">{row.note}</p>}</div><Status value={row.status}/></article>)}</section>)}</div>;
}

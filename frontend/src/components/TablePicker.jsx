import React, { useEffect, useRef, useState } from 'react';
import { Check, Leaf, Users } from 'lucide-react';
import './table-picker.css';
import Restaurant3D from './Restaurant3D';
import { tablePositions as positions } from './restaurant-layout';

function TableIllustration({ capacity }) {
  const seats = Math.min(20, Number(capacity));
  const perSide = Math.ceil(seats / 2);
  return <svg className="table-illustration" viewBox="0 0 180 130" aria-hidden="true">
    <ellipse cx="90" cy="107" rx="61" ry="9" fill="#694323" opacity=".08" />
    {Array.from({length: seats}, (_, i) => {
      const side = i < perSide ? 0 : 1;
      const count = side ? seats - perSide : perSide;
      const x = 42 + (i % perSide + .5) * 96 / count;
      return <rect className="table-chair" key={i} x={x - Math.min(10, 36/count)} y={side ? 94 : 12} width={Math.min(20,72/count)} height="23" rx="6" />;
    })}
    <rect className="table-edge" x="31" y="34" width="118" height="63" rx={seats <= 2 ? 29 : 16} />
    <rect className="table-surface" x="31" y="29" width="118" height="63" rx={seats <= 2 ? 29 : 16} />
    <path d="M48 48H130M48 72H130" stroke="#b78d60" opacity=".14" strokeLinecap="round" />
    <circle cx="62" cy="60" r="16" fill="#fffdfa" /><circle cx="62" cy="60" r="11" fill="none" stroke="#e8d7c0" />
    <circle cx="118" cy="60" r="16" fill="#fffdfa" /><circle cx="118" cy="60" r="11" fill="none" stroke="#e8d7c0" />
    <rect x="86" y="52" width="8" height="14" rx="3" fill="#d69a69" />
    <path d="M90 54Q76 39 88 40Q96 37 90 54M90 53Q106 40 98 39Q91 38 90 53" fill="#64865a" />
  </svg>;
}

export default function TablePicker({ tables, freeTables = tables, roomTables = [], selected, onSelect, guests, busy }) {
 const viewport = useRef(null);
 const [width, setWidth] = useState(980);
 const [zoomed, setZoomed] = useState(false);
 const [view, setView] = useState('3d');
 const listView = view === 'list';
 useEffect(() => {
   const element = viewport.current;
   if (!element) return;
   const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
   observer.observe(element);
   return () => observer.disconnect();
 }, [view]);
 const scale = zoomed ? 1 : Math.min(1, width / 980);
 const available = new Set(tables.map(t => t.id));
 const free = new Set(freeTables.map(t => t.id));
 const fullCount = roomTables.filter(t => !free.has(t.id)).length;
 const smallCount = roomTables.filter(t => free.has(t.id) && Number(t.capacity) < Number(guests)).length;
 function renderTable(t, location) {
   const canSelect = available.has(t.id);
   const state = !free.has(t.id) ? 'full' : Number(t.capacity) < Number(guests) ? 'too-small' : 'available';
   const status = state === 'full' ? 'โต๊ะเต็ม' : state === 'too-small' ? 'ที่นั่งไม่พอ' : 'โต๊ะว่าง';
   return <button type="button" key={t.id} style={location ? {left: location[0], top: location[1]} : undefined}
     disabled={busy || !canSelect} aria-pressed={selected === t.id}
     aria-label={`โต๊ะ ${t.table_number} ${t.capacity} ที่นั่ง · ${status}`}
     className={`dining-table status-${state} ${selected === t.id ? 'selected' : ''} ${!canSelect ? 'unavailable' : ''}`}
     onClick={() => onSelect(t.id)}>
     <span className="table-choice">{selected === t.id ? <><Check size={13} />เลือกแล้ว</> : status}</span>
     <TableIllustration capacity={t.capacity} />
     <strong>{t.table_number}</strong><span className="table-capacity"><Users size={13} />{t.capacity} ที่นั่ง</span>
   </button>;
 }
 const extra = roomTables.filter(t => !positions[t.table_number]);
 return <section className="table-picker" aria-label="เลือกโต๊ะจากผังร้าน">
   <div className="table-picker-heading">
     <div><span className="eyebrow orange">เว้นที่ให้ทุกมื้อสบายขึ้น</span><h2>เลือกโต๊ะจากผังร้าน</h2><p>ว่าง {tables.length} โต๊ะ สำหรับ {guests} คน · รอบที่คุณเลือก</p></div>
     <div className="table-legend"><span><i />โต๊ะว่าง</span><span><i className="chosen" />เลือกแล้ว</span><span><i className="full-dot" />โต๊ะเต็ม</span><span><i className="unavailable-dot" />ที่นั่งไม่พอ</span></div>
   </div>
   <div className="table-status-summary" aria-live="polite">
     <div className="summary-available"><strong>{tables.length}</strong><span>โต๊ะว่างสำหรับคุณ</span></div>
     <div className="summary-full"><strong>{fullCount}</strong><span>โต๊ะเต็มในรอบนี้</span></div>
     {smallCount > 0 && <div className="summary-small"><strong>{smallCount}</strong><span>โต๊ะว่าง แต่ที่นั่งไม่พอ</span></div>}
   </div>
   <p className="floorplan-description">ผังร้านตัวอย่าง · เว้นระยะระหว่างโต๊ะและเปิดทางเดินกลาง ยังไม่ได้อ้างอิงขนาดพื้นที่จริง</p>
   <div className="floorplan-toolbar">
     <div className="floorplan-view" role="group" aria-label="รูปแบบการเลือกโต๊ะ">
       <button type="button" aria-pressed={view === '3d'} onClick={() => setView('3d')}>ร้าน 3D</button>
       <button type="button" aria-pressed={view === '2d'} onClick={() => setView('2d')}>ผัง 2D</button>
       <button type="button" aria-pressed={listView} onClick={() => setView('list')}>รายการโต๊ะ</button>
     </div>
     {view === '2d' && <button type="button" className="floorplan-zoom" aria-pressed={zoomed} onClick={() => setZoomed(v => !v)}>{zoomed ? 'ย่อให้พอดีจอ' : 'ขยายผัง'}</button>}
   </div>
   {view === '2d' && <p className="floorplan-scroll-hint">{zoomed ? 'เลื่อนผังเพื่อดูมุมอื่น ๆ ของร้าน' : 'ดูผังได้ครบทั้งร้าน · ขยายเพื่อเลือกโต๊ะได้สะดวกขึ้น'}</p>}
   {view === '3d' ? <Restaurant3D roomTables={roomTables} tables={tables} freeTables={freeTables} guests={guests} selected={selected} onSelect={onSelect} busy={busy} onFallback={() => setView('2d')} /> : listView ? <div className="room-table-list">{roomTables.map(t => renderTable(t))}</div> : <>
   <div ref={viewport} className="floorplan-scroll" tabIndex={0} role="region" aria-label="ผังร้านตัวอย่าง เลื่อนแนวนอนเพื่อดูทุกโต๊ะ">
     <div className="floorplan-sized" style={{width: 980 * scale, height: 840 * scale}}>
     <div className="restaurant-floor" style={{transform: `scale(${scale})`}}>
       <div className="room-counter">เคาน์เตอร์ / จุดรับอาหาร</div>
       <div className="room-service-path">ทางเดินไปห้องน้ำ →</div>
       <div className="room-restroom">ห้องน้ำ</div>
       <div className="room-window">แนวหน้าต่าง</div>
       <div className="room-aisle"><span>ทางเดินกลาง</span></div>
       <span className="room-zone room-zone-left">ฝั่งหน้าต่าง</span><span className="room-zone room-zone-right">ฝั่งด้านใน</span>
       <div className="room-plant plant-left"><Leaf size={26} /></div><div className="room-plant plant-right"><Leaf size={26} /></div>
       {roomTables.filter(t => positions[t.table_number]).map(t => renderTable(t, positions[t.table_number]))}
       <div className="room-entry">↑ ทางเข้า / ออก</div>
     </div>
     </div>
   </div>
   </>}
   {!listView && extra.length > 0 && <div className="unplaced-tables"><h3>โต๊ะเพิ่มเติม · ยังไม่ได้ระบุตำแหน่งในผัง</h3><div>{extra.map(t => renderTable(t))}</div></div>}
 </section>;
}

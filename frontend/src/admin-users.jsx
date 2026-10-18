import AnimatedHeading from "./components/AnimatedHeading";
import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, Users } from 'lucide-react';
import { api, errorText } from './services/api';
import { useStore } from './state';
import { Feedback } from './components';
import { Badge } from './components/reui/badge';
import { thaiDate } from './utils';
const limit = 20;
export default function AdminUsers() {
 const {user}=useStore();
 const [input,setInput]=useState(''),[query,setQuery]=useState(''),[role,setRole]=useState(''),[offset,setOffset]=useState(0),[revision,setRevision]=useState(0);
 const [result,setResult]=useState({data:[],total:0}),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
   let active=true;setLoading(true);setError('');
   api.get('/admin/users',{params:{q:query,...(role?{role}:{}),limit,offset}}).then(r=>{if(active)setResult(r.data)}).catch(e=>{if(active)setError(errorText(e))}).finally(()=>{if(active)setLoading(false)});
   return ()=>{active=false};
 },[query,role,offset,revision]);
 function search(e){e.preventDefault();setOffset(0);setQuery(input.trim());setRevision(v=>v+1)}
 function reset(){setInput('');setQuery('');setRole('');setOffset(0)}
 return <section className="admin-users">
   <div className="admin-title"><AnimatedHeading as="h2">ผู้ใช้งาน</AnimatedHeading><Users size={25}/></div>
   <p className="admin-users-description">รายชื่อบัญชีลูกค้าและผู้ดูแลร้าน</p>
   <form className="admin-searchbar" onSubmit={search}>
     <label className="admin-search"><Search size={18}/><input aria-label="ค้นหาผู้ใช้งาน" placeholder="ชื่อ อีเมล หรือรหัสผู้ใช้" maxLength={190} value={input} onChange={e=>setInput(e.target.value)}/></label>
     <select aria-label="กรองสิทธิ์ผู้ใช้งาน" value={role} onChange={e=>{setRole(e.target.value);setOffset(0)}}><option value="">ทุกสิทธิ์</option><option value="customer">ลูกค้า</option><option value="admin">ผู้ดูแลร้าน</option></select>
     <button className="btn small" type="submit">ค้นหา</button>
     <button className="admin-refresh" type="button" aria-label="โหลดผู้ใช้งานใหม่" onClick={()=>setRevision(v=>v+1)}><RefreshCw size={18}/></button>
   </form>
   <Feedback loading={loading} error={error} reload={()=>setRevision(v=>v+1)}/>
   {!loading&&!error&&<>
     <div className="admin-results" aria-live="polite"><span>พบ {result.total} บัญชี{result.total>0&&` · แสดง ${offset+1}–${Math.min(offset+limit,result.total)}`}</span>{(query||role)&&<button onClick={reset}>ล้างตัวกรอง</button>}</div>
     <div className="admin-user-list">{result.data.map(row=><article className="admin-user-card" key={row.id}>
       <div className="admin-user-avatar" aria-hidden="true">{Array.from(row.name.trim())[0]||'U'}</div>
       <div className="admin-user-info"><h3>{row.name}{row.id===user?.id&&<span className="admin-user-self">คุณ</span>}</h3><p>{row.email}</p><small>รหัส #{row.id} · สมัครเมื่อ {thaiDate(row.created_at)}</small></div>
       <Badge radius="full" variant={row.role==='admin'?'warning-light':'success-light'}>{row.role==='admin'?'ผู้ดูแลร้าน':'ลูกค้า'}</Badge>
     </article>)}</div>
     {!result.data.length&&<div className="admin-empty"><Users size={30}/><h3>ไม่พบผู้ใช้งาน</h3><p>ลองเปลี่ยนคำค้นหาหรือสิทธิ์ที่เลือก</p><button className="btn secondary small" onClick={reset}>แสดงทั้งหมด</button></div>}
     <div className="admin-user-pagination"><button className="btn secondary small" disabled={offset===0} onClick={()=>setOffset(v=>Math.max(0,v-limit))}>ก่อนหน้า</button><span>หน้า {Math.floor(offset/limit)+1} / {Math.max(1,Math.ceil(result.total/limit))}</span><button className="btn secondary small" disabled={offset+limit>=result.total} onClick={()=>setOffset(v=>v+limit)}>ถัดไป</button></div>
   </>}
 </section>;
}

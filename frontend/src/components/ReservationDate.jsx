import React from 'react';
import { CalendarDays, Check } from 'lucide-react';
import './reservation-date.css';

export default function ReservationDate({ today, value, onChange }) {
  const dateAt = offset => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date;
  };
  const format = (date, options) => date.toLocaleDateString('th-TH', { ...options, timeZone: 'Asia/Bangkok' });
  return <div className="reservation-date">
    <div className="reservation-date-title"><CalendarDays size={22} /><strong>อยากมาอิ่มวันไหนดี?</strong></div>
    <div className="reservation-days" role="group" aria-label="เลือกวันแบบรวดเร็ว">
      {Array.from({length: 7}, (_, index) => {
        const date = dateAt(index), iso = date.toISOString().slice(0, 10);
        return <button key={iso} type="button" aria-pressed={value === iso}
          aria-label={format(date, {weekday:'long',day:'numeric',month:'long'})}
          onClick={() => onChange(iso)}>
          <span>{index === 0 ? 'วันนี้' : index === 1 ? 'พรุ่งนี้' : format(date, {weekday:'short'})}</span>
          <strong>{format(date, {day:'numeric'})}</strong>
          <small>{format(date, {month:'short'})}</small>
          {value === iso && <Check size={12} className="day-check" aria-hidden="true" />}
        </button>;
      })}
    </div>
    <div className="reservation-date-bottom">
      <label>วันที่
        <input name="date" type="date" min={today} max={dateAt(89).toISOString().slice(0,10)}
          value={value} onChange={e => onChange(e.target.value)} required />
      </label>
      <p aria-live="polite">{value ? format(new Date(`${value}T12:00:00Z`), {weekday:'long',day:'numeric',month:'long',year:'numeric'}) : 'เลือกวันด้านบน หรือเปิดปฏิทินเพื่อเลือกวันอื่น'}</p>
    </div>
  </div>;
}

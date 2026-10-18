import React from 'react';
import { LayoutGrid, Utensils, Soup, CupSoda } from 'lucide-react';

function presentation(name) {
  if (/เครื่องดื่ม|น้ำดื่ม/.test(name)) return { Icon: CupSoda, label: 'เครื่องดื่ม' };
  if (/ต้ม|แกง|น้ำ/.test(name)) return { Icon: Soup, label: 'ต้ม / แกง' };
  if (/ข้าว|แห้ง/.test(name)) return { Icon: Utensils, label: 'อาหารจานเดียว' };
  return { Icon: Utensils, label: name };
}
export default function CategoryPicker({ categories, value, onChange }) {
  return <section className="category-panel" aria-label="เลือกหมวดหมู่">
    <div className="category-icons" role="group" aria-label="หมวดหมู่อาหาร">
    <button type="button" aria-pressed={!value} onClick={() => onChange('')}>
      <span className="category-symbol"><LayoutGrid aria-hidden="true" /></span><span>ทั้งหมด</span>
    </button>
    {categories.map(category => {
      const { Icon, label } = presentation(category.name);
      return <button type="button" key={category.id} title={category.name}
        aria-label={category.name} aria-pressed={String(value) === String(category.id)}
        onClick={() => onChange(String(category.id))}>
        <span className="category-symbol"><Icon aria-hidden="true" /></span><span>{label}</span>
      </button>;
    })}
    </div>
  </section>;
}

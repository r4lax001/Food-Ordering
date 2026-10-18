// Shared layout coordinates for the sample 2D and 3D room.
export const tablePositions = {
  T01: [55, 165], T02: [235, 165], T03: [595, 165], T04: [775, 165],
  T06: [55, 385], T07: [235, 385], T08: [595, 385], T09: [775, 385],
  T05: [145, 605], T10: [685, 605],
};
export function tableStatus(table, free, guests) {
  return !free.has(table.id) ? 'full' : Number(table.capacity) < Number(guests) ? 'too-small' : 'available';
}
export const tableStatusLabels = { full: 'โต๊ะเต็ม', 'too-small': 'ที่นั่งไม่พอ', available: 'โต๊ะว่าง' };

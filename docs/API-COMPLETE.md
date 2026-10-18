# API Documentation — ฉบับส่งงาน

Base URL: `http://127.0.0.1:3000` รับส่ง JSON; POST/PUT/PATCH ใช้ Content-Type: application/json

Bearer token จาก /api/auth/login ใช้กับ endpoints สมาชิก ส่วน admin ตรวจ role ใน MySQL ทุกคำขอ ราคาที่อ่านจาก MySQL เป็น string แบบ DECIMAL, boolean เป็น 0/1 การส่งราคาใช้ JSON number และสถานะใช้ JSON boolean

รายการรองรับ limit 1–100 (default 50), offset >= 0 ในเมนู โต๊ะ หมวดหมู่ ประวัติ และรายการ admin

ตัวอย่าง Response ด้านล่างเก็บจากการทดสอบจริง ID/วันเวลาเป็นข้อมูลทดสอบ ไม่ใช่ค่าที่ต้องใช้ซ้ำ Token/ข้อมูลลับถูกปิดบัง

## GET /api/health

สิทธิ์: สาธารณะ

Request body: ไม่มี

Response 200:
```json
{
  "status": "ok",
  "database": "connected"
}
```

## GET /api/menu

สิทธิ์: สาธารณะ

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "name": "ข้าวกะเพราไก่",
      "description": "ข้าวกะเพราไก่พร้อมไข่ดาว",
      "price": "75.00",
      "image_url": null,
      "is_available": 1,
      "deleted_at": null,
      "created_at": "2026-10-17 18:23:45",
      "category_name": "อาหารจานหลัก"
    },
    {
      "id": 2,
      "category_id": 1,
      "name": "ข้าวผัดกุ้ง",
      "description": "ข้าวผัดกุ้งสด",
      "price": "90.00",
      "image_url": null,
      "is_available": 1,
      "deleted_at": null,
      "created_at": "2026-10-17 18:23:45",
      "category_name": "อาหารจานหลัก"
    },
    {
      "id": 3,
      "category_id": 2,
      "name": "ชาไทยเย็น",
      "description": "ชาไทยใส่นม",
      "price": "45.00",
      "image_url": null,
      "is_available": 1,
      "deleted_at": null,
      "created_at": "2026-10-17 18:23:45",
      "category_name": "เครื่องดื่ม"
    },
    {
      "id": 4,
      "category_id": 3,
      "name": "ไอศกรีมกะทิ",
      "description": "ไอศกรีมกะทิพร้อมถั่วลิสง",
      "price": "50.00",
      "image_url": null,
      "is_available": 1,
      "deleted_at": null,
      "created_at": "2026-10-17 18:23:45",
      "category_name": "ของหวาน"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

## GET /api/categories

สิทธิ์: สาธารณะ

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 1,
      "name": "อาหารจานหลัก"
    },
    {
      "id": 2,
      "name": "เครื่องดื่ม"
    },
    {
      "id": 3,
      "name": "ของหวาน"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

## POST /api/auth/register

สิทธิ์: สาธารณะ

Request body:
```json
{
  "name": "Postman Customer",
  "email": "postman-{{run_id}}@example.com",
  "password": "PostmanTest123!"
}
```

Response 201:
```json
{
  "data": {
    "id": 34,
    "name": "Postman Customer",
    "email": "postman-17922375674966jwt@example.com",
    "role": "customer"
  }
}
```

## POST /api/auth/login

สิทธิ์: สาธารณะ

Request body:
```json
{
  "email": "postman-{{run_id}}@example.com",
  "password": "PostmanTest123!"
}
```

Response 200:
```json
{
  "token": "[REDACTED]",
  "token_type": "[REDACTED]",
  "user": {
    "id": 34,
    "name": "Postman Customer",
    "email": "postman-17922375674966jwt@example.com",
    "role": "customer",
    "created_at": "2026-10-17 18:46:08"
  }
}
```

## GET /api/me

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 200:
```json
{
  "data": {
    "id": 34,
    "name": "Postman Customer",
    "email": "postman-17922375674966jwt@example.com",
    "role": "customer"
  }
}
```

## GET /api/admin/orders

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 403:
```json
{
  "error": "Administrator access required"
}
```

## POST /api/menu

สิทธิ์: Admin

Request body:
```json
{
  "category_id": 1,
  "name": "Postman menu {{run_id}}",
  "price": 65,
  "description": "API test item",
  "is_available": true
}
```

Response 201:
```json
{
  "data": {
    "id": 13,
    "category_id": 1,
    "name": "Postman menu 17922375674966jwt",
    "description": "API test item",
    "price": 65,
    "image_url": null,
    "is_available": true
  }
}
```

## GET /api/menu/:id

สิทธิ์: สาธารณะ

Request body: ไม่มี

Response 200:
```json
{
  "data": {
    "id": 13,
    "category_id": 1,
    "name": "Postman menu 17922375674966jwt",
    "description": "API test item",
    "price": "65.00",
    "image_url": null,
    "is_available": 1,
    "deleted_at": null,
    "created_at": "2026-10-17 18:46:08"
  }
}
```

## PUT /api/menu/:id

สิทธิ์: Admin

Request body:
```json
{
  "category_id": 1,
  "name": "Postman menu {{run_id}}",
  "price": 70,
  "description": "API test item",
  "is_available": true
}
```

Response 200:
```json
{
  "data": {
    "id": 13,
    "category_id": 1,
    "name": "Postman menu 17922375674966jwt",
    "description": "API test item",
    "price": 70,
    "image_url": null,
    "is_available": true
  }
}
```

## GET /api/reservation-slots

สิทธิ์: สาธารณะ

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    "11:00",
    "12:30",
    "14:00",
    "17:00",
    "18:30",
    "20:00"
  ],
  "duration_minutes": 90,
  "timezone": "Asia/Bangkok"
}
```

## GET /api/tables/availability

สิทธิ์: สาธารณะ

Query: `date={{booking_date}}&slot=11:00&guests=2`

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 1,
      "table_number": "T01",
      "capacity": 2,
      "is_active": 1
    },
    {
      "id": 2,
      "table_number": "T02",
      "capacity": 2,
      "is_active": 1
    },
    {
      "id": 3,
      "table_number": "T03",
      "capacity": 4,
      "is_active": 1
    },
    {
      "id": 4,
      "table_number": "T04",
      "capacity": 4,
      "is_active": 1
    },
    {
      "id": 5,
      "table_number": "T05",
      "capacity": 6,
      "is_active": 1
    }
  ]
}
```

## POST /api/reservations

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body:
```json
{
  "table_id": "{{table_id}}",
  "date": "{{booking_date}}",
  "slot": "11:00",
  "guests": 2
}
```

Response 201:
```json
{
  "data": {
    "id": 19,
    "table_id": 1,
    "date": "2026-10-24",
    "slot": "11:00",
    "guests": 2,
    "note": "",
    "status": "confirmed"
  }
}
```

## GET /api/me/reservations

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 19,
      "user_id": 34,
      "table_id": 1,
      "reservation_date": "2026-10-24",
      "slot": "11:00",
      "guests": 2,
      "status": "confirmed",
      "note": "",
      "active_slot": 1,
      "created_at": "2026-10-17 18:46:09",
      "table_number": "T01"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

## POST /api/orders

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body:
```json
{
  "reservation_id": "{{reservation_id}}",
  "items": [
    {
      "menu_item_id": "{{menu_id}}",
      "quantity": 2
    }
  ]
}
```

Response 201:
```json
{
  "data": {
    "id": 13,
    "reservation_id": 19,
    "total": "140.00",
    "status": "pending",
    "items": [
      {
        "menu_item_id": 13,
        "quantity": 2,
        "menu_name": "Postman menu 17922375674966jwt",
        "unit_price": "70.00"
      }
    ]
  }
}
```

## GET /api/me/orders

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 13,
      "user_id": 34,
      "reservation_id": 19,
      "total": "140.00",
      "status": "pending",
      "note": "",
      "created_at": "2026-10-17 18:46:09"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

## GET /api/orders/:id

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 200:
```json
{
  "data": {
    "id": 13,
    "user_id": 34,
    "reservation_id": 19,
    "total": "140.00",
    "status": "pending",
    "note": "",
    "created_at": "2026-10-17 18:46:09",
    "items": [
      {
        "id": 13,
        "order_id": 13,
        "menu_item_id": 13,
        "menu_name": "Postman menu 17922375674966jwt",
        "quantity": 2,
        "unit_price": "70.00"
      }
    ]
  }
}
```

## PATCH /api/reservations/:id/cancel

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 409:
```json
{
  "error": "Cancel linked orders before cancelling the reservation"
}
```

## GET /api/admin/reservations

สิทธิ์: Admin

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 19,
      "user_id": 34,
      "table_id": 1,
      "reservation_date": "2026-10-24",
      "slot": "11:00",
      "guests": 2,
      "status": "confirmed",
      "note": "",
      "active_slot": 1,
      "created_at": "2026-10-17 18:46:09"
    },
    {
      "id": 17,
      "user_id": 33,
      "table_id": 10,
      "reservation_date": "2026-10-24",
      "slot": "12:30",
      "guests": 4,
      "status": "cancelled",
      "note": "",
      "active_slot": null,
      "created_at": "2026-10-17 18:42:09"
    },
    {
      "id": 15,
      "user_id": 33,
      "table_id": 1,
      "reservation_date": "2026-10-24",
      "slot": "11:00",
      "guests": 2,
      "status": "cancelled",
      "note": "",
      "active_slot": null,
      "created_at": "2026-10-17 18:42:06"
    },
    {
      "id": 4,
      "user_id": 8,
      "table_id": 1,
      "reservation_date": "2026-10-24",
      "slot": "11:00",
      "guests": 2,
      "status": "cancelled",
      "note": "",
      "active_slot": null,
      "created_at": "2026-10-17 18:27:13"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

## PATCH /api/admin/orders/:id/status

สิทธิ์: Admin

Request body:
```json
{
  "status": "confirmed"
}
```

Response 200:
```json
{
  "data": {
    "id": 13,
    "status": "confirmed"
  }
}
```

## PATCH /api/orders/:id/cancel

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 200:
```json
{
  "data": {
    "id": 14,
    "status": "cancelled"
  }
}
```

## DELETE /api/menu/:id

สิทธิ์: Admin

Request body: ไม่มี

Response 204:
ไม่มี body

## POST /api/categories

สิทธิ์: Admin

Request body:
```json
{
  "name": "Category {{run_id}}"
}
```

Response 201:
```json
{
  "data": {
    "id": 6,
    "name": "Category 17922375674966jwt"
  }
}
```

## GET /api/categories/:id

สิทธิ์: Admin

Request body: ไม่มี

Response 200:
```json
{
  "data": {
    "id": 6,
    "name": "Category 17922375674966jwt"
  }
}
```

## PUT /api/categories/:id

สิทธิ์: Admin

Request body:
```json
{
  "name": "Updated {{run_id}}"
}
```

Response 200:
```json
{
  "data": {
    "id": 6,
    "name": "Updated 17922375674966jwt"
  }
}
```

## DELETE /api/categories/:id

สิทธิ์: Admin

Request body: ไม่มี

Response 409:
```json
{
  "error": "Record is still referenced by menu items or history"
}
```

## POST /api/tables

สิทธิ์: Admin

Request body:
```json
{
  "table_number": "T{{run_id}}",
  "capacity": 4
}
```

Response 201:
```json
{
  "data": {
    "id": 11,
    "table_number": "T17922375674966jwt",
    "capacity": 4,
    "is_active": true
  }
}
```

## GET /api/tables

สิทธิ์: Admin

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 1,
      "table_number": "T01",
      "capacity": 2,
      "is_active": 1
    },
    {
      "id": 2,
      "table_number": "T02",
      "capacity": 2,
      "is_active": 1
    },
    {
      "id": 3,
      "table_number": "T03",
      "capacity": 4,
      "is_active": 1
    },
    {
      "id": 4,
      "table_number": "T04",
      "capacity": 4,
      "is_active": 1
    },
    {
      "id": 5,
      "table_number": "T05",
      "capacity": 6,
      "is_active": 1
    },
    {
      "id": 11,
      "table_number": "T17922375674966jwt",
      "capacity": 4,
      "is_active": 1
    }
  ],
  "limit": 50,
  "offset": 0
}
```

## PUT /api/tables/:id

สิทธิ์: Admin

Request body:
```json
{
  "table_number": "T{{run_id}}",
  "capacity": 6
}
```

Response 200:
```json
{
  "data": {
    "id": 11,
    "table_number": "T17922375674966jwt",
    "capacity": 6,
    "is_active": true
  }
}
```

## GET /api/reservations/my

สิทธิ์: สมาชิก / เจ้าของรายการ

Request body: ไม่มี

Response 200:
```json
{
  "data": [
    {
      "id": 21,
      "user_id": 34,
      "table_id": 11,
      "reservation_date": "2026-10-24",
      "slot": "12:30",
      "guests": 4,
      "status": "confirmed",
      "note": "",
      "active_slot": 1,
      "created_at": "2026-10-17 18:46:13",
      "table_number": "T17922375674966jwt"
    },
    {
      "id": 19,
      "user_id": 34,
      "table_id": 1,
      "reservation_date": "2026-10-24",
      "slot": "11:00",
      "guests": 2,
      "status": "cancelled",
      "note": "",
      "active_slot": null,
      "created_at": "2026-10-17 18:46:09",
      "table_number": "T01"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

## DELETE /api/tables/:id

สิทธิ์: Admin

Request body: ไม่มี

Response 409:
```json
{
  "error": "Cannot delete a table with active reservations"
}
```

## ข้อผิดพลาดและกติกา

รูปแบบ `{ "error": "ข้อความ" }`: 400 ข้อมูลผิด/หมวดหมู่ไม่มี/เกินความจุ; 401 token หาย ผิด หรือหมดอายุ; 403 สิทธิ์ไม่พอหรือ Origin ไม่อนุญาต; 404 ID ไม่พบ/ไม่ใช่เจ้าของ; 409 ข้อมูลซ้ำหรือสถานะขัดแย้ง; 413 body เกิน 100 KB; 429 auth เกิน 30 ครั้ง/15 นาที/IP; 503 MySQL ไม่พร้อม; 500 ภายใน โดยไม่ส่ง SQL หรือ stack trace

การจองใช้เวลา Asia/Bangkok รอบ 90 นาที: 11:00, 12:30, 14:00, 17:00, 18:30, 20:00 ภายใน 90 วันข้างหน้า การยกเลิกต้องเป็นเจ้าของและยังไม่เริ่ม และต้องยกเลิกออเดอร์ที่ผูกไว้ก่อน

DELETE เมนูเป็น soft delete; DELETE โต๊ะเป็น is_active=0 และห้ามเมื่อมี confirmed reservation ที่เวลาสิ้นสุดยังมาไม่ถึง; PUT โต๊ะห้ามปิดใช้งานหรือลด capacity จนรองรับการจองเดิมไม่ได้; DELETE หมวดหมู่ห้ามถ้ายังมีเมนูอ้างอิง รวมเมนู soft delete

สถานะออเดอร์ pending → confirmed → preparing → ready → completed; admin ยกเลิก pending/confirmed ได้ ลูกค้ายกเลิกเฉพาะ pending ระบบคำนวณยอดจากฐานข้อมูลเอง

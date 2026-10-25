# LottoArc — คู่มือการใช้งาน

**เว็บไซต์:** https://lottoarc.vercel.app  
**Network:** Arc Mainnet (Chain ID 5042)  
**Contract:** `0x049dB638171D12bFD5cC616C23D54a14482Bb0c0`

---

## LottoArc คืออะไร?

LottoArc คือระบบจับรางวัลบน blockchain Arc Mainnet ที่ใช้ USDC เป็นค่าเข้าร่วมและรางวัล  
ผู้ชนะได้รับเงินอัตโนมัติผ่าน smart contract โดยไม่มีคนกลาง

---

## วิธีเข้าร่วม (สำหรับผู้เล่น)

### ขั้นที่ 1 — เตรียม Wallet
- ติดตั้ง MetaMask บนเบราว์เซอร์หรือมือถือ
- เพิ่ม Arc Mainnet ใน MetaMask:
  - **Network name:** Arc Mainnet
  - **RPC URL:** `https://rpc.mainnet.arc.io`
  - **Chain ID:** `5042`
  - **Symbol:** USDC
  - **Explorer:** `https://explorer.arc.io`
- ต้องมี USDC บน Arc Mainnet ในกระเป๋า

### ขั้นที่ 2 — เชื่อมต่อ Wallet
- เปิด https://lottoarc.vercel.app
- กดปุ่ม **Connect Wallet** มุมขวาบน
- MetaMask จะขอให้อนุมัติ → กด Connect

### ขั้นที่ 3 — เลือก Pool และซื้อตั๋ว
- ดู Pool ที่เปิดอยู่ในหน้าหลัก
- ตรวจสอบ **ค่าตั๋ว**, **จำนวนที่นั่งคงเหลือ**, และ **เวลาที่เหลือ**
- กดปุ่ม **เข้าร่วม**
- MetaMask จะขออนุมัติ 2 ครั้ง:
  1. **Approve USDC** — อนุญาตให้ contract ดึง USDC
  2. **Enter Pool** — ยืนยันการเข้าร่วม
- รอ transaction confirm (~1-2 วินาทีบน Arc)

### ขั้นที่ 4 — รอผล
- เมื่อ owner จั่วรางวัล ระบบจะเลือกผู้ชนะโดยอัตโนมัติ
- ถ้าคุณชนะ — จะเห็นปุ่ม **Claim รางวัล** สีเขียวปรากฏขึ้น
- กด Claim เพื่อรับ USDC เข้ากระเป๋า

---

## ถ้าเวลาหมดแต่ Pool ยังไม่เต็ม — เกิดอะไรขึ้น?

นี่คือสถานการณ์สำคัญที่ผู้เล่นต้องทราบ:

### กรณี: Pool หมดเวลา มีคนลงทะเบียน 1 คนขึ้นไป แต่ไม่ครบจำนวน

**เงินจะไม่หาย** — contract มีระบบ Refund อัตโนมัติ:

| ขั้นตอน | ใครทำ | เงื่อนไข |
|---|---|---|
| 1. Pool deadline ผ่านไป | อัตโนมัติ | `block.timestamp > deadlineTimestamp` |
| 2. ใครก็ได้กด **"ยกเลิก Pool"** | ผู้เล่นคนใดก็ได้ / owner | Pool ต้องหมดเวลาแล้ว |
| 3. ระบบบันทึก Refund ให้ทุกคน | อัตโนมัติใน contract | — |
| 4. ผู้เล่นแต่ละคนกด **"Claim คืน"** | ผู้เล่น (แต่ละคนคนละครั้ง) | — |

### สิ่งที่ต้องรู้:
- **เงินไม่หายไปไหน** — อยู่ใน contract ตลอดจนกว่าจะ Claim
- **ไม่มีวันหมดอายุของ Refund** — Claim ได้ทุกเมื่อ
- **ไม่ต้องรอ owner** — ใครก็ได้เรียก `cancelStalePool` ได้หลัง deadline
- **ถ้า pool มีตั๋วเดียว** — ยังคืนเงินได้ เพราะ require `tickets.length >= 1`

### กรณีพิเศษ: Pool มีแค่ 1 คน
- ต้องรอ deadline ผ่านก่อน
- จากนั้น กด **"ยกเลิก Pool"** ได้เลย → รับเงินคืนเต็ม 100% ผ่าน Claim

### กรณี: ยกเลิก Pool ก่อนหมดเวลา (owner เท่านั้น)
- Owner สามารถยกเลิก Pool ที่ยังไม่ได้ Schedule Draw ได้ตลอดเวลา
- ผู้เล่นทุกคนได้รับเงินคืนเต็มจำนวน

---

## โครงสร้างค่าธรรมเนียม

สำหรับ Pool ที่มีผู้ชนะ (มีตั๋วอย่างน้อย 2 ใบและ draw สำเร็จ):

```
Pot ทั้งหมด = จำนวนตั๋ว × ราคาตั๋ว

House Fee (5%)         → Owner ของ contract
Winner Tax (1% ของรางวัล) → Treasury (สะสมใน contract)
ผู้ชนะได้รับ (~94.05%)   → ผู้เล่นที่ถูกเลือก
```

**ตัวอย่าง Pool 10 คน × 1 USDC:**
- Pot = 10 USDC
- House Fee = 0.50 USDC
- Winner Tax = 0.095 USDC
- ผู้ชนะได้ = **9.405 USDC**

**ถ้า Pool ถูกยกเลิก (ไม่ว่ากรณีใด):**
- ผู้เล่นทุกคนได้เงินคืน **100% เต็ม** ไม่มีหัก

---

## วงจรชีวิตของ Pool

```
[Open] → ผู้เล่นซื้อตั๋ว
   ↓
[Open, เต็ม / หรือ owner ตัดสินใจ]
   ↓
Owner เรียก scheduleDraw()
   ↓
[DrawScheduled] → รอ 3 block (~1.5 วินาที)
   ↓
ใครก็ได้เรียก executeDraw()
   ↓
[Closed] → ผู้ชนะและ owner Claim USDC ได้

--- เส้นทางยกเลิก ---
[Open] + หมดเวลา          → cancelStalePool() → [Cancelled]
[Open] + owner ต้องการ     → cancelPool()       → [Cancelled]
[DrawScheduled] + 256 block ผ่าน → cancelExpiredDraw() → [Cancelled]
ทุก Cancelled → ผู้เล่น Claim คืนได้
```

---

## คำถามที่พบบ่อย

**Q: ฉันต้องมี ETH ไหม?**  
A: ไม่ต้อง — Arc Mainnet ใช้ USDC เป็น gas โดยตรง มีแค่ USDC ก็พอ

**Q: ถ้าชนะแต่ไม่ Claim ทันทีเป็นไร?**  
A: ไม่เป็นไร — เงินอยู่ใน contract ตลอด Claim ได้ทุกเมื่อ ไม่มีวันหมดอายุ

**Q: ซื้อตั๋วหลายใบใน Pool เดียวกันได้ไหม?**  
A: ได้ — ยิ่งถือตั๋วมาก โอกาสชนะยิ่งสูง (สัดส่วนตรงตามจำนวนตั๋ว)

**Q: ระบบเลือกผู้ชนะยังไง?**  
A: ใช้ blockhash ของ block ในอนาคต (future-block entropy) — เลือก block ล่วงหน้า 3 block แล้วใช้ hash ของ block นั้นเป็น seed การสุ่ม ไม่มีใครรู้ผลล่วงหน้าได้

**Q: ถ้า Pool มีคนสมัครแค่คนเดียวจะเกิดอะไร?**  
A: Pool นั้น draw ไม่ได้ (ต้องมีอย่างน้อย 2 ตั๋ว) เมื่อหมดเวลาใครก็ได้ยกเลิกและ Claim เงินคืน

**Q: เงินใน contract ปลอดภัยไหม?**  
A: Contract ผ่านการ audit 5 รอบ ไม่มี admin key ที่สามารถดึงเงินออกได้โดยพลการ ทุก action มี event บน blockchain ตรวจสอบได้

---

## ตรวจสอบ Transaction

ทุก transaction ดูได้ที่ Arc Explorer:  
**https://explorer.arc.io/address/0x049dB638171D12bFD5cC616C23D54a14482Bb0c0**

---

*LottoArc · Built on Arc Mainnet · Smart contract at `0x049dB638171D12bFD5cC616C23D54a14482Bb0c0`*

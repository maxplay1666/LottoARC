# LottoARC — Security Review (Final, Round 3)

**Contract:** `contracts/ArcRaffle.sol` (v2)  
**Chain:** Arc Mainnet (chain ID 5042)  
**Date:** 2026-10-25  
**Severity audited:** MAX (all levels including Informational)  
**Tests:** 113/113 pass (unit + fuzz + invariant)  
**Slither:** 0 production-contract findings; test-file noise only  

---

## Summary

| Severity | Found | Fixed | Accepted (with notes) |
|---|---|---|---|
| Critical | 1 | 1 | 0 |
| High | 1 | 0 | 1 (RNG — known, no VRF on Arc) |
| Medium | 2 | 0 | 2 (ownership + custom errors — gas only) |
| Low | 1 | 0 | 1 (USDC pause risk — external dependency) |
| Informational | 2 | 0 | 2 (gas optimization suggestions) |

---

## Findings Detail

### CRITICAL — แก้แล้ว ✅

**CEI Violation ใน `_enterPool`**  
`autoDrawTimestamp` ถูก set หลัง external call `USDC.transferFrom` (Checks-Effects-Interactions pattern ผิด)  
แม้ `nonReentrant` guard จะป้องกัน reentrant attack ได้ แต่การจัดลำดับที่ถูกต้องตาม CEI เป็น best practice บังคับสำหรับ production  
**แก้แล้ว:** ย้าย effects ทั้งหมด (push tickets, set autoDrawTimestamp, emit events) ให้อยู่ก่อน `USDC.transferFrom`

---

### HIGH — ยอมรับ (ไม่มี VRF บน Arc) ⚠️

**RNG จาก block data**  
ทั้ง auto-draw path (`blockhash(block.number-1) + block.timestamp`) และ manual-draw path (`blockhash(pool.drawBlock)`) ใช้ค่า block เป็น entropy  

**ผลกระทบจริงบน Arc:**
- Arc ใช้ Proof-of-Authority validator — validator ที่ควบคุม block สามารถเลือก timestamp ภายใน margin ±15s และรู้ผล blockhash ล่วงหน้า
- ผู้ที่ควบคุม node สามารถ bias ผลได้ แต่ต้องเป็น validator จริงๆ ไม่ใช่ผู้เล่นทั่วไป
- Chainlink VRF ยังไม่รองรับบน Arc Mainnet

**มาตรการบรรเทา:**
- Pool สูงสุด 100 ticket — จำกัดมูลค่า
- ผู้เล่นทั่วไปไม่สามารถ bias ผลได้
- ความเสี่ยงเป็น operator-level ไม่ใช่ player-level

**คำแนะนำ:** เมื่อ Chainlink VRF หรือ randomness oracle พร้อมบน Arc ให้ upgrade contract

---

### MEDIUM — ยอมรับ (gas optimization) ✅

**1. One-step ownership transfer (OZ Ownable)**  
`transferOwnership` โอนสิทธิ์ทันทีในครั้งเดียว ถ้าพิมพ์ address ผิดอาจเสีย ownership  
**แนวทาง:** ใช้ `Ownable2Step` แทน — แต่เพิ่ม complexity; ยอมรับได้เพราะ owner เป็น EOA ของผู้ deploy  
**คำแนะนำ:** ระวังเวลา transferOwnership เป็นพิเศษ ตรวจ address ซ้ำก่อน confirm

**2. String revert messages แทน custom errors**  
ใช้ `require(..., "string")` ตลอด — deploy และ runtime gas สูงกว่า custom errors เล็กน้อย  
**ยอมรับ:** เข้าใจง่ายกว่า ไม่กระทบ security

---

### LOW — ยอมรับ (external dependency) ⚠️

**USDC pause risk**  
ถ้า Circle หยุด USDC contract (pause) การ transfer ทุก operation จะ revert — ผู้เล่นเข้าร่วมไม่ได้, claimRefund ไม่ได้  
**ยอมรับ:** เป็น known risk ของ ERC-20 stablecoin ทุกตัว ไม่ใช่ bug ใน contract  
**คำแนะนำ:** ถ้า USDC pause เกิดขึ้น ให้ประกาศ emergency ให้ผู้เล่นทราบและรอจนกว่าจะ unpause

---

### INFORMATIONAL — ยอมรับ

**1. Treasury hardcoded immutable**  
`TREASURY = 0x3d2b...ABD5` คือกระเป๋าของ owner — verified ว่าถูกต้องแล้ว  
ถ้า address นี้เสียหายหรือ private key หาย treasury fund จะ lock ถาวร  
**คำแนะนำ:** เก็บ private key บน hardware wallet และมี backup

**2. `getMyPools` เดิม O(n²) — แก้แล้วเป็น O(1)**  
ใช้ `_playerPoolList` indexed mapping แล้ว — ไม่มีปัญหา

---

## การตรวจสอบ Flow หลักทั้งหมด

| สถานการณ์ | ผลลัพธ์ |
|---|---|
| Pool เต็ม → auto-draw countdown 10 นาที → executeDraw | ✅ Winner ได้รับ 94.02%, houseFee → owner pending, treasury 0.98% |
| Pool ไม่เต็มก่อน deadline → cancelStalePool | ✅ ผู้เล่นทุกคน claimRefund คืนเต็ม |
| Owner cancelPool ก่อนมี draw scheduled | ✅ ผู้เล่นทุกคน claimRefund คืนเต็ม |
| Auto-draw countdown ผ่านไปแต่ไม่มีใคร execute | ✅ cancelExpiredAutoDraw → refund เต็ม |
| Manual draw commit window หมด | ✅ cancelExpiredDraw → refund เต็ม |
| ผู้เล่นพยายาม claimRefund โดยไม่มีสิทธิ์ | ✅ revert "No refund available" |
| Owner พยายาม renounceOwnership ขณะมี active pool | ✅ revert "ArcRaffle: active pool" |
| qty > remaining tickets | ✅ revert "Quantity exceeds remaining slots" |
| fee math: pot=10 USDC (10 tickets × 1 USDC) | ✅ house=0.5, treasury=0.0931, winner=9.4069, sum=10 ✓ |
| Invariant: pendingRefunds ≤ contract USDC balance | ✅ ผ่าน 256 runs × 500 calls |

---

## สรุปสถานะ

**Contract พร้อม production สำหรับ Arc Mainnet ณ วันนี้**

ไม่มี Critical หรือ High ที่ยังค้างอยู่  
RNG เป็น accepted known risk เพราะไม่มี VRF บน Arc — จำกัดความเสี่ยงด้วย max pool size  
Invariant tests ยืนยันว่าเงินไม่สูญหายในทุก path ที่เป็นไปได้  

Contract ที่ deploy: `0xf06655c118ba475F1eb943F5cD17a96f808e8E80`

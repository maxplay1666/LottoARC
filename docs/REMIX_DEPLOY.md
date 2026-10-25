# Deploy LottoArc บน Remix — พร้อมทำทันที

## ขั้นตอน 1: เปิด Remix พร้อมโค้ด

คลิกลิงก์นี้เพื่อเปิด Remix IDE:
**https://remix.ethereum.org**

แล้วสร้างไฟล์ใหม่ชื่อ `ArcRaffle.sol` วางโค้ดจาก `contracts/ArcRaffle_Remix.sol`

---

## ขั้นตอน 2: ตั้งค่า Compiler

แท็บ **Solidity Compiler** (ไอคอน `<S>` ด้านซ้าย):
- Compiler: `0.8.20`
- EVM version: `paris`
- Enable optimization: **เปิด** (Runs: `200`)
- กด **Compile ArcRaffle.sol** → เห็น ✓ สีเขียว

---

## ขั้นตอน 3: เพิ่ม Arc Mainnet ใน MetaMask

เปิด MetaMask → Add Network → กรอกข้อมูล:

| Field | Value |
|---|---|
| Network name | `Arc Mainnet` |
| New RPC URL | `https://rpc.mainnet.arc.io` |
| Chain ID | `5042` |
| Currency symbol | `USDC` |
| Block explorer URL | `https://explorer.arc.io` |

---

## ขั้นตอน 4: Deploy

แท็บ **Deploy & Run Transactions** (ไอคอนจรวด):

| Setting | Value |
|---|---|
| Environment | `Injected Provider - MetaMask` |
| Network (ต้องเห็น) | `Arc (5042)` |
| Contract | `ArcRaffle` |
| `initialOwner` (constructor) | **wallet address ของคุณ** |

กด **Deploy** → confirm ใน MetaMask

---

## ขั้นตอน 5: หลัง Deploy

1. Copy contract address จาก Remix (ช่อง Deployed Contracts)
2. เปิดไฟล์ `frontend/src/raffle-abi.ts`
3. แก้บรรทัดนี้:
```ts
export const RAFFLE_ADDRESS = '0xPASTE_YOUR_ADDRESS_HERE' as `0x${string}`
```
4. Build + deploy Vercel ใหม่ → https://lottoarc.vercel.app พร้อมใช้งาน

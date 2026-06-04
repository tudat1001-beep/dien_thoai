/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Load Supabase environment configurations safely to avoid startup crashes if left blank.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project-url.supabase.co',
  supabaseAnonKey || 'placeholder-anonymous-key'
);

/**
 * --- SUPABASE SQL SCHEMA DRAFT ---
 * Place this setup script into your Supabase > SQL Editor and execute it to create standard tables:
 * 
 * -- 1. Khach Hang Table
 * create table if not exists khach_hang (
 *   id text primary key,
 *   ten text not null,
 *   sdt text not null,
 *   dia_chi text default '',
 *   mst text default '',
 *   ghi_chu text default '',
 *   ngay_tao text default ''
 * );
 * 
 * -- 2. San Pham Table
 * create table if not exists san_pham (
 *   id text primary key,
 *   ten text not null,
 *   imei text default '',
 *   gia_nhap numeric default 0,
 *   gia_ban numeric default 0,
 *   ton_kho numeric default 0,
 *   trang_thai text default 'Còn hàng'
 * );
 * 
 * -- 3. Hoa Don Table
 * create table if not exists hoa_don (
 *   id text primary key,
 *   khach_hang_id text not null,
 *   ngay text not null,
 *   tong_tien numeric default 0,
 *   giam_gia numeric default 0,
 *   thanh_tien numeric default 0,
 *   da_thanh_toan numeric default 0,
 *   con_no numeric default 0,
 *   ghi_chu text default ''
 * );
 * 
 * -- 4. Chi Tiet Hoa Don Table
 * create table if not exists chi_tiet_hoa_don (
 *   id text primary key,
 *   hoa_don_id text not null,
 *   san_pham_id text not null,
 *   ten_san_pham text default '',
 *   imei text default '',
 *   so_luong numeric default 1,
 *   don_gia numeric default 0,
 *   thanh_tien numeric default 0
 * );
 * 
 * -- 5. Cong No Table
 * create table if not exists cong_no (
 *   id text primary key,
 *   khach_hang_id text not null,
 *   ngay text not null,
 *   loai text not null, -- 'Ghi nợ' | 'Thanh toán' | 'Giảm trừ do trả hàng'
 *   so_tien numeric default 0,
 *   hoa_don_id text default '',
 *   ghi_chu text default ''
 * );
 * 
 * -- 6. Gia Khach Hang Table
 * create table if not exists gia_khach_hang (
 *   id text primary key,
 *   khach_hang_id text not null,
 *   san_pham_id text not null,
 *   gia_rieng numeric default 0
 * );
 * 
 * -- 7. Lich Su Gia Table
 * create table if not exists lich_su_gia (
 *   id text primary key,
 *   san_pham_id text not null,
 *   ngay_thay_doi text not null,
 *   gia_cu numeric default 0,
 *   gia_moi numeric default 0
 * );
 * 
 * -- 8. Tra Hang Table
 * create table if not exists tra_hang (
 *   id text primary key,
 *   hoa_don_id text not null,
 *   san_pham_id text not null,
 *   so_luong numeric default 1,
 *   imei text default '',
 *   ngay_tra text not null,
 *   so_tien_hoan_trat numeric default 0,
 *   ly_do text default '',
 *   phuong_thuc text default 'Trừ vào công nợ'
 * );
 * 
 * ---- ENABLE ROW LEVEL SECURITY SAFEGUARDS ----
 * alter table khach_hang enable row level security;
 * alter table san_pham enable row level security;
 * alter table hoa_don enable row level security;
 * alter table chi_tiet_hoa_don enable row level security;
 * alter table cong_no enable row level security;
 * alter table gia_khach_hang enable row level security;
 * alter table lich_su_gia enable row level security;
 * alter table tra_hang enable row level security;
 * 
 * ---- ATTACH ANONYMOUS ALOWED ACCESS FOR QUICK INTEGRATION ----
 * create policy "Permit all traffic anon" on khach_hang for all using (true) with check (true);
 * create policy "Permit all traffic anon" on san_pham for all using (true) with check (true);
 * create policy "Permit all traffic anon" on hoa_don for all using (true) with check (true);
 * create policy "Permit all traffic anon" on chi_tiet_hoa_don for all using (true) with check (true);
 * create policy "Permit all traffic anon" on cong_no for all using (true) with check (true);
 * create policy "Permit all traffic anon" on gia_khach_hang for all using (true) with check (true);
 * create policy "Permit all traffic anon" on lich_su_gia for all using (true) with check (true);
 * create policy "Permit all traffic anon" on tra_hang for all using (true) with check (true);
 */

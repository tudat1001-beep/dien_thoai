import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  KhachHang, 
  SanPham, 
  HoaDon, 
  ChiTietHoaDon, 
  CongNo, 
  GiaKhachHang, 
  LichSuGia, 
  TraHang 
} from '../types';

// ==========================================
// MAPPING UTILITIES (camelCase <=> snake_case)
// ==========================================

export function mapKhachHangToDb(kh: KhachHang) {
  return {
    id: kh.id,
    ten: kh.ten,
    sdt: kh.sdt,
    dia_chi: kh.diaChi || '',
    mst: kh.mst || '',
    ghi_chu: kh.ghiChu || '',
    ngay_tao: kh.ngayTao || ''
  };
}

export function mapKhachHangFromDb(row: any): KhachHang {
  return {
    id: row.id,
    ten: row.ten,
    sdt: row.sdt,
    diaChi: row.dia_chi || '',
    mst: row.mst || '',
    ghiChu: row.ghi_chu || '',
    ngayTao: row.ngay_tao || ''
  };
}

export function mapSanPhamToDb(sp: SanPham) {
  return {
    id: sp.id,
    ten: sp.ten,
    imei: sp.imei || '',
    gia_nhap: sp.giaNhap,
    gia_ban: sp.giaBan,
    ton_kho: sp.tonKho,
    trang_thai: sp.trangThai,
    loai: sp.loai || 'Điện thoại'
  };
}

export function mapSanPhamFromDb(row: any): SanPham {
  return {
    id: row.id,
    ten: row.ten,
    imei: row.imei || '',
    giaNhap: Number(row.gia_nhap || 0),
    giaBan: Number(row.gia_ban || 0),
    tonKho: Number(row.ton_kho || 0),
    trangThai: (row.trang_thai || 'Còn hàng') as 'Còn hàng' | 'Hết hàng',
    loai: (row.loai || 'Điện thoại') as 'Điện thoại' | 'Linh phụ kiện'
  };
}

export function mapHoaDonToDb(hd: HoaDon) {
  return {
    id: hd.id,
    khach_hang_id: hd.khachHangId,
    ngay: hd.ngay,
    tong_tien: hd.tongTien,
    giam_gia: hd.giamGia,
    thanh_tien: hd.thanhTien,
    da_thanh_toan: hd.daThanhToan,
    con_no: hd.conNo,
    ghi_chu: hd.ghiChu || ''
  };
}

export function mapHoaDonFromDb(row: any): HoaDon {
  return {
    id: row.id,
    khachHangId: row.khach_hang_id,
    ngay: row.ngay,
    tongTien: Number(row.tong_tien || 0),
    giamGia: Number(row.giam_gia || 0),
    thanhTien: Number(row.thanh_tien || 0),
    daThanhToan: Number(row.da_thanh_toan || 0),
    conNo: Number(row.con_no || 0),
    ghiChu: row.ghi_chu || ''
  };
}

export function mapChiTietHoaDonToDb(ct: ChiTietHoaDon) {
  return {
    id: ct.id,
    hoa_don_id: ct.hoaDonId,
    san_pham_id: ct.sanPhamId,
    ten_san_pham: ct.tenSanPham || '',
    imei: ct.imei || '',
    so_luong: ct.soLuong,
    don_gia: ct.donGia,
    thanh_tien: ct.thanhTien
  };
}

export function mapChiTietHoaDonFromDb(row: any): ChiTietHoaDon {
  return {
    id: row.id,
    hoaDonId: row.hoa_don_id,
    sanPhamId: row.san_pham_id,
    tenSanPham: row.ten_san_pham || '',
    imei: row.imei || '',
    soLuong: Number(row.so_luong || 1),
    donGia: Number(row.don_gia || 0),
    thanhTien: Number(row.thanh_tien || 0)
  };
}

export function mapCongNoToDb(cn: CongNo) {
  return {
    id: cn.id,
    khach_hang_id: cn.khachHangId,
    ngay: cn.ngay,
    loai: cn.loai,
    so_tien: cn.soTien,
    hoa_don_id: cn.hoaDonId || '',
    ghi_chu: cn.ghiChu || ''
  };
}

export function mapCongNoFromDb(row: any): CongNo {
  return {
    id: row.id,
    khachHangId: row.khach_hang_id,
    ngay: row.ngay,
    loai: row.loai as 'Ghi nợ' | 'Thanh toán' | 'Giảm trừ do trả hàng',
    soTien: Number(row.so_tien || 0),
    hoaDonId: row.hoa_don_id || '',
    ghiChu: row.ghi_chu || ''
  };
}

export function mapGiaKhachHangToDb(gkh: GiaKhachHang) {
  return {
    id: gkh.id,
    khach_hang_id: gkh.khachHangId,
    san_pham_id: gkh.sanPhamId,
    gia_rieng: gkh.giaRieng
  };
}

export function mapGiaKhachHangFromDb(row: any): GiaKhachHang {
  return {
    id: row.id,
    khachHangId: row.khach_hang_id,
    sanPhamId: row.san_pham_id,
    giaRieng: Number(row.gia_rieng || 0)
  };
}

export function mapLichSuGiaToDb(lsg: LichSuGia) {
  return {
    id: lsg.id,
    san_pham_id: lsg.sanPhamId,
    ngay_thay_doi: lsg.ngayThayDoi,
    gia_cu: lsg.giaCu,
    gia_moi: lsg.giaMoi
  };
}

export function mapLichSuGiaFromDb(row: any): LichSuGia {
  return {
    id: row.id,
    sanPhamId: row.san_pham_id,
    ngayThayDoi: row.ngay_thay_doi,
    giaCu: Number(row.gia_cu || 0),
    giaMoi: Number(row.gia_moi || 0)
  };
}

export function mapTraHangToDb(th: TraHang) {
  return {
    id: th.id,
    hoa_don_id: th.hoaDonId,
    san_pham_id: th.sanPhamId,
    so_luong: th.soLuong,
    imei: th.imei || '',
    ngay_tra: th.ngayTra,
    so_tien_hoan_trat: th.soTienHoanTrat,
    ly_do: th.lyDo || '',
    phuong_thuc: th.phuongThuc
  };
}

export function mapTraHangFromDb(row: any): TraHang {
  return {
    id: row.id,
    hoaDonId: row.hoa_don_id,
    sanPhamId: row.san_pham_id,
    soLuong: Number(row.so_luong || 1),
    imei: row.imei || '',
    ngayTra: row.ngay_tra,
    soTienHoanTrat: Number(row.so_tien_hoan_trat || 0),
    lyDo: row.ly_do || '',
    phuongThuc: (row.phuong_thuc || 'Trừ vào công nợ') as 'Trừ vào công nợ' | 'Hoàn tiền mặt'
  };
}

// ==========================================
// SEEDING UTILITIES
// ==========================================

export async function seedSupabaseIfNeeded(
  initialKh: KhachHang[],
  initialSp: SanPham[],
  initialHd: HoaDon[],
  initialCthd: ChiTietHoaDon[],
  initialCn: CongNo[],
  initialGkh: GiaKhachHang[],
  initialLsg: LichSuGia[],
  initialTh: TraHang[]
) {
  if (!isSupabaseConfigured) return;

  try {
    // Check if khach_hang has data
    const { data, error } = await supabase.from('khach_hang').select('id').limit(1);
    if (error) {
      console.warn('Cannot query khach_hang for seeding. Tables may not exist in your Supabase SQL yet:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Supabase already has data. Seeding task bypassed.');
      return;
    }

    console.log('Supabase tables are blank. Initializing seeds database values bulk upscale...');

    // Seed Khach Hang
    const khRows = initialKh.map(mapKhachHangToDb);
    await supabase.from('khach_hang').upsert(khRows);

    // Seed San Pham
    const spRows = initialSp.map(mapSanPhamToDb);
    await supabase.from('san_pham').upsert(spRows);

    // Seed Hoa Don
    const hdRows = initialHd.map(mapHoaDonToDb);
    await supabase.from('hoa_don').upsert(hdRows);

    // Seed Chi Tiet
    const cthdRows = initialCthd.map(mapChiTietHoaDonToDb);
    await supabase.from('chi_tiet_hoa_don').upsert(cthdRows);

    // Seed Cong No
    const cnRows = initialCn.map(mapCongNoToDb);
    await supabase.from('cong_no').upsert(cnRows);

    // Seed Gia Rieng
    const gkhRows = initialGkh.map(mapGiaKhachHangToDb);
    await supabase.from('gia_khach_hang').upsert(gkhRows);

    // Seed Lich Su Gia
    const lsgRows = initialLsg.map(mapLichSuGiaToDb);
    await supabase.from('lich_su_gia').upsert(lsgRows);

    // Seed Tra Hang
    const thRows = initialTh.map(mapTraHangToDb);
    await supabase.from('tra_hang').upsert(thRows);

    console.log('Supabase base catalog seeded successfully!');
  } catch (error: any) {
    console.error('Failed to seed Supabase database automatically:', error.message || error);
  }
}

// ==========================================
// DATA FETCHERS
// ==========================================

export async function sFetchKhachHang(): Promise<KhachHang[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('khach_hang').select('*');
  if (error) throw new Error(`Fetch Khach Hang failed: ${error.message}`);
  return (data || []).map(mapKhachHangFromDb);
}

export async function sFetchSanPham(): Promise<SanPham[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('san_pham').select('*');
  if (error) throw new Error(`Fetch San Pham failed: ${error.message}`);
  return (data || []).map(mapSanPhamFromDb);
}

export async function sFetchHoaDon(): Promise<HoaDon[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('hoa_don').select('*');
  if (error) throw new Error(`Fetch Hoa Don failed: ${error.message}`);
  return (data || []).map(mapHoaDonFromDb);
}

export async function sFetchChiTietHoaDon(): Promise<ChiTietHoaDon[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('chi_tiet_hoa_don').select('*');
  if (error) throw new Error(`Fetch Chi Tiet Hoa Don failed: ${error.message}`);
  return (data || []).map(mapChiTietHoaDonFromDb);
}

export async function sFetchCongNo(): Promise<CongNo[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('cong_no').select('*');
  if (error) throw new Error(`Fetch Cong No failed: ${error.message}`);
  return (data || []).map(mapCongNoFromDb);
}

export async function sFetchGiaKhachHang(): Promise<GiaKhachHang[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('gia_khach_hang').select('*');
  if (error) throw new Error(`Fetch Gia Khach Hang failed: ${error.message}`);
  return (data || []).map(mapGiaKhachHangFromDb);
}

export async function sFetchLichSuGia(): Promise<LichSuGia[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('lich_su_gia').select('*');
  if (error) throw new Error(`Fetch Lich Su Gia failed: ${error.message}`);
  return (data || []).map(mapLichSuGiaFromDb);
}

export async function sFetchTraHang(): Promise<TraHang[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('tra_hang').select('*');
  if (error) throw new Error(`Fetch Tra Hang failed: ${error.message}`);
  return (data || []).map(mapTraHangFromDb);
}

// ==========================================
// DATA MUTATIONS
// ==========================================

export async function sUpsertKhachHang(kh: KhachHang): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('khach_hang').upsert(mapKhachHangToDb(kh));
  if (error) throw new Error(`Save Khach Hang error: ${error.message}`);
}

export async function sUpsertSanPham(sp: SanPham): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('san_pham').upsert(mapSanPhamToDb(sp));
  if (error) throw new Error(`Save San Pham error: ${error.message}`);
}

export async function sUpsertHoaDonAndDetails(
  hd: HoaDon, 
  details: ChiTietHoaDon[], 
  affectedProducts: SanPham[],
  optionalDebt?: CongNo
): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Insert Invoice
  const { error: hdError } = await supabase.from('hoa_don').upsert(mapHoaDonToDb(hd));
  if (hdError) throw new Error(`Save Invoice error: ${hdError.message}`);

  // Insert Details
  if (details.length > 0) {
    const detailRows = details.map(mapChiTietHoaDonToDb);
    const { error: dtError } = await supabase.from('chi_tiet_hoa_don').upsert(detailRows);
    if (dtError) throw new Error(`Save Invoice Details error: ${dtError.message}`);
  }

  // Update Inventory
  if (affectedProducts.length > 0) {
    const spRows = affectedProducts.map(mapSanPhamToDb);
    const { error: spError } = await supabase.from('san_pham').upsert(spRows);
    if (spError) throw new Error(`Update Product Inventory error: ${spError.message}`);
  }

  // Optional Debt Record
  if (optionalDebt) {
    const { error: cnError } = await supabase.from('cong_no').upsert(mapCongNoToDb(optionalDebt));
    if (cnError) throw new Error(`Trigger automated Debt Entry error: ${cnError.message}`);
  }
}

export async function sUpsertCongNo(cn: CongNo): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('cong_no').upsert(mapCongNoToDb(cn));
  if (error) throw new Error(`Save Cong No error: ${error.message}`);
}

export async function sUpdateHoaDonAfterPayment(
  updatedInvoice: HoaDon
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('hoa_don').upsert(mapHoaDonToDb(updatedInvoice));
  if (error) throw new Error(`Update HoaDon after payment error: ${error.message}`);
}

export async function sUpsertTraHangAndInventory(
  th: TraHang, 
  affectedProduct: SanPham, 
  optionalDebt?: CongNo
): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Save return document
  const { error: thError } = await supabase.from('tra_hang').upsert(mapTraHangToDb(th));
  if (thError) throw new Error(`Save Return Slip error: ${thError.message}`);

  // Update product inventory & IMEI index
  const { error: spError } = await supabase.from('san_pham').upsert(mapSanPhamToDb(affectedProduct));
  if (spError) throw new Error(`Restock Product Inventory error: ${spError.message}`);

  // Save Debt adjustment
  if (optionalDebt) {
    const { error: cnError } = await supabase.from('cong_no').upsert(mapCongNoToDb(optionalDebt));
    if (cnError) throw new Error(`Save Debt Offset error: ${cnError.message}`);
  }
}

export async function sUpsertGiaKhachHang(gkh: GiaKhachHang): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('gia_khach_hang').upsert(mapGiaKhachHangToDb(gkh));
  if (error) throw new Error(`Save Client Custom Price error: ${error.message}`);
}

export async function sDeleteGiaKhachHang(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('gia_khach_hang').delete().eq('id', id);
  if (error) throw new Error(`Delete Client Custom Price error: ${error.message}`);
}

export async function sUpsertLichSuGia(lsg: LichSuGia): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('lich_su_gia').upsert(mapLichSuGiaToDb(lsg));
  if (error) throw new Error(`Save Pricing Change Log error: ${error.message}`);
}

export async function sSyncAllLocalStorageToSupabase(
  khachHang: KhachHang[],
  sanPham: SanPham[],
  hoaDon: HoaDon[],
  chiTietHoaDon: ChiTietHoaDon[],
  congNo: CongNo[],
  giaKhachHang: GiaKhachHang[],
  lichSuGia: LichSuGia[],
  traHang: TraHang[]
): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase has not been configured in Secrets yet.');

  // Push all datasets sequentially to satisfy foreign key relationships
  if (khachHang.length > 0) {
    const { error } = await supabase.from('khach_hang').upsert(khachHang.map(mapKhachHangToDb));
    if (error) throw new Error(`Đồng bộ 'khach_hang' thất bại: ${error.message}`);
  }

  if (sanPham.length > 0) {
    const { error } = await supabase.from('san_pham').upsert(sanPham.map(mapSanPhamToDb));
    if (error) throw new Error(`Đồng bộ 'san_pham' thất bại: ${error.message}`);
  }

  if (hoaDon.length > 0) {
    const { error } = await supabase.from('hoa_don').upsert(hoaDon.map(mapHoaDonToDb));
    if (error) throw new Error(`Đồng bộ 'hoa_don' thất bại: ${error.message}`);
  }

  if (chiTietHoaDon.length > 0) {
    const { error } = await supabase.from('chi_tiet_hoa_don').upsert(chiTietHoaDon.map(mapChiTietHoaDonToDb));
    if (error) throw new Error(`Đồng bộ 'chi_tiet_hoa_don' thất bại: ${error.message}`);
  }

  if (congNo.length > 0) {
    const { error } = await supabase.from('cong_no').upsert(congNo.map(mapCongNoToDb));
    if (error) throw new Error(`Đồng bộ 'cong_no' thất bại: ${error.message}`);
  }

  if (giaKhachHang.length > 0) {
    const { error } = await supabase.from('gia_khach_hang').upsert(giaKhachHang.map(mapGiaKhachHangToDb));
    if (error) throw new Error(`Đồng bộ 'gia_khach_hang' thất bại: ${error.message}`);
  }

  if (lichSuGia.length > 0) {
    const { error } = await supabase.from('lich_su_gia').upsert(lichSuGia.map(mapLichSuGiaToDb));
    if (error) throw new Error(`Đồng bộ 'lich_su_gia' thất bại: ${error.message}`);
  }

  if (traHang.length > 0) {
    const { error } = await supabase.from('tra_hang').upsert(traHang.map(mapTraHangToDb));
    if (error) throw new Error(`Đồng bộ 'tra_hang' thất bại: ${error.message}`);
  }
}


export const SQL_SCHEMA_TEXT = `-- 1. BẢNG KHÁCH HÀNG
CREATE TABLE IF NOT EXISTS public.khach_hang (
    id TEXT PRIMARY KEY,
    ten TEXT NOT NULL,
    sdt TEXT NOT NULL,
    dia_chi TEXT DEFAULT '',
    mst TEXT DEFAULT '',
    ghi_chu TEXT DEFAULT '',
    ngay_tao TEXT
);

-- 2. BẢNG SẢN PHẨM
CREATE TABLE IF NOT EXISTS public.san_pham (
    id TEXT PRIMARY KEY,
    ten TEXT NOT NULL,
    imei TEXT DEFAULT '',
    gia_nhap NUMERIC NOT NULL DEFAULT 0,
    gia_ban NUMERIC NOT NULL DEFAULT 0,
    ton_kho NUMERIC NOT NULL DEFAULT 0,
    trang_thai TEXT NOT NULL DEFAULT 'Còn hàng',
    loai TEXT NOT NULL DEFAULT 'Điện thoại'
);

-- 3. BẢNG HÓA ĐƠN
CREATE TABLE IF NOT EXISTS public.hoa_don (
    id TEXT PRIMARY KEY,
    khach_hang_id TEXT REFERENCES public.khach_hang(id) ON DELETE CASCADE,
    ngay TEXT NOT NULL,
    tong_tien NUMERIC NOT NULL DEFAULT 0,
    giam_gia NUMERIC NOT NULL DEFAULT 0,
    thanh_tien NUMERIC NOT NULL DEFAULT 0,
    da_thanh_toan NUMERIC NOT NULL DEFAULT 0,
    con_no NUMERIC NOT NULL DEFAULT 0,
    ghi_chu TEXT DEFAULT ''
);

-- 4. BẢNG CHI TIẾT HÓA ĐƠN
CREATE TABLE IF NOT EXISTS public.chi_tiet_hoa_don (
    id TEXT PRIMARY KEY,
    hoa_don_id TEXT REFERENCES public.hoa_don(id) ON DELETE CASCADE,
    san_pham_id TEXT REFERENCES public.san_pham(id) ON DELETE CASCADE,
    ten_san_pham TEXT NOT NULL DEFAULT '',
    imei TEXT DEFAULT '',
    so_luong NUMERIC NOT NULL DEFAULT 1,
    don_gia NUMERIC NOT NULL DEFAULT 0,
    thanh_tien NUMERIC NOT NULL DEFAULT 0
);

-- 5. BẢNG CÔNG NỢ GỐI ĐẦU
CREATE TABLE IF NOT EXISTS public.cong_no (
    id TEXT PRIMARY KEY,
    khach_hang_id TEXT REFERENCES public.khach_hang(id) ON DELETE CASCADE,
    ngay TEXT NOT NULL,
    loai TEXT NOT NULL, -- 'Ghi nợ' | 'Thanh toán' | 'Giảm trừ do trả hàng'
    so_tien NUMERIC NOT NULL DEFAULT 0,
    hoa_don_id TEXT DEFAULT '',
    ghi_chu TEXT DEFAULT ''
);

-- 6. BẢNG GIÁ KHÁCH HÀNG RIÊNG
CREATE TABLE IF NOT EXISTS public.gia_khach_hang (
    id TEXT PRIMARY KEY,
    khach_hang_id TEXT REFERENCES public.khach_hang(id) ON DELETE CASCADE,
    san_pham_id TEXT REFERENCES public.san_pham(id) ON DELETE CASCADE,
    gia_rieng NUMERIC NOT NULL DEFAULT 0
);

-- 7. BẢNG LỊCH SỬ BIẾN ĐỘNG GIÁ
CREATE TABLE IF NOT EXISTS public.lich_su_gia (
    id TEXT PRIMARY KEY,
    san_pham_id TEXT REFERENCES public.san_pham(id) ON DELETE CASCADE,
    ngay_thay_doi TEXT NOT NULL,
    gia_cu NUMERIC NOT NULL DEFAULT 0,
    gia_moi NUMERIC NOT NULL DEFAULT 0
);

-- 8. BẢNG ĐỔI TRẢ HÀNG LỖI
CREATE TABLE IF NOT EXISTS public.tra_hang (
    id TEXT PRIMARY KEY,
    hoa_don_id TEXT REFERENCES public.hoa_don(id) ON DELETE CASCADE,
    san_pham_id TEXT REFERENCES public.san_pham(id) ON DELETE CASCADE,
    so_luong NUMERIC NOT NULL DEFAULT 1,
    imei TEXT DEFAULT '',
    ngay_tra TEXT NOT NULL,
    so_tien_hoan_trat NUMERIC NOT NULL DEFAULT 0,
    ly_do TEXT DEFAULT '',
    phuong_thuc TEXT NOT NULL DEFAULT 'Trừ vào công nợ'
);

-- BỎ CHẶN RLS ĐỂ ANON TRUY CẬP ĐẦY ĐỦ QUYỀN TRÊN CLIENT-SIDE (BYPASS RLS TRUY CẬP TRỰC TIẾP)
ALTER TABLE public.khach_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.san_pham ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoa_don ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chi_tiet_hoa_don ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cong_no ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gia_khach_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lich_su_gia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tra_hang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select" ON public.khach_hang FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.khach_hang FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.khach_hang FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.khach_hang FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON public.san_pham FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.san_pham FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.san_pham FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.san_pham FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON public.hoa_don FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.hoa_don FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.hoa_don FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.hoa_don FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON public.chi_tiet_hoa_don FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.chi_tiet_hoa_don FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.chi_tiet_hoa_don FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.chi_tiet_hoa_don FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON public.cong_no FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.cong_no FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.cong_no FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.cong_no FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON public.gia_khach_hang FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.gia_khach_hang FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.gia_khach_hang FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.gia_khach_hang FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON public.lich_su_gia FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.lich_su_gia FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.lich_su_gia FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.lich_su_gia FOR DELETE USING (true);

CREATE POLICY "Allow anon select" ON public.tra_hang FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.tra_hang FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.tra_hang FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.tra_hang FOR DELETE USING (true);`;

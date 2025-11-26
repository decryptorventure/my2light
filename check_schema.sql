-- BƯỚC 1: Kiểm tra kiểu dữ liệu của courts.id
-- Chạy lệnh này TRƯỚC để biết id là TEXT hay UUID
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'courts' 
ORDER BY ordinal_position;

-- Sau khi chạy, bạn sẽ thấy:
-- Nếu id là "text" → Chạy file fix_schema_v2.sql
-- Nếu id là "uuid" → Chạy file fix_schema_uuid.sql (tôi sẽ tạo ngay)

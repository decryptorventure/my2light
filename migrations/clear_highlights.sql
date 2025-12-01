-- Xóa tất cả dữ liệu trong bảng highlights
DELETE FROM highlights;

-- Nếu muốn xóa cả file trong storage (cần quyền admin hoặc chạy trong SQL Editor)
-- Lưu ý: Việc này chỉ xóa record trong bảng objects, file vật lý có thể vẫn còn tùy vào cấu hình S3/Storage
-- DELETE FROM storage.objects WHERE bucket_id = 'videos';

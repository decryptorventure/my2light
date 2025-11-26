#!/bin/bash

echo "🔍 Kiểm tra môi trường dev my2light..."
echo ""

# Kiểm tra Node.js
echo "✅ Checking Node.js..."
if ! command -v node &gt; /dev/null; then
    echo "❌ Node.js chưa được cài đặt!"
    exit 1
fi
NODE_VERSION=$(node --version)
echo "   Node.js: $NODE_VERSION"

# Kiểm tra npm
echo "✅ Checking npm..."
if ! command -v npm &gt; /dev/null; then
    echo "❌ npm chưa được cài đặt!"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo "   npm: $NPM_VERSION"

# Kiểm tra node_modules
echo "✅ Checking node_modules..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules chưa tồn tại. Chạy: npm install"
    exit 1
fi
echo "   node_modules: OK"

# Kiểm tra .env
echo "✅ Checking .env file..."
if [ ! -f ".env" ]; then
    echo "⚠️  File .env chưa tồn tại!"
    echo "   Tạo file .env từ .env.example"
    exit 1
fi

# Kiểm tra SUPABASE_URL
if grep -q "your_supabase_url_here" .env; then
    echo "⚠️  VITE_SUPABASE_URL chưa được cấu hình!"
    HAS_ERROR=1
elif grep -q "uthuigqlvjiscmdqvhxz" .env; then
    echo "   VITE_SUPABASE_URL: ✓ Configured"
else
    echo "⚠️  VITE_SUPABASE_URL có vẻ không đúng!"
    HAS_ERROR=1
fi

# Kiểm tra SUPABASE_ANON_KEY
if grep -q "your_supabase_anon_key_here" .env; then
    echo "⚠️  VITE_SUPABASE_ANON_KEY chưa được cấu hình!"
    echo ""
    echo "📝 Hướng dẫn lấy Supabase Anon Key:"
    echo "   1. Truy cập: https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/settings/api"
    echo "   2. Copy giá trị 'anon/public' key"
    echo "   3. Paste vào file .env"
    HAS_ERROR=1
else
    echo "   VITE_SUPABASE_ANON_KEY: ✓ Configured"
fi

echo ""
if [ "$HAS_ERROR" = "1" ]; then
    echo "⚠️  Vui lòng hoàn thành cấu hình .env trước khi chạy dev server!"
    echo ""
    echo "Sau khi cấu hình xong, chạy:"
    echo "   npm run dev"
    exit 1
fi

echo "✅ Môi trường dev đã sẵn sàng!"
echo ""
echo "Chạy development server:"
echo "   npm run dev"
echo ""

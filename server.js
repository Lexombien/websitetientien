import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Ưu tiên PORT từ env
const HOST = process.env.HOST || 'localhost'; // Ưu tiên HOST từ env, fallback localhost

// Nếu không có HOST trong env, ta sẽ cố gắng sử dụng request header để xác định host động trong các API upload
const USE_DYNAMIC_HOST = !process.env.HOST;


// Cấu hình CORS chi tiết hơn
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));

// Endpoint kiểm tra kết nối
app.get('/api/ping', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// ==================== AUTHENTICATION API ====================
// Credentials được lưu trong biến môi trường (không lộ ở frontend)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({
            success: true,
            message: 'Đăng nhập thành công!'
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Sai tài khoản hoặc mật khẩu!'
        });
    }
});

// Tạo folder uploads nếu chưa có (giống WordPress /wp-content/uploads)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database file (lưu products, categories, settings giống WordPress database)
const dbFile = path.join(__dirname, 'database.json');
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({
        products: [],
        categories: [],
        settings: {},
        categorySettings: {},
        media: {}, // Storage for image SEO metadata: { filename: { alt, title, description } }
        zaloNumber: ''
    }, null, 2));
}



// Serve static files từ folder uploads
app.use('/uploads', express.static(uploadsDir, {
    // Cache lâu dài (1 năm) để tối ưu tốc độ load ảnh
    // Vì tên file đã có suffix random nên ít khi bị trùng, nếu trùng thì tên file khác -> URL khác -> không lo cache cũ
    maxAge: '1y',
    etag: true,
    lastModified: true
}));

// ==================== DATABASE API ====================

// GET: Lấy toàn bộ database
app.get('/api/database', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Lưu toàn bộ database
app.post('/api/database', (req, res) => {
    try {
        const data = req.body;
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Đã lưu database thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== IMAGE UPLOAD API ====================


// Cấu hình Multer để lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique ngắn gọn: 6 số ngẫu nhiên theo yêu cầu
        const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        // Sanitize filename
        const safeName = nameWithoutExt.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        cb(null, safeName + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Max 5MB
    },
    fileFilter: (req, file, cb) => {
        // Chỉ cho phép upload ảnh
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép upload file ảnh (JPEG, PNG, GIF, WebP)!'));
        }
    }
});

// API: Upload single image
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file nào được upload!' });
        }

        // Trả về URL của ảnh
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.json({
            success: true,
            url: imageUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Upload multiple images (tối đa 5)
app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Không có file nào được upload!' });
        }

        // Trả về array URLs
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const host = req.get('host');
        const images = req.files.map(file => ({
            url: `${protocol}://${host}/uploads/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size
        }));

        res.json({
            success: true,
            images: images,
            count: images.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Delete image - Sử dụng cú pháp chuẩn để tránh lỗi server
app.delete('/api/upload/:filename', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.normalize(path.join(uploadsDir, filename));

        console.log(`\n--- YÊU CẦU XÓA FILE ---`);
        console.log(`- Filename nhận được: ${req.params.filename}`);
        console.log(`- Filename sau decode: ${filename}`);
        console.log(`- Folder uploads: ${uploadsDir}`);
        console.log(`- Đường dẫn file: ${filePath}`);

        // Bảo mật: Không cho phép xóa file ngoài folder uploads
        if (!filePath.startsWith(uploadsDir)) {
            console.error('🔥 Cảnh báo bảo mật: Cố gắng xóa file ngoài phạm vi cho phép!');
            return res.status(403).json({ error: 'Không có quyền truy cập file này!' });
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('✅ Kết quả: Đã xóa file thành công!');
            res.json({ success: true, message: 'Đã xóa ảnh thành công!' });
        } else {
            console.warn('⚠️ File không tồn tại (coi như đã xóa)!');
            // Trả về success để frontend không báo lỗi
            res.json({ success: true, message: 'Ảnh đã được xóa (hoặc không tồn tại)!' });
        }
    } catch (error) {
        console.error('🔥 Lỗi server khi xóa:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: List all uploaded images
app.get('/api/uploads', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const host = req.get('host');
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                filename: file,
                url: `${protocol}://${host}/uploads/${file}`,
                size: fs.statSync(path.join(uploadsDir, file)).size,
                uploadedAt: fs.statSync(path.join(uploadsDir, file)).mtime
            }));

        res.json({
            success: true,
            images: images,
            count: images.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Rename image file (for SEO optimization)
app.put('/api/rename-upload/:oldFilename', (req, res) => {
    try {
        const oldFilename = decodeURIComponent(req.params.oldFilename);
        const { newFilename } = req.body;

        if (!newFilename) {
            return res.status(400).json({ error: 'Tên file mới không được để trống!' });
        }

        console.log(`\n--- YÊU CẦU ĐỔI TÊN FILE ---`);
        console.log(`- Tên cũ: ${oldFilename}`);
        console.log(`- Tên mới được đề xuất: ${newFilename}`);

        // Create SEO-friendly filename
        const ext = path.extname(oldFilename);
        const randomId = Math.floor(100000 + Math.random() * 900000); // 6 chữ số ngẫu nhiên

        // Sanitize new filename: remove Vietnamese accents, special chars, convert to lowercase
        const slug = newFilename
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Handle đ separately
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

        const finalFilename = `${slug}-${randomId}${ext}`;
        console.log(`- Tên file cuối cùng (SEO): ${finalFilename}`);

        const oldPath = path.normalize(path.join(uploadsDir, oldFilename));
        const newPath = path.normalize(path.join(uploadsDir, finalFilename));

        // Security check
        if (!oldPath.startsWith(uploadsDir) || !newPath.startsWith(uploadsDir)) {
            console.error('🔥 Cảnh báo bảo mật: Cố gắng rename file ngoài phạm vi cho phép!');
            return res.status(403).json({ error: 'Không có quyền truy cập file này!' });
        }

        // Check if old file exists
        if (!fs.existsSync(oldPath)) {
            console.warn('❌ File cũ không tồn tại!');
            return res.status(404).json({ error: 'Không tìm thấy file cần đổi tên!' });
        }

        // Check if new filename already exists
        if (fs.existsSync(newPath)) {
            console.warn('❌ File mới đã tồn tại!');
            return res.status(409).json({ error: 'Tên file này đã tồn tại!' });
        }

        // Rename the file
        fs.renameSync(oldPath, newPath);
        console.log('✅ Đã đổi tên file thành công!');

        // Generate new URL
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const host = req.get('host');
        const newUrl = `${protocol}://${host}/uploads/${finalFilename}`;

        res.json({
            success: true,
            message: 'Đã đổi tên file thành công!',
            oldFilename: oldFilename,
            newFilename: finalFilename,
            newUrl: newUrl
        });
    } catch (error) {
        console.error('🔥 Lỗi khi đổi tên file:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server đang chạy!',
        uploadsFolder: uploadsDir
    });
});

// Start server
// Listen trên 0.0.0.0 để cho phép truy cập từ tất cả IPs trong mạng
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend server đang chạy tại:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - LAN:   http://${HOST}:${PORT}`);
    console.log(`📁 Ảnh được lưu trong: ${uploadsDir}`);
    console.log(`🌐 Upload API: http://${HOST}:${PORT}/api/upload`);
});

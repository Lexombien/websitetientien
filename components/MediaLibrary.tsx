import React, { useState, useEffect } from 'react';
import ImageLightbox from './ImageLightbox';

interface MediaImage {
    filename: string;
    url: string;
    size: number;
    uploadedAt: string;
}

interface ImageMetadata {
    alt?: string;
    title?: string;
    description?: string;
}

// Auto-detect backend URL based on environment
const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'  // Local development
    : '';  // Production: use same origin (Nginx proxy)

interface MediaLibraryProps {
    onMetadataChange?: (data: Record<string, ImageMetadata>) => void;
    onImageDelete?: (filename: string) => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ onMetadataChange, onImageDelete }) => {
    const [images, setImages] = useState<MediaImage[]>([]);
    const [mediaMetadata, setMediaMetadata] = useState<Record<string, ImageMetadata>>({});
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
    const [editingMetadata, setEditingMetadata] = useState<ImageMetadata>({});
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Lightbox for Media Library
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Load data from server
    const loadData = async () => {
        setLoading(true);
        try {
            // Load images list with cache buster
            const uploadsResponse = await fetch(`${BACKEND_URL}/api/uploads?t=${Date.now()}`);
            const uploadsResult = await uploadsResponse.json();

            // Load database (for metadata) with cache buster
            const dbResponse = await fetch(`${BACKEND_URL}/api/database?t=${Date.now()}`);
            const dbResult = await dbResponse.json();

            if (uploadsResult.success) {
                setImages(uploadsResult.images);
            }
            if (dbResult.success && dbResult.data.media) {
                setMediaMetadata(dbResult.data.media);
            }
        } catch (error) {
            console.error('Error loading media data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // When an image is selected, init the editing state
    useEffect(() => {
        if (selectedImage) {
            setEditingMetadata(mediaMetadata[selectedImage.filename] || {});
        }
    }, [selectedImage, mediaMetadata]);

    // Save metadata to server
    const handleSaveMetadata = async () => {
        if (!selectedImage) return;
        setSaving(true);
        try {
            // Get current database
            const dbResponse = await fetch(`${BACKEND_URL}/api/database`);
            const dbResult = await dbResponse.json();

            if (dbResult.success) {
                const updatedData = {
                    ...dbResult.data,
                    media: {
                        ...dbResult.data.media,
                        [selectedImage.filename]: editingMetadata
                    }
                };

                // Save back to server
                const saveResponse = await fetch(`${BACKEND_URL}/api/database`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });

                if (saveResponse.ok) {
                    setMediaMetadata(updatedData.media);
                    onMetadataChange?.(updatedData.media);
                    alert('✅ Đã lưu thông tin SEO ảnh!');
                }
            }
        } catch (error) {
            console.error('Error saving metadata:', error);
            alert('❌ Lỗi khi lưu thông tin SEO!');
        } finally {
            setSaving(false);
        }
    };

    // Delete image
    const handleDelete = async (filename: string) => {
        console.log(`🗑️ Bắt đầu tiến trình xóa ảnh: ${filename}`);

        if (!filename) {
            console.error('❌ Lỗi: Tên file trống!');
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa ảnh "${filename}"?\n\nẢnh sẽ bị xóa vĩnh viễn khỏi server!`)) {
            console.log('🚫 Người dùng đã hủy lệnh xóa.');
            return;
        }

        try {
            const encodedFilename = encodeURIComponent(filename);
            const deleteUrl = `${BACKEND_URL}/api/upload/${encodedFilename}`;
            console.log(`🌐 Đang gọi API DELETE: ${deleteUrl}`);

            const response = await fetch(deleteUrl, {
                method: 'DELETE'
            });

            console.log(`📡 Status Code: ${response.status}`);
            const result = await response.json();
            console.log('📦 Kết quả từ server:', result);

            // Nếu thành công (200) HOẶC ảnh đã biến mất khỏi server rồi (404)
            if (result.success || response.status === 404) {
                onImageDelete?.(filename);
                if (response.status === 404) {
                    console.log('ℹ️ Ảnh này đã không còn trên server, tiến hành dọn dẹp giao diện.');
                }
                alert('✅ Đã xóa ảnh thành công!');
                loadData(); // Reload list
            } else {
                throw new Error(result.error || 'Lỗi không xác định từ server');
            }
        } catch (error: any) {
            console.error('🔥 Lỗi khi gọi API xóa ảnh:', error);
            alert(`❌ Lỗi xóa ảnh: ${error.message}`);
        }
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Filter images
    const filteredImages = images.filter(img =>
        img.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold gradient-text">📁 Thư Viện Ảnh (Media Library)</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Quản lý file ảnh và thiết lập SEO tập trung
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="pill-button bg-gradient-pink text-white px-5 py-2 text-xs font-bold shadow-lg hover-glow-pink"
                >
                    {loading ? '⏳ Đang tải...' : '🔄 Làm mới'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass p-4 rounded-2xl text-center">
                    <p className="text-3xl font-bold gradient-text">{images.length}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Tổng số ảnh</p>
                </div>
                <div className="glass p-4 rounded-2xl text-center">
                    <p className="text-3xl font-bold gradient-text">
                        {formatSize(images.reduce((sum, img) => sum + img.size, 0))}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Tổng dung lượng</p>
                </div>
                <div className="glass p-4 rounded-2xl text-center">
                    <p className="text-3xl font-bold gradient-text">{filteredImages.length}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Đang hiển thị</p>
                </div>
            </div>

            {/* Search */}
            <div className="glass p-4 rounded-2xl">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Tìm kiếm theo tên file..."
                    className="w-full bg-white/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm"
                />
            </div>

            {/* Image Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="spinner-glass mx-auto mb-4"></div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách ảnh...</p>
                </div>
            ) : filteredImages.length === 0 ? (
                <div className="glass p-12 rounded-2xl text-center">
                    <p className="text-4xl mb-4">🖼️</p>
                    <p className="font-bold mb-2">Không có ảnh nào</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery ? 'Không tìm thấy ảnh phù hợp' : 'Chưa có ảnh nào được upload'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredImages.map((image) => {
                        const hasSEO = mediaMetadata[image.filename];
                        return (
                            <div
                                key={image.filename}
                                className="glass rounded-xl overflow-hidden group hover:shadow-2xl transition-all relative"
                            >
                                {/* SEO Indicator badge */}
                                {hasSEO && (hasSEO.alt || hasSEO.title) && (
                                    <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                        SEO ✓
                                    </div>
                                )}

                                {/* Image Preview */}
                                <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                                    <img
                                        src={image.url}
                                        alt={image.filename}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const idx = filteredImages.findIndex(img => img.filename === image.filename);
                                                setLightboxIndex(idx);
                                                setLightboxOpen(true);
                                            }}
                                            className="bg-white/90 hover:bg-white text-neutral-700 p-2 rounded-lg text-xs font-bold transition-all"
                                            title="Xem toàn màn hình"
                                        >
                                            🔍
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedImage(image); }}
                                            className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg text-xs font-bold transition-all"
                                            title="Thiết lập SEO"
                                        >
                                            ⚙️
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.open(image.url, '_blank'); }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-xs font-bold transition-all"
                                            title="Mở ảnh"
                                        >
                                            🔗
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(image.filename); }}
                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-xs font-bold transition-all"
                                            title="Xóa ảnh"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3 space-y-1">
                                    <p className="text-xs font-bold truncate" title={image.filename}>
                                        {image.filename}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                                        <span>{formatSize(image.size)}</span>
                                        <span>{new Date(image.uploadedAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail & SEO Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedImage(null);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-neutral-100 px-8 py-6 flex items-center justify-between rounded-t-3xl z-20">
                            <div>
                                <h3 className="text-xl font-bold">Quản Lý Metadata Ảnh</h3>
                                <p className="text-xs text-neutral-500 mt-1">Thiết lập SEO cho file: {selectedImage.filename}</p>
                            </div>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body - Two columns for better usage of space */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Col: Preview and Info */}
                            <div className="space-y-6">
                                <div className="flex justify-center bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                                    <img
                                        src={selectedImage.url}
                                        alt={selectedImage.filename}
                                        className="max-w-full max-h-72 rounded-xl shadow-lg object-contain"
                                    />
                                </div>

                                <div className="glass p-6 rounded-2xl space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase">📁 Tên file</label>
                                        <p className="text-sm font-semibold mt-1 break-all">{selectedImage.filename}</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase">🔗 URL Public</label>
                                        <div className="flex gap-2 mt-1">
                                            <input
                                                type="text"
                                                value={selectedImage.url}
                                                readOnly
                                                className="flex-1 bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 text-[10px] font-mono"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedImage.url);
                                                    alert('✅ Đã copy URL!');
                                                }}
                                                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">📊 Size</label>
                                            <p className="text-xs font-semibold mt-1">{formatSize(selectedImage.size)}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase">📅 Ngày tải lên</label>
                                            <p className="text-xs font-semibold mt-1">
                                                {new Date(selectedImage.uploadedAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: SEO Metadata Form */}
                            <div className="space-y-6">
                                <div className="p-6 border-2 border-pink-100 rounded-2xl space-y-5 bg-pink-50/20">
                                    <h4 className="font-bold text-neutral-700 flex items-center gap-2">
                                        ✨ Thiết lập SEO Metadata
                                    </h4>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-600">🏷️ Alt Text (Mô tả nội dung ảnh)</label>
                                        <input
                                            type="text"
                                            value={editingMetadata.alt || ''}
                                            onChange={(e) => setEditingMetadata({ ...editingMetadata, alt: e.target.value })}
                                            placeholder="Vd: Bó hoa hồng đỏ tươi tặng sinh nhật"
                                            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-neutral-400 italic">Quan trọng nhất cho Google Images</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-600">📌 Title (Tiêu đề ảnh)</label>
                                        <input
                                            type="text"
                                            value={editingMetadata.title || ''}
                                            onChange={(e) => setEditingMetadata({ ...editingMetadata, title: e.target.value })}
                                            placeholder="Vd: Hoa Hồng Đỏ Ecuador"
                                            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-600">📝 Mô tả chi tiết (Long Description)</label>
                                        <textarea
                                            value={editingMetadata.description || ''}
                                            onChange={(e) => setEditingMetadata({ ...editingMetadata, description: e.target.value })}
                                            placeholder="Thông tin thêm về ảnh này..."
                                            rows={4}
                                            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-pink-500 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSaveMetadata}
                                        disabled={saving}
                                        className="w-full bg-gradient-pink text-white py-4 rounded-xl text-sm font-bold shadow-lg hover-glow-pink transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>⏳ Đang lưu...</>
                                        ) : (
                                            <>✅ Lưu thông tin SEO</>
                                        )}
                                    </button>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="text-[11px] text-blue-700 leading-relaxed">
                                        💡 <strong>Tip:</strong> Metadata này sẽ được lưu tập trung. Khi bạn sử dụng ảnh này cho các sản phẩm, hệ thống có thể tự động lấy thông tin này nếu sản phẩm đó chưa được thiết lập SEO riêng.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-8 py-6 rounded-b-3xl flex gap-3 justify-end">
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-neutral-500 hover:bg-neutral-100 transition-all"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedImage.filename);
                                    setSelectedImage(null);
                                }}
                                className="px-6 py-3 rounded-xl text-sm font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                            >
                                🗑️ Xóa Vĩnh Viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ImageLightbox
                images={filteredImages.map(img => ({
                    url: img.url,
                    alt: mediaMetadata[img.filename]?.alt || img.filename,
                    title: mediaMetadata[img.filename]?.title
                }))}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
};

export default MediaLibrary;



import React, { useState, useEffect, useCallback } from 'react';

interface ImageLightboxProps {
    images: { url: string; alt?: string; title?: string }[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex, isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [initialIndex, isOpen]);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsLoaded(false);
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsLoaded(false);
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleNext, handlePrev, onClose]);

    if (!isOpen) return null;

    const currentImage = images[currentIndex];

    return (
        <div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 active:scale-95 border border-white/20"
                onClick={onClose}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Main content */}
            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Image Container */}
                <div className="relative max-w-7xl max-h-full flex items-center justify-center">
                    {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="spinner-glass"></div>
                        </div>
                    )}

                    <img
                        src={currentImage.url}
                        alt={currentImage.alt || 'Product Image'}
                        className={`max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-500 transform ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                        onLoad={() => setIsLoaded(true)}
                    />

                </div>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                    <>
                        <button
                            className="absolute left-4 md:left-8 p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all hover:scale-110 active:scale-95 border border-white/20 group"
                            onClick={handlePrev}
                        >
                            <svg className="w-8 h-8 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className="absolute right-4 md:right-8 p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all hover:scale-110 active:scale-95 border border-white/20 group"
                            onClick={handleNext}
                        >
                            <svg className="w-8 h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Pagination Counter */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold tracking-widest">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>

            {/* Thumbnail Strip (Optional for better library feel) */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-[90vw] overflow-x-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            className={`w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-pink-500 scale-110 shadow-lg glow-pink' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            onClick={() => { setIsLoaded(false); setCurrentIndex(idx); }}
                        >
                            <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageLightbox;

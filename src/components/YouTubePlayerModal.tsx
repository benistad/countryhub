import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface YouTubePlayerModalProps {
  videoId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function YouTubePlayerModal({ videoId, title, isOpen, onClose }: YouTubePlayerModalProps) {
  // Handle escape key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-80" />
      
      {/* Modal Content */}
      <div 
        className="relative z-10 w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
          aria-label="Close video player"
        >
          <span className="text-sm">Close</span>
          <X className="h-6 w-6" />
        </button>
        
        {/* Video Title */}
        <h3 className="text-white text-lg font-medium mb-3 truncate pr-20">
          {title}
        </h3>
        
        {/* YouTube Embed */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

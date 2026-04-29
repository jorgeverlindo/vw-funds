import { createPortal } from 'react-dom';
import { X, FileText, Download } from 'lucide-react';
import { WorkflowDocument } from '@/app/contexts/WorkflowContext';
import { PDFViewer } from './PDFViewer';

interface DocumentPreviewModalProps {
  doc: WorkflowDocument;
  onClose: () => void;
}

export function DocumentPreviewModal({ doc, onClose }: DocumentPreviewModalProps) {
  const ext = doc.type.toLowerCase();
  const isImage = doc.url && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  const isPDF   = doc.url && ext === 'pdf';
  const isVideo = doc.url && ['mp4', 'webm', 'mov', 'avi', 'm4v', 'mkv'].includes(ext);
  const hasPreview = isImage || isPDF || isVideo;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-[16px] shadow-2xl flex flex-col w-full max-w-[800px] h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-10 bg-[#F5F5F5] border border-[#E0E0E0] rounded flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-[#D2323F]">{doc.type.toUpperCase().slice(0, 4)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[#1f1d25] break-all leading-snug">{doc.name}</p>
              <p className="text-[11px] text-[#686576] mt-0.5">{doc.type.toUpperCase()} · {doc.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-4">
            {doc.url && (
              <a
                href={doc.url}
                download={doc.name}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-[#686576]"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#686576]" />
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-hidden bg-[#F0F2F4]">
          {isImage && (
            <div className="h-full overflow-auto p-4 flex items-start justify-center">
              <img src={doc.url} alt={doc.name} className="max-w-full rounded-lg shadow-md" />
            </div>
          )}
          {isPDF && (
            // Canvas-based renderer — no GPU compositing issue, works inside any container
            <PDFViewer url={doc.url!} fileName={doc.name} />
          )}
          {isVideo && (
            <div className="h-full flex items-center justify-center p-4 bg-black">
              <video
                src={doc.url!}
                controls
                autoPlay={false}
                className="max-h-full max-w-full rounded-lg shadow-lg"
              />
            </div>
          )}
          {!hasPreview && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-[#9C99A9]">
              <FileText className="w-16 h-16 opacity-30" />
              <div className="text-center">
                <p className="text-[14px] font-medium text-[#686576]">Preview not available</p>
                <p className="text-[12px] text-[#9C99A9] mt-1">This file type cannot be previewed in the browser.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

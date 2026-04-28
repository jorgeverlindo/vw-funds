'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName: string;
}

export function PDFViewer({ url, fileName }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Load PDF.js lazily (client-side only) to avoid SSR issues
  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      try {
        setLoading(true);
        setError(null);

        // Dynamic import so the 1 MB worker bundle doesn't hit SSR
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        // Vite resolves new URL(..., import.meta.url) at build time → correct asset URL
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.js',
          import.meta.url,
        ).toString();

        const doc = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setNumPages(doc.numPages);
        setPdfDoc(doc);
        setCurrentPage(1);
      } catch (e) {
        if (!cancelled) setError('Could not load PDF. Try the download button.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPDF();
    return () => { cancelled = true; };
  }, [url]);

  // Render the current page whenever page / scale / rotation / pdfDoc changes
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width  = viewport.width;
      canvas.height = viewport.height;

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;
    } catch (e: unknown) {
      // RenderingCancelledException is thrown when we cancel — ignore it
      if (e instanceof Error && e.name !== 'RenderingCancelledException') {
        setError('Error rendering page.');
      }
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  useEffect(() => { renderPage(); }, [renderPage]);

  const goTo = (p: number) => setCurrentPage(Math.min(Math.max(1, p), numPages));
  const zoomIn  = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const rotate  = () => setRotation(r => (r + 90) % 360);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9C99A9]">
        <div className="w-8 h-8 border-2 border-[#E0E0E0] border-t-[#473BAB] rounded-full animate-spin" />
        <p className="text-[13px]">Loading PDF…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9C99A9] px-6 text-center">
        <p className="text-[14px] font-medium text-[#686576]">Preview unavailable</p>
        <p className="text-[12px]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#E0E0E0] shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#686576]" />
          </button>
          <span className="text-[12px] text-[#686576] min-w-[72px] text-center select-none">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-[#686576]" />
          </button>
        </div>

        {/* Zoom + rotate */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4 text-[#686576]" />
          </button>
          <span className="text-[12px] text-[#686576] min-w-[44px] text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 text-[#686576]" />
          </button>
          <div className="w-px h-4 bg-[#E0E0E0] mx-1" />
          <button
            onClick={rotate}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4 text-[#686576]" />
          </button>
        </div>
      </div>

      {/* Canvas scroll area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#F0F2F4] flex items-start justify-center p-4"
      >
        <canvas
          ref={canvasRef}
          className="shadow-md rounded bg-white"
          style={{ display: 'block', maxWidth: 'none' }}
        />
      </div>
    </div>
  );
}

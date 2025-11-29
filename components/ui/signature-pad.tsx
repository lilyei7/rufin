'use client';

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSignatureSaved: (signatureData: string) => void;
  width?: number;
  height?: number;
}

export interface SignaturePadHandle {
  clear: () => void;
  getSignature: () => string | null;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePadComponent({ onSignatureSaved, width = 500, height = 200 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const clearSignature = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      setIsEmpty(true);
    };

    useImperativeHandle(ref, () => ({
      clear: clearSignature,
      getSignature: () => {
        if (canvasRef.current && !isEmpty) {
          return canvasRef.current.toDataURL('image/png');
        }
        return null;
      }
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsDrawing(true);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      let x, y;

      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      let x, y;

      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      ctx.lineTo(x, y);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1f2937';
      ctx.stroke();

      setIsEmpty(false);
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && !isEmpty) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.closePath();
        }
      }
    };

    const saveSignature = () => {
      const canvas = canvasRef.current;
      if (!canvas || isEmpty) return;

      const signatureData = canvas.toDataURL('image/png');
      onSignatureSaved(signatureData);
    };

    return (
      <div className="w-full space-y-3">
        <canvas
          ref={canvasRef}
          className="w-full border-4 border-[#EAB839] rounded-lg bg-white cursor-crosshair touch-none"
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={clearSignature}
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw size={16} /> Limpiar
          </button>
          <button
            onClick={saveSignature}
            disabled={isEmpty}
            type="button"
            className="px-4 py-2 bg-[#EAB839] hover:bg-yellow-400 disabled:bg-gray-300 text-[#121313] font-bold rounded-lg transition-colors flex items-center gap-2 text-sm disabled:cursor-not-allowed"
          >
            <Check size={16} /> Confirmar Firma
          </button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

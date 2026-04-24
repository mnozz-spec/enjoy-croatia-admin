'use client';

import { useState, useRef } from 'react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

export default function UploadZone({ onFilesSelected, maxFiles = 5 }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(incoming: File[]) {
    const accepted = incoming.slice(0, maxFiles);
    setFiles(accepted);
    onFilesSelected(accepted);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <p className="text-sm font-medium text-gray-700">Drop images here or click to browse</p>
        <p className="text-xs text-gray-400 mt-1">Up to {maxFiles} images · JPG, PNG, WebP</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => handleFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map(f => (
            <div key={f.name} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

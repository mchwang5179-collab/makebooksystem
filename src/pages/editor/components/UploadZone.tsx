import { useRef, useState } from "react";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
}

export default function UploadZone({ onFiles }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    onFiles(Array.from(fileList));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging
            ? "border-primary-400 bg-primary-50"
            : "border-background-300 bg-background-50 hover:border-primary-300 hover:bg-primary-50/40"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <i className="ri-upload-cloud-2-line text-2xl" aria-hidden="true"></i>
        </span>
        <p className="mt-3 text-sm font-medium text-foreground-900">
          시험지 PDF를 끌어다 놓거나 클릭
        </p>
        <p className="mt-1 text-xs text-foreground-500">
          여러 개를 한 번에 올릴 수 있어요
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
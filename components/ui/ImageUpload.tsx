import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { UploadService } from '../../services/upload';
import { useToast } from './Toast';

interface ImageUploadProps {
    value: string[];
    onChange: (urls: string[]) => void;
    maxFiles?: number;
    bucket?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value = [],
    onChange,
    maxFiles = 5,
    bucket = 'courts'
}) => {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (value.length + files.length > maxFiles) {
            showToast(`Chỉ được tải lên tối đa ${maxFiles} ảnh`, 'error');
            return;
        }

        setUploading(true);
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast(`${file.name} không phải là ảnh`, 'error');
                    continue;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast(`${file.name} quá lớn (tối đa 5MB)`, 'error');
                    continue;
                }

                const { url, error } = await UploadService.uploadImage(file, bucket);

                if (error) {
                    showToast(`Lỗi tải ảnh ${file.name}: ${error}`, 'error');
                } else if (url) {
                    newUrls.push(url);
                }
            }

            if (newUrls.length > 0) {
                onChange([...value, ...newUrls]);
                showToast(`Đã tải lên ${newUrls.length} ảnh`, 'success');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Có lỗi xảy ra khi tải ảnh', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (index: number) => {
        const newUrls = value.filter((_, i) => i !== index);
        onChange(newUrls);
    };

    return (
        <div className="space-y-4">
            {/* Image Grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {value.map((url, index) => (
                        <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                            <img
                                src={url}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button */}
            {value.length < maxFiles && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-lime-400 hover:text-lime-400 hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                <span className="text-sm">Đang tải lên...</span>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-slate-800 rounded-full">
                                    <Upload size={20} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Tải ảnh lên</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        PNG, JPG tối đa 5MB ({value.length}/{maxFiles})
                                    </p>
                                </div>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

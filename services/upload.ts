import { supabase } from '../lib/supabase';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const UploadService = {
    async uploadImage(file: File, bucket: string = 'courts'): Promise<{ url: string | null; error: string | null }> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${generateId()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return { url: null, error: uploadError.message };
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

            return { url: data.publicUrl, error: null };
        } catch (error: any) {
            console.error('Error in uploadImage:', error);
            return { url: null, error: error.message };
        }
    },

    async deleteImage(url: string, bucket: string = 'courts'): Promise<{ success: boolean; error: string | null }> {
        try {
            const path = url.split(`${bucket}/`).pop();
            if (!path) return { success: false, error: 'Invalid URL' };

            const { error } = await supabase.storage.from(bucket).remove([path]);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};

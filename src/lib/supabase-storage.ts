import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function uploadImageToSupabase(buffer: Buffer, filename: string) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filename, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg',
    });
  if (error) throw error;
  return data?.path ? supabase.storage.from('uploads').getPublicUrl(data.path).data.publicUrl : null;
}

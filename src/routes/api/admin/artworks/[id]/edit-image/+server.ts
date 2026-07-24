import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { supabase } from '$lib/supabase/client';

const prisma = new PrismaClient();

export async function POST({ request, params }) {
  const { id } = params;
  
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const imageUrl = formData.get('url') as string | null;

    let finalUrl = imageUrl;

    if (imageFile && imageFile.size > 0) {
      // Generate a unique filename
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return json({ error: 'Erreur lors de l\'upload de l\'image' }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);
        
      finalUrl = publicUrlData.publicUrl;
    }

    if (!finalUrl) {
      return json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    // Update database
    const updated = await prisma.oeuvres.update({
      where: { id: parseInt(id) },
      data: {
        image_url_full: finalUrl,
        image_url_thumb: finalUrl
      }
    });

    return json({ success: true, url: finalUrl, oeuvre: updated });
  } catch (err: any) {
    console.error(err);
    return json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

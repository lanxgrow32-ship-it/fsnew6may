'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function generateSlug(title: string) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
        .trim()
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
}

async function uploadBlogImage(file: File, slug: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${slug}-${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('blog-images')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading blog image:', error);
    throw new Error('Failed to upload blog image.');
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('blog-images')
    .getPublicUrl(data.path);
    
  return urlData.publicUrl;
}


export async function upsertBlogPost(prevState: any, formData: FormData) {
  const id = formData.get('id') as string | null;
  const title = formData.get('title') as string;
  let slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const seo_keywords = formData.get('seo_keywords') as string;
  const is_published = formData.get('is_published') === 'on';
  const imageFile = formData.get('image') as File;
  const currentImagePath = formData.get('current_image_path') as string | null;

  if (!title) {
    return { error: 'Title is required.' };
  }

  // If slug is not provided or is empty, generate it from the title
  if (!slug) {
      slug = generateSlug(title);
  } else {
      // If slug is provided, ensure it's in the correct format
      slug = generateSlug(slug);
  }

  const blogData: any = {
    title,
    slug,
    content,
    seo_keywords,
    is_published,
  };
  
  let imageUrl = currentImagePath;
  if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await uploadBlogImage(imageFile, slug);
        blogData.image_url = imageUrl;
      } catch (error: any) {
        return { error: error.message };
      }
  }

  if (id) {
    // Update existing blog post
    const { error } = await supabaseAdmin
      .from('blogs')
      .update(blogData)
      .eq('id', id);
    if (error) {
        console.error('Error updating blog post:', error);
        return { error: `Failed to update post: ${error.message}` };
    }
  } else {
    // Create new blog post
     const { error } = await supabaseAdmin.from('blogs').insert(blogData);
    if (error) {
        if (error.code === '23505') { // unique constraint violation for slug
            return { error: 'This slug is already in use. Please choose a different one.' };
        }
        console.error('Error creating blog post:', error);
        return { error: `Failed to create post: ${error.message}` };
    }
  }
  
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  redirect('/admin/blog');
}

export async function deleteBlogPost(id: number) {
    if (!id) {
        return { error: 'Post ID is required.' };
    }

    // First, retrieve the blog post to get the image URL
    const { data: post, error: fetchError } = await supabaseAdmin
        .from('blogs')
        .select('image_url')
        .eq('id', id)
        .single();
    
    if (fetchError) {
        console.error('Error fetching post for deletion:', fetchError);
        return { error: 'Could not find the post to delete.' };
    }

    // Delete the post from the database
    const { error: deleteError } = await supabaseAdmin
        .from('blogs')
        .delete()
        .eq('id', id);
    
    if (deleteError) {
        console.error('Error deleting blog post:', deleteError);
        return { error: `Failed to delete post: ${deleteError.message}` };
    }

    // If the post had an image, delete it from storage
    if (post.image_url) {
        const fileName = post.image_url.split('/').pop();
        if (fileName) {
            const { error: storageError } = await supabaseAdmin.storage
                .from('blog-images')
                .remove([fileName]);
            
            if (storageError) {
                console.error('Error deleting blog image from storage:', storageError);
                // Don't return an error to the user, as the main record is deleted.
                // Just log it for maintenance.
            }
        }
    }

    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    return { success: true };
}

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: post } = await supabase
    .from('blogs')
    .select('title, seo_keywords')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | FundedStock Blog`,
    description: `Read the latest post from FundedStock: ${post.title}`,
    keywords: post.seo_keywords || '',
  };
}

export default async function BlogPostPage({ params }: Props) {
    const supabase = createClient();
    const { data: post, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', params.slug)
        .eq('is_published', true)
        .single();
    
    if (error || !post) {
        notFound();
    }

    return (
        <article className="bg-background min-h-screen">
             <header className="py-4 border-b bg-muted/20">
                <div className="container mx-auto">
                    <Button variant="ghost" asChild>
                        <Link href="/blog">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Blog
                        </Link>
                    </Button>
                </div>
            </header>
            
            {post.image_url && (
                <div className="relative w-full h-64 md:h-96">
                    <Image src={post.image_url} alt={post.title} layout="fill" className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
            )}

            <main className="container mx-auto -mt-16 md:-mt-24 relative z-10 px-4">
                 <div className="max-w-3xl mx-auto bg-card p-6 md:p-10 rounded-lg shadow-lg">
                    <div className="space-y-4 mb-8">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{post.title}</h1>
                        <p className="text-muted-foreground">{format(new Date(post.created_at), 'MMMM d, yyyy')}</p>
                        {post.seo_keywords && (
                            <div className="flex flex-wrap gap-2">
                                {post.seo_keywords.split(',').map(keyword => (
                                    <Badge key={keyword.trim()} variant="secondary">{keyword.trim()}</Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline">
                        {post.content ? (
                            post.content.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))
                        ) : (
                            <p>This post has no content yet.</p>
                        )}
                    </div>
                </div>
            </main>
        </article>
    );
}

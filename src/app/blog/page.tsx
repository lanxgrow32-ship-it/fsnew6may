import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogIndexPage() {
    const supabase = createClient();
    const { data: posts, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching published blogs:", error);
    }

    return (
        <div className="bg-background min-h-screen">
            <header className="py-12 bg-muted/40 border-b">
                <div className="container mx-auto text-center">
                    <h1 className="text-4xl font-bold tracking-tight">FundedStock Blog</h1>
                    <p className="mt-4 text-lg text-muted-foreground">Insights, tips, and updates for the modern trader.</p>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                {posts && posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map(post => (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-lg group-hover:border-primary">
                                    {post.image_url && (
                                        <div className="relative w-full aspect-[16/9] overflow-hidden">
                                            <Image src={post.image_url} alt={post.title} layout="fill" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <p className="text-sm text-muted-foreground">{format(new Date(post.created_at), 'MMMM d, yyyy')}</p>
                                        <h2 className="text-xl font-semibold leading-tight line-clamp-2">{post.title}</h2>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {post.seo_keywords && (
                                            <div className="flex flex-wrap gap-2">
                                                {post.seo_keywords.split(',').map(keyword => (
                                                    <Badge key={keyword.trim()} variant="secondary">{keyword.trim()}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-6 pt-0">
                                         <span className="font-semibold text-primary flex items-center gap-2">
                                            Read More <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24">
                        <h2 className="text-2xl font-semibold">No posts yet</h2>
                        <p className="text-muted-foreground mt-2">Check back soon for new articles!</p>
                    </div>
                )}
            </main>
        </div>
    );
}

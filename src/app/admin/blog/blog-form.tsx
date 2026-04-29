'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { upsertBlogPost } from './actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type Blog = {
    id: number;
    title: string;
    slug: string;
    content: string | null;
    image_url: string | null;
    seo_keywords: string | null;
    is_published: boolean;
};

function SubmitButton({ isNew }: { isNew: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isNew ? 'Create Post' : 'Save Changes'}
        </Button>
    );
}

export function BlogForm({ post }: { post?: Blog }) {
    const { toast } = useToast();
    const router = useRouter();
    const [state, formAction] = useActionState(upsertBlogPost, { error: null });
    const [imagePreview, setImagePreview] = useState<string | null>(post?.image_url || null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.error) {
            toast({
                title: 'Error',
                description: state.error,
                variant: 'destructive',
            });
        }
    }, [state, toast]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    // Helper to generate a slug from the title on the client-side for immediate feedback
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        const slugInput = formRef.current?.elements.namedItem('slug') as HTMLInputElement;
        if (slugInput) {
            slugInput.value = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
        }
    }


    return (
        <form ref={formRef} action={formAction}>
            <input type="hidden" name="id" value={post?.id} />
             <input type="hidden" name="current_image_path" value={post?.image_url || ''} />

            {state?.error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{state.error}</AlertDescription></Alert>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Post Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" defaultValue={post?.title} placeholder="Your amazing blog post title" required onChange={handleTitleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea id="content" name="content" defaultValue={post?.content || ''} placeholder="Write your post here... Markdown is supported!" rows={15} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Publish & SEO</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="is_published" className="font-semibold flex-grow">Publish Post</Label>
                                <Switch id="is_published" name="is_published" defaultChecked={post?.is_published} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <Input id="slug" name="slug" defaultValue={post?.slug} placeholder="e.g., my-awesome-post" required />
                                <p className="text-xs text-muted-foreground">Will be auto-generated from title if left empty.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seo_keywords">SEO Keywords</Label>
                                <Input id="seo_keywords" name="seo_keywords" defaultValue={post?.seo_keywords || ''} placeholder="e.g., trading, stocks, guide" />
                                <p className="text-xs text-muted-foreground">Comma-separated keywords for search engines.</p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="relative w-full aspect-video bg-muted rounded-md border-2 border-dashed flex items-center justify-center">
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Image Preview" layout="fill" className="object-cover rounded-md" />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <UploadCloud className="mx-auto h-8 w-8" />
                                        <p className="mt-2 text-sm">No image selected</p>
                                    </div>
                                )}
                            </div>
                            <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} />
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.push('/admin/blog')}>Cancel</Button>
                        <SubmitButton isNew={!post} />
                    </div>
                </div>
            </div>
        </form>
    );
}

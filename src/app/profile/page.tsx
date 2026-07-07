
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, id')
        .eq('id', user.id)
        .single();
    
    if (!profile) {
        redirect('/login');
    }

    return (
        <ProfileClient initialProfile={profile} />
    );
}

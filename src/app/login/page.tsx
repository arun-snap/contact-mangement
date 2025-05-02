'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user) {
            // Save user to Supabase
            const saveUserToSupabase = async () => {
                const { user } = session;
                if (!user) {
                    console.error('User is undefined');
                    return;
                }
                const { error } = await supabase.from('users').upsert({
                    email: user.email,
                    name: user.name,
                    image: user.image,
                });

                console.log('User:', user);
                if (error) {
                    console.error('Error saving user to Supabase:', error);
                }
            };

            saveUserToSupabase();
        }
    }, [session]);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl mb-4">Login</h1>
            <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                Sign in with Google
            </button>
        </div>
    );
}

import { fail } from '@sveltejs/kit';
import QRCode from 'qrcode';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    // Fetch recent matches
    const { data: matches } = await supabase
        .from('matches')
        .select('*, players(nickname)')
        .order('created_at', { ascending: false })
        .limit(10);

    return {
        matches: matches || []
    };
};

export const actions: Actions = {
    createMatch: async ({ request, locals: { supabase }, url }) => {
        const formData = await request.formData();
        const durationMs = formData.get('duration_ms');

        if (!durationMs) {
            return fail(400, { error: 'Duration is required' });
        }

        const sessionToken = crypto.randomUUID();

        const { data, error } = await supabase
            .from('matches')
            .insert({
                duration_ms: parseInt(durationMs as string),
                session_token: sessionToken
            })
            .select()
            .single();

        if (error) {
            return fail(500, { error: error.message });
        }

        // Generate QR Code
        // The URL will be like: https://<host>/claim?token=...
        // For development, we use the request URL origin.
        const claimUrl = `${url.origin}/claim?token=${sessionToken}`;
        const qrCodeDataUrl = await QRCode.toDataURL(claimUrl, { width: 300 });

        return {
            success: true,
            match: data,
            qrCodeDataUrl,
            claimUrl
        };
    }
};

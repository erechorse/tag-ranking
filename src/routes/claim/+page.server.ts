import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
    const token = url.searchParams.get('token');

    if (!token) {
        return {
            error: 'No token provided',
            valid: false
        };
    }

    // Check if match exists and is unclaimed
    const { data: match, error } = await supabase
        .from('matches')
        .select('id, duration_ms, player_id')
        .eq('session_token', token)
        .single();

    if (error || !match) {
        return {
            error: 'Invalid or expired token',
            valid: false
        };
    }

    if (match.player_id) {
        return {
            error: 'This score has already been claimed',
            valid: false,
            time: match.duration_ms
        };
    }

    return {
        valid: true,
        token,
        time: match.duration_ms
    };
};

export const actions: Actions = {
    register: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const token = formData.get('token') as string;
        const nickname = formData.get('nickname') as string;
        const contact = formData.get('contact') as string;

        if (!token || !nickname) {
            return fail(400, { error: 'Nickname is required' });
        }

        // Use the RPC function we defined to handle atomic claim
        const { data, error } = await supabase.rpc('claim_match', {
            p_session_token: token,
            p_nickname: nickname,
            p_contact_info: contact || null
        });

        if (error) {
            console.error('Claim Error:', error);
            return fail(500, { error: 'Failed to claim score. Please try again.' });
        }

        // The RPC returns a JSON object with success/message/player_id
        // data: { success: boolean, ... }
        // Supabase RPC result is directly the data if generic is not used, 
        // but let's assume it returns what we defined.

        if (!data || data.success === false) {
            return fail(400, { error: data?.message || 'Failed to claim score' });
        }

        // Return success so the client can handle redirection and localStorage
        return {
            success: true,
            playerId: data.player_id,
            nickname
        };
    }
};

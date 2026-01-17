import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    const { data: matches } = await supabase
        .from('matches')
        .select(`
			duration_ms,
			created_at,
			players!inner (
				id,
				nickname
			)
		`)
        .not('player_id', 'is', null)
        .order('duration_ms', { ascending: true })
        .limit(50);

    return {
        matches: matches || []
    };
};

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
        .order('duration_ms', { ascending: false }) // Modified to descending order: Longer time is better (higher rank) 
        // User said: "勝ちまでの時間を競う" (Compete for time until win). shorter is better?
        // Usually "tag" implies surviving longer, but "鬼役が追いついて...勝ちまでの時間を競う"
        // If the 'Human' is controlling the 'Oni' (Catcher), and competing for time to catch.
        // Then SHORTER time is better (Faster catch).
        // Yes, "Speed" usually implies shorter time.
        // Let's assume ASCENDING order (Shorter is better).
        .limit(50);

    return {
        matches: matches || []
    };
};

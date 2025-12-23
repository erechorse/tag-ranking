import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, url }) => {
    const { session } = await safeGetSession();

    // If the user is NOT logged in and is NOT on the login page, redirect to login.
    if (!session && url.pathname !== '/admin/login') {
        redirect(303, '/admin/login');
    }

    // If the user IS logged in and IS on the login page, redirect to dashboard.
    if (session && url.pathname === '/admin/login') {
        redirect(303, '/admin');
    }

    return {
        session
    };
};

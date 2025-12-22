import { supabase } from './supabase';

export interface AuditLogEntry {
    id: string;
    created_at: string;
    action: string;
    resource: string;
    details: any;
    user_id: string;
    user?: {
        full_name: string;
        email: string;
        role: string;
    };
}

export const AuditService = {
    async logAction(action: string, resource: string, details: any = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Should allow logging for system actions? For now, only auth users.

            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: user.id,
                    action,
                    resource,
                    details
                });

            if (error) {
                console.error('Failed to log audit action:', error);
            }
        } catch (e) {
            console.error('Exception in audit logging:', e);
        }
    },

    async getLogs() {
        // Note: 'profiles' join requires foreign key setup or explicit relation in Supabase
        // Assuming public.profiles.id references auth.users.id
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        // Correction: joining with profiles usually requires a foreign key from audit_logs to profiles OR profiles to audit_logs.
        // audit_logs.user_id -> auth.users.id.
        // profiles.id -> auth.users.id.
        // They share the same ID.
        // Supabase PostgREST helper might not auto-detect this effectively for implicit join without FK.
        // I will keep it simple and maybe just fetch logs for now.

        if (error) throw error;
        return data;
    }
};

// Helper for direct function usage if needed
export const logAction = AuditService.logAction;

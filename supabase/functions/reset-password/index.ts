
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // Security Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error("Não autorizado. Token ausente.")
        }

        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !requester) {
            throw new Error("Não autorizado. Usuário inválido.")
        }

        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single()

        // Assuming GESTOR_SUPREMO (super_admin) or CONTRATACOES (admin-like) can reset passwords
        const canManage = requesterProfile?.role === 'GESTOR_SUPREMO' || requesterProfile?.role === 'CONTRATACOES'

        if (!canManage) {
            throw new Error("Permissão negada. Apenas administradores podem resetar senhas.")
        }

        const { userId, password } = await req.json()

        if (!userId || !password) {
            return new Response(JSON.stringify({ error: "ID do usuário e nova senha são obrigatórios." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        console.log(`[Reset-Password] Atualizando senha para user: ${userId}`)

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: password }
        )

        if (error) {
            throw error
        }

        return new Response(JSON.stringify({
            success: true,
            data
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error("[Reset-Password] Erro:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

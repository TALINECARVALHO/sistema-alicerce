
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Inicializar cliente com Service Role (Privilégios de Admin)
        // NECESSÁRIO para apagar usuários do Auth
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

        // 3. Verificar quem está chamando (Segurança)
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

        // Buscar o cargo do solicitante no banco
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single()

        const isAdmin = requesterProfile?.role === 'super_admin' || requesterProfile?.role === 'Gestor Supremo' || requesterProfile?.role === 'GESTOR_SUPREMO'

        if (!isAdmin) {
            throw new Error("Permissão negada. Apenas Super Admins podem apagar usuários.")
        }

        // 4. Ler ID do usuário a ser deletado
        const { userId } = await req.json()

        if (!userId) {
            throw new Error("ID do usuário é obrigatório.")
        }

        if (userId === requester.id) {
            throw new Error("Você não pode apagar sua própria conta.")
        }

        console.log(`[Delete-User] Solicitante ${requester.email} removendo user ${userId}`)

        // 5. Apagar usuário do Auth (Isso deve disparar cascade para profiles se configurado no BD,
        // mas por segurança faremos explicitamente também se necessário, ou confiamos no Auth)
        // Nota: supabase.auth.admin.deleteUser apaga do Auth.
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            throw new Error(`Erro ao apagar usuário do Auth: ${deleteError.message}`)
        }

        // 6. Opcional: Garantir limpeza na tabela profiles (caso não tenha ON DELETE CASCADE)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) {
            console.warn("Aviso: Erro ao limpar profile (pode já ter sido limpo via cascade):", profileError)
        }

        return new Response(JSON.stringify({ success: true, message: "Usuário removido com sucesso." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error("[Delete-User] Erro:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

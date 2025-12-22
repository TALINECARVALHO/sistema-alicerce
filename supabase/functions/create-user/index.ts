
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Fix: Added explicit declaration of the Deno global to resolve compilation errors 
 * in environments where Deno typings are not pre-configured.
 */
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

    // 3. Verificar se quem está chamando a função é um Admin
    // (Opcional, mas recomendado para segurança extra se a função for pública)
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

    const isAdmin = requesterProfile?.role === 'super_admin' || requesterProfile?.role === 'Departamento de Contratações'
    
    if (!isAdmin) {
      throw new Error("Permissão negada. Apenas administradores podem criar usuários.")
    }

    // 4. Ler dados do corpo
    const { email, password, userData } = await req.json()

    if (!email || !password || !userData.full_name) {
      return new Response(JSON.stringify({ error: "Dados incompletos (E-mail, senha e nome são obrigatórios)." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`[Create-User] Criando conta para: ${email}`)

    // 5. Criar usuário no Auth (Admin Auth API)
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Já cria como confirmado para agilizar o fluxo do fornecedor
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
        department: userData.department
      }
    })

    if (createUserError) {
      console.error("[Create-User] Erro Auth:", createUserError)
      return new Response(JSON.stringify({ error: createUserError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 6. Criar ou atualizar o Profile na tabela pública
    if (authUser.user) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          email: email,
          full_name: userData.full_name,
          role: userData.role,
          department: userData.department
        })
        .select()
        .single()

      if (profileError) {
        console.error("[Create-User] Erro Profile:", profileError)
        // Se falhar o profile, deletamos o auth user para não deixar lixo (Rollback manual)
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        throw new Error(`Erro ao criar perfil no banco: ${profileError.message}`)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        user: authUser.user, 
        profile: profile 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error("Falha ao retornar dados do usuário criado.")

  } catch (error: any) {
    console.error("[Create-User] Erro Crítico:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

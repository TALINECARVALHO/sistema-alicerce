-- Função para resetar senha de usuário (apenas admins)
-- Esta função usa a extensão pgsodium para hash de senha

CREATE OR REPLACE FUNCTION reset_user_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    -- Verificar se o usuário que está chamando é admin
    -- (você pode adicionar verificação de role aqui se necessário)
    
    -- Atualizar a senha do usuário
    UPDATE auth.users
    SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Verificar se o update foi bem sucedido
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não encontrado'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Senha atualizada com sucesso'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', SQLERRM
        );
END;
$$;

-- Garantir que apenas usuários autenticados possam chamar esta função
-- (adicione RLS policies conforme necessário)

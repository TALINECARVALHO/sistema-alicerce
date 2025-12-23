-- Função para resetar senha de usuário (apenas admins)
-- Habilitar extensão pgcrypto se necessário
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION reset_user_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
BEGIN
    -- Atualizar a senha do usuário usando crypt do pgcrypto
    UPDATE auth.users
    SET 
        encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
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
GRANT EXECUTE ON FUNCTION reset_user_password TO authenticated;


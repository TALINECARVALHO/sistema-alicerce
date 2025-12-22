
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createTransport } from "npm:nodemailer@6.9.7";

// Declare Deno to avoid TypeScript errors in some editors
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // 1. Handle CORS Preflight (Browser checks)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. Health Check
  if (req.method === 'GET') {
      return new Response(JSON.stringify({ 
          status: 'online', 
          library: 'nodemailer',
          timestamp: new Date().toISOString() 
      }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
      });
  }

  try {
    // 3. Pegar dados do corpo da requisição
    let bodyData;
    try {
        const text = await req.text();
        if (!text) throw new Error("Body vazio");
        bodyData = JSON.parse(text);
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: "JSON inválido ou corpo vazio." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
        });
    }

    const { to, subject, htmlBody, fromName } = bodyData;

    if (!to || !subject) {
        return new Response(JSON.stringify({ success: false, error: "Campos 'to' e 'subject' são obrigatórios." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }

    // 4. Ler Variáveis de Ambiente (Secrets)
    const emailUser = Deno.env.get("SMTP_EMAIL");
    const emailPass = Deno.env.get("SMTP_PASSWORD");
    // Pega o Host dos secrets ou usa o Gmail como padrão
    const emailHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    // Pega a Porta dos secrets ou usa 587 como padrão
    const emailPort = parseInt(Deno.env.get("SMTP_PORT") || "587");

    if (!emailUser || !emailPass) {
        console.error("ERRO: Variáveis SMTP ausentes.");
        return new Response(JSON.stringify({ 
            success: false, 
            error: "Configuração SMTP ausente (SMTP_EMAIL/SMTP_PASSWORD). Verifique os Secrets no Painel Supabase." 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }

    console.log(`[Send-Email] Iniciando envio para: ${to} via ${emailHost}`);

    // 5. Configurar Nodemailer
    const transporter = createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true para 465, false para outras
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        tls: {
            rejectUnauthorized: false // Ajuda a evitar erros de certificado em ambientes serverless
        }
    });

    // 6. Enviar o E-mail
    const info = await transporter.sendMail({
        from: `"${fromName || 'Sistema Alicerce'}" <${emailUser}>`,
        to: to,
        subject: subject,
        html: htmlBody || '<p>Mensagem do Sistema.</p>',
    });

    console.log("[Send-Email] Sucesso! ID:", info.messageId);

    return new Response(JSON.stringify({ success: true, id: info.messageId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error: any) {
    console.error("[Send-Email] Erro CRÍTICO:", error);
    
    return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || "Erro interno desconhecido",
        details: String(error)
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
  }
});


import { supabase } from './supabase';
import { formatError } from './api';

export interface EmailResult {
    success: boolean;
    error?: string;
}

export interface EmailLog {
    id?: number;
    created_at?: string;
    to_email: string;
    subject: string;
    status: 'success' | 'error' | 'simulated';
    error_details?: string;
}

const SIMULATION_KEY = 'alicerce_email_simulation_mode';

const saveLogToDB = async (to: string, subject: string, success: boolean, details?: string, isSimulated: boolean = false) => {
    try {
        const newLog: EmailLog = {
            to_email: to,
            subject,
            status: isSimulated ? 'simulated' : (success ? 'success' : 'error'),
            error_details: details
        };
        
        const { error } = await supabase.from('email_logs').insert([newLog]);
        if (error) {
            console.error("Falha ao salvar log no Banco de Dados. Motivo:", formatError(error));
        }
        
        window.dispatchEvent(new Event('email-log-updated'));
    } catch (e) {
        console.error("Erro ao processar log de e-mail:", formatError(e));
    }
};

export const isSimulationMode = (): boolean => {
    return localStorage.getItem(SIMULATION_KEY) === 'true';
};

export const setSimulationMode = (enabled: boolean) => {
    localStorage.setItem(SIMULATION_KEY, String(enabled));
};

export const sendEmail = async (to: string, subject: string, htmlBody: string): Promise<EmailResult> => {
    console.log(`[EmailService] Solicitado envio para ${to}...`);

    if (isSimulationMode()) {
        console.log("[EmailService] Modo Simulação ATIVO. Ignorando backend.");
        await new Promise(resolve => setTimeout(resolve, 800)); 
        await saveLogToDB(to, subject, true, "Simulação Ativa", true);
        return { success: true };
    }

    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            method: 'POST',
            body: {
                to,
                subject,
                htmlBody,
                fromName: 'Sistema Alicerce'
            }
        });

        if (error) {
            console.error("[EmailService] Erro de Invocação:", formatError(error));
            const msg = formatError(error);
            await saveLogToDB(to, subject, false, `Erro Técnico: ${msg}`);
            return { success: false, error: msg };
        }

        if (data && data.success === false) {
            const errorMsg = data.error || "Recusado pelo servidor de e-mail.";
            await saveLogToDB(to, subject, false, `Recusado pelo Servidor: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }

        await saveLogToDB(to, subject, true, "Enviado via SMTP.");
        return { success: true };

    } catch (e: any) {
        const criticalMsg = formatError(e);
        console.error("[EmailService] Exceção crítica:", criticalMsg);
        await saveLogToDB(to, subject, false, `Exceção: ${criticalMsg}`);
        return { success: false, error: `Erro inesperado: ${criticalMsg}` };
    }
};

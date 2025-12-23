
import React, { useState } from 'react';
import { Demand, UserRole, Question, Supplier } from '../types';
import { LockClosedIcon, CheckCircleIcon } from './icons';

interface QandAProps {
  demand: Demand;
  userRole: UserRole;
  currentSupplier?: Supplier;
  onAddQuestion: (demandId: number, question: Question) => Promise<void> | void;
  onAnswerQuestion: (demandId: number, questionId: number, answer: string) => void;
  disableNewQuestions?: boolean;
  onSuccess?: () => void; // Callback to trigger navigation after success
}

// Helper function to safely format dates
const formatDate = (dateValue: string | null | undefined): string => {
  if (!dateValue) return 'Data não disponível';

  try {
    const date = new Date(dateValue);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'Data inválida';
  }
};

const QandA: React.FC<QandAProps> = ({ demand, userRole, onAddQuestion, onAnswerQuestion, currentSupplier, disableNewQuestions, onSuccess }) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [answerForms, setAnswerForms] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddQuestion = async () => {
    if (newQuestion.trim() && currentSupplier) {
      setIsSubmitting(true);
      setSuccessMessage(null);

      const question: Question = {
        id: Date.now(),
        supplier_id: currentSupplier.id,
        supplierName: currentSupplier.name,
        question: newQuestion,
        askedAt: new Date().toISOString(),
        answer: null,
        answeredAt: null,
        answeredBy: null,
      };

      try {
        await onAddQuestion(demand.id, question);
        setNewQuestion('');
        // Feedback visual
        setSuccessMessage("Dúvida enviada! Aguarde o retorno do setor responsável.");

        // Delay to allow user to read message before redirecting
        setTimeout(() => {
          setSuccessMessage(null);
          if (onSuccess) {
            onSuccess();
          }
        }, 2500);
      } catch (e) {
        console.error("Falha ao enviar dúvida", e);
        setIsSubmitting(false); // Only re-enable on error. On success, keep disabled during redirect.
      }
    }
  };

  const handleAnswerChange = (questionId: number, text: string) => {
    setAnswerForms(prev => ({ ...prev, [questionId]: text }));
  };

  const handleAnswerSubmit = (questionId: number) => {
    const answer = answerForms[questionId];
    if (answer && answer.trim()) {
      onAnswerQuestion(demand.id, questionId, answer);
      setAnswerForms(prev => {
        const newForms = { ...prev };
        delete newForms[questionId];
        return newForms;
      });
    }
  };

  const canAnswerQuestions = [UserRole.CONTRATACOES, UserRole.GESTOR_SUPREMO].includes(userRole);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-4">Dúvidas e Respostas</h3>
      <div className="space-y-6">
        {demand.questions.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma dúvida registrada para esta demanda.</p>
        ) : (
          demand.questions.map((q) => (
            <div key={q.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <p className="text-sm font-semibold text-slate-800">
                <span className="font-bold text-blue-600">{q.supplierName}</span> perguntou em {formatDate(q.askedAt)}:
              </p>
              <p className="mt-2 text-slate-700">{q.question}</p>

              {q.answer ? (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-800">
                    <span className="font-bold text-green-600">{q.answeredBy}</span> respondeu em {formatDate(q.answeredAt)}:
                  </p>
                  <p className="mt-2 text-slate-700">{q.answer}</p>
                </div>
              ) : canAnswerQuestions ? (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <textarea
                    value={answerForms[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Digite a resposta oficial aqui..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                  <button onClick={() => handleAnswerSubmit(q.id)} className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors">
                    Responder
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-yellow-600 italic">Aguardando resposta do Departamento de Contratações.</p>
              )}
            </div>
          ))
        )}

        {userRole === UserRole.FORNECEDOR && (
          <div className="pt-6 border-t border-slate-200">
            {disableNewQuestions ? (
              <div className="bg-slate-100 p-4 rounded-lg flex items-center gap-3 text-slate-600">
                <LockClosedIcon className="w-5 h-5" />
                <p className="text-sm font-medium">Você já enviou sua proposta ou declinou esta oportunidade. Não é possível enviar novas perguntas.</p>
              </div>
            ) : successMessage ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center justify-center text-center animate-fade-in-down">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-green-800">Sucesso!</h4>
                <p className="text-green-700 mt-1">{successMessage}</p>
                <p className="text-xs text-green-600 mt-4">Redirecionando para o painel...</p>
              </div>
            ) : (
              <>
                <h4 className="font-semibold text-slate-700 mb-2">Registrar Nova Dúvida</h4>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Digite sua dúvida aqui..."
                  disabled={isSubmitting}
                ></textarea>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleAddQuestion}
                    disabled={isSubmitting || !newQuestion.trim()}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>Enviando...</>
                    ) : (
                      <>Enviar Dúvida</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default QandA;

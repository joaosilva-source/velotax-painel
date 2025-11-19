import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  BarChart3,
  RotateCcw,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Section {
  id: string;
  title: string;
  color: string;
  colorClass: string;
  content: {
    introduction: string;
    keyPoints: string[];
    examples: string[];
    highlight: string;
  };
  questions: Question[];
}

const sections: Section[] = [
  {
    id: "section1",
    title: "O Calendário do FGTS Digital",
    color: "#1e3a8a",
    colorClass: "from-blue-900 to-cyan-600",
    content: {
      introduction:
        "O calendário do FGTS Digital define as datas em que o desconto da parcela do empréstimo consignado será feito e quando o empregador precisa repassar esses valores. Ele organiza o fluxo entre trabalhador, empresa e instituição financeira.",
      keyPoints: [
        "Data de contratação: Período em que o trabalhador pode contratar o crédito",
        "Competência de desconto: Mês em que o valor da parcela será descontado do FGTS",
        "Pagamento da folha: Prazo máximo para o empregador pagar os salários e enviar o eSocial",
        "Vencimento da guia FGTS Digital: Data limite para recolhimento do FGTS e repasse da parcela",
      ],
      examples: [
        "Contratação em 21/03/2025 a 20/04/2025 → Desconto em Maio/2025 → Vencimento 06/06/2025",
        "Contratação em 21/04/2025 a 20/05/2025 → Desconto em Junho/2025 → Vencimento 05/07/2025",
        "Contratação em 21/05/2025 a 20/06/2025 → Desconto em Julho/2025 → Vencimento 06/08/2025",
      ],
      highlight:
        "O calendário segue a Portaria MTE nº 435 de 20/03/2025 e garante clareza nas tratativas com o cliente.",
    },
    questions: [
      {
        id: "q1-1",
        question: "O que define o calendário do FGTS Digital?",
        options: [
          "Apenas as datas de pagamento de salários",
          "As datas de desconto da parcela e quando o empregador repassa os valores",
          "Somente o vencimento das guias de impostos",
          "O calendário de férias dos colaboradores",
        ],
        correct: 1,
        explanation:
          "Correto! O calendário do FGTS Digital organiza o fluxo entre trabalhador, empresa e instituição financeira, definindo as datas de desconto e repasse.",
      },
      {
        id: "q1-2",
        question: "Qual é a competência de desconto?",
        options: [
          "O mês em que o trabalhador contrata o crédito",
          "O mês em que o valor da parcela será descontado do FGTS",
          "O mês em que o empregador paga os salários",
          "O mês em que o cliente recebe o crédito",
        ],
        correct: 1,
        explanation:
          "Correto! A competência de desconto é o mês em que o valor da parcela será descontado do FGTS.",
      },
      {
        id: "q1-3",
        question:
          "Qual é o prazo máximo para o empregador pagar os salários e enviar o eSocial?",
        options: [
          "Até o dia 20 do mês",
          "Até o dia 30 do mês",
          "Conforme definido no calendário (ex: 20/06/2025)",
          "Sem prazo específico",
        ],
        correct: 2,
        explanation:
          "Correto! O prazo máximo é definido no calendário, como por exemplo 20/06/2025, conforme a Portaria MTE nº 435.",
      },
    ],
  },
  {
    id: "section2",
    title: "Duplicidade de Pagamento",
    color: "#dc2626",
    colorClass: "from-red-700 to-pink-500",
    content: {
      introduction:
        "A duplicidade de pagamento ocorre quando o cliente paga a parcela antecipadamente direto à financeira, mas o empregador já enviou o desconto no holerite. O sistema registra duas entradas do mesmo valor.",
      keyPoints: [
        "Ocorre quando há pagamento antecipado direto à financeira",
        "E o empregador já enviou o desconto no holerite",
        "O sistema registra duas entradas do mesmo valor",
        "A duplicidade só é identificada após o pagamento da guia FGTS Digital",
      ],
      examples: [
        "Cliente paga R$ 500 antecipadamente à financeira no dia 15/05",
        "Empregador desconta R$ 500 do holerite de maio (competência maio)",
        "Sistema registra duas entradas de R$ 500",
        "Duplicidade identificada após vencimento da guia FGTS Digital",
      ],
      highlight:
        "A duplicidade é identificada após o vencimento da guia FGTS Digital, pois somente nessa etapa o sistema confirma o repasse da parcela.",
    },
    questions: [
      {
        id: "q2-1",
        question: "Quando ocorre a duplicidade de pagamento?",
        options: [
          "Quando o cliente paga antecipadamente à financeira",
          "Quando o empregador desconta a parcela do holerite",
          "Quando o cliente paga antecipadamente E o empregador já enviou o desconto",
          "Quando há atraso no pagamento da guia FGTS Digital",
        ],
        correct: 2,
        explanation:
          "Correto! A duplicidade ocorre quando o cliente paga antecipadamente à financeira E o empregador já enviou o desconto no holerite.",
      },
      {
        id: "q2-2",
        question: "Quando a duplicidade é identificada?",
        options: [
          "Imediatamente após o pagamento antecipado",
          "No final do mês de desconto",
          "Após o vencimento da guia FGTS Digital",
          "Nunca é identificada automaticamente",
        ],
        correct: 2,
        explanation:
          "Correto! A duplicidade é identificada após o vencimento da guia FGTS Digital, quando o sistema confirma o repasse da parcela.",
      },
      {
        id: "q2-3",
        question:
          "O que o sistema registra quando há duplicidade de pagamento?",
        options: [
          "Apenas uma entrada do valor",
          "Duas entradas do mesmo valor",
          "Nenhuma entrada",
          "Uma entrada com valor dobrado",
        ],
        correct: 1,
        explanation:
          "Correto! O sistema registra duas entradas do mesmo valor quando há duplicidade de pagamento.",
      },
    ],
  },
  {
    id: "section3",
    title: "Identificação e Prazos",
    color: "#16a34a",
    colorClass: "from-green-700 to-emerald-500",
    content: {
      introduction:
        "Após o pagamento da guia FGTS Digital, o repasse e a compensação financeira costumam levar de 30 a 40 dias para serem concluídos. Esse tempo é necessário para a integração entre eSocial, FGTS Digital, Caixa e instituição financeira.",
      keyPoints: [
        "Duplicidade identificada após vencimento da guia FGTS Digital",
        "Repasse oficial é processado nessa etapa",
        "Compensação financeira leva de 30 a 40 dias",
        "Integração entre eSocial, FGTS Digital, Caixa e instituição financeira",
      ],
      examples: [
        "Guia FGTS Digital vence em 06/06/2025",
        "Duplicidade identificada após 06/06/2025",
        "Compensação processada entre 06/07 e 16/07/2025",
        "Retorno financeiro ao cliente em até 40 dias",
      ],
      highlight:
        "O prazo de 30 a 40 dias é necessário para a integração entre todos os sistemas envolvidos no processo.",
    },
    questions: [
      {
        id: "q3-1",
        question:
          "Quanto tempo leva para a compensação financeira após o pagamento da guia FGTS Digital?",
        options: [
          "De 5 a 10 dias",
          "De 15 a 20 dias",
          "De 30 a 40 dias",
          "De 60 a 90 dias",
        ],
        correct: 2,
        explanation:
          "Correto! A compensação financeira costuma levar de 30 a 40 dias para ser concluída.",
      },
      {
        id: "q3-2",
        question: "Por que o prazo de compensação é tão longo?",
        options: [
          "Porque o sistema é lento",
          "Porque a Caixa Econômica Federal é lenta",
          "Porque é necessária a integração entre eSocial, FGTS Digital, Caixa e instituição financeira",
          "Porque há falta de funcionários",
        ],
        correct: 2,
        explanation:
          "Correto! O prazo é necessário para a integração entre todos os sistemas envolvidos no processo.",
      },
      {
        id: "q3-3",
        question:
          "Quando o sistema confirma o repasse da parcela na guia FGTS Digital?",
        options: [
          "Imediatamente após o desconto em folha",
          "No vencimento da guia FGTS Digital",
          "30 dias após o vencimento",
          "Nunca confirma automaticamente",
        ],
        correct: 1,
        explanation:
          "Correto! O sistema confirma o repasse na etapa do vencimento da guia FGTS Digital.",
      },
    ],
  },
  {
    id: "section4",
    title: "Quitação Antecipada",
    color: "#7c3aed",
    colorClass: "from-purple-700 to-violet-500",
    content: {
      introduction:
        "Quando o cliente quita a parcela antecipadamente e, no mesmo mês, ocorre o desconto em folha, não há pagamento duplicado. O valor descontado pela empresa é reaproveitado para a próxima parcela, conforme as regras da Caixa Econômica Federal.",
      keyPoints: [
        "Quitação antecipada + desconto no mesmo mês = SEM duplicidade",
        "Valor descontado é reaproveitado para a próxima parcela",
        "Reembolso só é feito se TODAS as parcelas estiverem quitadas",
        "Ainda assim, deve haver novo desconto para gerar reembolso",
      ],
      examples: [
        "Cliente quita a parcela antecipadamente em 10/05",
        "Empregador desconta em folha em 20/05 (mesmo mês)",
        "Valor descontado é reaproveitado para a próxima parcela",
        "Sem duplicidade, sem reembolso imediato",
      ],
      highlight:
        "Importante: o reembolso só é feito se todas as parcelas já estiverem quitadas e ainda assim houver novo desconto. Nesses casos, o retorno ocorre após o repasse da Caixa, com prazo médio de até 40 dias.",
    },
    questions: [
      {
        id: "q4-1",
        question:
          "O que acontece quando há quitação antecipada e desconto no mesmo mês?",
        options: [
          "Há duplicidade de pagamento",
          "Não há duplicidade, valor é reaproveitado",
          "O desconto é cancelado",
          "O cliente recebe reembolso imediato",
        ],
        correct: 1,
        explanation:
          "Correto! Quando há quitação antecipada e desconto no mesmo mês, não há duplicidade. O valor descontado é reaproveitado para a próxima parcela.",
      },
      {
        id: "q4-2",
        question: "Quando o reembolso é feito na quitação antecipada?",
        options: [
          "Imediatamente após a quitação",
          "No final do mês",
          "Se TODAS as parcelas estiverem quitadas E houver novo desconto",
          "Nunca é feito reembolso",
        ],
        correct: 2,
        explanation:
          "Correto! O reembolso só é feito se todas as parcelas já estiverem quitadas e ainda assim houver novo desconto.",
      },
      {
        id: "q4-3",
        question:
          "Qual é o prazo médio para o retorno financeiro na quitação antecipada?",
        options: [
          "De 5 a 10 dias",
          "De 15 a 20 dias",
          "De até 40 dias após o repasse da Caixa",
          "De 60 a 90 dias",
        ],
        correct: 2,
        explanation:
          "Correto! O retorno ocorre após o repasse da Caixa, com prazo médio de até 40 dias.",
      },
    ],
  },
  {
    id: "section5",
    title: "Situações Especiais",
    color: "#4f46e5",
    colorClass: "from-indigo-700 to-blue-500",
    content: {
      introduction:
        "Existem situações especiais que requerem atenção especial, como mudança de CNPJ e pagamento antecipado. Quando o empregador altera o CNPJ, o repasse automático das parcelas via FGTS Digital pode ficar temporariamente suspenso.",
      keyPoints: [
        "Mudança de CNPJ pode suspender repasses automáticos",
        "Data de vencimento permanece a mesma",
        "Pagamento deve ser feito manualmente pelo cliente",
        "Atualização de CNPJ pode levar até 60 dias nos sistemas oficiais",
      ],
      examples: [
        "Empresa altera CNPJ em 15/05",
        "Repasse automático fica suspenso temporariamente",
        "Cliente deve pagar manualmente no aplicativo",
        "Novo CNPJ atualizado na carteira de trabalho em até 60 dias",
      ],
      highlight:
        "É importante confirmar com o RH se o novo CNPJ já foi atualizado na carteira de trabalho, pois essa atualização pode levar até 60 dias para constar nos sistemas oficiais do Ministério do Trabalho.",
    },
    questions: [
      {
        id: "q5-1",
        question:
          "O que acontece quando o empregador altera o CNPJ no crédito consignado?",
        options: [
          "O crédito é cancelado automaticamente",
          "O repasse automático fica temporariamente suspenso",
          "A data de vencimento muda",
          "O cliente recebe reembolso automático",
        ],
        correct: 1,
        explanation:
          "Correto! Quando o empregador altera o CNPJ, o repasse automático das parcelas via FGTS Digital pode ficar temporariamente suspenso.",
      },
      {
        id: "q5-2",
        question:
          "O que o cliente deve fazer quando há mudança de CNPJ e o repasse fica suspenso?",
        options: [
          "Aguardar o repasse automático",
          "Pagar manualmente no aplicativo",
          "Entrar em contato com a financeira",
          "Cancelar o crédito",
        ],
        correct: 1,
        explanation:
          "Correto! O cliente deve pagar manualmente no aplicativo quando o repasse automático fica suspenso.",
      },
      {
        id: "q5-3",
        question:
          "Quanto tempo pode levar para o novo CNPJ ser atualizado nos sistemas oficiais?",
        options: [
          "De 5 a 10 dias",
          "De 15 a 30 dias",
          "De até 60 dias",
          "De 90 a 120 dias",
        ],
        correct: 2,
        explanation:
          "Correto! Segundo o Ministério do Trabalho, a atualização do CNPJ pode levar até 60 dias para constar nos sistemas oficiais.",
      },
    ],
  },
];

export default function TrainingModule() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [moduleComplete, setModuleComplete] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("trainingProgress");
    if (saved) {
      const progress = JSON.parse(saved);
      setAnswers(progress.answers || {});
      setCurrentSection(progress.currentSection || 0);
      setCurrentQuestion(progress.currentQuestion || 0);
      setModuleComplete(progress.moduleComplete || false);
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    const progress = {
      answers,
      currentSection,
      currentQuestion,
      moduleComplete,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("trainingProgress", JSON.stringify(progress));
  }, [answers, currentSection, currentQuestion, moduleComplete]);

  const section = sections[currentSection];
  const question = section.questions[currentQuestion];
  const answerKey = `${section.id}-q${currentQuestion + 1}`;
  const userAnswer = answers[answerKey];
  const isAnswered = userAnswer !== undefined;
  const isCorrect = isAnswered && userAnswer === question.correct;

  const handleAnswerSelect = (optionIndex: number) => {
    if (!isAnswered) {
      setSelectedAnswer(optionIndex);
      setAnswers({ ...answers, [answerKey]: optionIndex });
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    if (currentQuestion < section.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setModuleComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(sections[currentSection - 1].questions.length - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handleRestart = () => {
    setCurrentSection(0);
    setCurrentQuestion(0);
    setAnswers({});
    setShowFeedback(false);
    setSelectedAnswer(null);
    setModuleComplete(false);
    localStorage.removeItem("trainingProgress");
  };

  const calculateProgress = () => {
    const totalQuestions = sections.reduce(
      (acc, s) => acc + s.questions.length,
      0
    );
    return Math.round((Object.keys(answers).length / totalQuestions) * 100);
  };

  const calculateScore = () => {
    let correct = 0;
    sections.forEach((section) => {
      section.questions.forEach((q, idx) => {
        const key = `${section.id}-q${idx + 1}`;
        if (answers[key] === q.correct) {
          correct++;
        }
      });
    });
    const total = sections.reduce((acc, s) => acc + s.questions.length, 0);
    return { correct, total, percentage: Math.round((correct / total) * 100) };
  };

  if (moduleComplete) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 md:p-12 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-24 h-24 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Parabéns! Módulo Concluído
            </h1>
            <p className="text-lg text-slate-600">
              Você completou o treinamento sobre Crédito ao Trabalhador
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Sua Pontuação Final
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {score.percentage}%
                  </div>
                  <p className="text-sm text-slate-600">Percentual</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {score.correct}
                  </div>
                  <p className="text-sm text-slate-600">Corretas</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-600">
                    {score.total}
                  </div>
                  <p className="text-sm text-slate-600">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 text-left space-y-3">
              <h3 className="font-bold text-slate-900">
                Tópicos Abordados no Treinamento:
              </h3>
              <ul className="space-y-2">
                {sections.map((s) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{s.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={handleRestart}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar Módulo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              Módulo de Treinamento
            </h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Progresso</div>
            <div className="text-2xl font-bold text-blue-600">
              {calculateProgress()}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-6 p-4 md:p-6">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="hidden md:block w-64 flex-shrink-0">
            <Card className="p-4 sticky top-24">
              <h2 className="font-bold text-slate-900 mb-4">Seções</h2>
              <div className="space-y-2">
                {sections.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSection(idx);
                      setCurrentQuestion(0);
                      setSelectedAnswer(null);
                      setShowFeedback(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      currentSection === idx
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-sm">{s.title}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Section Content */}
          <Card className="mb-6 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${section.colorClass} p-6 md:p-8 text-white`}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                {section.title}
              </h2>
              <p className="text-blue-100">
                Seção {currentSection + 1} de {sections.length}
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Introduction */}
              <div>
                <p className="text-slate-700 leading-relaxed">
                  {section.content.introduction}
                </p>
              </div>

              {/* Key Points */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3">
                  Pontos-Chave:
                </h3>
                <ul className="space-y-2">
                  {section.content.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-blue-600 font-bold flex-shrink-0">
                        •
                      </span>
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Exemplos:</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  {section.content.examples.map((example, idx) => (
                    <p key={idx} className="text-slate-700 text-sm">
                      {idx + 1}. {example}
                    </p>
                  ))}
                </div>
              </div>

              {/* Highlight */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-slate-800 font-medium">
                  💡 {section.content.highlight}
                </p>
              </div>
            </div>
          </Card>

          {/* Quiz */}
          <Card className="overflow-hidden">
            <div className="bg-slate-100 p-6 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">
                Atividade Interativa - Pergunta {currentQuestion + 1} de{" "}
                {section.questions.length}
              </h3>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <h4 className="text-lg font-semibold text-slate-900">
                {question.question}
              </h4>

              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAnswer === idx
                        ? isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : isAnswered && idx === question.correct
                          ? "border-green-500 bg-green-50"
                          : isAnswered && idx === userAnswer
                            ? "border-red-500 bg-red-50"
                            : "border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                    } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAnswer === idx
                            ? isCorrect
                              ? "border-green-500 bg-green-500"
                              : "border-red-500 bg-red-500"
                            : isAnswered && idx === question.correct
                              ? "border-green-500 bg-green-500"
                              : isAnswered && idx === userAnswer
                                ? "border-red-500 bg-red-500"
                                : "border-slate-300"
                        }`}
                      >
                        {selectedAnswer === idx ? (
                          isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <XCircle className="w-4 h-4 text-white" />
                          )
                        ) : isAnswered && idx === question.correct ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : isAnswered && idx === userAnswer ? (
                          <XCircle className="w-4 h-4 text-white" />
                        ) : null}
                      </div>
                      <span className="text-slate-700">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div
                  className={`p-4 rounded-lg ${
                    isCorrect
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p
                        className={`font-semibold ${
                          isCorrect ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        {isCorrect ? "Parabéns!" : "Resposta Incorreta"}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          isCorrect ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  disabled={currentSection === 0 && currentQuestion === 0}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isAnswered}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {currentSection === sections.length - 1 &&
                  currentQuestion === section.questions.length - 1
                    ? "Finalizar"
                    : "Próximo"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

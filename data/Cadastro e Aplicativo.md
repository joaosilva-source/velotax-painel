# Cadastro e Aplicativo

Base de conhecimento - Cadastro e Aplicativo

**Total de artigos:** 25

---

## 1. Agradecimentos

Eu que agradeço, se tiver mais dúvidas é só me perguntar!!

---

## 2. App - Alteração de Número de Telefone

Diagnóstico do Cenário: Verificação: Identificar em qual tela o cliente está enfrentando o problema com o número de telefone.



Fluxos de Ação: Cenário 1: Tela de Validação do GOV.BR Causa: O número de telefone está vinculado à conta do governo (gov.br), não ao cadastro da Velotax.


Ação: O cliente precisa acessar o site do gov.br e fazer a atualização do número de telefone diretamente por lá.



Cenário 2: Cadastro Interno da Velotax Causa: O número está incorreto no nosso próprio sistema.


Ação: Seguir o mesmo procedimento de segurança para alteração de e-mail: solicitar ao cliente uma selfie segurando um documento de identificação e, após o recebimento, escalar para o time interno fazer a alteração.

---

## 3. App - Atualizar dados

[
  {
    "title": "Passo 1: Coletar informações iniciais",
    "content": "Solicite o CPF do cliente, o novo e-mail/telefone desejado e peça que ele confirme qual era o e-mail/telefone antigo cadastrado."
  },
  {
    "title": "Passo 2: Validar o novo contato",
    "content": "Envie uma macro de saudação para o novo e-mail e peça para o cliente confirmar o recebimento."
  },
  {
    "title": "Passo 3: Iniciar o processo de validação",
    "content": "Após a confirmação de recebimento, envie a macro '[Atendimento] Troca de e-mail - Validação com foto' para o cliente."
  },
  {
    "title": "Passo 4: Solicitar a alteração internamente",
    "content": "Após o recebimento da selfie com documento ao lado do rosto, e tamebem a imagem do documento em si, verificar a identidade do cliente, e envie o CPF e o novo e-mail no grupo do chat interno solicitando a alteração."
  },
  {
    "title": "Passo 5: Informar o prazo ao cliente",
    "content": "Comunique ao cliente que a alteração do e-mail ou telefone será concluída no sistema em até 24 horas."
  }
]

---

## 4. App - Atualizar situação

Caminho no App: Impostos (menu inferior) > Declarações Passadas > Rolar até o final > Botão "Atualizar".

Requisito: Será necessário fazer login com a conta gov.br para que o sistema possa sincronizar as informações mais recentes da Receita Federal.

---

## 5. App - Cancelar procuração

O que é: A procuração autoriza a Velotax a consultar informações fiscais na Receita Federal.

Como Cancelar: O processo é feito pelo cliente no portal MIR com a conta gov.br.

Passos: Acessar Portal MIR > Menu "Procurações" > Localizar a da Velotax > Clicar em "Cancelar".

Impacto do Cancelamento: Sem a procuração ativa, a Velotax não consegue mais acompanhar a declaração ou identificar pendências.

---

## 6. App - Cobrança exibida

Ação: Consultar no sistema os serviços que o cliente contratou.

Confirmar a origem do débito (antecipação, tarifa, plano, etc.).

Informar ao cliente o valor exato e a qual serviço a cobrança se refere.

Se o cliente não reconhecer, registrar um ticket e escalar para a área de análise.

---

## 7. App - Como acessar a conta

Passo a Passo: Acessar o aplicativo da Velotax.

Clicar no ícone do conta localizado no menu inferior da tela.

---

## 8. App - Consulta de contrato

Caminho no App: Menu "Impostos" (na parte inferior). "Declarações passadas".

Selecionar o ano da antecipação.

Rolar a tela até o final para localizar "Documentos da operação".

---

## 9. App - Excluir conta Velotax

Condição Obrigatória: Quitar todas as pendências financeiras (como antecipação) antes de solicitar a exclusão.

A exclusão não cancela dívidas.

Como Excluir (Sem Pendências):

 Pelo App: Acessar Impostos > DARFs para investidor > menu no canto superior esquerdo >Conta e selecionar “Excluir conta”.

 Pelo Site: Fazer login, ir em “Conta” e clicar em “Excluir conta”.

Aviso: A ação é permanente e remove todos os dados da plataforma.

---

## 10. App - Falha na contratação

Diagnóstico: Verificar com o cliente a mensagem exata de erro.

Causa Provável: Geralmente, a falha ocorre por instabilidade na conexão ou por uma versão desatualizada do aplicativo.

Ação Imediata: Orientar o cliente a verificar a internet, atualizar o app e tentar novamente.

Se Persistir: Registrar um ticket e encaminhar para análise do suporte técnico.

---

## 11. App - Reativar conta

Cenário: Cliente excluiu a conta, mas precisa reativá-la (geralmente para fazer a portabilidade de uma chave PIX que ficou presa). (Guia Interno) Procedimento: Pegar o CPF do cliente e a solicitação "REATIVAR CONTA".

Enviar no grupo de chat B2C no formato: "[CPF]

- REATIVAR CONTA".

Informar ao cliente que o prazo para a reativação é de até 24 horas úteis.

---

## 12. Crédito Pessoal - Empresa de Conexão

Parceiro: A conexão Open Finance é feita através do nosso parceiro Belvo.

Esclarecimento: O cliente está conectando seus dados com a Velotax; o Belvo é apenas o intermediário tecnológico que garante a segurança do processo.

---

## 13. Imposto de Renda?

Definição: É um tributo federal cobrado sobre os ganhos (renda) de pessoas e empresas.

Incidência: Aplica-se a salários, aluguéis, investimentos, entre outros.

Declaração Anual: É obrigatória para quem atinge determinados limites de renda definidos pela Receita Federal a cada ano.

---

## 14. Metodos de pagamento da antecipação

Opções de Quitação (Dívidas em Aberto):

 PIX: Pagamento imediato, com liberação da chave no mesmo dia.

 Cartão de Crédito: Pagamento integral ou parcelado (conforme condições).

Onde Pagar: Acessar a área de "Impostos" ou "Próximos Pagamentos" no aplicativo.

---

## 15. Pix - Cadastro na Celcoin

Para que a portabilidade da antecipação seja concluída corretamente, é obrigatório que a chave Pix do cliente esteja cadastrada, ativa e vinculada ao banco Celcoin.

Não é possivel associar outras chaves que não sejam CPF.

Caso a portabilidade não seja confirmada no app do banco, a liberação da antecipação não ocorrerá.

A exclusão ou alteração da chave Pix antes da finalização do processo pode gerar divergências e falhas operacionais.

Por esse motivo, é fundamental orientar o cliente a manter a chave ativa e vinculada até a conclusão total da operação.

---

## 16. PIX - O cliente se compromete a manter a chave PIX CPF vinculada até a quitação?

Oriente o cliente que a vinculação da chave PIX é realizada no momento da contratação da antecipação, pois a Receita deposita o valor da restituição apenas em chaves desse tipo, permitindo a quitação automática do débito.

Explique que o cliente pode retirar a chave PIX após a contratação, mas, sem a quitação do débito, isso configura uma quebra de contrato.

---

## 17. Quando é necessário emitir o DARF?

Regra de Isenção para Vendas: Limite Mensal: O investidor é isento de pagar Imposto de Renda sobre o lucro se o valor total das suas vendas de ações no mercado à vista for inferior a R$

20.000,00 dentro do mesmo mês.

Importante: Este limite de R$

20.000,00 refere-se ao total vendido, e não ao lucro obtido.

Quando o Pagamento de Imposto é Obrigatório?

Condição: Se o valor total das vendas em um mês ultrapassar R$

20.000,00.

Ação: Neste caso, o investidor perde a isenção e precisará calcular o imposto devido sobre o lucro total obtido naquele mês, gerar o DARF e efetuar o pagamento.

Em Resumo: Vendeu menos de R$ 20 mil no mês?

O lucro é isento.

Vendeu mais de R$ 20 mil?

O imposto é calculado sobre o lucro.

---

## 18. Recibo de Declaração

Onde Encontrar: O número do recibo da declaração do cliente está disponível no Octadesk, ao consultar as informações do perfil.

Status da Entrega: Se o cliente questionar se a declaração foi entregue, verificar o status no Octa.

---

## 19. Reclamação sobre Taxas do Contrato

Argumento: Os juros e taxas aplicados foram detalhados de forma transparente e acordados pelo cliente no contrato (CCB), que está disponível para consulta no aplicativo.

---

## 20. Restituição - Data dos lotes

Liberação dos Pagamentos: O pagamento da restituição do IRPF é feito pela Receita Federal em lotes.

A ordem dos lotes segue critérios de prioridade definidos pela própria Receita (ex: idade, professores, etc.).

Como o Cliente Pode Consultar: Onde: No site oficial "Consulta Restituição" da Receita Federal.

https://www.restituicao.receita.fazenda.gov.br

Dados Necessários: CPF e data de nascimento.

Datas dos Lotes de 2025: 1º Lote: 30/05/2025 2º Lote: 30/06/2025 3º Lote: 31/07/2025 4º Lote: 29/08/2025 5º Lote (último): 30/09/2025

---

## 21. Validação de Selfie e Documento

Se o App Ainda Permite o Envio:

 Orientações: A foto deve ser tirada em local bem iluminado, com o rosto totalmente visível e o documento legível.

Se o App Não Permite Mais o Envio:

 Significado: A conta não poderá ser aberta para a antecipação.

 Comunicação: Informar que o perfil foi considerado inelegível no momento, sem detalhar o motivo (que pode ser a foto ou outra regra de segurança intern

---

## 22. conta - Bloqueio Judicial

Sinais de Alerta: Cliente alega que recebeu um valor que não aparece no extrato, ou que um valor sumiu.

A mensagem de erro "HOUVE UM ERRO AO BUSCAR DETALHES DA TRANSFERÊNCIA" também pode indicar isso.

Procedimento: Solicitar o extrato completo da conta ao time de suporte interno.

Ao confirmar o bloqueio, encaminhar o extrato ao cliente.

Informar que no documento haverá um número de processo judicial, que ele pode usar para consultar a origem do bloqueio junto ao órgão responsável.

---

## 23. Veloprime - Ações no Exterior

Consolidação: O Veloprime consolida automaticamente movimentações de ativos no exterior em plataformas integradas, como a Warren, gerando relatórios prontos para o IRPF e pagamento de tributos.

Tributação sobre Lucro na Venda (Ganhos de Capital):
• Apuração: Centraliza movimentações e apura ganhos de capital automaticamente.
• Relatório: Substitui o preenchimento manual do GCAP.
• Alíquota: 15% sobre o ganho de capital.
• Câmbio: Conversão pela cotação oficial do dólar do Banco Central na data da operação.

Tributação sobre Dividendos Recebidos no Exterior:
• Apuração: Dividendos são consolidados em relatório mensal.
• Pagamento: Dados usados no Carnê-Leão com tabela progressiva (até 27,5%).

Tributação sobre Aplicações Financeiras no Exterior (Lei 14.754/2023):
• Apuração: Rendimentos capturados automaticamente via integração (ex.: Warren).
• Alíquota: 15% sobre rendimentos disponibilizados.
• Pagamento: Declaração nas fichas correspondentes do IRPF.

Tributação sobre Entidades Controladas (Offshores, Trusts):
• Apuração: Lucros apurados em 31/12 consolidados em relatório.
• Alíquota: 15% sobre o lucro anual, independentemente de distribuição.
• Pagamento: Recolhimento no Brasil, mesmo sem remessa do valor.

---

## 24. Veloprime - Fundos Imobiliários (FIIs)

Tributação sobre Rendimentos (Aluguéis): Regra: Os rendimentos mensais distribuídos pelos FIIs são isentos de Imposto de Renda para pessoas físicas.

Tributação sobre o Lucro na Venda das Cotas: Regra: Não há isenção.

Qualquer lucro obtido na venda de cotas de FIIs é tributável.

Alíquota: 20% sobre o ganho de capital.

Pagamento: O imposto deve ser pago via DARF até o último dia útil do mês seguinte à venda.

---

## 25. Veloprime - Não reconhece a cobrança

Contexto: O cliente questiona uma cobrança que ele acredita ser da "Veloprime".

Diagnóstico e Ação: Verificação Interna: Consulte no sistema os detalhes do plano que o cliente contratou.

Análise: A contratação da Veloprime pode incluir diferentes funcionalidades e planos, cada um com seu respectivo valor.

Orientação: Com base nos detalhes do plano do cliente, explique a qual serviço ou funcionalidade a cobrança se refere

---


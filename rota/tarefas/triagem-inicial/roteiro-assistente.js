// ============================================================
// tarefas/triagem-inicial/roteiro-assistente.js
// Roteiro da janela assistente para a Triagem Inicial.
//
// Roda no contexto do assistente.html.
// Filtra pelo parâmetro pjerota_tarefa da URL.
//
// Por ora: aguarda os dados chegarem via storage e remove
// o carregando. A interface será montada aqui futuramente.
// ============================================================

async function triagem_assistente_iniciar() {

    // ── Filtra pelo parâmetro da URL ──────────────────────────
    const tarefa = new URL(location.href).searchParams.get('pjerota_tarefa')
    if (tarefa !== 'triagem-inicial') return

    // ── Aguarda sinal de dados prontos via storage ────────────
    //
    // O roteiro.js da página de detalhes salva rota_dadosProntos: true
    // quando termina de coletar todos os dados do processo.
    // Aqui ficamos ouvindo até esse sinal chegar.

    await new Promise(resolver => {
        browser.storage.onChanged.addListener(function ouvir(mudancas) {
            if (mudancas['rota_dadosProntos']?.newValue === true) {
                browser.storage.onChanged.removeListener(ouvir)
                // Limpa o sinal para não reativar em aberturas futuras
                armazenar({ rota_dadosProntos: false })
                resolver()
            }
        })
    })

    // ── Remove o carregando ───────────────────────────────────
    removerCarregando()
    criaDiv({id: 'bloco-autuacao', ancestral: 'rota-corpo'})
    criaTitulo({id: 'bloco-autuacao-titulo', texto: 'Autuação', ancestral: 'bloco-autuacao'})
    criaTextoQueAbrePassandoOMouse({
        id:'bloco-autuacao-instrucao-longa', 
        texto:`Passe o mouse para ver a instrução da tarefa.
Clique para fixar/desafixar.`,
        textoBox: `Preciso de um texto longo pra testar isso tudo.
executado:
associacao bauruense de ensino
CNPJ: 03.564.615/0001-39
RUA EXPEDICIONARIOS , 2463
VILA ZILDA - SAO JOSE DO RIO PRETO - SP - CEP: 15025-030 (email: juridico.setanet@hotmail.com)
Maria Christina Dos Santos (ADVOGADO)
CPF: 736.487.798-34
OAB: SP56979
E-mail: juridico.setanet@hotmail.com

executado:
grafica editora e informatica rio preto ltda - epp
CNPJ: 58.945.460/0001-72
RUA SIQUEIRA CAMPOS , 2628 , Fundos
PARQUE INDUSTRIAL - SAO JOSE DO RIO PRETO - SP - CEP: 15025-055
Maria Christina Dos Santos (ADVOGADO)
CPF: 736.487.798-34
OAB: SP56979
E-mail: juridico.setanet@hotmail.com

executado:
colegio estoril ltda - me
CNPJ: 06.314.858/0001-07
RUA EXPEDICIONARIOS , 2463
VILA ZILDA - SAO JOSE DO RIO PRETO - SP - CEP: 15025-030
Maria Christina Dos Santos (ADVOGADO)
CPF: 736.487.798-34
OAB: SP56979
E-mail: juridico.setanet@hotmail.com

executado:
sociedade educacional tristao de athaide ltda - me
CNPJ: 49.071.442/0001-18
Sem endereço cadastrado no processo
(email: setanet@hotmail.com)
Maria Christina Dos Santos (ADVOGADO)
CPF: 736.487.798-34
OAB: SP56979
E-mail: juridico.setanet@hotmail.com

executado:
colegio inovacao s/s ltda - me
CNPJ: 06.228.012/0001-54
AMADEU SEGUNDO CHERUBINI, 700
JARDIM PANORAMA - SAO JOSE DO RIO PRETO - SP - CEP: 15091-250
Maria Christina Dos Santos (ADVOGADO)
CPF: 736.487.798-34
OAB: SP56979
E-mail: juridico.setanet@hotmail.com

executado:
colegio atheneu s/s ltda - me
CNPJ: 50.778.463/0001-57
RUA EXPEDICIONARIOS , 2463
VILA ZILDA - SAO JOSE DO RIO PRETO - SP - CEP: 15025-030
Maria Christina Dos Santos (ADVOGADO)
CPF: 736.487.798-34
OAB: SP56979
E-mail: juridico.setanet@hotmail.com

executado:
setsis sistema de ensino bauru ltda - me
CNPJ: 04.948.079/0001-38
Sem endereço cadastrado no processo
Maria Christina Dos Santos (ADVOGADO)
CPF: 736.487.798-34
OAB: SP56979
E-mail: juridico.setanet@hotmail.com`,
        ancestral: 'bloco-autuacao'}
    )
    criaTexto({id: 'bloco-autuacao-instrucao-curta', texto: 'Verifique os dados da autuação, se estão corretos e correspondem à petição inicial.', ancestral: 'bloco-autuacao'})
    // ── Interface será montada aqui futuramente ───────────────
    //
    // Exemplo de uso quando chegar a hora:
    //
    //   const dados = await obterArmazenamento(['rota_dadosTriagemInicial'])
    //   const triagem = dados?.rota_dadosTriagemInicial
    //
    //   criaDiv({ id: 'bloco-autuacao', ancestral: 'rota-corpo' })
    //   criaTitulo({ id: 'titulo-autuacao', texto: 'Autuação', ancestral: 'bloco-autuacao' })
    //   criaTexto({ id: 'texto-partes', texto: formatarPartes(triagem.partes), ancestral: 'bloco-autuacao' })
    //   ...
}

// Auto-executa ao carregar o script
triagem_assistente_iniciar()
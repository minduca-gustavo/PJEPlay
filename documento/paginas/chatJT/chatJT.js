// arquitetura - soma da janela + href puxa o armazenamento. O armazenamento tem a tarefa específica
let esperaChatJT = false

async function chatJTFuncoes(){
    // verifica se é a janela do chatJT
    let janela = confereJanela(/\/ia\.jt\.jus\.br\/chat/)
    if (!janela) return
    // verifica se foi janela aberta pela extensão
    let janelaNome = window.name
    if (!janelaNome.includes('rotapje')) return
    if (esperaChatJT) return
    esperaChatJT = true
    let login = await chatJTconfereLogin()
    if (!login){ esperaChatJT = false; return }
    // pega o timestamp do nome da janela
    let execucao = janelaNome.match(/\d{13}$/)?.[0]
    if (!execucao) {   // sem timestamp, a comparação abaixo passaria com undefined == undefined
        window.name = ''
        rota_avisoObrigatorio('Ocorreu um erro. Tente novamente', 4)
        return
    }
    // pega a tarefa do nome da janela
    let tarefa = janelaNome.replace('rotapje_', '').replace(execucao, '')
    // obtem o armazenamento pra conferir o timestamp
    console.log('%c[Rota PJE]%c tarefa: ' + JSON.stringify(tarefa), LOG.aviso, 'color:inherit')
    let armazenamento = await obterArmazenamento(janelaNome)
    let dadosTarefa = armazenamento[janelaNome]
    if (dadosTarefa?.execucao != execucao) return
    let correspondenciaFuncoes = [
        {
            label: 'tramitaIA_menu_rolante_ris',
            nome: 'Recebimento e Remessa analisa sentença e Acórdãos',
            assistente: '6aac80f81501b0e00725a8df',
            funcaoRechamada: 'tramitaIASecaoRis'
        }
    ]
    let dados = dadosTarefa?.dados
    let parametros = correspondenciaFuncoes.find(c => c?.label == tarefa)
    if (!parametros){
        window.name = ''
        rota_avisoObrigatorio('Ocorreu um erro. Tente novamente', 4)
        console.log('%c[Rota PJE]%c chatJT: tarefa sem correspondência: ' + tarefa, LOG.aviso, 'color:inherit')
        return
    }
    if (!dados || (Array.isArray(dados) && dados.length == 0)){
        window.name = ''
        rota_avisoObrigatorio('Ocorreu um erro. Tente novamente', 4)
        console.log('%c[Rota PJE]%c chatJT: tarefa sem dados: ' + tarefa, LOG.aviso, 'color:inherit')
        return
    }
    // naoMandar: em objeto vem na raiz; em lista vem dentro de cada item (removido item a item, ao enviar)
    let naoMandar = (!Array.isArray(dados) && dados?.naoMandar) || {}
    let overlay = criaDiv({
        id: id('tramitaIA', 'chatJT', 'overlay'),
        ancestral: document.body
    })
    formataDiv(overlay, 'branco', '100%', '100%', 'absolute')
    overlay.style.background = 'rgba(255,255,255,0.85)'
    overlay.style.justifyContent = 'center'
    overlay.style.alignItems = 'center'
    let divMensagem = criaDiv({
        id: id('tramitaIA', 'chatJT', 'overlay', 'mensagem'),
        ancestral: id('tramitaIA', 'chatJT', 'overlay')
    })
    let texto = criaSubTitulo({
        id: id('tramitaIA', 'chatJT', 'overlay', 'mensagem', 'texto'),
        ancestral: id('tramitaIA', 'chatJT', 'overlay', 'mensagem'),
        texto: 'Aguarde, iniciando consultas. Não feche esta página.'
    })
    texto.style.fontSize = '20px'
    let ehLista = Array.isArray(dados)
    let itens = ehLista ? dados : [dados]
    let resultado = []
    try {
        for (let i = 0; i < itens.length; i++){
            texto.textContent = ehLista ? 'Consulta em andamento: ' + (i + 1) + '/' + itens.length : 'Efetuando consulta'
            let consulta = null
            try { consulta = await chatJTExecutaPrompt(parametros, JSON.stringify(chatJTSemNaoMandar(itens[i]))) }
            catch(e){ consulta = 'ERRO: ' + e.message }
            resultado.push({ indice: ehLista ? i : null, ...chatJTLimpaJSON(consulta) })
        }
        await rota_avisar('tramitaIA', {
            janela: janelaNome,
            elemento: janelaNome.replace(execucao, ''),
            funcaoRechamada: parametros.funcaoRechamada,
            dados: resultado,
            naoMandar: naoMandar
        })
        await removerArmazenamento(janelaNome)
        texto.textContent = 'Concluído. Você já pode fechar esta janela.'
        window.close()
    } catch(e){
        // falhou fora da consulta (ex.: ao avisar a aba): a janela fica aberta e o armazenamento é mantido
        texto.textContent = 'Erro: ' + e.message + '. Feche esta janela e tente novamente.'
        console.log('%c[Rota PJE]%c chatJT erro: ' + e.message, LOG.aviso, 'color:inherit')
    }
}

// tira o naoMandar do item antes de enviar para a IA (sem alterar o objeto original)
function chatJTSemNaoMandar(item){
    if (!item || typeof item != 'object' || Array.isArray(item)) return item
    let { naoMandar: _ignorado, ...resto } = item
    return resto
}

async function chatJTExecutaPrompt(parametros, texto, arquivos = []) {
    let conversa = await rota_fetch_IACriaConversa(parametros.assistente)
    if (!conversa?.idIA || !conversa?.aut) throw new Error('falha ao criar conversa')
    let { idIA, aut } = conversa
    let resultado = await rota_fetch_IAEnviaRequisicao(texto, idIA, aut, arquivos)
    console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
    if (resultado == null) throw new Error('sem resposta da IA')
    return resultado
}

async function chatJTconfereLogin() {
    await aguardarElemento('button[type="submit"]')
    await suspender(1000)
    if (document.querySelector('form[action="/chat/login"]')){
        rota_avisoObrigatorio('Faça login e atualize a página', 5)
        return false
    }
    return true
}

// seletor do login 'form[action="/chat/login"]'
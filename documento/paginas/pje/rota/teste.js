//(async ()=> {
//    let testando = 1
//    if (testando !== 1) return
//    let d = await buscarProcessosPorTarefa('Triagem Inicial')
//    
//    //for(let j of d.PASSIVO){
//    //    relatar(JSON.stringify(j),'','teste')
//    //    
//    //}
//    //relatar('Linha 5 do teste: ' + JSON.stringify(dados), '', 'teste')
//    relatar('Tá mudando? ' + JSON.stringify(d), '', 'teste')
//}) ()

/*
(async ()=> {
    let testando = 0
    if (testando !== 1) return
    let d = await extrairTexto(3866132, 279194446)
    
    //for(let j of d.PASSIVO){
    //    relatar(JSON.stringify(j),'','teste')
    //    
    //}
    //relatar('Linha 5 do teste: ' + JSON.stringify(dados), '', 'teste')
    relatar('Tá mudando? ' + JSON.stringify(d), '', 'teste')
}) ()
*/
// ==== DEVOLVER GIG PARA CRIADOR/ALTERADOR ====

(function () {
  const URL_REGEX = /processo\/\d{7}\/detalhe/;

  function extrairNome(trElement) {
    // Tenta Alteração primeiro, depois Criação
    const todosSrOnly = trElement.querySelectorAll('p.sr-only');
    const srOnly = [...todosSrOnly].find(p => /Cria|Altera/.test(p.textContent));
    if (!srOnly) return null;
    const texto = srOnly.textContent || '';
    const match = texto.match(/Altera(?:ção|cao):\s+([A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ ]+?)\s+em\s/)
                || texto.match(/Cria(?:ção|cao):\s+([A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ ]+?)\s+em\s/);
    return match ? match[1].trim() : null;
  }

  function extrairDescricao(trElement) {
    const span = trElement.querySelector('span.descricao');
    if (!span) return '';
    const b = span.querySelector('b');
    const prefixo = b ? b.innerText + ':' : '';
    let texto = span.innerText.trim();
    if (prefixo && texto.startsWith(prefixo)) {
        texto = texto.slice(prefixo.length).trimStart();
    }
    return texto;
    }

  function setNativeValue(element, value) {
    // Angular intercepta o value nativo; precisamos disparar via setter nativo
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function aguardarElemento(seletor, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(seletor);
      if (el) return resolve(el);
      const obs = new MutationObserver(() => {
        const found = document.querySelector(seletor);
        if (found) {
          obs.disconnect();
          resolve(found);
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        obs.disconnect();
        reject(new Error(`Timeout aguardando: ${seletor}`));
      }, timeout);
    });
  }

  async function executarDevolucao(btnEditar, nome, descricao) {
    btnEditar.click();

    try {
      // Aguarda o form de edição abrir (botão salvar como âncora)
      await aguardarElemento('[aria-label="Salva as alterações"]');

      // Pequena pausa para o Angular terminar de renderizar os campos
      await new Promise(r => setTimeout(r, 400));

      // ---- Responsável ----
      const inputResponsavel = document.querySelector(
        'input[formcontrolname="responsavel"]'
      );
      if (inputResponsavel && nome) {
        inputResponsavel.focus();
        // Limpa primeiro para forçar o autocomplete a abrir
        setNativeValue(inputResponsavel, '');
        await new Promise(r => setTimeout(r, 200));
        setNativeValue(inputResponsavel, nome);

        await new Promise(r => setTimeout(r, 600));
        const primeiraOpcao = document.querySelector('mat-option');
        if (primeiraOpcao) {
            primeiraOpcao.click();
        }
    }

      // ---- Observação ----
      const textarea = document.querySelector(
        'textarea[formcontrolname="observacao"]'
      );
      if (textarea) {
        const novaObservacao = `FEITO. Devolvendo.\n${descricao}`;
        textarea.focus();
        setNativeValue(textarea, novaObservacao);
      }

    } catch (err) {
      console.error('[Devolver GIG] Erro aguardando formulário:', err);
    }
  }

  function adicionarBotoes() {
    if (!URL_REGEX.test(location.pathname)) return;

    const tabela = document.getElementById('tabela-atividades');
    if (!tabela) return;

    const linhas = tabela.querySelectorAll('tbody tr');
    linhas.forEach(tr => {
      // Evita duplicar botão
      if (tr.querySelector('.btn-devolver-gig')) return;

      const nome = extrairNome(tr);
      const descricao = extrairDescricao(tr);
      if (!nome) return; // sem nome, sem botão

      const btnTrash = tr.querySelector('[id^="excluir-atividade-"]');
      if (!btnTrash) return;

      const btnEditar = tr.querySelector('[id^="editar-atividade-"]');
      if (!btnEditar) return;

      // Cria o botão
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'btn-devolver-gig mat-focus-indicator mat-tooltip-trigger ' +
        'icone-clicavel mat-icon-button mat-button-base';
      btn.setAttribute('mattooltip', 'Devolver para quem criou ou alterou o GIG');
      btn.setAttribute('aria-label', 'Devolver para quem criou ou alterou o GIG');
      btn.title = `Devolver para: ${nome}`;
      
      btn.innerHTML = `
        <span class="mat-button-wrapper">
          <i aria-hidden="true" class="far fa-share-square botao-icone-tabela"></i>
        </span>
        <span matripple="" class="mat-ripple mat-button-ripple mat-button-ripple-round"></span>
        <span class="mat-button-focus-overlay"></span>
      `;
      btn.style.cssText = 'min-width: 20px !important; width: 20px !important; height: 0px !important; padding: 0 !important; margin: 0 !important; line-height: 20px !important;';
      

      btn.addEventListener('click', () => {
        executarDevolucao(btnEditar, nome, descricao);
      });

      // Insere após o botão excluir
      btnTrash.insertAdjacentElement('afterend', btn);
    });
  }

  // ---- Observa mudanças no DOM (Angular renderiza async) ----
  let debounce = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(adicionarBotoes, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Roda imediatamente também
  adicionarBotoes();
})();













//(async ()=> {
//    let testando = 0
//    if (testando !== 1) return
//    let d = await buscarProcesso(3896542, '/partes')
//    let r = d?.PASSIVO
//    for (let j of r){
//        relatar(JSON.stringify(j.documento),'','teste')
//    }
//    //for(let j of d.PASSIVO){
//    //    relatar(JSON.stringify(j),'','teste')
//    //    
//    //}
//    //relatar('Linha 5 do teste: ' + JSON.stringify(dados), '', 'teste')
//    relatar('Tá mudando? ' + JSON.stringify(r), '', 'teste')
//}) ()

//(async ()=> {
//    let testando = 0
//    if (testando !== 1) return
//    let d = []
//    let gigs = await buscarGigs('0011054-19.2025.5.15.0074')
//    relatar('gigs: ' + JSON.stringify(gigs), '', 'teste')  // nova API que traz tudo junto
//    let ativos     = gigs.filter(gig => gig.statusAtividade !== 'Concluído')
//    let concluidos = gigs.filter(gig => gig.statusAtividade === 'Concluído')
//    let descricao = gigs[0]?.tipoAtividade?.descricao || ''
//
//    let temAtivoGab = ativos.some(gig => /GAB.* JU/i.test(gig?.tipoAtividade?.descricao || ''))
//
//    if (temAtivoGab) return  // tem ativo — não interessa
//
//    // Não tem ativo — procura no concluído
//    let gigConcluido = concluidos.find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || '')) || 'Não foi encontrado GIG concluído.'
//    
//        d.push({
//            processo: '0011054-19.2025.5.15.0074',
//            gig:      gigConcluido.tipoAtividade?.descricao || '',
//            status:   gigConcluido.statusAtividade,
//    //    })
//    
//    relatar('ativos: ' + JSON.stringify(ativos), '', 'teste')
//    relatar('concluidos: ' + JSON.stringify(concluidos), '', 'teste')
//    relatar('temAtivoGab: ' + JSON.stringify(temAtivoGab), '', 'teste')
//    relatar('descricao: ' + JSON.stringify(descricao), '', 'teste')
//    relatar('resultado: ' + JSON.stringify(d), '', 'teste')
//}) ()

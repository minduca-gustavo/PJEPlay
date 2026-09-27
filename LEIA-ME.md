# Rota PJE — arquitetura SISE

Refatoração do Rota PJE para a arquitetura da extensão SISE-JT,
mantendo as duas como extensões separadas.

## Regra de ouro

**`modulos/` é cópia literal da pasta do SISE. Nunca edite nada aí.**
Atualização = copiar a pasta por cima, vinda do repositório do SISE.
Se algo do Rota precisar de comportamento diferente do de um módulo,
o lugar é `documento/paginas/pje/rota/nucleo/rota-nucleo.js`.

## Estrutura

```
manifest.json                 short_name "RotaPJE" — sem espaço, senão prefixar() quebra
modulos/                      ← SISE, intocada, atualizável por git
estilos/                      rotapje-*.css, mesma divisão do SISE
imagens/
documento/
  documento.js                ponto de entrada (último script do manifest)
  paginas/
    melhor-leitura/           roda em <all_urls>, independente dos módulos
    pje/
      pje.js                  rota() — guarda de contexto e orquestração
      api/consultas.js        rota_fetch, post, download
      requisicoes/
        xhr.js                mundo MAIN — um único patch, dois eventos
        interceptador.js      metatags via criar_metaTag()
        documento.js          teor do documento (PDF via segundo plano)
      rota/
        nucleo/               rota-nucleo.js, seletores, estado, cache, modelo, movimentar…
        ui/ui.js              componentes; paleta lida do CSS
        botao/                botão Rota, pintura, janelas
        assistentes/          widgets flutuantes
        tarefas/              catálogo e roteiros
        assistente-janela/    janela lateral do modo assistente
navegador/
  segundo-plano.js            protocolo de mensagens do SISE + EXTRAIR_PDF
  compatibilizacao.js         service worker (Chrome)
  paginas/menu/               popup
  paginas/configuracoes/      <funcionalidades> — salvar/carregar pelos módulos
utils/                        ⚠️ AUSENTE — ver pendências
```

## De onde vem cada coisa

Consumido direto de `modulos/`, sem duplicata no Rota:

| Antes (rota/modulos/) | Agora |
|---|---|
| `suspender`, `clicar`, `focar`, `preencher` | `modulos/automacao.js` |
| `selecionar`, `remover`, `estilizar`, `aguardarElemento` | `modulos/dom.js` |
| `rota_cookie` | `cookie_obter` — `modulos/dom.js` |
| criação manual de `<meta>` | `criar_metaTag` — `modulos/dom.js` |
| `JSON.parse` em try/catch | `texto_ou_json` — `modulos/texto.js` |
| `new DOMParser()` | `textoParaDOM` — `modulos/texto.js` |
| `armazenar`, `obterArmazenamento`, `extensao_raiz` | `modulos/navegador.js` |
| `rota_idempotencia` | `criarChaveDeIdempotencia` — `modulos/apis.js` |
| `relatar` (gate por `MODO_DEV`) | `modulos/relatar.js` (gate por tipo) |
| `NAVEGADOR`, `EXTENSAO`, `LOCAL`, `CONFIGURACAO` | `modulos/definicoes.js` |

Sobrou em `rota-nucleo.js` só o que o SISE não tem: `LOG`, `JANELA`,
`normalizar`, `buscaEmTextoMalFormatado`, `confereJanela`,
`comandar`/`obedecer`, `monitorarBody`, `rota_aguardarElemento`
(o do módulo não tem timeout) e as três variantes de preenchimento
que o `preencher()` do módulo não cobre.

## Cores

`estilos/rotapje-cores.css` é a única fonte de verdade. O `ui.js` lê
as variáveis por `getComputedStyle` através de um `Proxy`, então
`UI_CORES.azul` continua funcionando em todo lugar mas resolve para o
CSS. Mudar a identidade visual = editar um arquivo CSS.

## Metatags

Os nomes passaram de `rota-<rotulo>` para `rotapje-<rotulo>` — é o
`prefixar()` do módulo. Use sempre `rota_metaTag_nome(rotulo)`,
nunca o literal.

## Pendências conhecidas

1. **`utils/pdfjs.mjs` e `utils/pdfjs.worker.mjs` não existem.**
   Já faltavam no pacote original. Sem eles, `EXTRAIR_PDF` falha e a
   pintura não classifica documento em PDF.

2. **Referências mortas herdadas** (já quebradas antes da refatoração):
   `htmlParaMarkdown`, `salvarSentenca` (`assistentes/sf-botoes.js`),
   `planilha_executar` (`assistentes/porta-de-entrada.js`),
   `triagem_inicial_bloquearHorarios` (`tarefas/triagem-inicial/roteiro.js`).

3. **`preencher` em textarea — testar.** O `preencher()` do módulo usa
   o descriptor de `HTMLInputElement` fixo; o antigo do Rota escolhia
   entre Input/TextArea/Select. Ponto a observar:
   `nucleo/acoes.js` linha ~46, observação do GIG
   (`[formcontrolname="observacao"]`).

4. **`clicar` sem a espera de 300 ms.** O do Rota tinha
   `await suspender(300)` embutido; o do módulo não. Se alguma
   sequência falhar por ritmo, o conserto é pontual:
   `await suspender(300)` antes da chamada.

5. **`focar` rola a tela.** O do módulo faz
   `scrollIntoView({block:'center', behavior:'smooth'})`. Onde
   atrapalhar: `focar(elemento, false)`.

6. **Evita queda.** Ativo. A alternativa do SISE (bloquear a checagem
   de mudança de perfil) está documentada e comentada no topo de
   `nucleo/evita-queda.js`. As duas não convivem.

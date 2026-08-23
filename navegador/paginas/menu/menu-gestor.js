async function gestao_inicializar() {
    let janela = location.href.includes('navegador/paginas/menu/menu-gestor.htm')
    if (!janela) {
        return
    }
    console.log('%c[Rota PJE]%c Menu Gestão' + JSON.stringify(), LOG.aviso, 'color:inherit')
}
gestao_inicializar()
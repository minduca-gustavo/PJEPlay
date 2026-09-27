function criarChaveDeIdempotencia() {
  return crypto.randomUUID() // 122 bits de entropia, formato padrão UUID v4
}
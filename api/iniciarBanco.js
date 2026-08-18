const banco = require('./src/config/conexaoBanco')
const { alertasIniciais } = require('./src/config/listaGolpes')

// Cria as tabelas do Héstia e remove a tabela de leads antiga
banco.exec(`
  DROP TABLE IF EXISTS leads;

  CREATE TABLE IF NOT EXISTS alertas_golpes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo          TEXT NOT NULL,
    descricao       TEXT NOT NULL,
    regiao          TEXT NOT NULL,
    categoria       TEXT NOT NULL,
    nivel_risco     TEXT NOT NULL CHECK(nivel_risco IN ('verde','amarelo','vermelho')),
    data_publicacao TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_alertas_regiao ON alertas_golpes(regiao);
  CREATE INDEX IF NOT EXISTS idx_alertas_categoria ON alertas_golpes(categoria);

  CREATE TABLE IF NOT EXISTS estatisticas_analise (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_entrada     TEXT NOT NULL CHECK(tipo_entrada IN ('link','texto','pix')),
    risco            TEXT NOT NULL CHECK(risco IN ('verde','amarelo','vermelho')),
    regras_atingidas TEXT DEFAULT NULL,
    criado_em        TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_estatisticas_risco ON estatisticas_analise(risco);
`)

// Semear alertas iniciais apenas se a tabela estiver vazia
const total = banco.prepare('SELECT COUNT(*) AS total FROM alertas_golpes').get().total
if (total === 0) {
  const inserir = banco.prepare(
    'INSERT INTO alertas_golpes (titulo, descricao, regiao, categoria, nivel_risco) VALUES (?, ?, ?, ?, ?)'
  )
  const seedar = banco.transaction((alertas) => {
    for (const a of alertas) inserir.run(a.titulo, a.descricao, a.regiao, a.categoria, a.nivel_risco)
  })
  seedar(alertasIniciais)
  console.log(`${alertasIniciais.length} alertas iniciais cadastrados.`)
}

console.log('Banco de dados do Héstia criado/verificado com sucesso.')
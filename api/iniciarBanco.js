const banco = require('./src/config/conexaoBanco')
const { alertasIniciais } = require('./src/config/listaGolpes')
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })

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
    data_publicacao TEXT DEFAULT (datetime('now','localtime')),
    atualizado_em   TEXT DEFAULT (datetime('now','localtime')),
    fonte           TEXT,
    fonte_url       TEXT,
    data_ocorrencia TEXT,
    situacao        TEXT DEFAULT 'em_monitoramento',
    verificado_em   TEXT
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

  CREATE TABLE IF NOT EXISTS analytics_sessoes (
    id                TEXT PRIMARY KEY,
    primeiro_acesso   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    ultimo_acesso     TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    idioma            TEXT,
    origem            TEXT,
    dispositivo       TEXT,
    navegador         TEXT,
    sistema           TEXT,
    recorrente        INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS analytics_eventos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sessao_id       TEXT,
    tipo            TEXT NOT NULL,
    pagina          TEXT,
    idioma          TEXT,
    detalhes        TEXT,
    criado_em       TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (sessao_id) REFERENCES analytics_sessoes(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_analytics_eventos_tipo ON analytics_eventos(tipo);
  CREATE INDEX IF NOT EXISTS idx_analytics_eventos_criado ON analytics_eventos(criado_em);
`)

const esquemaEstatisticas = banco.prepare(`
  SELECT sql FROM sqlite_master
  WHERE type = 'table' AND name = 'estatisticas_analise'
`).get()
if (esquemaEstatisticas?.sql && !esquemaEstatisticas.sql.includes("'cinza'")) {
  banco.exec(`
    ALTER TABLE estatisticas_analise RENAME TO estatisticas_analise_legado;
    CREATE TABLE estatisticas_analise (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_entrada     TEXT NOT NULL CHECK(tipo_entrada IN ('link','texto','pix')),
      risco            TEXT NOT NULL CHECK(risco IN ('cinza','verde','amarelo','vermelho')),
      regras_atingidas TEXT DEFAULT NULL,
      criado_em        TEXT DEFAULT (datetime('now','localtime'))
    );
    INSERT INTO estatisticas_analise (id, tipo_entrada, risco, regras_atingidas, criado_em)
    SELECT id, tipo_entrada,
      CASE risco WHEN 'verde' THEN 'cinza' ELSE risco END,
      regras_atingidas, criado_em
    FROM estatisticas_analise_legado;
    DROP TABLE estatisticas_analise_legado;
    CREATE INDEX IF NOT EXISTS idx_estatisticas_risco ON estatisticas_analise(risco);
  `)
}

const colunasExistentes = new Set(
  banco.prepare('PRAGMA table_info(alertas_golpes)').all().map((coluna) => coluna.name)
)
if (!colunasExistentes.has('fonte')) {
  banco.exec('ALTER TABLE alertas_golpes ADD COLUMN fonte TEXT')
}
if (!colunasExistentes.has('fonte_url')) {
  banco.exec('ALTER TABLE alertas_golpes ADD COLUMN fonte_url TEXT')
}
if (!colunasExistentes.has('atualizado_em')) {
  banco.exec('ALTER TABLE alertas_golpes ADD COLUMN atualizado_em TEXT')
  banco.prepare("UPDATE alertas_golpes SET atualizado_em = COALESCE(data_publicacao, datetime('now','localtime'))").run()
}
if (!colunasExistentes.has('data_ocorrencia')) banco.exec('ALTER TABLE alertas_golpes ADD COLUMN data_ocorrencia TEXT')
if (!colunasExistentes.has('situacao')) banco.exec("ALTER TABLE alertas_golpes ADD COLUMN situacao TEXT DEFAULT 'em_monitoramento'")
if (!colunasExistentes.has('verificado_em')) banco.exec('ALTER TABLE alertas_golpes ADD COLUMN verificado_em TEXT')

const diasRetencao = Math.max(1, Number.parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10) || 90)
banco.prepare(`
  DELETE FROM analytics_eventos
  WHERE criado_em < datetime('now', '-' || ? || ' days')
`).run(diasRetencao)
banco.prepare(`
  DELETE FROM analytics_sessoes
  WHERE ultimo_acesso < datetime('now', '-' || ? || ' days')
`).run(diasRetencao)

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
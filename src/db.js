// Camada de persistência simples baseada em arquivo JSON (sem dependências nativas).
// Os dados ficam em <userData>/entre-colunas-data.json, gravados de forma atômica.
const fs = require('fs');
const path = require('path');

const EMPTY = {
  meta: { versao: 1 },
  leiloes: [],
  clientes: [],
  lotes: [],
  lances: [],
};

class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'entre-colunas-data.json');
    this.tmp = path.join(dir, 'entre-colunas-data.tmp.json');
  }

  load() {
    try {
      if (!fs.existsSync(this.file)) return structuredCloneSafe(EMPTY);
      const raw = fs.readFileSync(this.file, 'utf8');
      const data = JSON.parse(raw);
      // Garante que todas as coleções existem mesmo em arquivos antigos.
      return { ...structuredCloneSafe(EMPTY), ...data };
    } catch (err) {
      // Em caso de arquivo corrompido, preserva uma cópia e começa limpo.
      try {
        if (fs.existsSync(this.file)) {
          fs.copyFileSync(this.file, this.file + '.corrompido-' + Date.now());
        }
      } catch (_) { /* ignora */ }
      return structuredCloneSafe(EMPTY);
    }
  }

  save(data) {
    const payload = JSON.stringify(data, null, 2);
    fs.writeFileSync(this.tmp, payload, 'utf8');
    fs.renameSync(this.tmp, this.file); // troca atômica
    return true;
  }

  filePath() {
    return this.file;
  }
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = { Store, EMPTY };

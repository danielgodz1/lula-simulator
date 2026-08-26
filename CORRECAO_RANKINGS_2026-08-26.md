# 🔧 Correção do Sistema de Rankings — 26/08/2026

> **Sessão de debugging e correção completa do sistema de gravação de recordes no Lula Simulator.**
> Todos os problemas foram identificados, corrigidos e os dados históricos foram recuperados.

---

## 📋 Resumo Executivo

O sistema de placar parou de registrar scores no ranking após uma atualização nas **Firestore Security Rules**. A causa raiz foi identificada: o `api/score.js` usava a **REST API pública do Firestore sem autenticação**, que passou a ser bloqueada pelas novas regras. Adicionalmente, o `api/sync.js` nunca atualizava os rankings gerais — apenas os perfis dos usuários. Os dados históricos foram recuperados com um endpoint de repair.

---

## 🔍 Diagnóstico — Problemas Encontrados

### Problema 1 — `api/score.js` usava REST API sem autenticação
**Commit:** `fe5a98b`

O arquivo `score.js` fazia chamadas diretas à Firestore REST API **sem token de autorização**:

```js
// ❌ ANTES — sem Authorization header
await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/.../lula_leaderboards_v2/flappy`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: { score: { integerValue: '100' } } })
});
```

Quando as Firestore Rules foram atualizadas para `allow write: if false`, essas chamadas passaram a ser rejeitadas com **HTTP 403**. O problema ficou **oculto** porque o `catch` retornava `{ success: true, fallback: true }` — o frontend achava que funcionou.

**Todas as outras APIs** (`auth.js`, `sync.js`, `social.js`) já usavam o **Firebase Admin SDK** corretamente.

**Fix:** Migração completa do `score.js` para o Admin SDK (`import { db } from './_firebaseAdmin.js'`).

```js
// ✅ DEPOIS — Admin SDK bypassa as rules por design
const userRef = db.collection(collectionName).doc(docId);
await userRef.set(userFields, { merge: true });

const lbRef = db.collection('lula_leaderboards_v2').doc(docName);
await lbRef.set(payload);
```

**Outros bugs corrigidos junto:**
- Removido dead code: segundo `return res.status(200).json(...)` duplicado (linhas 404–411) que nunca executava
- `catch` agora retorna **HTTP 500 real** em vez de `{ success: true, fallback: true }` que escondia erros

---

### Problema 2 — `api/sync.js` nunca atualizava os rankings gerais
**Commit:** `cf07a7f`

O `sync.js` atualizava corretamente:
- ✅ `lula_users_v2` — perfil do usuário (flappyScore, runnerScore, etc.)
- ✅ `lula_leaderboards_v2/flappy_accumulated` — picanhas acumuladas
- ✅ `lula_leaderboards_v2/runner_accumulated` — moedas acumuladas

Mas **nunca** atualizava:
- ❌ `lula_leaderboards_v2/flappy` — ranking geral do Flappy Lula
- ❌ `lula_leaderboards_v2/runner` — ranking geral do Empresário 3D

Por isso, scores apareciam corretamente no perfil do jogador (via sync.js) mas **não no ranking** (que dependia exclusivamente do score.js, que estava quebrado).

**Fix:** Adicionada a função `updateGeneralLeaderboards()` no `sync.js` que atualiza os rankings gerais a cada sincronização de perfil, criando **dupla redundância** com o `score.js`.

Também foram corrigidos na refatoração:
- Função `updateLeaderboardDoc()` reutilizável para todos os boards
- Campos `countryName` e `flag` adicionados nas entradas do leaderboard acumulado (antes ausentes)
- Verificação `shouldUpdate` para evitar gravações desnecessárias

---

### Problema 3 — Dados históricos no leaderboard estavam desatualizados
**Commits:** `cf07a7f`, `dc031a0`, `f191593`

Como o `score.js` estava quebrado há algum tempo, o `lula_leaderboards_v2/flappy` e `/runner` estavam desatualizados ou vazios, enquanto os perfis (`lula_users_v2`) tinham os scores corretos.

**Fix:** Criado o endpoint `api/repair-leaderboard.js` — um utilitário administrativo protegido por `REPAIR_SECRET` que:

1. Lê todos os perfis em `lula_users_v2` (fonte primária)
2. Lê todos os docs em `lula_scores_v2` e `lula_runner_scores_v2` (fonte secundária — usuários sem conta)
3. **Lê o leaderboard existente** e mescla (nunca perde dados já presentes)
4. Mantém sempre o **maior score por jogador** entre todas as fontes
5. Grava o resultado final em `lula_leaderboards_v2/flappy` e `/runner`
6. Suporta **banimento de jogadores trapaceiros** via `?ban=NomeDoJogador`

**Resultado do repair executado:**
- **Flappy Lula:** 108 jogadores restaurados. #1: Victor22 (1.953 pts)
- **Empresário 3D:** 66 jogadores restaurados. #1: camisinho (12.947 km)

---

## 🛡️ Segurança — Injeção de Score

Foi identificado que um usuário (`JonesOPatriotaFacho`) havia injetado um score de **9.999 pts** via console do navegador quando o site ainda não tinha Firestore Rules configuradas.

**Por que não é mais possível:**

| Proteção | Descrição |
|---|---|
| **Firestore Rules** | `allow write: if false` em todas as coleções — cliente nunca escreve diretamente |
| **HMAC Session Token** | Cada partida exige token assinado pelo servidor com `SESSION_SECRET`. Sem o segredo, impossível forjar |
| **Token expira em 10 min** | Tokens não podem ser gerados antecipadamente |
| **Mínimo de 300ms** | Anti-spam: token usado < 300ms após criação é rejeitado |
| **Score máximo: 50.000** | Valores absurdos são rejeitados pelo servidor |

O jogador trapaceiro foi banido do ranking via:
```
POST /api/repair-leaderboard?key=REPAIR_SECRET&ban=JonesOPatriotaFacho
```

---

## 📁 Arquivos Modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `api/score.js` | MODIFY | REST API → Firebase Admin SDK; removido dead code; catch retorna 500 real |
| `api/sync.js` | MODIFY | Adicionado `updateGeneralLeaderboards()`; refatorado `updateLeaderboardDoc()` |
| `api/repair-leaderboard.js` | NEW | Endpoint de repair/reconstrução dos rankings com suporte a ban |
| `firestore.rules` | MODIFY | Comentários atualizados com mapa de rotas; `historico_acessos` agora bloqueado para leitura |

---

## 📦 Commits da Sessão

| Hash | Mensagem |
|---|---|
| `fe5a98b` | `fix(score): migrar REST API sem auth para Firebase Admin SDK` |
| `55f9fbb` | `chore(firestore): atualizar rules com mapa de rotas Admin SDK e corrigir historico_acessos` |
| `cf07a7f` | `fix: adicionar repair-leaderboard e corrigir sync.js para atualizar rankings gerais` |
| `dc031a0` | `fix(repair): garantir zero perda de dados — mescla leaderboard existente antes de sobrescrever` |
| `f191593` | `fix(repair): adicionar parametro ?ban= para remover jogadores trapaceiros do ranking` |

---

## 🔄 Fluxo de Gravação de Score (Pós-Correção)

```
Partida termina
      │
      ├─► /api/score (POST)
      │     ├── Valida HMAC Session Token
      │     ├── Admin SDK → lula_scores_v2/{player}      (score individual)
      │     ├── Admin SDK → lula_leaderboards_v2/flappy  (ranking geral)
      │     ├── Admin SDK → lula_leaderboards_v2/flappy_weekly  (ranking semanal)
      │     └── Admin SDK → lula_leaderboards_v2/flappy_accumulated (acumulado)
      │
      └─► /api/sync (POST) — ao sincronizar perfil
            ├── Admin SDK → lula_users_v2/{player}       (perfil)
            ├── Admin SDK → lula_leaderboards_v2/flappy  (ranking geral) ← NOVO
            ├── Admin SDK → lula_leaderboards_v2/runner  (ranking geral) ← NOVO
            ├── Admin SDK → lula_leaderboards_v2/flappy_accumulated
            └── Admin SDK → lula_leaderboards_v2/runner_accumulated
```

**Dupla redundância:** mesmo que um caminho falhe, o outro garante o registro.

---

## 🛠️ Como usar o Endpoint de Repair (Para o Futuro)

### Variável de ambiente necessária (Vercel)
```
REPAIR_SECRET = sua_chave_secreta_forte
```

### Dry-run (só lê, não modifica)
```
GET https://www.lulasimulator.com.br/api/repair-leaderboard?key=SUA_CHAVE
```

### Executar repair completo
```js
// No console do navegador em lulasimulator.com.br:
fetch('/api/repair-leaderboard?key=SUA_CHAVE', { method: 'POST' })
  .then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))
```

### Banir jogador trapaceiro + repair
```js
fetch('/api/repair-leaderboard?key=SUA_CHAVE&ban=NomeDoTrapaceiro', { method: 'POST' })
  .then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))
```

### Banir múltiplos jogadores
```
?key=SUA_CHAVE&ban=Jogador1&ban=Jogador2&ban=Jogador3
```

> **O repair é sempre seguro** — é aditivo (nunca remove dados legítimos) e pode ser executado quantas vezes quiser.

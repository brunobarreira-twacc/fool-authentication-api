---
name: code-review
description: >
  Revisão autônoma de MR GitLab cobrindo correctness, SOLID, GoF,
  arquitetura, nomenclatura, segurança e qualidade de testes.
  Carrega spec e contexto Jira automaticamente. Posta comentários inline
  (medium+) e cria cards de tech debt no Jira após confirmação do usuário.
argument-hint: <GitLab MR URL>
user-invocable: true
metadata:
  author: local
  version: "2.0"
---

# Code Review Skill

Revisão autônoma e multi-ângulo de um MR do GitLab com 10 ângulos de análise, verificação adversarial com multi-voto para findings críticos, detecção de re-review, carregamento automático de spec e contexto Jira, e criação de cards de tech debt após confirmação do usuário.

---

## Passo 1 — Parse da URL do MR

A partir do argumento `$ARGUMENTS`, extrair:
- `{mr_url}` — URL completa fornecida
- `{repo_path}` — caminho do projeto GitLab (ex: `latamairlines/lyca/eloyalty/engage-to-thrive/missions/bff-missions`)
- `{mr_iid}` — número do MR (ex: `72`)
- `{repo_encoded}` — `{repo_path}` com cada `/` substituído por `%2F`

Se o argumento estiver vazio ou não for uma URL GitLab válida com número de MR, perguntar ao usuário:

> **Qual o MR que deseja revisar? Informe a URL completa do GitLab ou apenas o número do MR (ex: 72).**
>
> *(Exemplo: `https://gitlab.com/latamairlines/.../bff-missions/-/merge_requests/72`)*

Aguardar a resposta antes de prosseguir. Se o usuário informar apenas o número, solicitar também o repositório caso não seja possível inferir pelo contexto do diretório de trabalho atual.

---

## Passo 2 — Coleta de dados do MR (paralelo)

Executar **em paralelo** via Bash:

```bash
# Metadados do MR
glab api "projects/{repo_encoded}/merge_requests/{mr_iid}" --method GET

# Diff completo
glab mr diff {mr_iid} --repo {repo_path}

# Comentários/discussões existentes (para detectar re-review)
glab api "projects/{repo_encoded}/merge_requests/{mr_iid}/discussions" --method GET
```

Do resultado do `glab api` de metadados, extrair:
- `diff_refs.base_sha` → `{base_sha}`
- `diff_refs.head_sha` → `{head_sha}`
- `diff_refs.start_sha` → `{start_sha}`
- `title`, `author.name`, `source_branch`, `description`

### Detecção de ticket Jira
Se `{source_branch}` contiver o padrão `[A-Z]+-[0-9]+` (ex: `feature/ESTRIV-2725`), extrair `{jira_ticket}` (ex: `ESTRIV-2725`). Caso contrário, `{jira_ticket}` = null.

### Detecção de re-review
Nos comentários retornados, procurar discussões cujo body contenha `Gerado por \`/code-review\` skill`. Se encontradas, `{is_rereview}` = true e extrair os findings já comentados (arquivo + linha) para uso no Passo 8.

Se `glab` retornar erro de autenticação, instruir o usuário a executar `glab auth login` e encerrar.

---

## Passo 3 — Carregar convenções e contexto do projeto

Buscar **em paralelo** no diretório de trabalho atual:

1. **Regras de código**: `CLAUDE.md`, `CONTEXT.md` (raiz e subpastas imediatas)
2. **ADRs**: arquivos em `docs/adr/` relevantes para os arquivos do diff
3. **Spec do ticket**: se `{jira_ticket}` foi extraído, buscar `specs/{jira_ticket}/` — carregar `plan.md` e `spec.md` se existirem
4. **Tamanho do diff**: contar linhas adicionadas/removidas por arquivo para priorização

Anotar as regras encontradas para uso nos ângulos. Se `specs/{jira_ticket}/` existir, extrair:
- ACs (acceptance criteria) listados
- Componentes descritos no plan
- Restrições e regras de design declaradas

---

## Passo 4 — Carregar contexto Jira (se `{jira_ticket}` não for null)

Usar o MCP Jira (Atlassian) para buscar o ticket `{jira_ticket}` no projeto Jira:
- Descrição e sumário do ticket
- ACs detalhados
- Labels e tipo (Bug, Story, Task)

Se o MCP Jira não estiver disponível ou o ticket não for encontrado, prosseguir sem contexto Jira (não é bloqueante).

Combinar o contexto Jira com o da spec local (Passo 3) para ter a visão completa do que o MR deveria fazer.

---

## Passo 5 — Review multi-ângulo (10 agentes em paralelo)

Usar o **Agent tool** para disparar os 10 ângulos abaixo **em uma única mensagem** (todos simultâneos).

### ⚠️ Regra crítica de isolamento dos agentes

Cada prompt de agente **DEVE incluir o diff completo inline** (copiado do Passo 2) e as convenções do projeto (copiadas do Passos 3-4). Os agentes analisam **exclusivamente o que está no próprio prompt**.

**Regra para 9 dos 10 ângulos (A, B, D, E, F, G, H, I, J):**
> "Analise SOMENTE o diff fornecido neste prompt. NÃO use ferramentas de leitura de arquivos, NÃO navegue pelo filesystem. Suas evidências devem vir exclusivamente do código no diff."

**Exceção — Ângulo C (Cross-file):** pode usar grep/read, mas **somente dentro do diretório do projeto do MR** — não explorar outros projetos no workspace.

### Severidade máxima por agente

Agentes retornam no máximo `high` como severidade máxima. O label `critical` é reservado para o Passo 7 (pós-verificação adversarial). Isso evita alarme falso antes da validação.

Cada agente retorna até **6 findings candidates** em JSON:
```json
{"file": "caminho/relativo/arquivo", "line": N, "severity": "high|medium|low",
 "category": "...", "summary": "1 frase", "failure_scenario": "entradas → saída errada",
 "suggestion": "como corrigir"}
```

---

### Ângulo A — Correctness
Analise SOMENTE o diff. Leia o diff linha a linha. Para cada hunk, analise a função envolvente completa. Pergunte para cada linha: que entrada, estado, timing ou plataforma faz essa linha estar errada? Busque: condições invertidas, off-by-one, null/undefined deref, exceção engolida em catch, resultado de erro cacheado indevidamente, operação não atômica, ordem de inicialização errada em beans Spring.

### Ângulo B — Removed behavior
Analise SOMENTE o diff. Para cada linha **deletada** ou substituída, nomear o invariante ou comportamento que ela enforçava. Buscar onde esse invariante é re-estabelecido no novo código. Se não encontrar: candidate.

### Ângulo C — Cross-file impact *(único ângulo que pode usar grep/read no projeto local)*
Para cada função/símbolo modificado no diff, usar grep para buscar callers no diretório local do projeto (se disponível). Verificar se a mudança quebra algum call site. Verificar também: se o projeto tem `@Bean` definidos em outros lugares que conflitem com os novos. **Restringir toda busca ao diretório do projeto do MR — não explorar outros projetos no workspace.**

### Ângulo D — SOLID
Analise SOMENTE o diff e as convenções fornecidas.
- **SRP**: lógica que não pertence à classe foi adicionada?
- **OCP**: `if/switch` hardcoded onde extensão seria melhor?
- **LSP**: subclasse/implementação viola contrato da interface?
- **ISP**: interface gorda adicionada?
- **DIP**: classe de domínio passou a depender de implementação concreta de infraestrutura?

### Ângulo E — GoF Design Patterns
Analise SOMENTE o diff. Avalie exclusivamente o código presente no diff.
- Padrão aplicado incorretamente
- Oportunidade perdida visível no diff: if/else → Strategy, criação complexa → Builder, cache inline → Proxy
- Anti-padrão: Magic Number, Primitive Obsession, Anemic Domain Model

### Ângulo F — Arquitetura e Camadas
Analise SOMENTE o diff e as convenções fornecidas.
- Classes de domínio importando classes de infraestrutura ou de apresentação?
- Adapter/Client em pacote errado?
- Lógica de negócio em Controller ou Feign Client?
- Dependência circular entre pacotes?
- Interface de domínio retornando tipo de camada superior?

### Ângulo G — Nomenclatura e Linguagem de Domínio
Analise SOMENTE o diff e as convenções fornecidas.
- Nomes semanticamente invertidos
- Nomes inconsistentes com linguagem de domínio
- Abreviações ambíguas, nomes genéricos demais
- Convenção de nomenclatura diferente da estabelecida (testes: `{sut}_{condOrAction}_{expectedBehavior}`)

### Ângulo H — Segurança (OWASP Top 10)
Analise SOMENTE o diff e as convenções fornecidas.
- **A01** Broken Access Control: endpoint sem validação de autorização, path param não validado contra JWT
- **A02** Cryptographic Failures: PII logado, retornado ou cacheado com chave incorreta
- **A03** Injection: header injetável, concatenação perigosa em queries ou cache keys
- **A05** Security Misconfiguration: cache ou CB com valores inseguros por padrão
- **A09** Logging: exceção swallowed sem log, log com dados sensíveis, PII em stack traces

### Ângulo I — Qualidade dos Testes
Analise SOMENTE o diff e as convenções fornecidas.
- Casos de borda faltando: null, empty, falha transitória, retorno silencioso vs. exceção
- Estado compartilhado entre testes
- Mock na camada errada
- Teste que passa por razão errada
- Nome do teste não descreve o cenário (verificar convenção do projeto)

### Ângulo J — Spec vs. Implementação *(ativo apenas se spec ou Jira context foram carregados)*
Analise SOMENTE o diff e a spec/contexto Jira fornecidos no prompt.
- Cada AC listado na spec está implementado?
- Restrições declaradas na spec (ex: "no FFN in logs", "cache independente do CB") foram respeitadas?
- Componentes descritos no plan existem com as responsabilidades corretas?
- Há funcionalidade implementada que está fora do escopo declarado?

Se nenhuma spec foi carregada, retornar `{"candidates": []}`.

---

## Passo 6 — Dedup e Verificação Adversarial

### 6.1 — Deduplicar
Agrupar candidates que apontam para a mesma linha e mecanismo, mantendo o com `failure_scenario` mais concreto.

### 6.2 — Verificação adversarial com multi-voto

Para cada candidate restante, rodar **agentes verificadores** via Agent tool (em paralelo). Os verificadores recebem o diff completo inline e o candidate. **Instrução: tentar refutar o finding analisando SOMENTE o código fornecido — NÃO acessar filesystem.**

| Severidade do candidate | Nº de verificadores | Critério de aprovação |
|---|---|---|
| `high` | 2 verificadores independentes | Ambos concordam (CONFIRMED/PLAUSIBLE) |
| `medium` | 1 verificador | CONFIRMED ou PLAUSIBLE |
| `low` | 1 verificador | CONFIRMED ou PLAUSIBLE |

Cada verificador retorna exatamente um de:
- `CONFIRMED` — consegue nomear entradas/estado que disparam o problema e a saída errada
- `PLAUSIBLE` — mecanismo é real, trigger é incerto (timing, env, config)
- `REFUTED` — o código não diz isso, ou está guardado em outro lugar (citar a linha que prova)

Descartar findings onde **maioria** retorna REFUTED. Manter CONFIRMED e PLAUSIBLE.

### 6.3 — Check de padrão existente (SOLID e Arquitetura)
Para cada finding CONFIRMED de categoria SOLID ou Arquitetura, usar Bash para verificar se o mesmo padrão já existe no projeto:
```bash
grep -r "NomeDaClasseConcreta" {project_dir}/src/main/java --include="*.java" -l | head -5
```
Se o padrão for encontrado em 2+ arquivos pré-existentes ao diff, reduzir o finding para `low` e anotar: "padrão existente no projeto — não violação nova introduzida por este MR".

---

## Passo 7 — Calibração de severidade final

Elevar para `critical` **apenas** findings que satisfaçam **todos** os critérios:
1. Veredicto CONFIRMED (não PLAUSIBLE)
2. Mecanismo de falha é acionável em produção sem configuração especial
3. Impacto: vazamento de dados, indisponibilidade, ou corrupção de estado persistente

Descartar findings PLAUSIBLE que já foram comentados em review anterior (`{is_rereview}` = true e linha já comentada). Limitar a **10 findings no total**, mantendo os de maior severidade.

---

## Passo 8 — Apresentar resumo ao usuário

```
## Code Review — MR #{mr_iid}: {title}
Autor: {author} | Branch: {source_branch}
Ângulos: Correctness · Removed Behavior · Cross-file · SOLID · GoF · Arquitetura · Nomenclatura · Segurança · Testes · Spec
{Se re-review: "⟳ Re-review: {N} findings do review anterior já comentados foram filtrados"}
{Se jira_ticket: "📋 Contexto Jira: {jira_ticket} carregado"}

### 🔴 Critical (N)
- `file:line` [Category] — Summary
  Cenário: ...

### 🟠 High (N)
- ...

### 🟡 Medium (N)
- ...

### 🔵 Low (N) — resumo apenas, não será postado
- ...

──────────────────────────────────────────
Total confirmados: X | Postáveis no GitLab (medium+): Y | Cards de tech debt possíveis: Z
```

---

## Passo 9 — Confirmação de comentários GitLab

Perguntar ao usuário:

> **Postar {Y} comentários inline no MR #{mr_iid}? [S]im / [N]ão**

- Se `n`: anotar que comentários não foram postados. Prosseguir para Passo 11.
- Se `s`: executar Passo 10, depois prosseguir para Passo 11.

---

## Passo 10 — Postar comentários inline (medium+) *(condicional)*

Para cada finding confirmado de severidade `critical`, `high` ou `medium`:

```bash
glab api "projects/{repo_encoded}/merge_requests/{mr_iid}/discussions" \
  --method POST \
  --raw-field "body=CONTEÚDO_DO_COMENTÁRIO" \
  --field "position[base_sha]={base_sha}" \
  --field "position[start_sha]={start_sha}" \
  --field "position[head_sha]={head_sha}" \
  --field "position[position_type]=text" \
  --field "position[new_path]={file}" \
  --field "position[new_line]={line}"
```

Formato do comentário:
```
**[{emoji} {category}]** {summary}

**Cenário:** {failure_scenario}

**Sugestão:** {suggestion}

---
*Gerado por `/code-review` skill — verificação adversarial aplicada*
```

Emojis: 🔴 critical · 🟠 high · 🟡 medium

**Fallback**: se retornar 422 (posição inválida), postar como nota geral:
```bash
glab mr note {mr_iid} --repo {repo_path} -m "CONTEÚDO (ref: {file}:{line})"
```

Ao final, postar nota geral de resumo:
```bash
glab mr note {mr_iid} --repo {repo_path} -m "RESUMO"
```

---

## Passo 11 — Confirmação de cards de tech debt

Perguntar ao usuário:

> **Criar {Z} cards de tech debt no Jira (projeto ESTRIV) para os findings confirmados? [S]im / [N]ão**
>
> *(Serão criados para todos os findings confirmados/plausíveis, incluindo os de severidade low)*

- Se `n`: encerrar após salvar o report local (Passo 13).
- Se `s`: executar Passo 12, depois encerrar.

---

## Passo 12 — Criar cards de tech debt no Jira *(condicional)*

Para cada finding CONFIRMED ou PLAUSIBLE, criar uma issue no Jira via MCP Jira:

**Campos do card:**
- **Projeto**: ESTRIV
- **Tipo**: `Bug` para severidade critical/high · `Story` para medium/low
- **Sumário**: `[Tech Debt] {category}: {summary}` (max 80 chars)
- **Descrição**:
  ```
  h3. Finding de Code Review — MR #{mr_iid}

  *Arquivo:* {file}:{line}
  *Severidade:* {severity}
  *Categoria:* {category}
  *Verificação:* {CONFIRMED|PLAUSIBLE}

  h3. Cenário de falha
  {failure_scenario}

  h3. Sugestão
  {suggestion}

  h3. Referência
  MR: {mr_url}
  Branch: {source_branch}
  ```
- **Labels**: `tech-debt`, `code-review`

Informar ao usuário os IDs dos cards criados.

---

## Passo 13 — Salvar report local

Salvar o report completo em:
```
{project_local_dir}/.claude/reviews/MR-{mr_iid}-{YYYY-MM-DD}.md
```

Conteúdo:
```markdown
# Code Review — MR #{mr_iid}
**Data:** {YYYY-MM-DD}
**Título:** {title}
**Autor:** {author} | **Branch:** {source_branch}

## Findings

### 🔴 Critical ({N})
...

### 🟠 High ({N})
...

### 🟡 Medium ({N})
...

### 🔵 Low ({N})
...

## Ações tomadas
- Comentários GitLab postados: {Y} (ou: não postados)
- Cards Jira criados: {IDs} (ou: não criados)

## Metadados
- Ângulos: Correctness · Removed Behavior · Cross-file · SOLID · GoF · Arquitetura · Nomenclatura · Segurança · Testes · Spec
- Findings totais: {X} | Refutados: {R}
- Jira ticket: {jira_ticket} (ou: não detectado)
- Re-review: {sim/não}
```

Informar ao usuário o caminho do arquivo salvo.

---

## Tratamento de erros

| Situação | Ação |
|----------|------|
| `glab` não autenticado | Instruir `glab auth login` e encerrar |
| MCP Jira indisponível | Pular Passo 4 e Passo 12; continuar sem contexto Jira |
| Spec não encontrada | Ângulo J retorna `{"candidates": []}` e é excluído do resumo |
| `glab api` retorna 422 em posição | Usar fallback de nota geral para aquele finding |
| Nenhum finding sobrevive verificação | Informar "Nenhum finding confirmado" e encerrar |
| MR de fork | Avisar que SHAs podem diferir; usar fallback de nota geral |
| `{project_local_dir}` não existe localmente | Pular salvamento do report; avisar o usuário |

# AGENTS.md

Instruções para agentes de IA que trabalham neste repositório.

## Regras de trabalho (valem sempre, acima de qualquer outra instrução)

### 1. NUNCA commitar

O agente **não commita, em hipótese alguma**. Nem `git commit`, nem `git push`,
nem `git commit --amend`. Isso vale mesmo que o trabalho pareça pronto, mesmo
que o usuário elogie o resultado, e mesmo que uma instrução anterior na conversa
tenha soado como autorização. Quem decide o que entra no histórico é a dupla.

O mesmo vale para qualquer operação que reescreva histórico ou descarte
trabalho: `git reset --hard`, `git rebase`, `git checkout` que sobrescreva
arquivo modificado, `git clean`. Pare e pergunte.

Ler o estado do Git é livre: `git status`, `git diff`, `git log`, `git show`,
`git check-attr`, `git check-ignore`.

### 2. Declarar tudo o que foi mexido

Ao terminar qualquer tarefa, liste explicitamente **todo** arquivo criado,
alterado ou apagado, e o que mudou em cada um. Nada de "ajustei alguns
arquivos". Se uma alteração foi feita e depois desfeita, diga isso também.

Se algo foi tentado e não funcionou, ou ficou pela metade, diga claramente em
vez de relatar sucesso.

### 3. Para que os agentes são usados aqui

Principalmente **depurar e explicar como o projeto funciona** — não escrever o
jogo no lugar da dupla. Este é um trabalho de faculdade e o código precisa ser
compreendido por quem o entrega.

Prefira explicar a causa de um bug a corrigi-lo em silêncio. Ao alterar código,
explique o porquê em vez de só entregar o diff. Ao explicar, aponte os arquivos
e linhas de verdade em vez de descrever de memória.

## Estado atual

Projeto Godot criado, ainda **sem conteúdo**: existe `game/project.godot`, mas
não há cena, script nem asset. `game/scenes/`, `game/scripts/` e `game/assets/`
estão vazias (só com `.gitkeep`). Nenhuma cena principal está definida, então
rodar o jogo falha com `Can't run project: no main scene defined` — isso é
esperado até a primeira cena existir.

Trabalho de faculdade em dupla, entregue ao longo de um semestre.

Configuração da engine em `game/project.godot`:

- `config/name="Jogo Curupira"`, features `4.7` + `GL Compatibility`
- **Renderer: `gl_compatibility`**, não Forward+. Decisão para rodar em máquina
  fraca. Trocar isso altera como sprites e luzes 2D aparecem — não mude sem
  combinar com a dupla.
- `3d/physics_engine` e `rendering_device/driver.windows` são defaults da engine
  e não têm efeito aqui (jogo 2D, Linux).

## A Godot abre `game/`, não a raiz

A raiz do repositório contém `docs/` e `art/`, que a engine não deve enxergar.
O projeto Godot vive em `game/`. Todo caminho `res://` resolve a partir de
`game/`, não da raiz.

Godot 4.7.1 stable. Nesta máquina o binário está fora do repositório, um nível
acima (não está no PATH):

```bash
GODOT=../Godot_v4.7.1-stable_linux.x86_64

$GODOT --path game/ --editor                   # abrir o editor
$GODOT --path game/                            # rodar o jogo
```

Para verificar se o projeto está íntegro sem abrir a GUI, use
`--editor --headless --quit`: ela escaneia o filesystem e sai com código 0.
Sem o `--editor`, a engine tenta *rodar* o jogo e sai com código 1 enquanto não
houver cena principal — o que não indica projeto quebrado.

### Agentes: como rodar a Godot sem atrapalhar quem está usando o editor

**Antes de rodar a engine, cheque se o editor já está aberto:**

```bash
pgrep -af Godot
```

Se estiver, **não rode nada contra `game/`**. Duas instâncias escrevendo em
`game/.godot/` ao mesmo tempo disputam o cache do filesystem.

Rodar a engine direto tem dois efeitos colaterais que atingem a máquina do
usuário, fora do repositório:

1. **Abre pop-up na tela dele.** Mesmo com `--headless`, a Godot chama o
   `zenity` para mostrar erro em janela nativa — por exemplo o alerta de cena
   principal ausente. `--headless` não impede isso.
2. **Reescreve `~/.config/godot/editor_settings-4.7.tres`**, que são as
   preferências globais do editor (tema, fonte, atalhos), compartilhadas com
   todos os outros projetos Godot da máquina.

Receita segura: copiar o projeto para fora do repositório, usar um
`XDG_CONFIG_HOME` descartável e tirar o `DISPLAY`.

```bash
TMP=$(mktemp -d)
cp -r game "$TMP/game" && rm -rf "$TMP/game/.godot"

env -u DISPLAY -u WAYLAND_DISPLAY XDG_CONFIG_HOME="$TMP/cfg" \
  "$GODOT" --path "$TMP/game" --editor --headless --quit
```

Sem `DISPLAY` o zenity falha com `Failed to open display` e nenhuma janela
aparece, mas o erro real continua saindo no stderr. O `XDG_CONFIG_HOME` faz a
engine gravar as preferências na pasta temporária em vez das do usuário. E como
o `.godot/` é o da cópia, o cache do projeto de verdade não é tocado.

Confirme com `md5sum` antes e depois que estes dois não mudaram:

```bash
~/.config/godot/editor_settings-4.7.tres
game/.godot/editor/editor_layout.cfg
```

Não há framework de teste configurado. Se for adicionar um, ele entra em
`game/` como plugin da engine.

## Merge de `.tscn` / `.tres` está desligado de propósito

O `.gitattributes` marca `*.tscn`, `*.tres` e `*.import` como `binary`. **Isso é
uma decisão deliberada, não um descuido — não troque para `merge=ours`, `union`
ou merge de texto.**

Motivo: o Git mescla linha a linha e não entende a estrutura interna de uma
cena. Duas edições em regiões distantes do mesmo `.tscn` são mescladas sem
conflito, e o resultado pode ter ids de `ext_resource` duplicados ou nós
apontando para o recurso errado. A cena abre corrompida depois, sem erro no
momento do merge.

`binary` faz o Git parar e exigir escolha manual. O arquivo **não** recebe
marcadores `<<<<<<<`, então continua válido em disco e dá para abrir na engine
antes de decidir:

```bash
git checkout --ours   game/scenes/fase1.tscn
git checkout --theirs game/scenes/fase1.tscn
git add game/scenes/fase1.tscn
```

Consequência prática: conflito em cena significa que alguém refaz o trabalho.
Não existe "resolver mesclando as duas versões" aqui.

Nota: `merge=ours` no `.gitattributes` seria inútil — não existe merge driver
embutido com esse nome, e o `git config` que o definiria não é versionado, logo
não valeria para o outro integrante da dupla.

## Git LFS

`*.png` e `*.kra` passam por LFS. Um clone feito sem `git lfs install` traz
ponteiros de texto no lugar das imagens e a engine não abre. Para verificar:

```bash
file game/assets/*.png   # "PNG image data", não "ASCII text"
```

## Regras de versionamento

- **`.import` é versionado.** Ficam ao lado do asset (`game/assets/x.png.import`).
  Sem eles a Godot reimporta tudo e os UIDs mudam, quebrando as referências nas
  cenas. O `.gitignore` tem `!*.import` explícito — não remova.
- **`game/.godot/` não é versionado.** É cache regenerável da engine.
- O `.gitignore` é de Godot 4. Entradas de Godot 3 (`.import/`, `export.cfg`,
  `export_credentials.cfg`) foram removidas de propósito; não as traga de volta.
- Todas as regras de ignore usam o prefixo `game/` para não afetar `docs/` e `art/`.

## Pipeline de arte

Krita (`.kra`) em `art/source/` → PNG exportado direto em `game/assets/`.
Os PNG **não** são duplicados em `art/`. `art/` é material de trabalho e a
engine nunca o lê.

## Documentação

`docs/gdd.md` (design) e `docs/tdd.md` (técnico) são esqueletos de seções, a
preencher ao longo do semestre. Diagramas `.excalidraw` em `docs/diagrams/`.

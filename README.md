# Curupira

Jogo 2D estilo *boss rush* com o Curupira como personagem principal.
Projeto de faculdade, feito em dupla, entregue ao longo do semestre.

- **Engine:** Godot 4
- **Arte:** Krita (`.kra`), exportada em PNG

## Como abrir

A Godot abre a pasta **`game/`**, não a raiz do repositório — é lá que fica o
`project.godot`. No gerenciador de projetos da Godot: *Import* → selecione
`jogo-curupira/game/project.godot`.

## Estrutura

```
jogo-curupira/
├── docs/
│   ├── gdd.md          Game Design Document
│   ├── tdd.md          Technical Design Document
│   └── diagrams/       .excalidraw
├── art/
│   └── source/         arquivos .kra do Krita (trabalho)
└── game/               <- a Godot abre AQUI
    └── assets/         PNG exportados do Krita
```

Os `.kra` ficam em `art/source/`. Os PNG exportados vão direto para
`game/assets/` — não duplique PNG em `art/`.

## Setup (primeira vez)

**Instale o Git LFS *antes* de clonar.** Sem ele, o clone traz arquivos de
texto com ponteiros do LFS no lugar das imagens, e a Godot não abre nada.

```bash
sudo apt install git-lfs
git lfs install          # uma vez por máquina
git clone <url-do-repo>
cd jogo-curupira
```

Se você já clonou antes de instalar o LFS, dá para consertar sem clonar de novo:

```bash
sudo apt install git-lfs
git lfs install
git lfs pull
```

Para conferir que as imagens vieram de verdade:

```bash
git lfs ls-files         # lista os arquivos sob LFS
file game/assets/*.png   # deve dizer "PNG image data", não "ASCII text"
```

Depois é só abrir `game/project.godot` na Godot 4.

## Merge de cenas

`.tscn`, `.tres` e `.import` estão marcados como `binary` no `.gitattributes`.
O Git **não** tenta mesclar esses arquivos linha a linha: se os dois mexerem na
mesma cena, o merge para e alguém escolhe uma versão inteira.

```bash
git checkout --ours   game/scenes/fase1.tscn   # fica a versão da minha branch
git checkout --theirs game/scenes/fase1.tscn   # fica a versão da outra branch
git add game/scenes/fase1.tscn
```

Isso é intencional: cena da Godot mesclada pela metade abre corrompida na
engine. Para evitar o retrabalho, combinem antes quem mexe em qual cena.

## Regras do repositório

- Os arquivos `.import` **são versionados**. Sem eles a Godot reimporta tudo e
  os UIDs mudam, quebrando as referências nas cenas.
- `game/.godot/` é cache da engine e não vai para o repositório.
- PNG e `.kra` passam pelo LFS automaticamente — é só commitar normal.

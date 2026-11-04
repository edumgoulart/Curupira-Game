# Pendências da dupla

O que um deixou para o outro conferir ou decidir. Quem resolver um item apaga ele daqui
no mesmo commit. Quem deixar algo pendente para o outro, anota aqui.

## Para o Arthur conferir no editor

- **Pixel art ligada nas cenas pelo Claude**, a pedido do Eduardo ("não precisa esperar o
  Arthur"). Se o editor estiver aberto, clicar em "Recarregar" (não em "Salvar novamente").
  - Mudaram: `curupira`, os 4 chefes, `level1..4`, os projéteis e efeitos dos chefes,
    `projectile_base`, `projetil_bola_de_fogo` e `projetil_instinto_selvagem`. O guia está
    em `docs/tdd.md`, seções 9 e 10.
  - Os `*_frames.tres` são gerados por script (`art/pixel/gerar_spriteframes.gd`). É exceção
    à regra do `CLAUDE.md` (SpriteFrames é do Arthur): mudar o desenho no gerador e gerar
    de novo, em vez de editar à mão.
  - As cenas novas usam `ext_resource` só com caminho; o Godot completa os `uid` ao salvar.
- **Formas de colisão.** Ninguém ajustou as formas à arte nova. Com `Debug > Visible Collision Shapes`, conferir:
  - **Curupira:** o desenho tem ~204 px de altura de pé e ~112 px agachado. As cápsulas
    continuam as antigas (raio 30, altura 192), e a agachada é criada pelo código com metade
    da altura (`ALTURA_AGACHADO`, `curupira.gd:30`).
  - **Chefes:** `Hurtbox` e `Contato` de cada um. Na Máquina, os dois ficam no `Nucleo`, que segue a lente.
  - **Ataques:** projéteis e perigos dos chefes (`onda_fogo_mula`, `nota_cuca`, `coracao_boto`, `chapeu_boto`, `placa_maquina` etc.). As formas têm o tamanho aproximado do desenho.
- **Teste de cada luta (F6).** Nada da pixel art foi visto rodando; só passou no teste
  headless (`game/testes/teste_lutas.gd`), que não acusa erro de script. Rodar `level1..4`
  e observar:
  - a âncora: os pés no chão (y = 340) e o Boto na linha d'água;
  - os tiros saindo da mão do Curupira nas 8 direções, dos dois lados, agachado e no ar;
  - os tiros dos chefes saindo do lugar certo: bola da boca da Mula, feitiço da garra da Cuca, jato do bico do Boto, laser da lente da Máquina;
  - a fase 2 (com 2/3 da vida) e a fase 3 (com 1/3) trazendo o ataque novo logo em seguida.

## Decisões em aberto

- **Valores "provisório".** Os ataques novos (pisoteio, investida, bote, ninar, beijos,
  chapéu, pistões, varredura) e os limiares das fases (0,667 e 0,333) estão marcados
  "provisório" nos `*_data.gd`. Fechar no GDD (Q16) depois de testar.
- **Trava de mira.** Ficou no RB / Shift (`aim_lock`), como propõe a Q15 do GDD. Confirmar.
- **Coração do Boto carrega o especial.** Estourar um coração com tiro conta como acerto,
  porque a hurtbox dele está na layer `enemy`. Decidir se é desejado.
- **Regras desatualizadas.** O resumo de regras do `CLAUDE.md` e do `AGENTS.md` ainda diz
  "estado único", "atira para onde está olhando" e que W/S não fazem nada. O GDD e o TDD já
  estão atualizados. A dupla decide quando atualizar.
- **Pulo × tamanho.** O Curupira tem ~204 px de altura e o pulo do GDD, ~215 px. Testar se
  dá para pular por cima dos ataques rasteiros; mudar `velocidade_pulo` é valor de combate e
  tem que sair do GDD.
- **Boto.** O arco do salto (520 px, `boto_data.gd`) foi pensado para o Curupira antigo.
  Testar se ainda passa por cima dele.
- **Durações de pose** (`DURACAO_POSE_ATAQUE` 0,3 s e `DURACAO_POSE_DANO` 0,2 s) estão
  fixas em `curupira.gd`. O `CLAUDE.md` pede valores de ajuste num `.tres`. Mover para o
  `MovimentoData` (`curupira_movimento.tres`)?

## Arte

- **Ataques liberados sem pixel art.** Feitiço Perseguidor, Bolha d'Água, Canhão
  Flamejante, Poção Maldita e Bolha Abissal ainda são `Polygon2D` provisórios. A Bola de
  Fogo do jogador usa a bola da Mula, mas só tem o desenho de lado: na diagonal e para cima
  ela voa de lado. Desenhar no gerador, com uma imagem por direção como a folha.
- **HUD e menus** continuam com a arte antiga. Por isso o filtro padrão do projeto ainda é
  `Linear` (TDD 10.3).
- **Arte antiga sem uso.** Nenhuma cena usa mais estes arquivos de `game/assets/`:
  `boto.png`, `cuca.png`, `mula.png`, `mula_bolas.png`, `curupira_corrida_01..08.png`,
  `curupira_subindo_mao.png`, `curupira_mao_atacando.png`, `fase_boto.png`, `fase_cuca.png`,
  `efeitos/bola_fogo_1..4.png` e `placeholder/` (personagem e tileset). Apagar quando a
  dupla confirmar (o original fica no histórico do Git). `curupira.png`, `titulo.png` e
  `fase_mula.png` continuam em uso no menu.
- **GDD, Q5.** O GDD já registra a pixel art em 480×270 ×4. Conferir se a Q5 (tamanho dos
  sprites) pode ser fechada.

## Repositório

- **Teasers.** `*.mp4` agora vai pelo LFS (`.gitattributes`). Mesmo assim, o commit `4db5d5b`
  ainda guarda os três vídeos inteiros (~205 MB) no histórico, e todo clone baixa esse peso.
  - Tirar de lá exige reescrever o histórico (`git lfs migrate`) e dar force push, então só
    se a dupla decidir junta.
  - O LFS do GitHub tem cota de armazenamento e de banda, e cada versão nova de um teaser
    ocupa espaço lá.
- **Export.** Ao criar o `export_presets.cfg`, incluir `*.json` no filtro de arquivos
  não-recurso, senão os pontos e as âncoras da pixel art somem no build (TDD 10.3).

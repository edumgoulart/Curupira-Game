# Pendências da dupla

O que um deixou para o outro conferir ou decidir. Quem resolver um item apaga ele daqui
no mesmo commit. Quem deixar algo pendente para o outro, anota aqui.

## Para o Arthur conferir no editor

- **Pixel art ligada nas cenas pelo Claude**, a pedido do Eduardo ("não precisa esperar o
  Arthur"). Se o editor estiver aberto, clicar em "Recarregar" (não em "Salvar novamente").
  - Mudaram: `curupira`, os 4 chefes, `level1..4`, os projéteis e efeitos dos chefes,
    `projectile_base`, `projetil_bola_de_fogo` e `projetil_instinto_selvagem`. O guia está
    em `docs/tdd.md`, seções 9 e 10.
  - Na segunda rodada mudaram também os ataques ganhos (feitiço, bolhas, poção, canhão e os
    respingos), o menu e as outras telas (tema, fonte, fundo), as caixas de dano dos chefes e
    a hurtbox do Curupira.
  - Os `*_frames.tres` são gerados por script (`art/pixel/gerar_spriteframes.gd`). É exceção
    à regra do `CLAUDE.md` (SpriteFrames é do Arthur): mudar o desenho no gerador e gerar
    de novo, em vez de editar à mão.
  - As cenas novas usam `ext_resource` só com caminho; o Godot completa os `uid` ao salvar.
- **Caixas de dano.** Ajustadas à arte nova pelo Claude. Conferir com
  `Debug > Visible Collision Shapes`:
  - **Chefes:** `Hurtbox` e `Contato` agora acompanham a pose (a `caixa` de cada animação no
    `.json`). O tamanho é uma fração do desenho, `fracao_hurtbox` e `fracao_contato` no
    `.tres` de cada chefe. A Máquina continua com as caixas fixas no `Nucleo`.
  - **Curupira:** a hurtbox ficou um pouco menor que o corpo (raio 24, altura 172).
  - **Ataques:** `onda_fogo_mula` mais larga (100×72) e `pocao_cuca` com raio 18.
- **Teste de cada luta (F6).** Nada da pixel art foi visto rodando; só passou no teste
  headless (`game/testes/teste_lutas.gd`), que não acusa erro de script. Rodar `level1..4`
  e observar:
  - a âncora: os pés no chão (y = 340) e o Boto na linha d'água;
  - os tiros saindo da mão do Curupira nas 8 direções, dos dois lados, agachado e no ar;
  - os tiros dos chefes saindo do lugar certo: bola da boca da Mula, feitiço da garra da Cuca, jato do bico do Boto, laser da lente da Máquina;
  - a fase 2 (com 2/3 da vida) e a fase 3 (com 1/3) trazendo o ataque novo logo em seguida;
  - os ataques ganhos: com `LIBERAR_TUDO_PARA_TESTE` (`game_state.gd`) todos já aparecem
    na seleção, e a Máquina também. Pôr `false` para testar a progressão de verdade.

## Decisões em aberto

- **Valores "provisório".** Os ataques novos (pisoteio, investida, bote, ninar, beijos,
  chapéu, pistões, varredura) e os limiares das fases (0,667 e 0,333) estão marcados
  "provisório" nos `*_data.gd`. Fechar no GDD (Q16) depois de testar.
- **Trava de mira no controle.** A trava ficou só no Shift, a pedido do Eduardo. No controle
  ela não tem botão (era RB). Escolher um botão (GDD, Q15).
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

- **Bola de Fogo do jogador.** Usa a bola da Mula, que só tem o desenho de lado: na
  diagonal e para cima ela voa de lado. Desenhar no gerador, com uma imagem por direção,
  como a folha.
- **HUD** ainda é desenhado por código (círculos e barra lisos), fora do estilo pixel.
- **Arte antiga.** Foi para `art/antiga/` e saiu do jogo. Só as folhas do dash
  (`game/assets/efeitos/folha.png`) continuam em uso, e por isso o filtro padrão do projeto
  ainda é `Linear`.
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

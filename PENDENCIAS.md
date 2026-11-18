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
  - Na terceira rodada, a pedido do Eduardo: os fundos de Mula, Cuca e Boto foram refeitos
    (16 quadros num laço de 2 s) e a areia do Boto ficou mais estreita, com paredes nas
    beiras (`LimiteAreia*` no `level3`, layer 6 `limite_arena`; o corpo do Curupira agora tem
    máscara 33).
  - Na quarta rodada, a Cuca foi redesenhada de novo. O Eduardo escolheu a versão 3 entre os
    rascunhos (`art/pixel/rascunhos/`): cabeça de jacaré menor com a boca inteiriça, sem
    batom, e um sobretudo ameixa de gola alta com forro vermelho. O chip vai cravado no peito
    e há uma luz vermelha na faixa de metal do chapéu, que se apaga quando o chip salta na
    derrota. A célula da folha agora é 134×120.
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
  - no Boto: o Curupira para nas beiras da areia, os tiros passam até o Boto na água e o
    salto do Boto ainda cai na água do outro lado;
  - a Cuca nova: o feitiço saindo da garra erguida, a poção da mão, as notas da boca, o
    bote deitada e, na derrota, o chip saltando do peito e a luz do chapéu apagando;
  - os tiros saindo da mão do Curupira nas 8 direções, dos dois lados, agachado e no ar;
  - o HUD novo: a barra do chefe enchendo na entrada, o rastro claro a cada golpe, os
    entalhes das fases, o nome do chefe cabendo na tela (o do Boto é o mais longo); o
    coração tremendo ao levar golpe, o retrato mudando de cara e a onça acendendo com o
    especial cheio;
  - os tiros dos chefes saindo do lugar certo: bola da boca da Mula, feitiço da garra da Cuca, jato do bico do Boto, laser da lente da Máquina;
  - a dificuldade: trocar Normal/Expert na seleção (←/→) e conferir as fases. Normal: Mula, Cuca e
    Boto sem troca de fase, Máquina com uma troca na metade. Expert: uma troca na metade (Máquina:
    em 2/3 e 1/3). A barra do chefe mostra os entalhes certos;
  - a transição: o chefe termina o ataque, a tela treme e clareia, os tiros dele somem, ele faz
    a animação de 2 s (continua levando dano) e volta com um combo que tem o ataque novo;
  - a ordem dos ataques variando (não alterna mais A/B) e os combos (dois ataques emendados);
  - o golpe no chefe: pisca branco, faísca onde o tiro bateu, um tranquinho e, parado entre
    ataques, a pose de susto. No Curupira: pisca branco, tela treme e pose de dano;
  - Mula e Cuca: depois da investida e do bote, ficam do outro lado (não voltam de costas) e os
    ataques seguintes saem espelhados. Na transição, a Mula empina e a caixa dela cresce;
    conferir se encostar nela ali é justo;
  - Boto: o jato ora alto (abaixar), ora baixo (pular); o chapéu ora baixo→alto, ora
    alto→baixo;
  - **os avisos dos ataques** (pedido do Eduardo: "não dá pra saber onde vai cair", e depois
    "o quadradão deixa muito fácil"). Saíram as faixas listradas; o aviso é a pose do chefe.
    Conferir em cada luta:
    - Mula, investida: ela agacha e raspa a pata da frente na terra duas vezes, jogando terra
      para trás, e só então corre. Ver se dá para reconhecer a pose a tempo de pular ou dar dash;
    - Mula, meteoros: um brilho pequeno no alto da tela, em cima de onde cada pedra vai cair,
      que cresce e pisca mais rápido, e a pedra saindo dele. Ver se dá para enxergar o brilho
      no fundo de fogo e se ele não fica atrás da barra de vida do chefe;
    - Cuca, Canção de ninar: melodia de 6 notas soltas, grave (laranja, pular) ou aguda (azul,
      abaixar). A antiga não dava para desviar;
    - Boto, jato (pedido do Eduardo: "o jato sai torto" e "não faz sair aquela linha"): sem
      linha. Ele afunda na água até o bico ficar na altura do jato (o baixo deixa só a cabeça
      de fora), a água sai do bico fina e vai crescendo, e o jato sai reto. Ver se dá para ler
      alto/baixo pela altura dele a tempo, e se ele volta para a linha d'água no fim;
    - Boto, chapéu (pedido do Eduardo: "tira o risquinho do chapéu"): sem linha. Ele tira o
      chapéu da cabeça com a nadadeira, puxa o braço para trás e segura, tremendo; ao mesmo
      tempo afunda (ida baixa, só a cabeça e o braço de fora) ou sobe (ida alta). Ver se dá para
      ler a altura pela pose a tempo, se o chapéu sai reto da nadadeira e se ele volta para a
      linha d'água depois de jogar;
    - Boto, rasante (novo): deita para a frente e bate a cauda espirrando água, e atravessa
      baixo e deitado. Ver se dá para diferenciar do mergulho do salto por cima (que afunda
      reto) a tempo de abaixar, e se abaixar no controle é confortável;
    - Máquina: a linha do laser seguindo e travando, e a da varredura;
    - os outros ataques sem marca nenhuma: se a pose de aviso de cada um basta;
    - se os avisos mais longos deixaram as lutas fáceis demais. Os valores antigos estão no
      TDD 8.3.
  - a água em volta do Boto (pedido do Eduardo: "não ficar uma água estática"): anéis abrindo,
    espuma no corpo e gotinhas, azul na margem esquerda e barrenta na direita; respingo quando
    ele afunda, sobe e na saída e chegada do salto. Ver se os anéis aparecem na faixa clara da
    linha d'água e se a espuma não fica estranha quando ele sai da água na transição;
  - Boto mais difícil (pedido do Eduardo):
    - salto por cima: cinco bolhas mais rápidas e balançando mais. Ver se ainda dá para passar
      entre elas;
    - corações: perseguem o Curupira com curva larga e ondulando. O que encosta encanta por
      1 s: o Curupira fica rosa, sobem coraçõezinhos e ele é puxado para o lado do Boto, sem
      andar, abaixar nem dar dash (pula e atira). Ver se é divertido e se dá para despistar;
    - o `verificar_desvio.gd` não acha desvio nos combos que começam com `beijos` quando o
      Curupira está colado na água (x = 480), mas o robô não atira. Se no F6 também for
      injusto, baixar `curva_beijo` ou `quantidade_beijos` (`boto.tres`) ou subir o atraso
      desses combos;
    - para forçar uma forma: `chance_rasante` e `chance_chapeu_invertido` em 0 ou 1 no
      `boto.tres`;
  - se pular por cima dos ataques rasteiros e correr por baixo do salto do Boto é confortável
    no controle. O `verificar_desvio.gd` achou desvio sem dash para todos os ataques sozinhos,
    mas ele joga como um robô;
  - os ataques ganhos: com `LIBERAR_TUDO_PARA_TESTE` (`game_state.gd`) todos já aparecem
    na seleção, e a Máquina também. Pôr `false` para testar a progressão de verdade.

- **Mapa do mundo (F6 em `scenes/mapa.tscn`)**, pedido do Eduardo: escolher o chefe andando até
  ele, como no Cuphead. Novo Jogo e Continuar levam ao mapa; vitória, derrota e pausa da luta
  voltam para ele. Passou no `game/testes/teste_mapa.gd`, mas ninguém jogou. Observar:
  - se andar no controle e no teclado é gostoso (velocidade em `dados/mapa/mapa_ajustes.tres`) e se
    o Curupira vira certo nas 8 direções, sem a de lado ficar bugada;
  - se ele passa atrás das árvores quando está acima do tronco e na frente quando está abaixo, e se
    não fica preso nas beiras (água, mata, troncos, cerca);
  - as quatro entradas: entre as árvores em chamas (Mula), na boca da mata da Cuca com a luz verde,
    na ponta do píer (Boto) e na porta do prédio (Máquina). Aparece o nome e "A / Espaço: entrar";
  - o painel: ataques, dificuldade, "Lutar!" e "Voltar ao mapa" (B também fecha). Depois da luta, o
    Curupira volta para a frente da área, e a bandeira aparece na área vencida;
  - o portão da empresa: com `LIBERAR_TUDO_PARA_TESTE` em `true` ele já vem aberto. Pôr `false` para
    ver o portão com cadeado e o aviso "Portão trancado".
## Decisões em aberto

- **Valores "provisório".** Os ataques novos (pisoteio, investida, bote, ninar, beijos,
  chapéu, pistões, varredura, jato baixo, chapéu invertido, rasante, e no Boto a perseguição
  e o encanto dos corações e as bolhas mais rápidas) estão marcados "provisório" nos
  `*_data.gd`. Os avisos subiram a pedido do Eduardo (TDD 8.3): os que o GDD fixa mudaram lá
  também; os outros (pisoteio, investida, bote, ninar, beijos, chapéu, salto, pistões, placa,
  varredura) são provisórios. As fases e os combos (chance, atraso, pausa, limiares) ficam no
  `.tres` de cada chefe, com a tabela no TDD 8.2. Fechar no GDD (Q16) depois de testar. Depois de mudar um
  combo, rodar `game/testes/verificar_desvio.gd` (TDD 15.3) para ver se ainda dá para desviar.
- **Vitória no Expert.** O Claude assumiu: vencer no Normal já dá os ataques e libera a
  Máquina; o Expert só marca "(derrotada · Expert)" na seleção. Confirmar ou mudar.
- **Trava de mira no controle.** A trava ficou só no Shift, a pedido do Eduardo. No controle
  ela não tem botão (era RB). Escolher um botão (GDD, Q15).
- **Coração do Boto carrega o especial.** Estourar um coração com tiro conta como acerto,
  porque a hurtbox dele está na layer `enemy`. Decidir se é desejado.
- **Regras desatualizadas.** O resumo de regras do `CLAUDE.md` e do `AGENTS.md` ainda diz
  "estado único" (agora são fases por dificuldade, com combos), "atira para onde está olhando",
  que W/S não fazem nada e que a vida do chefe não aparece (agora há barra, a pedido do
  Eduardo). O GDD e o TDD já estão atualizados. A dupla decide quando atualizar.
- **`level_select` sem uso.** O mapa substituiu a tela de seleção; o painel de cada área copiou a
  lógica dela. Apagar `level_select.tscn`/`.gd` ou guardar.
- **Duração da pose de tiro** (`DURACAO_POSE_ATAQUE` 0,3 s) está fixa em `curupira.gd`. O
  `CLAUDE.md` pede valores de ajuste num `.tres`. Mover para o `MovimentoData`
  (`curupira_movimento.tres`)? A pose de dano agora dura o tempo da animação `dano` (0,33 s);
  `DURACAO_POSE_DANO` só vale se ela faltar.

## Arte

- **Animações sem uso.** `trote` (Mula) e `andar` (Cuca) saíram do código, porque os dois não
  voltam mais para o lugar. Continuam na folha. Apagar do gerador ou guardar para depois.
- **Animações novas** (gerador): `dano` (susto, 4 quadros) e `transicao` (24 quadros, 2 s) nos
  quatro chefes, `dano` novo do Curupira (5 quadros) e a faísca de acerto
  (`curupira/efeitos/acerto_1..6.png`).
- **Bola de Fogo do jogador.** Usa a bola da Mula, que só tem o desenho de lado: na
  diagonal e para cima ela voa de lado. Desenhar no gerador, com uma imagem por direção,
  como a folha.
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

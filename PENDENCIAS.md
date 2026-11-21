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
  - a dificuldade: trocar Normal/Expert no painel do mapa (←/→) e conferir as fases. Normal: Mula, Cuca e
    Boto sem troca de fase, Máquina com uma troca na metade. Expert: Cuca e Boto com uma troca na
    metade, Máquina em 2/3 e 1/3, Mula sem troca. A barra do chefe mostra os entalhes certos;
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
    no painel do mapa, e a Máquina também. Pôr `false` para testar a progressão de verdade.

- **Mapa do mundo (F6 em `scenes/mapa.tscn`)**, pedido do Eduardo: escolher o chefe andando até
  ele, como no Cuphead. Novo Jogo e Continuar levam ao mapa; vitória, derrota e pausa da luta
  voltam para ele. Passou no `game/testes/teste_mapa.gd`, mas ninguém jogou. Observar:
  - se andar no controle e no teclado é gostoso (velocidade em `dados/mapa/mapa_ajustes.tres`) e se
    o Curupira vira certo nas 8 direções, sem a de lado ficar bugada;
  - se ele passa atrás das árvores quando está acima do tronco e na frente quando está abaixo, e se
    não fica preso nas beiras (água, mata, troncos, cerca);
  - as quatro entradas: na beira da mata em chamas (Mula), na beira da mata da Cuca, com o
    caldeirão e a luz verde ao lado, na ponta da praia do encontro das águas (Boto) e na porta do
    prédio (Máquina). Aparece o nome e "A / Espaço: entrar". Os becos para dentro da mata da Mula e
    da Cuca saíram (pedido do Eduardo: "tira essas covas"; neles dava para sair do raio e não
    conseguir mais entrar na luta);
  - o painel: ataques, dificuldade, "Lutar!" e "Voltar ao mapa" (B também fecha). Depois da luta, o
    Curupira volta para a frente da área, e a bandeira aparece na área vencida;
  - o portão da empresa: com `LIBERAR_TUDO_PARA_TESTE` em `true` ele já vem aberto. Pôr `false` para
    ver o portão com cadeado e o aviso "Portão trancado".
  - **Mapa refeito** (pedido do Eduardo: "o Curupira tá grande perto das árvores", "o píer do Boto
    não faz sentido"). Agora tem 1440×810, três telas de 480×270, e a câmera segue o Curupira com
    a mesma escala de antes. Conferir:
    - se as árvores maiores e da Amazônia (castanheira, embaúba, açaí, buriti, samaúma no centro)
      ficaram na proporção certa com o Curupira, e se a copa fica meio transparente quando ele
      passa atrás;
    - a velocidade, que subiu de 64 para 84 (`mapa_ajustes.tres`);
    - o encontro das águas: o Rio Negro escuro e o Solimões barrento correndo lado a lado sem se
      misturar, e a praia de areia branca onde fica a entrada do Boto;
    - a camada `frente` saiu: o que passa na frente do Curupira agora é objeto com `z` no
      `dados.json`. Ver se nada ficou atrás dele que devia ficar na frente (fumaça, névoa);
    - o fundo tem 16 quadros de 1440×810. Se pesar na memória, dá para baixar para 8 no gerador.
  - **Áreas que mudam e criaturas que conversam** (pedido do Eduardo). Para testar sem lutar, pôr
    as fases em `concluidas` no `game_state.gd` (ou vencer as lutas):
    - antes de vencer: mata da Mula pegando fogo, com brasas e fumaça; névoa e a luz verde no
      caldeirão da Cuca; o Boto de olho vermelho no encontro das águas;
    - depois de vencer: a mata da Mula apagada com brotos e as árvores rebrotando; a névoa some; e
      a criatura aparece livre, sem o chip, perto da sua área. As criaturas estão na mesma
      proporção do combate (reduzidas para 39/52, a razão entre o Curupira do mapa e o da luta);
    - chegar perto dela, por qualquer lado, mostra "A / Espaço: conversar" (o raio agora conta da
      criatura, e não de um ponto na frente dela). A conversa trava o Curupira, escreve letra
      por letra (A completa e depois avança, B fecha) e solta ele no fim;
    - as falas estão em `dados/mapa/conversa_mula.tres`, `conversa_cuca.tres` e
      `conversa_boto.tres` (uma fala por linha, "Quem: texto"), para trocar pelo inspetor.
- **Correções na luta** (pedido do Eduardo):
  - o coração do HUD congelava no meio da piscada depois de um golpe (às vezes cheio, parecendo que
    voltou) e o retrato ficava preso na cara de dor. Levar golpes, com e sem dash, e ver se o
    coração apaga e o retrato volta ao normal;
  - laser e varredura da Máquina: o dano desliga na hora e o raio afina e some em 0,1 s (antes
    sumia de uma vez, no mesmo quadro do dano). No teste quadro a quadro a caixa de dano não durava
    mais que o raio; se no F6 ainda parecer que dura, dizer em que passada (reta ou no chão).
- **Mula rebalanceada (F6 em `level1`)**, pedido do Eduardo ("o Expert tem que dificultar").
  Passou no teste das lutas e no `verificar_desvio.gd` (agora ele testa cada dificuldade com o
  `GameState` certo), mas ninguém jogou. Os números estão no `mula.tres` / `mula_data.gd`:
  - **dano corrigido:** bola de fogo, fogo rastejante, bolha do Boto e nota e feitiço da Cuca às
    vezes encostavam primeiro no corpo do Curupira (maior que a hurtbox) e sumiam sem dar dano.
    Agora só somem no chão e na parede (`Hitbox.e_mundo`). O `game/testes/teste_dano_projeteis.gd`
    passou 8/8 em cada caso (antes: 0 a 5 de 8). Conferir no F6 pulando, caindo e agachando;
  - nos dois níveis: a onda de fogo do pisoteio mais rápida (650 → 800 px/s, `velocidade_onda`)
    e crescendo conforme se afasta da Mula: com 850 px andados fica 3× maior (216 px de altura),
    alta demais para pular, até no máximo 3,5× (`distancia_onda_longe`, `escala_onda_longe`,
    `escala_onda_max`). Ver se dá para perceber que é preciso correr para perto da Mula. O dash
    (invencível) ainda passa por ela, mesmo grande;
  - nos dois níveis: as bolas com a mesma velocidade, mas o espaço entre elas sorteado de 0,35 s até o dobro,
    0,7 s (`intervalo_bolas` e `intervalo_bolas_max`). Ver se dá para ler quando cabe pular
    entre duas e quando é melhor pular por cima de todas ou dar dash;
  - no Expert, uma fase só, com os 4 ataques desde o começo e sem transição; 1600 de vida
    (`vida_extra_expert` = 400). Sem combos: um ataque de cada vez (pedido do Eduardo: com a bola
    alta o Curupira agacha e agachado não anda, então não dava para fugir dos meteoros). O
    painel do mapa diz "Uma fase · mais rápido · mais vida";
  - no Expert, a Mula 15% mais rápida (`ritmo` = 1,15 na fase: avisos, animações, pausas e
    corrida; os tiros não) e a pausa entre ataques em 0,45 (≈0,5 s). Ver se ficou rápido demais
    para ler as poses de aviso;
  - no Expert, 5 bolas por rajada, altas (abaixar) e baixas (pular) misturadas, com pelo menos
    uma de cada. Pose nova no gerador (`bolas_alto` em `chefes_px.js`; `aviso_bolas_alto`,
    `bolas_alto`, `fim_bolas_alto`, `bolas_sobe` e `bolas_desce` na folha): para a alta ela
    abaixa menos e estica o pescoço para a frente, e troca de pose antes de cada bola que muda
    de altura (o espaço nessa troca é no mínimo 0,55 s). A diferença entre as poses é pequena:
    ver se dá para ler, ou se é melhor ler pela bola;
  - no Expert, a chuva de meteoros: primeiro ela cospe uma rajada de pedras para o céu (~1,2 s,
    2 pedras a cada 0,05 s, em leque; `lancamento_meteoros_expert`). Depois a chuva cobre a arena
    toda, menos perto da Mula (`zona_livre_mula_expert` = 220 px), em duas ondas: a primeira a
    cada 300 px a partir do Curupira, com os brilhos acendendo do mais perto dele ao mais longe;
    a segunda, nos vãos, só começa a brilhar (fraco) quando a primeira começa a cair, e cai 1 s
    depois (`aviso_segunda_onda_expert`). Ver se dá para diferenciar as duas ondas e ler onde
    ficar;
- **Carta de derrota (F6 em `level1..4`, perder de propósito)**, pedido do Eduardo, no estilo do
  Cuphead. Passou no `game/testes/teste_derrota.gd`, mas ninguém jogou. Observar:
  - a carta descendo; o retrato do chefe de frente, rindo (olho e fogo vermelhos do chip);
  - a frase de deboche sorteada cabendo na carta (as compridas usam a letra menor). As frases estão
    em `frases_derrota` no `.tres` de cada chefe (`dados/chefes/`);
  - a trilha: o Curupira correndo até onde chegou na vida do chefe, os entalhes das fases e o
    chip na ponta;
  - "Tentar de novo" e "Voltar para o mapa" no controle e no teclado.
- **Cenas de abertura (F6 em `scenes/abertura.tscn`, ou Novo Jogo no menu)**, pedido do Eduardo.
  Quatro imagens paradas com uma frase embaixo, antes do mapa. Passou no
  `game/testes/teste_abertura.gd`, mas ninguém jogou. Observar:
  - se A / Espaço / Enter avança uma cena por vez e Start / Esc pula direto para o mapa, no
    controle e no teclado; o Continuar não passa por elas;
  - se a troca (escurece e clareia em 0,3 s) não fica lenta nem rápida demais;
  - os desenhos (gerador, `art/pixel/gerador/abertura_px.js`): o Curupira com o broto; o trator
    derrubando a mata e o olho vermelho da IA no data center; a Máquina ligando os chips da Mula,
    da Cuca e do Boto na câmara; o Curupira partindo ao amanhecer, com o incêndio, a mata da
    Cuca, o rio e a empresa no horizonte;
  - os textos estão em `dados/abertura.tres`, para trocar pelo inspetor.
- **Animações de tiro e dos especiais (F6 em `level1..4`)**, pedido do Eduardo. Passou no
  `game/testes/teste_especiais.gd`, mas ninguém jogou. Observar:
  - o tiro: a mão dá o coice só quando sai um tiro, no ritmo do ataque (Bola de Fogo e Bolha
    d'Água devagar, Folha rápido), e fica firme entre um tiro e outro. Com a mira travada (Shift /
    L2) sem atirar, a mão não mexe. Correndo, ver se o coice aparece sem a passada engasgar;
  - os quatro especiais têm gesto próprio: onça (puxa as mãos para trás e empurra rugindo), Canhão
    (pernas abertas, mãos juntas tremendo, fumaça no fim), Poção (arma o braço e arremessa) e Bolha
    (bolha entre as palmas e empurra). Cada um na frente, na diagonal para cima, para cima e
    agachado. A animação antiga `especial` saiu da folha;
  - mirando para cima ou na diagonal para cima, o especial sai nessa direção. Diagonal e cima no
    chão: cima + frente ou só cima; agachado sai rente ao chão; o resto vai para a frente;
  - **muda o jogo:** o golpe sai depois de um preparo de 0,2 s, e o Curupira fica parado durante
    o especial (antes só no Canhão). A volta (~0,3 s) é interrompida por andar, pular, dash ou
    tiro. O feixe do Canhão também espera esse preparo. Ver se ficou lento ou injusto; o tempo é o
    fps das animações `especial_*` (gerador, `ESPECIAIS_PX` em `poses_px.js`);
  - o feixe do Canhão na diagonal é a arte girada (como o laser da Máquina); ver se fica feio;
  - no ar o especial usa a mesma pose de pé (cai junto, como o Canhão já fazia);
  - a onça para cima e na diagonal tem desenho próprio (`onca_cima`, `onca_diag_cima`).
- **Decisões da v1.0 (GDD e TDD), para conferir no F6:**
  - a trava de mira no **L2** do controle (o Shift continua no teclado);
  - o jogo abrindo em **tela cheia**;
  - estourar um coração do Boto com tiro **não** enche mais a barra do especial (acertar o
    Boto continua enchendo);
  - a tela antiga `level_select` foi apagada: o menu leva ao mapa como antes.

## Decisões em aberto

Nenhuma. As decisões fechadas estão no GDD (Questões em aberto → Resolvidas) e no TDD (seção 19).
Se um valor mudar no teste, atualizar o `.tres` e o GDD juntos e rodar
`game/testes/verificar_desvio.gd` (TDD 15.3) para ver se ainda dá para desviar.

## Arte

- **Animações novas** (gerador): `dano` (susto, 4 quadros) e `transicao` (24 quadros, 2 s) nos
  quatro chefes, `dano` novo do Curupira (5 quadros) e a faísca de acerto
  (`curupira/efeitos/acerto_1..6.png`).
- **Bola de Fogo do jogador.** Usa a bola da Mula, que só tem o desenho de lado: na
  diagonal e para cima ela voa de lado. Desenhar no gerador, com uma imagem por direção,
  como a folha.
- **Arte antiga.** Foi para `art/antiga/` e saiu do jogo. Só as folhas do dash
  (`game/assets/efeitos/folha.png`) continuam em uso, e por isso o filtro padrão do projeto
  ainda é `Linear`.

## Repositório

- **Teasers.** `*.mp4` agora vai pelo LFS (`.gitattributes`). Mesmo assim, o commit `4db5d5b`
  ainda guarda os três vídeos inteiros (~205 MB) no histórico, e todo clone baixa esse peso.
  - Tirar de lá exige reescrever o histórico (`git lfs migrate`) e dar force push, então só
    se a dupla decidir junta.
  - O LFS do GitHub tem cota de armazenamento e de banda, e cada versão nova de um teaser
    ocupa espaço lá.
- **Export.** Ao criar o `export_presets.cfg`, incluir `*.json` no filtro de arquivos
  não-recurso, senão os pontos e as âncoras da pixel art somem no build (TDD 10.3).

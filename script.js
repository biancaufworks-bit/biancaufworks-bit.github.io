/* =========================================================
   Portfólio da Bianca: script
   ========================================================= */

// ---------- CONFIGURAÇÃO: troque aqui ----------
const CONFIG = {
  // Seu usuário do GitHub (ex.: "bianca-dev"). Deixe "" para ver os projetos de exemplo.
  githubUsuario: "biancaufworks-bit",
  // Se preencher, mostra só os repositórios que têm esse "topic" no GitHub
  // (ex.: "portfolio"). Deixe "" para mostrar todos os seus repositórios.
  somenteComTopico: "portfolio",
  // Quantos projetos mostrar no máximo.
  maxProjetos: 5,
};


// ---------- Deck de polaroids ----------
// Cada foto tem uma posição: centro (na frente), direita (no meio) ou esquerda (atrás).
// Ao avançar: a da direita vem pro centro, a de trás vai pra direita e a da frente
// faz uma curva pra fora e vai pro fundo, como se alguém tirasse a foto de cima da pilha.
(function iniciarDeck() {
  const deck = document.getElementById("deck");
  const fotos = Array.from(deck.querySelectorAll(".polaroid"));
  const posicoes = ["centro", "direita", "esquerda"];
  const camada = { centro: 3, direita: 2, esquerda: 1 };
  // as animações rodam sempre, mesmo com "reduzir animações" ligado no computador
  const semMovimento = false;
  let atual = 0;       // índice da foto que está no centro
  let animando = false;

  function aplicarPosicoes() {
    fotos.forEach((foto, i) => {
      const lugar = (i - atual + fotos.length) % fotos.length;
      foto.dataset.pos = posicoes[lugar] || "esquerda";
      foto.setAttribute("aria-hidden", lugar === 0 ? "false" : "true");
    });
  }

  function trocar(novoAtual, direcao) {
    if (animando || novoAtual === atual) return;

    // guarda onde cada foto está agora
    const antes = fotos.map((f) => ({ pos: f.dataset.pos, transform: getComputedStyle(f).transform }));
    atual = novoAtual;
    aplicarPosicoes();
    if (semMovimento) return;

    animando = true;
    const animacoes = fotos.map((foto, i) => {
      const de = antes[i];
      const para = { pos: foto.dataset.pos, transform: getComputedStyle(foto).transform };
      const zDe = camada[de.pos], zPara = camada[para.pos];
      const quadros = [{ transform: de.transform, zIndex: zDe }];

      // a foto que sai da frente (ou volta pra frente) faz uma curva pra fora do deck
      if (Math.abs(zDe - zPara) === 2) {
        const lado = direcao > 0 ? -1 : 1;
        quadros.push({
          transform: `${de.transform} translate(${lado * 55}%, -4%) rotate(${lado * 7}deg)`,
          zIndex: zDe,
          offset: 0.45,
        });
        quadros.push({ zIndex: zPara, offset: 0.5 });
      }
      quadros.push({ transform: para.transform, zIndex: zPara });

      // velocidade média, começando e terminando devagar, sem trancos
      return foto.animate(quadros, {
        duration: 1150,
        easing: "cubic-bezier(.45, 0, .25, 1)",
      }).finished;
    });
    Promise.all(animacoes).finally(() => {
      animando = false;
      // se o mouse já estiver em cima da nova foto do meio, ela começa a flutuar
      const frente = fotos[atual];
      if (frente.matches(":hover")) comecarFlutuar(frente);
    });
  }

  const avancar = () => trocar((atual + 1) % fotos.length, 1);
  const voltar = () => trocar((atual - 1 + fotos.length) % fotos.length, -1);

  document.getElementById("seta-avancar").addEventListener("click", avancar);
  document.getElementById("seta-voltar").addEventListener("click", voltar);

  // Clicar na foto da frente passa pra próxima; clicar numa de trás traz ela pra frente.
  fotos.forEach((foto, i) => {
    foto.addEventListener("click", () => {
      if (arrastou) return;
      if (i === atual) avancar();
      else trocar(i, foto.dataset.pos === "direita" ? 1 : -1);
    });
  });

  // No celular: arrastar pro lado também troca as fotos.
  let inicioX = null, arrastou = false;
  deck.addEventListener("pointerdown", (e) => { inicioX = e.clientX; arrastou = false; });
  deck.addEventListener("pointerup", (e) => {
    if (inicioX === null) return;
    const dx = e.clientX - inicioX;
    inicioX = null;
    if (Math.abs(dx) > 40) {
      arrastou = true;
      dx < 0 ? avancar() : voltar();
      setTimeout(() => (arrastou = false), 0);
    }
  });

  // Ao passar o mouse na foto do meio, ela sobe devagar e fica flutuando.
  // As fotos de trás não se mexem. Ao tirar o mouse, ela desce suave pro lugar.
  let flutuacao = null;
  let fotoFlutuando = null;
  const suave = "cubic-bezier(.37, 0, .63, 1)"; // curva tipo onda, bem leve

  function comecarFlutuar(foto) {
    if (flutuacao || animando || foto.dataset.pos !== "centro") return;
    foto.classList.add("flutuando");
    fotoFlutuando = foto;
    // 1) sobe devagar e cresce um pouquinho
    flutuacao = foto.animate(
      [
        { translate: "0 0", rotate: "0deg", scale: "1" },
        { translate: "0 -20px", rotate: "1.2deg", scale: "1.04" },
      ],
      { duration: 700, easing: "cubic-bezier(.33, 1, .68, 1)", fill: "forwards" }
    );
    // 2) fica flutuando, subindo e descendo devagar, enquanto o mouse estiver em cima
    flutuacao.finished.then(() => {
      if (fotoFlutuando !== foto) return;
      flutuacao.cancel();
      flutuacao = foto.animate(
        [
          { translate: "0 -20px", rotate: "1.2deg", scale: "1.04" },
          { translate: "0 -34px", rotate: "-1deg", scale: "1.04" },
          { translate: "0 -20px", rotate: "1.2deg", scale: "1.04" },
        ],
        { duration: 2800, easing: suave, iterations: Infinity }
      );
    }).catch(() => {});
  }

  function pararFlutuar() {
    if (!flutuacao) return;
    const foto = fotoFlutuando;
    fotoFlutuando = null;
    const { translate, rotate, scale } = getComputedStyle(foto);
    flutuacao.cancel();
    flutuacao = null;
    foto.classList.remove("flutuando");
    foto.animate(
      [{ translate, rotate, scale }, { translate: "0 0", rotate: "0deg", scale: "1" }],
      { duration: 800, easing: "cubic-bezier(.33, 1, .68, 1)" }
    );
  }

  fotos.forEach((foto) => {
    // entrar com o mouse ou mexer o mouse em cima (ex.: logo depois de trocar de foto)
    const aoPassar = (e) => { if (e.pointerType !== "touch") comecarFlutuar(foto); };
    foto.addEventListener("pointerenter", aoPassar);
    foto.addEventListener("pointermove", aoPassar);
    foto.addEventListener("pointerleave", pararFlutuar);
    foto.addEventListener("click", pararFlutuar, true);
  });
  document.getElementById("seta-avancar").addEventListener("click", pararFlutuar, true);
  document.getElementById("seta-voltar").addEventListener("click", pararFlutuar, true);

  aplicarPosicoes();

  // Entrada: as fotos chegam uma de cada vez, como se fossem colocadas na mesa.
  if (!semMovimento) {
    fotos.forEach((foto, i) => {
      const final = getComputedStyle(foto).transform;
      foto.animate(
        [
          { transform: `${final} translateY(60px) rotate(${i % 2 ? 10 : -10}deg)`, opacity: 0 },
          { transform: final, opacity: 1 },
        ],
        { duration: 1000, delay: 150 + i * 140, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "backwards" }
      );
    });
  }
})();

// ---------- Seções deslizam suavemente ao aparecer na tela ----------
(function revelarAoRolar() {
  if (!("IntersectionObserver" in window)) return;
  const alvos = document.querySelectorAll(".secao-cabeca, .projetos, .caminho li, .contato-cabeca, .contatos");
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.remove("abaixo");
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12 });
  alvos.forEach((el) => {
    el.classList.add("revelar");
    // só desliza o que ainda está abaixo da tela; o resto já aparece no lugar
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add("abaixo");
      observador.observe(el);
    }
  });
})();

// ---------- Flutuar ao passar o mouse (usado nos cards de projeto) ----------
// Mesmo movimento das polaroids: sobe devagar, cresce um pouquinho e fica
// subindo e descendo enquanto o cursor estiver em cima; ao sair, desce suave.
function flutuarAoPassar(el) {
  let animacao = null;

  function comecar(e) {
    if (e.pointerType === "touch" || animacao) return;
    el.classList.add("flutuando");
    animacao = el.animate(
      [
        { translate: "0 0", rotate: "0deg", scale: "1" },
        { translate: "0 -12px", rotate: "0.6deg", scale: "1.03" },
      ],
      { duration: 700, easing: "cubic-bezier(.33, 1, .68, 1)", fill: "forwards" }
    );
    const esta = animacao;
    animacao.finished.then(() => {
      if (animacao !== esta) return;
      animacao.cancel();
      animacao = el.animate(
        [
          { translate: "0 -12px", rotate: "0.6deg", scale: "1.03" },
          { translate: "0 -22px", rotate: "-0.5deg", scale: "1.03" },
          { translate: "0 -12px", rotate: "0.6deg", scale: "1.03" },
        ],
        { duration: 2800, easing: "cubic-bezier(.37, 0, .63, 1)", iterations: Infinity }
      );
    }).catch(() => {});
  }

  function parar() {
    if (!animacao) return;
    const { translate, rotate, scale } = getComputedStyle(el);
    animacao.cancel();
    animacao = null;
    el.classList.remove("flutuando");
    el.animate(
      [{ translate, rotate, scale }, { translate: "0 0", rotate: "0deg", scale: "1" }],
      { duration: 800, easing: "cubic-bezier(.33, 1, .68, 1)" }
    );
  }

  el.addEventListener("pointerenter", comecar);
  el.addEventListener("pointermove", comecar);
  el.addEventListener("pointerleave", parar);
}

// ---------- Projetos do GitHub ----------
const lista = document.getElementById("lista-projetos");
const status = document.getElementById("projetos-status");

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function nomeBonito(nome) {
  return nome.replace(/[-_]/g, " ").replace(/^\w/, (l) => l.toUpperCase());
}

function criarCard(repo) {
  const card = document.createElement("article");
  card.className = "projeto";

  const titulo = document.createElement("h3");
  titulo.textContent = nomeBonito(repo.name);

  const desc = document.createElement("p");
  desc.textContent = repo.description || "Projeto sem descrição ainda.";

  const meta = document.createElement("div");
  meta.className = "projeto-meta";
  if (repo.language) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = repo.language;
    meta.append(chip);
  }
  const extra = document.createElement("span");
  extra.textContent = `★ ${repo.stargazers_count} · atualizado em ${formatarData(repo.pushed_at)}`;
  meta.append(extra);

  const link = document.createElement("a");
  link.href = repo.html_url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Ver no GitHub →";

  card.append(titulo, desc, meta, link);
  flutuarAoPassar(card);
  return card;
}

function mostrar(repos) {
  lista.replaceChildren(...repos.map(criarCard));
}

async function carregarProjetos() {
  const usuario = CONFIG.githubUsuario.trim();

  if (!usuario) {
    status.textContent = "Coloque seu usuário do GitHub no script.js para ver seus projetos aqui.";
    lista.replaceChildren();
    return;
  }

  // Atualiza o link do GitHub no contato
  document.getElementById("link-github").href = `https://github.com/${usuario}`;
  document.getElementById("texto-github").textContent = `github.com/${usuario}`;

  try {
    // busca todos os repositórios públicos, sempre com dados atualizados
    let repos = [];
    for (let pagina = 1; pagina <= 5; pagina++) {
      const resp = await fetch(
        `https://api.github.com/users/${usuario}/repos?sort=pushed&per_page=100&page=${pagina}`,
        { cache: "no-cache" }
      );
      if (!resp.ok) throw new Error(`GitHub respondeu ${resp.status}`);
      const lote = await resp.json();
      repos = repos.concat(lote);
      if (lote.length < 100) break;
    }

    const topico = CONFIG.somenteComTopico.trim().toLowerCase();
    if (topico) {
      // projetos escolhidos a dedo: mostra todos com o tópico, inclusive forks e arquivados
      repos = repos.filter((r) => (r.topics || []).some((t) => t.toLowerCase() === topico));
    } else {
      // sem tópico: esconde cópias de projetos de outras pessoas (forks) e arquivados
      repos = repos.filter((r) => !r.fork && !r.archived);
    }
    repos = repos.slice(0, CONFIG.maxProjetos);

    if (repos.length === 0) {
      status.textContent = "Nenhum projeto público encontrado ainda.";
      lista.replaceChildren();
      return;
    }
    status.textContent = "Os projetos que mais gosto :";
    mostrar(repos);
  } catch (erro) {
    console.error(erro);
    status.textContent = "Não consegui carregar os projetos do GitHub agora. Tente recarregar a página daqui a pouco ):";
    lista.replaceChildren();
  }
}

carregarProjetos();

// ---------- Botões de copiar contato ----------
document.querySelectorAll(".copiar").forEach((botao) => {
  botao.addEventListener("click", async () => {
    const texto = botao.dataset.copiar;
    try {
      await navigator.clipboard.writeText(texto);
      botao.textContent = "Copiado!";
    } catch {
      // Se o navegador bloquear, seleciona o texto pra copiar na mão
      const valor = botao.parentElement.querySelector(".contato-valor");
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(valor);
      sel.removeAllRanges();
      sel.addRange(range);
      botao.textContent = "Selecionado";
    }
    setTimeout(() => (botao.textContent = "Copiar"), 1800);
  });
});

// ---------- Tema claro / escuro ----------
// O claro é o padrão. A escolha fica salva no navegador de quem visita.
(function iniciarTema() {
  const botao = document.getElementById("tema-switch");
  const raiz = document.documentElement;
  let ocupado = false;

  function aplicarTema(escuro) {
    if (escuro) raiz.dataset.theme = "dark";
    else delete raiz.dataset.theme;
  }

  botao.setAttribute("aria-checked", raiz.dataset.theme === "dark" ? "true" : "false");

  botao.addEventListener("click", () => {
    if (ocupado) return;
    ocupado = true;
    const escuro = raiz.dataset.theme !== "dark";
    try { localStorage.setItem("tema", escuro ? "escuro" : "claro"); } catch (e) {}

    // 1) a bolinha desliza até o outro lado do switch (e estica no meio do caminho)
    botao.setAttribute("aria-checked", escuro ? "true" : "false");
    botao.classList.remove("mudando");
    void botao.offsetWidth;
    botao.classList.add("mudando");
    setTimeout(() => botao.classList.remove("mudando"), 1150);

    // 2) quando ela chega, as cores do novo tema se espalham num círculo a partir do switch
    setTimeout(() => {
      if (!document.startViewTransition) {
        aplicarTema(escuro);
        ocupado = false;
        return;
      }
      const r = botao.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const transicao = document.startViewTransition(() => aplicarTema(escuro));
      transicao.ready.then(() => {
        raiz.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`] },
          { duration: 1400, easing: "cubic-bezier(.45, 0, .25, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(() => {});
      transicao.finished.finally(() => { ocupado = false; });
    }, 800);
  });
})();

// ---------- Ano no rodapé ----------
document.getElementById("ano").textContent = new Date().getFullYear();

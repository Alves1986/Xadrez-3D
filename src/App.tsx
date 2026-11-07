import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { isAudioMuted, toggleAudioMute, subscribeAudioState } from './soundEngine.js';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!isAudioMuted());

  const [legendModalOpen, setLegendModalOpen] = useState(false);
  const [currentDiff, setCurrentDiff] = useState('lenda');
  const [currentLegend, setCurrentLegend] = useState('kasparov');

  // Master's Hint Toast State
  const [hintAdvice, setHintAdvice] = useState<string | null>(null);

  // 2D Tactical Board & 3D Theme Modal State
  const [board2dOpen, setBoard2dOpen] = useState(false);
  const [current3dTheme, setCurrent3dTheme] = useState('cathedral');
  const [board2dState, setBoard2dState] = useState<any[][]>([]);
  const [selected2dSquare, setSelected2dSquare] = useState<{ r: number; c: number } | null>(null);

  const winApi = typeof window !== 'undefined' ? (window as unknown as { wizardChess?: any }).wizardChess : null;
  const aiConfig = winApi?.getAIConfig ? winApi.getAIConfig() : null;

  const activeLegendObj = aiConfig?.legendConfig || {
    id: 'kasparov',
    name: 'Garry Kasparov',
    title: 'O Monstro de Baku',
    avatar: '👑',
    quote: 'O xadrez é a arte da luta tática e da iniciativa implacável.',
    styleSummary: 'Agressividade tática avassaladora, pressão constante no centro e ataques diretos.'
  };

  const activeDiffObj = aiConfig?.difficultyConfig || {
    id: 'lenda',
    name: 'Lenda (Grão-Mestre)',
    badge: '🔴'
  };

  const aiDifficulties = aiConfig?.allDifficulties || [
    { id: 'iniciante', name: 'Iniciante (Aprendiz)', badge: '🟢', description: 'Lances casuais, permite recuperar de erros e busca trocas simples.' },
    { id: 'intermediario', name: 'Intermediário (Guardião)', badge: '🟡', description: 'Desenvolve peças no centro, evita entregas diretas e responde a ameaças.' },
    { id: 'avancado', name: 'Avançado (Mestre)', badge: '🟠', description: 'Visão tática afiada de múltiplos lances, defende fraquezas e cria pressão.' },
    { id: 'lenda', name: 'Lenda (Grão-Mestre)', badge: '🔴', description: 'Precisão de Campeão Mundial. Punir erros implacavelmente com estilo lendário.' }
  ];

  const aiLegends = aiConfig?.allLegends || [
    { id: 'kasparov', name: 'Garry Kasparov', title: 'O Monstro de Baku', avatar: '👑', styleSummary: 'Agressividade tática avassaladora, pressão constante e ataques diretos.' },
    { id: 'carlsen', name: 'Magnus Carlsen', title: 'Precisão Cirúrgica', avatar: '🎯', styleSummary: 'Evolução posicional gradual, sufocamento e exploração de finais.' },
    { id: 'fischer', name: 'Bobby Fischer', title: 'Clareza Cristalina', avatar: '⚡', styleSummary: 'Lances diretos e enérgicos, aberturas afiadas e bispos dominantes.' },
    { id: 'tal', name: 'Mikhail Tal', title: 'O Mago de Riga', avatar: '🧙‍♂️', styleSummary: 'Caos tático espetacular, sacrifícios arrojados e tempestade sobre o Rei.' },
    { id: 'karpov', name: 'Anatoly Karpov', title: 'A Jiboia Posicional', avatar: '🐍', styleSummary: 'Profilaxia implacável, restrição de mobilidade inimiga e controle total.' },
    { id: 'capablanca', name: 'José R. Capablanca', title: 'A Máquina Humana', avatar: '💎', styleSummary: 'Harmonia perfeita entre as peças, jogo limpo e conversão sem erros.' },
    { id: 'morphy', name: 'Paul Morphy', title: 'O Romântico Supremo', avatar: '🏰', styleSummary: 'Desenvolvimento ultrarrápido de peças, abertura de linhas e ataques.' },
    { id: 'alekhine', name: 'Alexander Alekhine', title: 'O Furacão Tático', avatar: '🔥', styleSummary: 'Combinações dinâmicas e selvagens com ataque de Dama e Torres.' },
    { id: 'nakamura', name: 'Hikaru Nakamura', title: 'Rei do Contra-Ataque', avatar: '⚡', styleSummary: 'Velocidade de cálculo, recursos táticos e defesas acrobáticas.' },
    { id: 'polgar', name: 'Judit Polgár', title: 'A Rainha do Ataque', avatar: '👑', styleSummary: 'Agressividade destemida, busca incansável por xeque-mate.' }
  ];

  const handleSelectDifficulty = (id: string) => {
    setCurrentDiff(id);
    if (winApi?.setAIDifficulty) {
      winApi.setAIDifficulty(id);
    }
  };

  const handleSelectLegend = (id: string) => {
    setCurrentLegend(id);
    if (winApi?.setAILegend) {
      winApi.setAILegend(id);
    }
  };

  const handleGetMasterHint = () => {
    const win = window as unknown as { wizardChess?: any };
    if (win.wizardChess?.getMasterHintMove) {
      const res = win.wizardChess.getMasterHintMove();
      if (res && res.text) {
        setHintAdvice(res.text);
      } else if (res && res.advice) {
        setHintAdvice(res.advice);
      } else {
        setHintAdvice(`💡 ${activeLegendObj.name}: Foque no controle do centro e no desenvolvimento seguro das suas peças!`);
      }
    } else {
      setHintAdvice(`💡 ${activeLegendObj.name}: Mantenha o Rei seguro e busque enfraquecer a estrutura inimiga.`);
    }
  };

  const refresh2dBoard = () => {
    const win = window as unknown as { wizardChess?: any };
    if (win.wizardChess?.getBoardState) {
      setBoard2dState(win.wizardChess.getBoardState());
    }
  };

  const handleOpen2dModal = () => {
    refresh2dBoard();
    setSelected2dSquare(null);
    setBoard2dOpen(true);
  };

  const handleSelectTheme3D = (themeId: string) => {
    setCurrent3dTheme(themeId);
    const win = window as unknown as { wizardChess?: any };
    if (win.wizardChess?.setBoard3DTheme) {
      win.wizardChess.setBoard3DTheme(themeId);
    }
  };

  const handle2dSquareClick = (r: number, c: number) => {
    const win = window as unknown as { wizardChess?: any };
    if (!selected2dSquare) {
      const pc = board2dState[r]?.[c];
      if (pc) {
        setSelected2dSquare({ r, c });
      }
    } else {
      if (selected2dSquare.r === r && selected2dSquare.c === c) {
        setSelected2dSquare(null);
      } else {
        if (win.wizardChess?.executeChessMove) {
          win.wizardChess.executeChessMove(selected2dSquare.r, selected2dSquare.c, r, c);
        }
        setSelected2dSquare(null);
        setTimeout(() => {
          refresh2dBoard();
        }, 300);
      }
    }
  };

  const getPieceSymbol = (pc: { type: string; color: string } | null) => {
    if (!pc) return '';
    const symbols: Record<string, Record<string, string>> = {
      w: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      b: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };
    return symbols[pc.color]?.[pc.type] || '';
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();
  }, []);

  useEffect(() => {
    const unsub = subscribeAudioState(setSoundEnabled);
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setLegendModalOpen(false);
        setBoard2dOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCopyHistory = () => {
    const win = window as unknown as { wizardChess?: { getGamePGN?: () => string } };
    const pgn = win.wizardChess?.getGamePGN ? win.wizardChess.getGamePGN() : '';
    if (!pgn) return;
    navigator.clipboard?.writeText(pgn).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleRestoreUI = () => {
    const win = window as unknown as { wizardChess?: { toggleUI?: (force?: boolean) => void } };
    if (win.wizardChess?.toggleUI) {
      win.wizardChess.toggleUI(false);
    } else {
      document.body.classList.remove('cinematic-ui-hidden');
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) btnHide.textContent = 'Ocultar UI [H]';
    }
  };

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">Xadrez Bruxo 3D</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">Invocando a Arquitetura do Templo e Peças Esculpidas...</div>
      </div>

      <div id="canvas-container"></div>

      {/* Toast Banner: Dica do Mestre 💡 */}
      {hintAdvice && (
        <div id="hint-advice-toast" className="hint-advice-toast" role="alert">
          <div className="hint-advice-header">
            <span className="hint-advice-icon">💡</span>
            <span className="hint-advice-title">Dica do Mestre ({activeLegendObj.name})</span>
            <button
              type="button"
              className="hint-advice-close"
              onClick={() => setHintAdvice(null)}
              aria-label="Fechar dica"
            >
              ✕
            </button>
          </div>
          <div className="hint-advice-content">{hintAdvice}</div>
        </div>
      )}

      {/* Componente: Histórico de Lances (Notação Algébrica Básica) */}
      <aside
        id="move-history-panel"
        className={`move-history-panel ${historyCollapsed ? 'collapsed' : ''}`}
        aria-label="Histórico de lances"
      >
        <div className="move-history-header">
          <div
            className="move-history-title-wrap"
            onClick={() => setHistoryCollapsed((prev) => !prev)}
            title={historyCollapsed ? 'Expandir histórico de lances' : 'Minimizar histórico'}
          >
            <span className="move-history-icon" aria-hidden="true">📜</span>
            <span className="move-history-title">Lances</span>
            <span className="move-history-badge" id="move-history-count" title="Total de lances realizados">0</span>
          </div>

          <div className="move-history-actions">
            {!historyCollapsed && (
              <button
                type="button"
                className="move-history-btn"
                id="btn-copy-history"
                title="Copiar lances da partida (notação algébrica PGN)"
                onClick={handleCopyHistory}
              >
                {copySuccess ? 'Copiado!' : 'Copiar'}
              </button>
            )}
            <button
              type="button"
              className="move-history-btn toggle-btn"
              id="btn-toggle-history"
              title={historyCollapsed ? 'Expandir histórico' : 'Minimizar histórico'}
              onClick={() => setHistoryCollapsed((prev) => !prev)}
              aria-label={historyCollapsed ? 'Expandir histórico' : 'Minimizar histórico'}
            >
              {historyCollapsed ? '▲' : '▼'}
            </button>
          </div>
        </div>

        <div className="move-history-body" id="move-history-body">
          <div className="move-history-table" id="move-history-table">
            <div className="move-history-empty" id="move-history-empty">
              Nenhum lance realizado ainda.
            </div>
          </div>
        </div>
      </aside>

      {/* Componente: Painel de Estatísticas da Partida em Tempo Real */}
      <aside
        id="game-stats-panel"
        className={`game-stats-panel ${statsCollapsed ? 'collapsed' : ''}`}
        aria-label="Estatísticas da partida"
      >
        <div className="stats-header">
          <div
            className="stats-title-wrap"
            onClick={() => setStatsCollapsed((prev) => !prev)}
            title={statsCollapsed ? 'Expandir estatísticas' : 'Minimizar estatísticas'}
          >
            <span className="stats-icon" aria-hidden="true">⏱️</span>
            <span className="stats-title">Estatísticas</span>
            <span className="stats-live-badge" title="Rastreamento em tempo real">Ao Vivo</span>
          </div>

          <div className="stats-actions">
            <button
              type="button"
              className="stats-btn toggle-btn"
              id="btn-toggle-stats"
              title={statsCollapsed ? 'Expandir estatísticas' : 'Minimizar estatísticas'}
              onClick={() => setStatsCollapsed((prev) => !prev)}
              aria-label={statsCollapsed ? 'Expandir estatísticas' : 'Minimizar estatísticas'}
            >
              {statsCollapsed ? '▲' : '▼'}
            </button>
          </div>
        </div>

        <div className="stats-body" id="stats-body">
          {/* Tempo total da partida */}
          <div className="stats-row highlight-row">
            <span className="stats-label">Tempo de Jogo</span>
            <span className="stats-val time-val" id="stat-match-time">00:00</span>
          </div>

          {/* Vantagem Material e Saldo */}
          <div className="stats-section">
            <div className="stats-row">
              <span className="stats-label">Vantagem Material</span>
              <span className="stat-advantage-badge neutral-advantage" id="stat-material-diff">
                Equilíbrio (0)
              </span>
            </div>

            <div className="stat-balance-bar-wrap" title="Equilíbrio de pontos entre Brancas e Pretas">
              <div className="stat-balance-bar">
                <div className="stat-balance-fill" id="stat-material-bar-fill" style={{ width: '50%' }}></div>
              </div>
              <div className="stat-balance-labels">
                <span id="stat-material-white">39 pts</span>
                <span className="stat-balance-mid">Saldo</span>
                <span id="stat-material-black">39 pts</span>
              </div>
            </div>
          </div>

          {/* Número de Capturas de cada jogador */}
          <div className="stats-section">
            <div className="stats-label-sub">Peças Capturadas</div>
            <div className="stats-dual-cards">
              <div className="stats-mini-card white-side" title="Peças pretas capturadas pelas Brancas">
                <span className="mini-card-label">Brancas ⚔️</span>
                <span className="mini-card-val" id="stat-captures-white">0</span>
              </div>
              <div className="stats-mini-card black-side" title="Peças brancas capturadas pelas Pretas">
                <span className="mini-card-label">Pretas ⚔️</span>
                <span className="mini-card-val" id="stat-captures-black">0</span>
              </div>
            </div>
          </div>

          {/* Peças Restantes no Tabuleiro */}
          <div className="stats-row footer-row">
            <span className="stats-label">No Tabuleiro</span>
            <span className="stats-val pieces-val">
              <strong id="stat-pieces-white">16</strong>B vs <strong id="stat-pieces-black">16</strong>P
            </span>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className="hud-btn mobile-only-restore-ui"
        id="btn-mobile-show-ui"
        onClick={handleRestoreUI}
        title="Mostrar Controles da Interface"
      >
        Mostrar UI
      </button>

      <div id="hud-top">
        <div className="hud-group" id="hud-left">
          <div className="brand-pill">
            <span className="brand-title">Xadrez Bruxo</span>
          </div>
          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">Vez das Brancas</span>
            <span className="mode-badge" id="mode-badge">Jogando como Brancas</span>
          </div>

          <button
            type="button"
            className="hud-btn legend-trigger-btn"
            id="btn-legend-trigger"
            title="Escolher Nível de Dificuldade e Lenda do Xadrez"
            onClick={() => setLegendModalOpen(true)}
          >
            <span className="legend-btn-avatar">{activeLegendObj?.avatar || '👑'}</span>
            <span className="legend-btn-name">{activeLegendObj?.name?.split(' ')?.[0] || 'Kasparov'}</span>
            <span className="legend-btn-diff">{activeDiffObj?.badge || '🔴'}</span>
            <span className="legend-btn-arrow">▾</span>
          </button>
        </div>

        <button
          type="button"
          className={`hud-btn mobile-controls-trigger ${mobileSheetOpen ? 'active' : ''}`}
          id="btn-mobile-controls"
          aria-expanded={mobileSheetOpen}
          aria-controls="hud-right"
          onClick={() => setMobileSheetOpen((prev) => !prev)}
        >
          {mobileSheetOpen ? 'Fechar' : 'Controles'}
        </button>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        <div
          className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`}
          id="hud-right"
        >
          <div
            className="mobile-sheet-handle-wrap"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          >
            <div className="mobile-sheet-handle"></div>
          </div>

          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">Controles</span>
            <button
              type="button"
              className="mobile-sheet-close"
              id="btn-mobile-sheet-close"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSheetOpen(false);
              }}
              aria-label="Fechar Controles"
            >
              Fechar ✕
            </button>
          </div>

          <div className="mobile-sheet-section-label">Ações de Jogo &amp; Dicas</div>

          <div className="desktop-hud-segmented-group actions-group">
            <button
              className="hud-btn"
              id="btn-side-toggle"
              title="Alternar entre jogar de Brancas ou de Pretas"
              onClick={() => setMobileSheetOpen(false)}
            >
              Jogar de Pretas
            </button>
            <button
              className="hud-btn"
              id="btn-ai-move"
              title="Deixar a IA fazer a próxima jogada imediatamente"
              onClick={() => setMobileSheetOpen(false)}
            >
              IA 🤖
            </button>
            <button
              className="hud-btn primary"
              id="btn-master-hint"
              title="Sugerir jogada ideal no estilo da Lenda selecionada"
              onClick={() => {
                handleGetMasterHint();
                setMobileSheetOpen(false);
              }}
            >
              Dica 💡
            </button>
            <button
              className="hud-btn"
              id="btn-reset"
              title="Iniciar uma nova partida no altar"
              onClick={() => setMobileSheetOpen(false)}
            >
              Novo 🔄
            </button>
          </div>

          <div className="desktop-hud-segmented-group panels-group">
            <button
              className="hud-btn"
              id="btn-toggle-2d"
              title="Abrir Tabuleiro 2D Tático e Temas Visuals"
              onClick={() => {
                handleOpen2dModal();
                setMobileSheetOpen(false);
              }}
            >
              Tabuleiro 2D ♟️
            </button>
            <button
              className="hud-btn"
              id="btn-sheet-toggle-history"
              title="Abrir ou recolher lista de lances da partida"
              onClick={() => {
                setHistoryCollapsed((prev) => !prev);
                setMobileSheetOpen(false);
              }}
            >
              Lances 📜
            </button>
            <button
              className="hud-btn"
              id="btn-sheet-toggle-stats"
              title="Abrir ou recolher painel de estatísticas da partida"
              onClick={() => {
                setStatsCollapsed((prev) => !prev);
                setMobileSheetOpen(false);
              }}
            >
              Stats ⏱️
            </button>
          </div>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>Vistas de Câmera</span>
            <span className="mobile-sheet-section-sub">Toque na vista ativa para inverter</span>
          </div>

          <div className="desktop-hud-segmented-group cameras-group">
            <button
              className="hud-btn active"
              id="btn-cam-player"
              title="Câmera do Jogador (Clique novamente para alternar visão Brancas / Pretas)"
            >
              Jogador
            </button>
            <button
              className="hud-btn"
              id="btn-cam-top"
              title="Visão Superior do Tabuleiro (Clique novamente para inverter orientação)"
            >
              Topo
            </button>
            <button
              className="hud-btn"
              id="btn-cam-side"
              title="Visão de Perfil Lateral (Clique novamente para alternar lado Leste / Oeste)"
            >
              Perfil
            </button>
            <button
              className="hud-btn"
              id="btn-cam-wide"
              title="Visão Ampla da Catedral (Clique novamente para alternar Rosácea Norte / Nártex Sul)"
            >
              Catedral
            </button>
          </div>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Exibição e Som</div>

          <div className="desktop-hud-segmented-group utility-group">
            <button
              className={`hud-btn ${soundEnabled ? 'active' : ''}`}
              id="btn-sound-toggle"
              title="Alternar efeitos sonoros de pedra e catedral (Atalho: M)"
              onClick={() => toggleAudioMute()}
            >
              {soundEnabled ? 'Som: 🔊' : 'Som: 🔇'}
            </button>

            <button
              className="hud-btn"
              id="btn-hide-ui"
              title="Alternar visibilidade da interface (Atalho: H)"
              onClick={() => setMobileSheetOpen(false)}
            >
              Ocultar UI [H]
            </button>
          </div>

          <div className="mobile-sheet-hint">
            <strong>Toque:</strong> Toque na peça para mover &nbsp;•&nbsp; Arrastar com 1 dedo: Orbitar &nbsp;•&nbsp; Arrastar com 2 dedos: Mover visão &nbsp;•&nbsp; Pinça: Zoom
          </div>
        </div>
      </div>

      <div id="hud-bottom">
        <div className="hint-pill" id="controls-hint">
          <strong>Controles:</strong> Clique na peça para mover &nbsp;•&nbsp; Arrastar c/ botão esquerdo: Orbitar &nbsp;•&nbsp; Arrastar c/ botão direito: Mover visão &nbsp;•&nbsp; Rolar: Zoom &nbsp;•&nbsp; WASD + R/F: Voo livre &nbsp;•&nbsp; M: Som &nbsp;•&nbsp; H: Ocultar UI
        </div>
        <div className="captured-pill" id="captured-tray"></div>
      </div>

      <div id="checkmate-overlay" role="status" aria-live="polite">
        <div className="checkmate-banner">
          <div className="checkmate-ornament">✦ &nbsp; Julgamento do Templo &nbsp; ✦</div>
          <div className="checkmate-crown" id="checkmate-crown">♔</div>
          <div className="checkmate-title" id="checkmate-title">Xeque-mate</div>
          <div className="checkmate-rule"></div>
          <div className="checkmate-subtitle" id="checkmate-subtitle">
            Brancas Triunfam • O Rei das Pretas Caiu
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" id="btn-checkmate-replay">
              Repetir Queda do Rei
            </button>
            <button className="checkmate-btn" id="btn-checkmate-newgame">
              Novo Jogo
            </button>
            <button className="checkmate-btn secondary" id="btn-checkmate-dismiss">
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Seleção de Dificuldade & Lendas do Xadrez */}
      {legendModalOpen && (
        <div
          className="legend-modal-overlay"
          onClick={() => setLegendModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="legend-modal-title"
        >
          <div
            className="legend-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="legend-modal-header">
              <div className="legend-modal-title-wrap">
                <span className="legend-modal-icon">✦</span>
                <h2 className="legend-modal-title" id="legend-modal-title">
                  Níveis de Dificuldade &amp; Lendas do Xadrez
                </h2>
              </div>
              <button
                type="button"
                className="legend-modal-close"
                onClick={() => setLegendModalOpen(false)}
                aria-label="Fechar janela de lendas"
              >
                ✕
              </button>
            </div>

            <div className="legend-modal-body">
              <div className="legend-modal-section-title">
                1. Nível de Dificuldade do Motor IA
              </div>
              <div className="difficulty-grid">
                {aiDifficulties.map((diff: any) => {
                  const isActive = currentDiff === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      className={`difficulty-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectDifficulty(diff.id)}
                    >
                      <span className="diff-badge">{diff.badge}</span>
                      <div className="diff-info">
                        <span className="diff-name">{diff.name}</span>
                        <span className="diff-desc">{diff.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="legend-modal-section-title" style={{ marginTop: '18px' }}>
                2. Estilo de Jogo dos 10 Maior Mestres da História
              </div>
              <div className="legends-grid">
                {aiLegends.map((leg: any) => {
                  const isActive = currentLegend === leg.id;
                  return (
                    <button
                      key={leg.id}
                      type="button"
                      className={`legend-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectLegend(leg.id)}
                    >
                      <div className="legend-card-header">
                        <span className="legend-card-avatar">{leg.avatar}</span>
                        <div className="legend-card-titles">
                          <span className="legend-card-name">{leg.name}</span>
                          <span className="legend-card-title-sub">{leg.title}</span>
                        </div>
                      </div>
                      <p className="legend-card-summary">{leg.styleSummary}</p>
                    </button>
                  );
                })}
              </div>

              {activeLegendObj && (
                <div className="legend-active-quote-box">
                  <div className="quote-header">
                    <span className="quote-avatar">{activeLegendObj.avatar}</span>
                    <strong className="quote-author">{activeLegendObj.name}</strong>
                    <span className="quote-title-sub">({activeLegendObj.title})</span>
                  </div>
                  <blockquote className="quote-text">
                    &ldquo;{activeLegendObj.quote || 'O xadrez é a arte da luta tática.'}&rdquo;
                  </blockquote>
                </div>
              )}
            </div>

            <div className="legend-modal-footer">
              <button
                type="button"
                className="hud-btn active"
                onClick={() => setLegendModalOpen(false)}
              >
                Confirmar Desafio ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tabuleiro 2D Tático & Temas 3D */}
      {board2dOpen && (
        <div
          id="board-2d-modal"
          className="legend-modal-overlay"
          onClick={() => setBoard2dOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="board-2d-title"
        >
          <div
            className="legend-modal-card board-2d-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="legend-modal-header">
              <div className="legend-modal-title-wrap">
                <span className="legend-modal-icon">♟️</span>
                <h2 className="legend-modal-title" id="board-2d-title">
                  Modo Tabuleiro 2D &amp; Temas do Tabuleiro 3D
                </h2>
              </div>
              <button
                type="button"
                className="legend-modal-close"
                onClick={() => setBoard2dOpen(false)}
                aria-label="Fechar modo 2D"
              >
                ✕
              </button>
            </div>

            <div className="legend-modal-body board-2d-body">
              <div className="legend-modal-section-title">
                1. Seleção de Tema Visual do Tabuleiro 3D
              </div>
              <div className="theme-selector-row">
                <button
                  type="button"
                  className={`theme-chip ${current3dTheme === 'cathedral' ? 'active' : ''}`}
                  onClick={() => handleSelectTheme3D('cathedral')}
                >
                  🏛️ Catedral Gótica (Obsidiana)
                </button>
                <button
                  type="button"
                  className={`theme-chip ${current3dTheme === 'classic_wood' ? 'active' : ''}`}
                  onClick={() => handleSelectTheme3D('classic_wood')}
                >
                  🪵 Madeira Clássica de Torneio
                </button>
                <button
                  type="button"
                  className={`theme-chip ${current3dTheme === 'classic_marble' ? 'active' : ''}`}
                  onClick={() => handleSelectTheme3D('classic_marble')}
                >
                  🏛️ Mármore Real Império
                </button>
              </div>

              <div className="legend-modal-section-title" style={{ marginTop: '14px' }}>
                2. Tabuleiro 2D Tático (Sincronizado ao Vivo)
              </div>
              <div className="board-2d-grid-wrap">
                <div className="board-2d-ranks">
                  {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank) => (
                    <div key={rank} className="board-2d-rank-label">{rank}</div>
                  ))}
                </div>
                <div className="board-2d-matrix">
                  {Array.from({ length: 8 }).map((_, r) => (
                    <div key={r} className="board-2d-row">
                      {Array.from({ length: 8 }).map((_, c) => {
                        const pc = board2dState[r]?.[c] || null;
                        const isLight = (r + c) % 2 === 0;
                        const isSelected = selected2dSquare?.r === r && selected2dSquare?.c === c;
                        return (
                          <div
                            key={c}
                            className={`board-2d-sq ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handle2dSquareClick(r, c)}
                          >
                            <span className={`pc-symbol ${pc?.color === 'w' ? 'white-piece' : 'black-piece'}`}>
                              {getPieceSymbol(pc)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="board-2d-files">
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
                      <div key={file} className="board-2d-file-label">{file}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="legend-modal-footer">
              <button
                type="button"
                className="hud-btn active"
                onClick={() => setBoard2dOpen(false)}
              >
                Voltar à Catedral 3D 🏰
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

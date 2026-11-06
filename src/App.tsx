import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
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

          <div className="mobile-sheet-section-label">Ações de Jogo</div>

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
            Jogada da IA
          </button>
          <button
            className="hud-btn"
            id="btn-reset"
            title="Iniciar uma nova partida no altar"
            onClick={() => setMobileSheetOpen(false)}
          >
            Novo Jogo
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
            {historyCollapsed ? 'Ver Lances 📜' : 'Ocultar Lances 📜'}
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>Vistas de Câmera</span>
            <span className="mobile-sheet-section-sub">Toque na vista ativa para inverter</span>
          </div>

          <button
            className="hud-btn active"
            id="btn-cam-player"
            title="Câmera do Jogador (Clique novamente para alternar visão Brancas / Pretas)"
          >
            Câmera Jogador
          </button>
          <button
            className="hud-btn"
            id="btn-cam-top"
            title="Visão Superior do Tabuleiro (Clique novamente para inverter orientação)"
          >
            Superior
          </button>
          <button
            className="hud-btn"
            id="btn-cam-side"
            title="Visão de Perfil Lateral (Clique novamente para alternar lado Leste / Oeste)"
          >
            Lateral
          </button>
          <button
            className="hud-btn"
            id="btn-cam-wide"
            title="Visão Ampla da Catedral (Clique novamente para alternar Rosácea Norte / Nártex Sul)"
          >
            Catedral
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Exibição e Gestos</div>

          <button
            className="hud-btn"
            id="btn-hide-ui"
            title="Alternar visibilidade da interface (Atalho: H)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Ocultar UI [H]
          </button>

          <div className="mobile-sheet-hint">
            <strong>Toque:</strong> Toque na peça para mover &nbsp;•&nbsp; Arrastar com 1 dedo: Orbitar &nbsp;•&nbsp; Arrastar com 2 dedos: Mover visão &nbsp;•&nbsp; Pinça: Zoom
          </div>
        </div>
      </div>

      <div id="hud-bottom">
        <div className="hint-pill" id="controls-hint">
          <strong>Controles:</strong> Clique na peça para mover &nbsp;•&nbsp; Arrastar c/ botão esquerdo: Orbitar &nbsp;•&nbsp; Arrastar c/ botão direito: Mover visão &nbsp;•&nbsp; Rolar: Zoom &nbsp;•&nbsp; WASD + R/F: Voo livre &nbsp;•&nbsp; H: Ocultar UI
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
    </>
  );
}

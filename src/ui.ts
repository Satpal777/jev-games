import { CELL_POSITIONS, TOTAL_CELLS } from './constants';
import { fallbackRandomAIMoveFromContext } from './ai';
import type { TicTacToeGame } from './game';
import type { AIFunction, CellPosition, MoveRecord } from './types';

export class TicTacToeUI {
  private readonly game: TicTacToeGame;
  private readonly boardContainer: HTMLElement;
  private readonly scoreHumanElem: HTMLElement;
  private readonly scoreDrawsElem: HTMLElement;
  private readonly scoreAiElem: HTMLElement;
  private readonly statusDotElem: HTMLElement;
  private readonly statusTextElem: HTMLElement;
  private readonly alertBoxElem: HTMLElement;
  private readonly alertIconElem: HTMLElement;
  private readonly alertTitleElem: HTMLElement;
  private readonly alertMessageElem: HTMLElement;
  private readonly remainingBoxesListElem: HTMLElement;
  private readonly remainingCountBadgeElem: HTMLElement;
  private readonly historyLogElem: HTMLElement;
  private readonly moveCountBadgeElem: HTMLElement;
  private readonly btnNextRound: HTMLButtonElement;
  private readonly btnResetAll: HTMLButtonElement;
  private readonly btnFallbackAI: HTMLButtonElement;

  // TypeSafe AI Decision Inspector Elements
  private readonly apiKeyStatusElem: HTMLElement;
  private readonly apiKeyInputElem: HTMLInputElement;
  private readonly btnSaveApiKey: HTMLButtonElement;
  private readonly btnToggleApiKey: HTMLButtonElement;
  private readonly apiKeyHintElem: HTMLElement;
  private readonly inspectorEngineBadgeElem: HTMLElement;
  private readonly statPredictedStepElem: HTMLElement;
  private readonly statConfidenceElem: HTMLElement;
  private readonly statAssessmentElem: HTMLElement;
  private readonly probabilitiesListElem: HTMLElement;

  private cellButtons: HTMLButtonElement[] = [];
  private isAIProcessing = false;

  constructor(game: TicTacToeGame) {
    this.game = game;

    this.boardContainer = this.getRequiredElement<HTMLElement>('board-grid');
    this.scoreHumanElem = this.getRequiredElement<HTMLElement>('score-human');
    this.scoreDrawsElem = this.getRequiredElement<HTMLElement>('score-draws');
    this.scoreAiElem = this.getRequiredElement<HTMLElement>('score-ai');
    this.statusDotElem = this.getRequiredElement<HTMLElement>('status-dot');
    this.statusTextElem = this.getRequiredElement<HTMLElement>('status-text');
    this.alertBoxElem = this.getRequiredElement<HTMLElement>('alert-box');
    this.alertIconElem = this.getRequiredElement<HTMLElement>('alert-icon');
    this.alertTitleElem = this.getRequiredElement<HTMLElement>('alert-title');
    this.alertMessageElem = this.getRequiredElement<HTMLElement>('alert-message');
    this.remainingBoxesListElem = this.getRequiredElement<HTMLElement>('remaining-boxes-list');
    this.remainingCountBadgeElem = this.getRequiredElement<HTMLElement>('remaining-count-badge');
    this.historyLogElem = this.getRequiredElement<HTMLElement>('history-log');
    this.moveCountBadgeElem = this.getRequiredElement<HTMLElement>('move-count-badge');
    this.btnNextRound = this.getRequiredElement<HTMLButtonElement>('btn-next-round');
    this.btnResetAll = this.getRequiredElement<HTMLButtonElement>('btn-reset-all');
    this.btnFallbackAI = this.getRequiredElement<HTMLButtonElement>('btn-fallback-ai');

    // TypeSafe AI Inspector bindings
    this.apiKeyStatusElem = this.getRequiredElement<HTMLElement>('api-key-status');
    this.apiKeyInputElem = this.getRequiredElement<HTMLInputElement>('typesafe-api-key-input');
    this.btnSaveApiKey = this.getRequiredElement<HTMLButtonElement>('btn-save-api-key');
    this.btnToggleApiKey = this.getRequiredElement<HTMLButtonElement>('btn-toggle-api-key');
    this.apiKeyHintElem = this.getRequiredElement<HTMLElement>('api-key-hint');
    this.inspectorEngineBadgeElem = this.getRequiredElement<HTMLElement>('inspector-engine-badge');
    this.statPredictedStepElem = this.getRequiredElement<HTMLElement>('stat-predicted-step');
    this.statConfidenceElem = this.getRequiredElement<HTMLElement>('stat-confidence');
    this.statAssessmentElem = this.getRequiredElement<HTMLElement>('stat-assessment');
    this.probabilitiesListElem = this.getRequiredElement<HTMLElement>('probabilities-list');

    this.initBoardDOM();
    this.attachEventListeners();
    this.initApiKeySettings();
    this.render();
  }

  private getRequiredElement<T extends HTMLElement>(id: string): T {
    const elem = document.getElementById(id);
    if (!elem) {
      throw new Error(`Required DOM element with id "${id}" not found.`);
    }
    return elem as T;
  }

  private initBoardDOM(): void {
    this.boardContainer.innerHTML = '';
    this.cellButtons = [];

    for (let index = 0; index < TOTAL_CELLS; index++) {
      const pos = CELL_POSITIONS[index]!;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'grid-cell';
      button.setAttribute('role', 'gridcell');
      button.setAttribute('data-index', String(index));
      button.setAttribute('aria-label', `Cell #${index}, ${pos.label} (${pos.algebraic}), Row ${pos.row}, Column ${pos.col}, Empty`);

      const coordBadge = document.createElement('span');
      coordBadge.className = 'cell-coord-badge';
      coordBadge.textContent = `${pos.algebraic} [${pos.row},${pos.col}]`;

      const indexBadge = document.createElement('span');
      indexBadge.className = 'cell-index-badge';
      indexBadge.textContent = `#${index}`;

      const symbolSpan = document.createElement('span');
      symbolSpan.className = 'cell-symbol';
      symbolSpan.id = `cell-symbol-${index}`;

      button.appendChild(coordBadge);
      button.appendChild(indexBadge);
      button.appendChild(symbolSpan);

      button.addEventListener('keydown', (e) => this.handleCellKeydown(e, index));
      button.addEventListener('click', () => this.handleCellClick(index));

      this.boardContainer.appendChild(button);
      this.cellButtons.push(button);
    }
  }

  private attachEventListeners(): void {
    this.btnNextRound.addEventListener('click', () => {
      this.game.resetRound();
      this.hideAlert();
      this.render();
    });

    this.btnResetAll.addEventListener('click', () => {
      this.game.resetAll();
      this.hideAlert();
      this.render();
    });

    this.btnFallbackAI.addEventListener('click', async () => {
      if (this.game.getStatus() === 'WON' || this.game.getStatus() === 'DRAW') {
        this.showAlert('warning', 'Game Finished', 'Start a new round to play again.');
        return;
      }
      if (this.game.getCurrentTurn() !== 'O') {
        this.showAlert('warning', 'Not AI Turn', 'It is your turn (Player X). Click a box first.');
        return;
      }
      await this.executeAITurn(fallbackRandomAIMoveFromContext);
    });
  }

  private async initApiKeySettings(): Promise<void> {
    const savedKey = localStorage.getItem('typesafe_api_key') || '';
    if (savedKey) {
      this.apiKeyInputElem.value = savedKey;
      this.apiKeyStatusElem.textContent = 'Browser Key';
      this.apiKeyStatusElem.className = 'api-key-status badge-live';
    }

    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = (await res.json()) as { hasEnvKey: boolean; model: string };
        if (data.hasEnvKey) {
          this.apiKeyStatusElem.textContent = 'Server Key Active';
          this.apiKeyStatusElem.className = 'api-key-status badge-live';
          this.apiKeyHintElem.innerHTML = `Server <code>TYPESAFE_API_KEY</code> detected. Jev model (<code>${data.model}</code>) active.`;
        } else if (!savedKey) {
          this.apiKeyStatusElem.textContent = 'No Key';
          this.apiKeyStatusElem.className = 'api-key-status badge-neutral';
        }
      }
    } catch {
      // Server not reachable
    }

    this.btnSaveApiKey.addEventListener('click', () => {
      const key = this.apiKeyInputElem.value.trim();
      if (key) {
        localStorage.setItem('typesafe_api_key', key);
        this.apiKeyStatusElem.textContent = 'Browser Key Saved';
        this.apiKeyStatusElem.className = 'api-key-status badge-live';
        this.showAlert('success', 'API Key Saved', 'Your TypeSafe API key is saved locally in this browser session.');
      } else {
        localStorage.removeItem('typesafe_api_key');
        this.apiKeyStatusElem.textContent = 'Cleared';
        this.apiKeyStatusElem.className = 'api-key-status badge-neutral';
        this.showAlert('info', 'API Key Cleared', 'Browser API key removed. Set TYPESAFE_API_KEY on the server or enter one here.');
      }
    });

    this.btnToggleApiKey.addEventListener('click', () => {
      if (this.apiKeyInputElem.type === 'password') {
        this.apiKeyInputElem.type = 'text';
      } else {
        this.apiKeyInputElem.type = 'password';
      }
    });
  }

  // Keyboard navigation across the 3x3 grid
  private handleCellKeydown(event: KeyboardEvent, currentIndex: number): void {
    const row = Math.floor(currentIndex / 3);
    const col = currentIndex % 3;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowUp':
        if (row > 0) nextIndex = currentIndex - 3;
        break;
      case 'ArrowDown':
        if (row < 2) nextIndex = currentIndex + 3;
        break;
      case 'ArrowLeft':
        if (col > 0) nextIndex = currentIndex - 1;
        break;
      case 'ArrowRight':
        if (col < 2) nextIndex = currentIndex + 1;
        break;
      default:
        return;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      this.cellButtons[nextIndex]?.focus();
    }
  }

  private async handleCellClick(index: number): Promise<void> {
    if (this.isAIProcessing) {
      this.showAlert('warning', 'Please Wait', 'AI is currently predicting its step with TypeSafe AI.');
      return;
    }

    const pos = CELL_POSITIONS[index]!;
    const result = this.game.makeHumanMove(index);

    if (!result.success) {
      if (result.code === 'CELL_ALREADY_OCCUPIED') {
        this.showAlert(
          'error',
          'Override Blocked',
          `Cannot place move: Box #${index} (${pos.label}) is already occupied. Choose an empty box.`
        );
      } else if (result.code === 'GAME_ALREADY_FINISHED') {
        this.showAlert('warning', 'Round Over', 'This round has ended. Click "Next Round" to play again.');
      } else if (result.code === 'NOT_PLAYERS_TURN') {
        this.showAlert('warning', 'Wait for AI', "It is currently the AI's turn to play.");
      } else {
        this.showAlert('error', 'Invalid Move', result.message);
      }
      return;
    }

    this.hideAlert();
    this.render();

    if (result.status === 'WON') {
      this.showAlert('success', 'Victory!', `Congratulations! Player (X) aligned 3 marks on the ${result.winningLine?.description}!`);
      return;
    }

    if (result.status === 'DRAW') {
      this.showAlert('info', 'Draw', 'All boxes filled! The match ended in a draw.');
      return;
    }

    await this.executeAITurn();
  }

  private async executeAITurn(customFn?: AIFunction): Promise<void> {
    this.isAIProcessing = true;
    this.setTurnStatus('AI_THINKING');

    await new Promise((resolve) => setTimeout(resolve, 200));

    const result = await this.game.makeAIMove(customFn);
    this.isAIProcessing = false;

    if (!result.success) {
      this.render();

      if (result.code === 'AI_RETURNED_EMPTY') {
        this.showAlert(
          'warning',
          'AI Returned Empty',
          `TypeSafe AI function returned undefined. Try clicking "Play Fallback Random Move".`
        );
      } else if (result.code === 'CELL_ALREADY_OCCUPIED') {
        this.showAlert('error', 'AI Override Attempt Rejected', result.message);
      } else if (result.code === 'AI_EXECUTION_ERROR') {
        this.showAlert('error', 'AI Runtime Error Caught', result.message);
      } else {
        this.showAlert('error', 'AI Move Failed', result.message);
      }
      return;
    }

    this.hideAlert();
    this.render();

    if (result.status === 'WON') {
      this.showAlert('warning', 'AI Won', `AI Model (O) won via ${result.winningLine?.description}.`);
    } else if (result.status === 'DRAW') {
      this.showAlert('info', 'Draw', 'Game ended in a tie!');
    }
  }

  public render(): void {
    this.renderScores();
    this.renderStatus();
    this.renderBoard();
    this.renderRemainingBoxes();
    this.renderHistoryPanel();
    this.renderDecisionInspector();
  }

  private renderScores(): void {
    const scores = this.game.getScores();
    this.scoreHumanElem.textContent = String(scores.humanWins);
    this.scoreDrawsElem.textContent = String(scores.draws);
    this.scoreAiElem.textContent = String(scores.aiWins);
  }

  private renderStatus(): void {
    const currentTurn = this.game.getCurrentTurn();
    const status = this.game.getStatus();
    const winningLine = this.game.getWinningLine();

    if (status === 'WON') {
      const winner = winningLine?.player;
      this.statusDotElem.className = winner === 'X' ? 'turn-indicator-dot dot-x' : 'turn-indicator-dot dot-o';
      this.statusTextElem.textContent = `Game Over: Player ${winner} won!`;
      return;
    }

    if (status === 'DRAW') {
      this.statusDotElem.className = 'turn-indicator-dot dot-idle';
      this.statusTextElem.textContent = 'Game Over: Draw!';
      return;
    }

    if (status === 'AI_AWAITING_IMPLEMENTATION') {
      this.statusDotElem.className = 'turn-indicator-dot dot-o';
      this.statusTextElem.textContent = 'AI Turn: Waiting for logic or fallback';
      return;
    }

    if (currentTurn === 'X') {
      this.statusDotElem.className = 'turn-indicator-dot dot-x';
      this.statusTextElem.textContent = "Your turn (Player X)! Select an available cube.";
      return;
    }

    this.statusDotElem.className = 'turn-indicator-dot dot-o';
    this.statusTextElem.textContent = "TypeSafe AI (O) is classifying next step...";
  }

  private renderBoard(): void {
    const board = this.game.getBoard();
    const status = this.game.getStatus();
    const winningLine = this.game.getWinningLine();

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const button = this.cellButtons[i]!;
      const value = board[i];
      const pos = CELL_POSITIONS[i]!;
      const symbolSpan = document.getElementById(`cell-symbol-${i}`);

      const isWinningCell = winningLine?.indices.includes(i) ?? false;
      button.classList.toggle('winning-cell', isWinningCell);

      if (value !== null && value !== undefined) {
        if (symbolSpan) {
          symbolSpan.textContent = value;
          symbolSpan.className = `cell-symbol pop-in ${value === 'X' ? 'symbol-x' : 'symbol-o'}`;
        }
        button.disabled = true;
        button.setAttribute(
          'aria-label',
          `Cell #${i}, ${pos.label} (${pos.algebraic}), Marked with ${value}`
        );
        continue;
      }

      if (symbolSpan) {
        symbolSpan.textContent = '';
        symbolSpan.className = 'cell-symbol';
      }
      button.disabled = status === 'WON' || status === 'DRAW';
      button.setAttribute(
        'aria-label',
        `Cell #${i}, ${pos.label} (${pos.algebraic}), Row ${pos.row}, Column ${pos.col}, Empty`
      );
    }
  }

  private renderRemainingBoxes(): void {
    const remainingBoxes = this.game.getRemainingBoxes();
    this.remainingCountBadgeElem.textContent = `${remainingBoxes.length} / 9`;
    this.remainingBoxesListElem.innerHTML = '';

    if (remainingBoxes.length === 0) {
      const emptyTag = document.createElement('span');
      emptyTag.className = 'code-info';
      emptyTag.textContent = 'No boxes remaining.';
      this.remainingBoxesListElem.appendChild(emptyTag);
      return;
    }

    for (const box of remainingBoxes) {
      const pill = document.createElement('div');
      pill.className = 'box-pill';
      pill.title = `${box.label} (Row ${box.row}, Col ${box.col})`;
      pill.innerHTML = `<span class="box-idx">#${box.index}</span> <span class="box-coord">${box.algebraic}</span>`;
      this.remainingBoxesListElem.appendChild(pill);
    }
  }

  private renderHistoryPanel(): void {
    const history = this.game.getMoveHistory();
    this.moveCountBadgeElem.textContent = `${history.length} move${history.length === 1 ? '' : 's'}`;
    this.renderHistory(history);
  }

  private renderDecisionInspector(): void {
    const decision = this.game.getLastDecision();
    if (!decision) {
      this.statPredictedStepElem.textContent = '-';
      this.statConfidenceElem.textContent = '-';
      this.statAssessmentElem.textContent = '-';
      this.inspectorEngineBadgeElem.textContent = 'Awaiting First Move';
      this.inspectorEngineBadgeElem.className = 'inspector-engine-badge badge-neutral';
      this.probabilitiesListElem.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">Probabilities appear when AI makes a move.</span>';
      return;
    }

    this.statPredictedStepElem.textContent = `${decision.chosenPosition.algebraic} (#${decision.chosenPosition.index})`;
    this.statConfidenceElem.textContent = `${Math.round(decision.confidence * 100)}%`;
    this.statAssessmentElem.textContent = decision.assessment.replace(/_/g, ' ');

    this.inspectorEngineBadgeElem.textContent = `Jev (${decision.model})`;
    this.inspectorEngineBadgeElem.className = 'inspector-engine-badge badge-live';

    this.probabilitiesListElem.innerHTML = '';
    const sortedMoves = Object.entries(decision.probabilities).sort(([, a], [, b]) => b - a);

    for (const [algebraic, prob] of sortedMoves) {
      const isChosen = algebraic === decision.chosenPosition.algebraic;
      const percent = Math.round(prob * 100);

      const item = document.createElement('div');
      item.className = 'prob-item';
      item.innerHTML = `
        <div class="prob-header">
          <span class="prob-label ${isChosen ? 'prob-chosen' : ''}">${algebraic} ${isChosen ? '★' : ''}</span>
          <span class="prob-percent">${percent}%</span>
        </div>
        <div class="prob-bar-container">
          <div class="prob-bar ${isChosen ? 'prob-bar-chosen' : ''}" style="width: ${Math.max(4, percent)}%;"></div>
        </div>
      `;
      this.probabilitiesListElem.appendChild(item);
    }
  }

  private renderHistory(history: readonly MoveRecord[]): void {
    this.historyLogElem.innerHTML = '';
    if (history.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'history-item';
      emptyItem.innerHTML = '<span style="color: var(--text-muted);">No moves played yet.</span>';
      this.historyLogElem.appendChild(emptyItem);
      return;
    }

    for (let i = history.length - 1; i >= 0; i--) {
      const record = history[i]!;
      const item = document.createElement('li');
      item.className = 'history-item';

      const playerClass = record.player === 'X' ? 'history-player-x' : 'history-player-o';
      const playerText = record.player === 'X' ? 'Human (X)' : 'AI (O)';

      item.innerHTML = `
        <span><strong class="${playerClass}">${playerText}</strong> &rarr; ${record.position.label} [${record.position.algebraic}]</span>
        <span style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.7rem;">#${record.position.index}</span>
      `;
      this.historyLogElem.appendChild(item);
    }
  }

  private setTurnStatus(mode: 'AI_THINKING'): void {
    if (mode === 'AI_THINKING') {
      this.statusDotElem.className = 'turn-indicator-dot dot-o';
      this.statusTextElem.textContent = 'TypeSafe AI is classifying next step...';
    }
  }

  private showAlert(type: 'info' | 'warning' | 'error' | 'success', title: string, message: string): void {
    this.alertBoxElem.className = `alert-box alert-${type}`;
    this.alertTitleElem.textContent = title;
    this.alertMessageElem.innerHTML = message;

    const icons: Record<string, string> = {
      info: '&#8505;',
      warning: '&#9888;',
      error: '&#10006;',
      success: '&#10004;',
    };
    this.alertIconElem.innerHTML = icons[type] ?? '&#9888;';
  }

  private hideAlert(): void {
    this.alertBoxElem.className = 'alert-box hidden';
  }
}

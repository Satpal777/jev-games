import { TicTacToeGame } from './game';
import { TicTacToeUI } from './ui';

window.addEventListener('DOMContentLoaded', () => {
  const game = new TicTacToeGame();
  const ui = new TicTacToeUI(game);

  (window as unknown as { __TICTACTOE_GAME__: TicTacToeGame }).__TICTACTOE_GAME__ = game;
  (window as unknown as { __TICTACTOE_UI__: TicTacToeUI }).__TICTACTOE_UI__ = ui;
});

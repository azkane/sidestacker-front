import {getRowAvailabilityFromBoard, placePiece} from "./SidestackerGameHook";

it("Adds a piece in the specified position at the left side", () => {
  let board = [[undefined, undefined], [undefined, undefined]];
  expect(placePiece(board, 'C', 0, 'L'))
    .toEqual([['C', undefined], [undefined, undefined]])
});

it("Adds a piece in the specified position at the right", () => {
  let board = [[undefined, undefined], [undefined, undefined]];
  expect(placePiece(board, 'X', 1, 'R'))
    .toEqual([[undefined, undefined], [undefined, 'X']])
});

it('Returns available rows correctly', () => {
  let board = [[undefined, undefined], ['C', 'X']];
  expect(getRowAvailabilityFromBoard(board))
    .toEqual([true, false]);
})
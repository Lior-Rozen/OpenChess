import { useRef, useState, type RefObject } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View, type GestureResponderEvent } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon, InfoSheet } from '@/components/ui';
import { theme } from '@/theme';

import { Board } from './Board';
import {
  editorBoardFrom,
  editorFen,
  editorPosition,
  editorProblem,
  pieceOf,
  POOL,
  POOL_COLUMNS,
  poolPieceAt,
  squareAt,
  type EditorBoard,
  type PieceCode,
} from './editor';
import { ChessGame, type Color, type Square } from './game';
import { Piece } from './Piece';
import { addPosition, defaultName, removePosition } from './savedPositions';
import { useSavedPositions } from './useSavedPositions';

type Props = {
  initial: EditorBoard;
  initialTurn: Color;
  orientation: Color;
  /** Board width and height in pixels. */
  size: number;
  /** Called with the FEN of a valid set-up position. */
  onPlay: (fen: string) => void;
  onCancel: () => void;
};

type Rect = { x: number; y: number; width: number; height: number };
type Drag = { code: PieceCode; from: Square | null };

const START = editorBoardFrom(new ChessGame().position());

/**
 * Set up any position: drag pieces in from the pool, drag them around the board, or drag them
 * off the board to remove them. "Play from here" checks the position first.
 */
export function BoardEditor({ initial, initialTurn, orientation, size, onPlay, onCancel }: Props) {
  const [board, setBoard] = useState<EditorBoard>(initial);
  const [turn, setTurn] = useState<Color>(initialTurn);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useSavedPositions();
  const [sheet, setSheet] = useState<'save' | 'load' | null>(null);
  const [name, setName] = useState('');
  const [drag, setDrag] = useState<Drag | null>(null);
  // The square the dragged piece would land on, lit up while dragging.
  const [hover, setHover] = useState<Square | null>(null);
  const [ghost] = useState(() => new Animated.ValueXY());
  // Where the root, board and pool are on screen, for working out what a finger is over.
  const [rects, setRects] = useState<{ root?: Rect; board?: Rect; pool?: Rect }>({});
  const rootRef = useRef<View>(null);
  const boardRef = useRef<View>(null);
  const poolRef = useRef<View>(null);

  const squareSize = size / 8;
  const tileSize = size / POOL_COLUMNS;
  // The dragged piece is drawn larger than a square and centred on the finger, so it shows around it.
  const ghostSize = squareSize * 1.5;

  // measure() reports page coordinates, the same space as a touch's pageX/pageY. (measureInWindow
  // leaves out the status bar on Android, which put every touch about a square too low.)
  function measure(name: 'root' | 'board' | 'pool', ref: RefObject<View | null>) {
    ref.current?.measure((_x, _y, width, height, pageX, pageY) =>
      setRects((r) => ({ ...r, [name]: { x: pageX, y: pageY, width, height } })),
    );
  }

  function measureAll() {
    measure('root', rootRef);
    measure('board', boardRef);
    measure('pool', poolRef);
  }

  /** The board square under a finger, or null if it's off the board. */
  function squareUnder(pageX: number, pageY: number): Square | null {
    const b = rects.board;
    return b ? squareAt(pageX - b.x, pageY - b.y, b.width, orientation) : null;
  }

  function change(next: EditorBoard) {
    setBoard(next);
    setProblem(null);
    setNotice(null);
  }

  function save() {
    const label = name.trim() || defaultName(saved);
    setSaved((list) => addPosition(list, { name: label, board, turn }));
    setSheet(null);
    setName('');
    setNotice(`Saved as "${label}".`);
  }

  function load(position: { board: EditorBoard; turn: Color; name: string }) {
    change(position.board);
    setTurn(position.turn);
    setSheet(null);
    setNotice(`Loaded "${position.name}".`);
  }

  /** What is under a finger: a piece on the board or in the pool. */
  function pick(pageX: number, pageY: number): Drag | null {
    const square = squareUnder(pageX, pageY);
    if (square) return board[square] ? { code: board[square], from: square } : null;
    const p = rects.pool;
    if (p) {
      const code = poolPieceAt(pageX - p.x, pageY - p.y, p.width);
      if (code) return { code, from: null };
    }
    return null;
  }

  function moveGhost(e: GestureResponderEvent) {
    const { pageX, pageY } = e.nativeEvent;
    const root = rects.root ?? { x: 0, y: 0 };
    ghost.setValue({ x: pageX - root.x - ghostSize / 2, y: pageY - root.y - ghostSize / 2 });
    const square = squareUnder(pageX, pageY);
    if (square !== hover) setHover(square);
  }

  function onGrant(e: GestureResponderEvent) {
    const picked = pick(e.nativeEvent.pageX, e.nativeEvent.pageY);
    if (!picked) return;
    moveGhost(e);
    setDrag(picked);
  }

  function onRelease(e: GestureResponderEvent) {
    endDrag();
    if (!drag) return;
    const target = squareUnder(e.nativeEvent.pageX, e.nativeEvent.pageY);
    const next = { ...board };
    if (drag.from) delete next[drag.from];
    if (target) next[target] = drag.code;
    // Dropping a pool piece off the board changes nothing.
    if (target || drag.from) change(next);
  }

  function endDrag() {
    setDrag(null);
    setHover(null);
    // Re-measure in case anything moved on screen since the last layout.
    measureAll();
  }

  function play() {
    const why = editorProblem(board, turn);
    if (why) setProblem(why);
    else onPlay(editorFen(board, turn));
  }

  // While dragging a piece from the board, its square shows empty.
  const shown = { ...board };
  if (drag?.from) delete shown[drag.from];

  return (
    <View
      ref={rootRef}
      onLayout={() => measure('root', rootRef)}
      style={styles.root}
      onStartShouldSetResponderCapture={(e) => pick(e.nativeEvent.pageX, e.nativeEvent.pageY) !== null}
      onResponderGrant={onGrant}
      onResponderMove={moveGhost}
      onResponderRelease={onRelease}
      onResponderTerminationRequest={() => !drag}
      onResponderTerminate={endDrag}
    >
      <View ref={boardRef} onLayout={() => measure('board', boardRef)}>
        <Board
          position={editorPosition(shown, turn)}
          orientation={orientation}
          selection={hover ? { from: hover, targets: [] } : null}
          onSquarePress={() => {}}
          size={size}
        />
      </View>
      <Text style={styles.hint}>Drag off the board to remove.</Text>

      <View ref={poolRef} onLayout={() => measure('pool', poolRef)} style={[styles.pool, { width: size + 2 }]}>
        {POOL.map((code) => (
          <View key={code} style={{ width: tileSize, height: tileSize, padding: 3 }}>
            <View style={styles.tile}>
              <Piece {...pieceOf(code)} size={tileSize - 6} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.chips}>
        <Chip label="White to move" selected={turn === 'w'} onPress={() => setTurn('w')} />
        <Chip label="Black to move" selected={turn === 'b'} onPress={() => setTurn('b')} />
      </View>
      <View style={styles.chips}>
        <Chip label="Start position" onPress={() => change(START)} />
        <Chip label="Clear" dashed onPress={() => change({})} />
        <Chip label="Save" onPress={() => setSheet('save')} />
        <Chip label={saved.length ? `Saved (${saved.length})` : 'Saved'} onPress={() => setSheet('load')} />
      </View>
      <View style={styles.chips}>
        <Button label="Cancel" onPress={onCancel} />
        <Button label="Play from here" primary onPress={play} />
      </View>
      {problem && <Text style={styles.problem}>{problem}</Text>}
      {!problem && notice && <Text style={styles.notice}>{notice}</Text>}

      <InfoSheet visible={sheet === 'save'} onClose={() => setSheet(null)} title="Save this position">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={defaultName(saved)}
          placeholderTextColor={theme.muted}
          style={styles.input}
          autoFocus
          onSubmitEditing={save}
          returnKeyType="done"
        />
        <View style={styles.sheetButtons}>
          <Button label="Save" primary onPress={save} />
        </View>
      </InfoSheet>

      <InfoSheet visible={sheet === 'load'} onClose={() => setSheet(null)} title="Saved positions">
        {saved.length === 0 && <Text style={styles.empty}>Nothing saved yet.</Text>}
        {saved.map((p) => (
          <View key={p.id} style={styles.savedRow}>
            <Pressable onPress={() => load(p)} style={({ pressed }) => [styles.savedMain, pressed && styles.pressed]}>
              <Text style={styles.savedName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.savedMeta}>
                {Object.keys(p.board).length} pieces · {p.turn === 'w' ? 'White' : 'Black'} to move
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSaved((list) => removePosition(list, p.id))}
              accessibilityLabel={`Delete ${p.name}`}
              hitSlop={8}
              style={styles.delete}
            >
              <Icon name="trash-outline" size={18} />
            </Pressable>
          </View>
        ))}
      </InfoSheet>

      {drag && (
        <Animated.View
          pointerEvents="none"
          style={[styles.ghost, { width: ghostSize, height: ghostSize, transform: ghost.getTranslateTransform() }]}
        >
          <Piece {...pieceOf(drag.code)} size={ghostSize} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 10 },
  hint: { fontSize: 13, fontFamily: theme.font, color: theme.muted, textAlign: 'center' },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
  },
  tile: { flex: 1, backgroundColor: theme.pressed, borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  problem: { fontSize: 15, fontFamily: theme.font, color: theme.bad, textAlign: 'center' },
  notice: { fontSize: 14, fontFamily: theme.font, color: theme.muted, textAlign: 'center' },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: theme.font,
    color: theme.text,
    backgroundColor: theme.background,
  },
  sheetButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  empty: { fontSize: 14, fontFamily: theme.font, color: theme.muted, marginTop: 10 },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    marginTop: 8,
  },
  savedMain: { flex: 1, paddingVertical: 10 },
  savedName: { fontSize: 15, fontFamily: theme.fontMedium, color: theme.text },
  savedMeta: { fontSize: 12, fontFamily: theme.font, color: theme.muted, marginTop: 2 },
  delete: { padding: 8 },
  pressed: { opacity: 0.7 },
  ghost: { position: 'absolute', left: 0, top: 0 },
});

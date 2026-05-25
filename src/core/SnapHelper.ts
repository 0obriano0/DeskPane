// ============================================================
// WebOS-Core — Snap Helper
// 純計算模組：計算視窗拖曳時的吸附位置與 guide 線位置
// ============================================================

export interface SnapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapGuide {
  /** 'v' = 垂直線（固定 x），'h' = 水平線（固定 y） */
  axis: 'v' | 'h';
  /** 線在容器座標系的位置（px） */
  pos: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

/**
 * 計算單軸的吸附結果。
 * nearTargets：近邊（left/top）匹配用目標。
 * farTargets ：遠邊（right/bottom）匹配用目標。
 */
function snapAxis(
  pos: number,
  size: number,
  nearTargets: number[],
  farTargets: number[],
  threshold: number,
): { snapped: number; guidePos: number | null } {
  let bestDist = threshold;
  let snapped = pos;
  let guidePos: number | null = null;

  for (const t of nearTargets) {
    const d = Math.abs(pos - t);
    if (d < bestDist) {
      bestDist = d;
      snapped = t;
      guidePos = t;
    }
  }

  for (const t of farTargets) {
    const d = Math.abs(pos + size - t);
    if (d < bestDist) {
      bestDist = d;
      snapped = t - size;
      guidePos = t;
    }
  }

  return { snapped, guidePos };
}

/**
 * 計算拖曳視窗的吸附位置。
 *
 * @param drag          拖曳中視窗的建議位置與大小
 * @param containerSize 容器的寬高（isolated 用容器；否則用 viewport）
 * @param others        其他非最小化 / 非最大化視窗的位置與大小
 * @param threshold     吸附感應距離（px）
 * @param gap           視窗與視窗之間的間距（px），預設 0；容器邊緣不套用
 */
export function snapPosition(
  drag: SnapRect,
  containerSize: { width: number; height: number },
  others: SnapRect[],
  threshold: number,
  gap: number = 0,
): SnapResult {
  // 容器邊緣：不套用 gap
  const xNear: number[] = [0, containerSize.width];
  const xFar:  number[] = [0, containerSize.width];
  const yNear: number[] = [0, containerSize.height];
  const yFar:  number[] = [0, containerSize.height];

  for (const o of others) {
    // 近邊（drag.left / drag.top）對齊：
    //   同側對齊（left→left, top→top）：無間距
    //   跨側對齊（left 緊接 other.right）：+gap
    xNear.push(o.x, o.x + o.width + gap);
    yNear.push(o.y, o.y + o.height + gap);

    // 遠邊（drag.right / drag.bottom）對齊：
    //   跨側對齊（right 緊接 other.left）：-gap
    //   同側對齊（right→right）：無間距
    xFar.push(o.x - gap, o.x + o.width);
    yFar.push(o.y - gap, o.y + o.height);
  }

  const { snapped: snapX, guidePos: guideX } = snapAxis(drag.x, drag.width,  xNear, xFar, threshold);
  const { snapped: snapY, guidePos: guideY } = snapAxis(drag.y, drag.height, yNear, yFar, threshold);

  const guides: SnapGuide[] = [];
  if (guideX !== null) guides.push({ axis: 'v', pos: guideX });
  if (guideY !== null) guides.push({ axis: 'h', pos: guideY });

  return { x: snapX, y: snapY, guides };
}

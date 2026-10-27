/**
 * 서버 id 를 기기에 적어 둔 기록을 DB 초기화 때 한 번 비운다.
 *
 * 서버 DB 를 truncate 하면 id 가 다시 1부터 매겨진다. 기기에 남은 옛 id 는 새 데이터와 같은 번호가 되어
 * 엉뚱한 대상에 붙는다 — 2026-10-27 새 재매칭 대기방이 예전에 지운 방 id 와 겹쳐 목록에서 사라졌다.
 * 방·알림 지우기는 서버(계정 단위)로 옮겼고, 여기서는 그 밖에 id 를 키로 쓰는 기록과 옛 지우기 기록을 지운다.
 *
 * **DB 를 다시 초기화하면 [STORAGE_EPOCH] 를 바꾼다.** 기기마다 다음 실행에서 한 번 비워진다.
 * 비우는 대가는 작다: 평가 축하·건너뛴 평가 안내·매칭 수락 토스트가 한 번 더 뜰 수 있다.
 */
export const STORAGE_EPOCH = "2026-10-27";

const EPOCH_KEY = "ditto.storageEpoch";

/** 지울 기록. 정확한 키이거나, 끝이 `*` 이면 그 접두사로 시작하는 키 전부. */
const ID_KEYED_ENTRIES = [
  // 서버 지우기로 옮기기 전의 기기 로컬 숨김 목록. 더는 읽지 않는다.
  "ditto.hiddenChatRoomIds",
  "ditto.hiddenNotificationIds",
  // 알림 id·평가 id·퀴즈셋 id 를 키로 쓰는 기록.
  "ditto.notificationBellSeenId*",
  "ditto:review:submitted",
  "ditto:rematch:announced",
  "ditto:review:prompt-skipped",
  "ditto_match_accepted_notif_*",
];

function matches(key: string): boolean {
  return ID_KEYED_ENTRIES.some((entry) =>
    entry.endsWith("*") ? key.startsWith(entry.slice(0, -1)) : key === entry,
  );
}

/** 이번 기기가 아직 현재 epoch 를 거치지 않았으면 id 기록을 지우고 epoch 를 적는다. 몇 번 불러도 같다. */
export function clearStaleLocalIds(storage: Storage): void {
  if (storage.getItem(EPOCH_KEY) === STORAGE_EPOCH) return;

  const stale: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null && matches(key)) stale.push(key);
  }
  stale.forEach((key) => storage.removeItem(key));
  storage.setItem(EPOCH_KEY, STORAGE_EPOCH);
}

/**
 * 모듈을 읽는 순간 비운다. 화면의 이펙트는 자식부터 돌아서, 레이아웃 이펙트에서 비우면
 * 목록·벨이 먼저 옛 값을 읽는다. 저장소 접근은 언제든 throw 할 수 있어(프라이빗 창) 삼킨다.
 */
if (typeof window !== "undefined") {
  try {
    clearStaleLocalIds(window.localStorage);
  } catch {
    // 못 비우면 옛 값이 남을 뿐이다. 화면을 막을 일은 아니다.
  }
}

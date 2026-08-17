import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefCallback,
  type RefObject,
} from 'react';

/** Keeps keyboard position stable while outbox rows change around the user. */
interface StableListFocusOptions {
  itemIds: string[];
  fallbackFocusRef?: RefObject<HTMLElement | null>;
}

export function useStableListFocus({
  itemIds,
  fallbackFocusRef,
}: StableListFocusOptions) {
  const [activeId, setActiveId] = useState<string | null>(itemIds[0] ?? null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const previousIdsRef = useRef(itemIds);
  const listRef = useRef<HTMLUListElement>(null);
  const focusWasWithinListRef = useRef(false);

  const focusRow = useCallback((messageId: string) => {
    const row = rowRefs.current.get(messageId);
    if (!row) return;

    setActiveId(messageId);
    row.focus();
  }, []);

  const registerRow = useCallback<RefCallback<HTMLLIElement>>((row) => {
    if (!row) return;

    const messageId = row.dataset.messageId;
    if (!messageId) return;

    rowRefs.current.set(messageId, row);
    return () => {
      if (rowRefs.current.get(messageId) === row) {
        rowRefs.current.delete(messageId);
      }
    };
  }, []);

  const handleFocusCapture = useCallback(
    (messageId: string) => {
      focusWasWithinListRef.current = true;
      setActiveId(messageId);
    },
    [],
  );

  const handleBlurCapture = useCallback(() => {
    queueMicrotask(() => {
      const list = listRef.current;
      focusWasWithinListRef.current = Boolean(
        list && list.contains(document.activeElement),
      );
    });
  }, []);

  const handleRowKeyDown = useCallback(
    (
      messageId: string,
      event: KeyboardEvent<HTMLLIElement>,
      onToggleSelection: () => void,
      selectable: boolean,
    ) => {
      if (event.target !== event.currentTarget) return;

      const currentIndex = itemIds.indexOf(messageId);
      if (currentIndex < 0) return;

      let nextId: string | undefined;

      switch (event.key) {
        case 'ArrowDown':
          nextId = itemIds[Math.min(currentIndex + 1, itemIds.length - 1)];
          break;
        case 'ArrowUp':
          nextId = itemIds[Math.max(currentIndex - 1, 0)];
          break;
        case 'Home':
          nextId = itemIds[0];
          break;
        case 'End':
          nextId = itemIds[itemIds.length - 1];
          break;
        case ' ':
          if (selectable) {
            event.preventDefault();
            onToggleSelection();
          }
          return;
        default:
          return;
      }

      if (nextId) {
        event.preventDefault();
        focusRow(nextId);
      }
    },
    [focusRow, itemIds],
  );

  useLayoutEffect(() => {
    const previousIds = previousIdsRef.current;
    let nextActiveId = activeId;

    if (!nextActiveId || !itemIds.includes(nextActiveId)) {
      const previousIndex = nextActiveId
        ? previousIds.indexOf(nextActiveId)
        : 0;
      const fallbackIndex = Math.min(
        Math.max(previousIndex, 0),
        Math.max(itemIds.length - 1, 0),
      );
      nextActiveId = itemIds[fallbackIndex] ?? null;

      if (nextActiveId !== activeId) setActiveId(nextActiveId);
    }

    if (focusWasWithinListRef.current) {
      const listStillHasFocus = Boolean(
        listRef.current?.contains(document.activeElement),
      );

      if (!listStillHasFocus) {
        if (nextActiveId) rowRefs.current.get(nextActiveId)?.focus();
        else fallbackFocusRef?.current?.focus();
      }
    }

    previousIdsRef.current = itemIds;
  }, [activeId, fallbackFocusRef, itemIds]);

  return {
    activeId,
    listRef,
    registerRow,
    handleFocusCapture,
    handleBlurCapture,
    handleRowKeyDown,
  };
}

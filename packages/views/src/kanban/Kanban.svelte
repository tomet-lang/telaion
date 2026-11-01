<script lang="ts">
  import type { Snippet } from "svelte";
  import { Badge, IconButton } from "@telaion/primitives";
  import { Plus } from "@telaion/primitives/icons";
  import type { KanbanCardData, KanbanColumnData, KanbanMoveEvent } from "./types.js";

  let {
    columns = $bindable([]),
    oncardmove,
    oncardclick,
    onaddcard,
    cardSnippet,
    columnHeaderSnippet,
  }: {
    columns: KanbanColumnData[];
    oncardmove?: (event: KanbanMoveEvent) => void;
    oncardclick?: (card: KanbanCardData, columnId: string) => void;
    onaddcard?: (columnId: string) => void;
    cardSnippet?: Snippet<[{ card: KanbanCardData; column: KanbanColumnData; index: number }]>;
    columnHeaderSnippet?: Snippet<[{ column: KanbanColumnData; index: number }]>;
  } = $props();

  let draggingCardId = $state<string | null>(null);
  let activeDropColumnId = $state<string | null>(null);
  let activeDropIndex = $state<number | null>(null);

  function findCard(cardId: string): { colIndex: number; cardIndex: number; card: KanbanCardData; column: KanbanColumnData } | null {
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const idx = col.items.findIndex((item) => item.id === cardId);
      if (idx !== -1) {
        return { colIndex: c, cardIndex: idx, card: col.items[idx], column: col };
      }
    }
    return null;
  }

  function moveCard(cardId: string, targetColId: string, targetIndex: number) {
    const found = findCard(cardId);
    if (!found) return;

    const { colIndex: srcColIndex, cardIndex: srcCardIndex, card, column: srcCol } = found;
    const destColIndex = columns.findIndex((col) => col.id === targetColId);
    if (destColIndex === -1) return;

    const destCol = columns[destColIndex];

    // If moving within same column to same position, do nothing
    if (srcColIndex === destColIndex && srcCardIndex === targetIndex) return;

    // Mutate state immutably or directly
    const nextColumns = columns.map((col, idx) => {
      if (idx === srcColIndex && idx === destColIndex) {
        // Move within same column
        const items = [...col.items];
        items.splice(srcCardIndex, 1);
        const clampedTarget = Math.max(0, Math.min(items.length, targetIndex));
        items.splice(clampedTarget, 0, card);
        return { ...col, items };
      }
      if (idx === srcColIndex) {
        // Remove from source
        const items = col.items.filter((_, i) => i !== srcCardIndex);
        return { ...col, items };
      }
      if (idx === destColIndex) {
        // Insert into destination
        const items = [...col.items];
        const clampedTarget = Math.max(0, Math.min(items.length, targetIndex));
        items.splice(clampedTarget, 0, card);
        return { ...col, items };
      }
      return col;
    });

    columns = nextColumns;

    oncardmove?.({
      cardId,
      fromColumnId: srcCol.id,
      toColumnId: destCol.id,
      fromIndex: srcCardIndex,
      toIndex: targetIndex,
    });
  }

  function handleDragStart(e: DragEvent, card: KanbanCardData, columnId: string) {
    if (!e.dataTransfer) return;
    draggingCardId = card.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId: card.id, fromColumnId: columnId }));
  }

  function handleDragEnd() {
    draggingCardId = null;
    activeDropColumnId = null;
    activeDropIndex = null;
  }

  function handleColumnDragOver(e: DragEvent, columnId: string) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = "move";
    activeDropColumnId = columnId;
  }

  function handleColumnDrop(e: DragEvent, columnId: string) {
    e.preventDefault();
    if (!draggingCardId) return;

    const targetIndex = activeDropIndex !== null ? activeDropIndex : 999999;
    moveCard(draggingCardId, columnId, targetIndex);
    handleDragEnd();
  }

  function handleCardDragOver(e: DragEvent, columnId: string, index: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = "move";
    activeDropColumnId = columnId;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    // If pointer is in lower half, drop after this card
    const targetIdx = e.clientY > midpoint ? index + 1 : index;
    activeDropIndex = targetIdx;
  }

  function handleCardKeyDown(e: KeyboardEvent, card: KanbanCardData, colIndex: number, cardIndex: number) {
    const col = columns[colIndex];

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      oncardclick?.(card, col.id);
      return;
    }

    if (e.key === "ArrowLeft") {
      if (colIndex > 0) {
        e.preventDefault();
        const prevCol = columns[colIndex - 1];
        moveCard(card.id, prevCol.id, prevCol.items.length);
        // Focus the card in its new position after DOM update
        setTimeout(() => {
          document.getElementById(`kanban-card-${card.id}`)?.focus();
        }, 0);
      }
    } else if (e.key === "ArrowRight") {
      if (colIndex < columns.length - 1) {
        e.preventDefault();
        const nextCol = columns[colIndex + 1];
        moveCard(card.id, nextCol.id, nextCol.items.length);
        setTimeout(() => {
          document.getElementById(`kanban-card-${card.id}`)?.focus();
        }, 0);
      }
    } else if (e.key === "ArrowUp") {
      if (cardIndex > 0) {
        e.preventDefault();
        moveCard(card.id, col.id, cardIndex - 1);
        setTimeout(() => {
          document.getElementById(`kanban-card-${card.id}`)?.focus();
        }, 0);
      }
    } else if (e.key === "ArrowDown") {
      if (cardIndex < col.items.length - 1) {
        e.preventDefault();
        moveCard(card.id, col.id, cardIndex + 1);
        setTimeout(() => {
          document.getElementById(`kanban-card-${card.id}`)?.focus();
        }, 0);
      }
    }
  }
</script>

<div class="tln-kanban" role="region" aria-label="Kanban board">
  {#each columns as column, cIndex (column.id)}
    <div
      class="tln-kanban-column"
      class:tln-kanban-column-active={activeDropColumnId === column.id}
      role="region"
      aria-label={column.title}
      ondragover={(e) => handleColumnDragOver(e, column.id)}
      ondrop={(e) => handleColumnDrop(e, column.id)}
    >
      <header class="tln-kanban-column-header">
        {#if columnHeaderSnippet}
          {@render columnHeaderSnippet({ column, index: cIndex })}
        {:else}
          <div class="tln-kanban-column-title">
            <span>{column.title}</span>
            <Badge tone="neutral">{column.items.length}</Badge>
          </div>
          {#if onaddcard}
            <IconButton
              icon={Plus}
              label="Add card to {column.title}"
              onclick={() => onaddcard?.(column.id)}
            />
          {/if}
        {/if}
      </header>

      <div class="tln-kanban-cards" role="list">
        {#each column.items as card, cardIdx (card.id)}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
          <div
            id="kanban-card-{card.id}"
            role="listitem"
            tabindex="0"
            draggable="true"
            aria-roledescription="card"
            aria-label="{card.title}, column {column.title}"
            class="tln-kanban-card"
            data-dragging={draggingCardId === card.id || undefined}
            ondragstart={(e) => handleDragStart(e, card, column.id)}
            ondragend={handleDragEnd}
            ondragover={(e) => handleCardDragOver(e, column.id, cardIdx)}
            onclick={() => oncardclick?.(card, column.id)}
            onkeydown={(e) => handleCardKeyDown(e, card, cIndex, cardIdx)}
          >
            {#if cardSnippet}
              {@render cardSnippet({ card, column, index: cardIdx })}
            {:else}
              <div class="tln-kanban-card-header">
                <span class="tln-kanban-card-title">{card.title}</span>
                {#if card.badge}
                  <Badge tone={card.badgeTone ?? "neutral"}>{card.badge}</Badge>
                {/if}
              </div>
              {#if card.description}
                <p class="tln-kanban-card-desc">{card.description}</p>
              {/if}
            {/if}
          </div>
        {/each}

        {#if column.items.length === 0}
          <div class="tln-kanban-empty">
            <span>No cards</span>
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .tln-kanban {
    display: flex;
    gap: calc(var(--tln-space) * 4);
    overflow-x: auto;
    padding: calc(var(--tln-space) * 2);
    align-items: flex-start;
    width: 100%;
    box-sizing: border-box;
  }

  .tln-kanban-column {
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
    width: 280px;
    min-width: 240px;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transition: box-shadow var(--tln-transition), border-color var(--tln-transition);
    border: 1px solid var(--tln-border);
  }

  .tln-kanban-column.tln-kanban-column-active {
    border-color: var(--tln-accent);
  }

  .tln-kanban-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--tln-space) * 3);
    border-bottom: 1px solid var(--tln-border);
    font-size: var(--tln-text-sm);
    font-weight: var(--tln-weight-medium);
  }

  .tln-kanban-column-title {
    display: flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
  }

  .tln-kanban-cards {
    display: flex;
    flex-direction: column;
    gap: calc(var(--tln-space) * 2.5);
    padding: calc(var(--tln-space) * 3);
    min-height: 80px;
    max-height: 520px;
    overflow-y: auto;
  }

  .tln-kanban-card {
    background: var(--tln-action);
    border: 1px solid var(--tln-border);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-action);
    padding: calc(var(--tln-space) * 3);
    cursor: grab;
    display: flex;
    flex-direction: column;
    gap: calc(var(--tln-space) * 1.5);
    transition: background-color var(--tln-transition), box-shadow var(--tln-transition), opacity var(--tln-transition);
    user-select: none;
    -webkit-user-select: none;
  }

  .tln-kanban-card:hover {
    background: var(--tln-action-hover);
  }

  .tln-kanban-card:focus-visible {
    outline: var(--tln-focus-ring);
    outline-offset: -1px;
  }

  .tln-kanban-card[data-dragging] {
    opacity: 0.4;
    cursor: grabbing;
  }

  .tln-kanban-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: calc(var(--tln-space) * 2);
  }

  .tln-kanban-card-title {
    font-size: var(--tln-text-sm);
    font-weight: var(--tln-weight-medium);
    color: var(--tln-fg);
  }

  .tln-kanban-card-desc {
    margin: 0;
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
    line-height: var(--tln-leading);
  }

  .tln-kanban-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--tln-space) * 4);
    color: var(--tln-fg-muted);
    font-size: var(--tln-text-xs);
    border: 1px dashed var(--tln-border);
    border-radius: var(--tln-radius);
  }
</style>

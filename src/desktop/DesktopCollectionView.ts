// ============================================================
// DeskPane-Desktop — DesktopCollectionView
// Wijmo-style collection view for desktop icon data binding.
// ============================================================

import { EventBus } from '../core/EventBus.js';

export type DesktopCollectionChangeAction =
  | 'reset'
  | 'refresh'
  | 'add'
  | 'remove'
  | 'update';

export interface DesktopCollectionChangedEvent<TItem extends { id: string }> {
  action: DesktopCollectionChangeAction;
  source: string;
  items: TItem[];
  item?: TItem;
  previousItem?: TItem;
  id?: string;
  index?: number;
}

export interface DesktopCollectionViewOptions<TItem extends { id: string }> {
  /** Custom key getter. Defaults to `item.id`. */
  getKey?: (item: TItem) => string;
  /**
   * Track added / removed / edited items when mutations go through the view.
   * Direct sourceCollection mutations still require refresh().
   */
  trackChanges?: boolean;
}

export interface DesktopCollectionMutationOptions {
  /** Describes who initiated the change. */
  source?: string;
  /** Set false when the caller wants to batch or emit manually. */
  emit?: boolean;
}

export class DesktopCollectionView<TItem extends { id: string }> {
  sourceCollection: TItem[];
  items: TItem[];
  readonly collectionChanged = new EventBus();
  readonly currentChanged = new EventBus();
  readonly trackChanges: boolean;
  readonly addedItems: TItem[] = [];
  readonly removedItems: TItem[] = [];
  readonly editedItems: TItem[] = [];

  private readonly _getKey: (item: TItem) => string;
  private _deferLevel = 0;
  private _pendingChange: DesktopCollectionChangedEvent<TItem> | null = null;

  constructor(sourceCollection: TItem[] = [], options: DesktopCollectionViewOptions<TItem> = {}) {
    this.sourceCollection = sourceCollection;
    this.items = [...sourceCollection];
    this.trackChanges = options.trackChanges ?? false;
    this._getKey = options.getKey ?? ((item) => item.id);
  }

  get length(): number {
    return this.items.length;
  }

  getItem(id: string): TItem | undefined {
    return this.items.find(item => this._getKey(item) === id);
  }

  setSourceCollection(
    sourceCollection: TItem[],
    options: DesktopCollectionMutationOptions = {},
  ): void {
    this.sourceCollection = sourceCollection;
    this.refresh({
      source: options.source ?? 'external',
      emit: options.emit,
    });
  }

  refresh(options: DesktopCollectionMutationOptions = {}): void {
    this.items = [...this.sourceCollection];
    this._emit({
      action: 'refresh',
      source: options.source ?? 'external',
      items: this.snapshot(),
    }, options);
  }

  beginUpdate(): void {
    this._deferLevel++;
  }

  endUpdate(): void {
    if (this._deferLevel === 0) return;
    this._deferLevel--;
    if (this._deferLevel === 0 && this._pendingChange) {
      const pending = this._pendingChange;
      this._pendingChange = null;
      this.collectionChanged.emit<DesktopCollectionChangedEvent<TItem>>('change', pending);
    }
  }

  deferUpdate(fn: () => void): void {
    this.beginUpdate();
    try {
      fn();
    } finally {
      this.endUpdate();
    }
  }

  add(item: TItem, options: DesktopCollectionMutationOptions = {}): void {
    this.sourceCollection.push(item);
    this.items = [...this.sourceCollection];
    if (this.trackChanges) this.addedItems.push(item);
    this._emit({
      action: 'add',
      source: options.source ?? 'view',
      items: this.snapshot(),
      item: { ...item },
      id: this._getKey(item),
      index: this.sourceCollection.length - 1,
    }, options);
  }

  remove(idOrItem: string | TItem, options: DesktopCollectionMutationOptions = {}): TItem | undefined {
    const id = typeof idOrItem === 'string' ? idOrItem : this._getKey(idOrItem);
    const index = this.sourceCollection.findIndex(item => this._getKey(item) === id);
    if (index < 0) return undefined;
    const [removed] = this.sourceCollection.splice(index, 1);
    this.items = [...this.sourceCollection];
    if (this.trackChanges) this.removedItems.push(removed);
    this._emit({
      action: 'remove',
      source: options.source ?? 'view',
      items: this.snapshot(),
      item: { ...removed },
      id,
      index,
    }, options);
    return removed;
  }

  update(
    idOrItem: string | TItem,
    patch: Partial<TItem>,
    options: DesktopCollectionMutationOptions = {},
  ): TItem | undefined {
    const id = typeof idOrItem === 'string' ? idOrItem : this._getKey(idOrItem);
    const index = this.sourceCollection.findIndex(item => this._getKey(item) === id);
    if (index < 0) return undefined;
    const previous = { ...this.sourceCollection[index] };
    Object.assign(this.sourceCollection[index], patch);
    const item = this.sourceCollection[index];
    this.items = [...this.sourceCollection];
    if (this.trackChanges && !this.editedItems.includes(item)) this.editedItems.push(item);
    this._emit({
      action: 'update',
      source: options.source ?? 'view',
      items: this.snapshot(),
      item: { ...item },
      previousItem: previous,
      id,
      index,
    }, options);
    return item;
  }

  clearChanges(): void {
    this.addedItems.length = 0;
    this.removedItems.length = 0;
    this.editedItems.length = 0;
  }

  snapshot(): TItem[] {
    return this.items.map(item => ({ ...item }));
  }

  dispose(): void {
    this.collectionChanged.clearAll();
    this.currentChanged.clearAll();
    this._pendingChange = null;
    this._deferLevel = 0;
  }

  private _emit(
    change: DesktopCollectionChangedEvent<TItem>,
    options: DesktopCollectionMutationOptions,
  ): void {
    if (options.emit === false) return;
    if (this._deferLevel > 0) {
      this._pendingChange = {
        action: 'reset',
        source: change.source,
        items: this.snapshot(),
      };
      return;
    }
    this.collectionChanged.emit<DesktopCollectionChangedEvent<TItem>>('change', change);
  }
}

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.DeskPaneMenu = {}));
})(this, (function (exports) { 'use strict';

    // ============================================================
    // DeskPane — Global Event Bus
    // 跨視窗事件系統，允許不同視窗間即時資料聯動
    // ============================================================
    class EventBus {
        constructor() {
            this._listeners = new Map();
        }
        /** 訂閱事件 */
        on(event, cb) {
            if (!this._listeners.has(event)) {
                this._listeners.set(event, new Set());
            }
            this._listeners.get(event).add(cb);
            // 回傳取消訂閱函式
            return () => this.off(event, cb);
        }
        /** 取消訂閱 */
        off(event, cb) {
            this._listeners.get(event)?.delete(cb);
        }
        /** 發送事件 */
        emit(event, data) {
            this._listeners.get(event)?.forEach(cb => {
                try {
                    cb(data);
                }
                catch (e) {
                    console.error(`[EventBus] Error in handler for "${event}":`, e);
                }
            });
        }
        /** 清除特定事件的所有訂閱 */
        clear(event) {
            this._listeners.delete(event);
        }
        /** 清除全部訂閱 */
        clearAll() {
            this._listeners.clear();
        }
    }

    // ============================================================
    // DeskPane-Menu - Icon rendering helpers
    // ============================================================
    /** Render the same URL / inline SVG / emoji icon forms used by Desktop. */
    function appendMenuIcon(container, icon) {
        if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
            const img = document.createElement('img');
            img.src = icon;
            img.alt = '';
            container.appendChild(img);
        }
        else if (icon.trim().startsWith('<svg')) {
            container.innerHTML = icon;
        }
        else {
            container.textContent = icon;
        }
    }

    // ============================================================
    // DeskPane-Menu - Shared menu surface and interaction engine
    // ============================================================
    class MenuSurface {
        constructor(options) {
            this.events = new EventBus();
            this._outsideIgnore = new Set();
            this._destroyed = false;
            this._onDocumentPointerDown = (event) => {
                if (this._el.hidden)
                    return;
                const target = event.target;
                if (!(target instanceof Node))
                    return;
                if (this._el.contains(target))
                    return;
                if (Array.from(this._outsideIgnore).some(element => element.contains(target)))
                    return;
                this.hide('outside');
            };
            this._onViewportChange = () => {
                if (!this._el.hidden)
                    this.hide('outside');
            };
            this._onKeyDown = (event) => {
                const target = event.target;
                if (!(target instanceof HTMLButtonElement) || !target.classList.contains('dp-menu-item')) {
                    if (event.key === 'Escape')
                        this.hide('escape');
                    return;
                }
                const list = target.closest('.dp-menu-list');
                if (!list)
                    return;
                const buttons = this._visibleButtons(list);
                const index = buttons.indexOf(target);
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
                    event.preventDefault();
                    let next = index;
                    if (event.key === 'Home')
                        next = 0;
                    else if (event.key === 'End')
                        next = buttons.length - 1;
                    else if (event.key === 'ArrowDown')
                        next = (index + 1) % buttons.length;
                    else
                        next = (index - 1 + buttons.length) % buttons.length;
                    buttons[next]?.focus();
                    return;
                }
                if (event.key === 'ArrowRight') {
                    const entry = target.closest('.dp-menu-entry');
                    const submenu = entry?.querySelector(':scope > .dp-menu-submenu');
                    if (submenu && entry instanceof HTMLElement) {
                        event.preventDefault();
                        this._positionSubmenu(entry, submenu);
                        entry.classList.add('dp-menu-entry--expanded');
                        target.setAttribute('aria-expanded', 'true');
                        this._focusFirst(submenu);
                    }
                    return;
                }
                if (event.key === 'ArrowLeft') {
                    const submenu = target.closest('.dp-menu-submenu');
                    const parentEntry = submenu?.parentElement;
                    const parentButton = parentEntry?.querySelector(':scope > .dp-menu-item');
                    if (parentButton) {
                        event.preventDefault();
                        parentEntry?.classList.remove('dp-menu-entry--expanded');
                        parentButton.setAttribute('aria-expanded', 'false');
                        parentButton.focus();
                    }
                    return;
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.hide('escape');
                }
            };
            this._variant = options.variant;
            this._target = options.target ?? document.body;
            this._closeOnSelect = options.closeOnSelect;
            this._groups = {
                items: [...options.items],
                secondaryItems: [...(options.secondaryItems ?? [])],
                footerItems: [...(options.footerItems ?? [])],
                header: options.header,
            };
            this._el = document.createElement('div');
            this._el.className = `dp-menu dp-${options.variant}-menu`;
            if (options.className)
                this._el.classList.add(...options.className.split(/\s+/).filter(Boolean));
            this._el.hidden = true;
            this._el.setAttribute('role', 'menu');
            this._el.setAttribute('aria-hidden', 'true');
            this._el.addEventListener('keydown', this._onKeyDown);
            this._target.appendChild(this._el);
            document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
            window.addEventListener('resize', this._onViewportChange);
            window.addEventListener('blur', this._onViewportChange);
            this._render();
        }
        setGroups(groups) {
            this._groups = {
                items: groups.items ? [...groups.items] : this._groups.items,
                secondaryItems: groups.secondaryItems ? [...groups.secondaryItems] : this._groups.secondaryItems,
                footerItems: groups.footerItems ? [...groups.footerItems] : this._groups.footerItems,
                header: groups.header === undefined ? this._groups.header : groups.header,
            };
            this._render();
        }
        addOutsideIgnore(element) {
            this._outsideIgnore.add(element);
        }
        showAt(clientX, clientY, source = 'api') {
            this._prepareOpen();
            this._position(clientX, clientY);
            this._finishOpen(source);
        }
        showFor(anchor, placement, offset) {
            this._prepareOpen();
            const anchorRect = anchor.getBoundingClientRect();
            const menuRect = this._el.getBoundingClientRect();
            let x = placement.endsWith('end') ? anchorRect.right - menuRect.width : anchorRect.left;
            let y = placement.startsWith('top')
                ? anchorRect.top - menuRect.height - offset
                : anchorRect.bottom + offset;
            const bounds = this._getBounds();
            if (placement.startsWith('top') && y < bounds.top)
                y = anchorRect.bottom + offset;
            if (placement.startsWith('bottom') && y + menuRect.height > bounds.bottom) {
                const above = anchorRect.top - menuRect.height - offset;
                if (above >= bounds.top)
                    y = above;
            }
            this._position(x, y);
            this._finishOpen('anchor');
        }
        hide(reason = 'api') {
            if (this._el.hidden)
                return;
            this._el.hidden = true;
            this._el.style.visibility = '';
            this._el.setAttribute('aria-hidden', 'true');
            this._el.querySelectorAll('.dp-menu-entry--expanded').forEach(node => {
                node.classList.remove('dp-menu-entry--expanded');
            });
            this.events.emit('menu:close', { element: this._el, reason });
        }
        isOpen() {
            return !this._el.hidden;
        }
        getElement() {
            return this._el;
        }
        destroy() {
            if (this._destroyed)
                return;
            this._destroyed = true;
            this.hide('destroy');
            document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
            window.removeEventListener('resize', this._onViewportChange);
            window.removeEventListener('blur', this._onViewportChange);
            this._el.removeEventListener('keydown', this._onKeyDown);
            this._el.remove();
            this._outsideIgnore.clear();
            this.events.clearAll();
        }
        _render() {
            this._el.innerHTML = '';
            if (this._variant === 'start') {
                if (this._groups.header?.label || this._groups.header?.icon) {
                    this._el.appendChild(this._createHeader(this._groups.header));
                }
                const body = document.createElement('div');
                body.className = 'dp-start-menu-body';
                const primary = document.createElement('div');
                primary.className = 'dp-start-menu-primary';
                primary.appendChild(this._createList(this._groups.items));
                body.appendChild(primary);
                if (this._groups.secondaryItems?.length) {
                    const secondary = document.createElement('div');
                    secondary.className = 'dp-start-menu-secondary';
                    secondary.appendChild(this._createList(this._groups.secondaryItems));
                    body.appendChild(secondary);
                }
                this._el.appendChild(body);
                if (this._groups.footerItems?.length) {
                    const footer = document.createElement('div');
                    footer.className = 'dp-start-menu-footer';
                    footer.appendChild(this._createList(this._groups.footerItems));
                    this._el.appendChild(footer);
                }
                return;
            }
            this._el.appendChild(this._createList(this._groups.items));
        }
        _createHeader(header) {
            const el = document.createElement('div');
            el.className = 'dp-start-menu-header';
            if (header.icon) {
                const icon = document.createElement('span');
                icon.className = 'dp-start-menu-header-icon';
                appendMenuIcon(icon, header.icon);
                el.appendChild(icon);
            }
            if (header.label) {
                const label = document.createElement('span');
                label.className = 'dp-start-menu-header-label';
                label.textContent = header.label;
                el.appendChild(label);
            }
            return el;
        }
        _createList(items) {
            const list = document.createElement('ul');
            list.className = 'dp-menu-list';
            list.setAttribute('role', 'menu');
            items.forEach((item) => {
                if (item.type === 'separator') {
                    const separator = document.createElement('li');
                    separator.className = 'dp-menu-separator';
                    separator.setAttribute('role', 'separator');
                    if (item.id)
                        separator.dataset.menuId = item.id;
                    list.appendChild(separator);
                    return;
                }
                const entry = document.createElement('li');
                entry.className = 'dp-menu-entry';
                entry.setAttribute('role', 'none');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'dp-menu-item';
                button.dataset.menuId = item.id;
                button.disabled = item.disabled === true;
                button.setAttribute('role', item.checked === undefined ? 'menuitem' : 'menuitemcheckbox');
                if (item.checked !== undefined)
                    button.setAttribute('aria-checked', String(item.checked));
                const check = document.createElement('span');
                check.className = 'dp-menu-check';
                check.setAttribute('aria-hidden', 'true');
                check.textContent = item.checked ? '✓' : '';
                button.appendChild(check);
                const icon = document.createElement('span');
                icon.className = 'dp-menu-icon';
                icon.setAttribute('aria-hidden', 'true');
                if (item.icon)
                    appendMenuIcon(icon, item.icon);
                button.appendChild(icon);
                const label = document.createElement('span');
                label.className = 'dp-menu-label';
                label.textContent = item.label;
                button.appendChild(label);
                if (item.shortcut) {
                    const shortcut = document.createElement('span');
                    shortcut.className = 'dp-menu-shortcut';
                    shortcut.textContent = item.shortcut;
                    button.appendChild(shortcut);
                }
                if (item.children?.length) {
                    button.setAttribute('aria-haspopup', 'menu');
                    button.setAttribute('aria-expanded', 'false');
                    const arrow = document.createElement('span');
                    arrow.className = 'dp-menu-submenu-arrow';
                    arrow.setAttribute('aria-hidden', 'true');
                    arrow.textContent = '›';
                    button.appendChild(arrow);
                    const submenu = document.createElement('div');
                    submenu.className = 'dp-menu-submenu';
                    submenu.appendChild(this._createList(item.children));
                    entry.append(button, submenu);
                    entry.addEventListener('pointerenter', () => this._positionSubmenu(entry, submenu));
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        this._positionSubmenu(entry, submenu);
                        const expanded = entry.classList.toggle('dp-menu-entry--expanded');
                        button.setAttribute('aria-expanded', String(expanded));
                        if (expanded)
                            this._focusFirst(submenu);
                    });
                }
                else {
                    entry.appendChild(button);
                    button.addEventListener('click', (event) => this._selectItem(item, event));
                }
                list.appendChild(entry);
            });
            return list;
        }
        _selectItem(item, originalEvent) {
            if (item.disabled)
                return;
            const event = { id: item.id, item, originalEvent };
            this.events.emit('menu:select', event);
            item.action?.(event);
            if (this._closeOnSelect)
                this.hide('select');
        }
        _prepareOpen() {
            if (this._destroyed)
                throw new Error('Cannot open a destroyed menu.');
            this._el.hidden = false;
            this._el.style.position = 'fixed';
            this._el.style.visibility = 'hidden';
            this._el.style.left = '0px';
            this._el.style.top = '0px';
            this._el.setAttribute('aria-hidden', 'false');
        }
        _finishOpen(source) {
            this._el.style.visibility = '';
            this._focusFirst(this._el);
            this.events.emit('menu:open', { element: this._el, source });
        }
        _position(clientX, clientY) {
            const rect = this._el.getBoundingClientRect();
            const bounds = this._getBounds();
            const margin = 4;
            const [minX, maxX] = this._getClampRange(bounds.left, bounds.right, rect.width, window.innerWidth, margin);
            const [minY, maxY] = this._getClampRange(bounds.top, bounds.bottom, rect.height, window.innerHeight, margin);
            const x = Math.min(Math.max(clientX, minX), maxX);
            const y = Math.min(Math.max(clientY, minY), maxY);
            this._el.style.left = `${Math.round(x)}px`;
            this._el.style.top = `${Math.round(y)}px`;
        }
        _getClampRange(targetStart, targetEnd, size, viewportEnd, margin) {
            const viewportMin = margin;
            const viewportMax = Math.max(viewportMin, viewportEnd - size - margin);
            const targetMin = Math.max(viewportMin, targetStart + margin);
            const targetMax = Math.min(viewportMax, targetEnd - size - margin);
            return targetMax >= targetMin
                ? [targetMin, targetMax]
                : [viewportMin, viewportMax];
        }
        _getBounds() {
            if (this._target === document.body || this._target === document.documentElement) {
                return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
            }
            return this._target.getBoundingClientRect();
        }
        _focusFirst(scope) {
            scope.querySelector('.dp-menu-item:not(:disabled)')?.focus();
        }
        _positionSubmenu(entry, submenu) {
            submenu.classList.remove('dp-menu-submenu--flip');
            submenu.style.top = '-5px';
            submenu.style.display = 'block';
            submenu.style.visibility = 'hidden';
            const bounds = this._getBounds();
            const entryRect = entry.getBoundingClientRect();
            let submenuRect = submenu.getBoundingClientRect();
            const margin = 4;
            const visibleLeft = Math.max(0, bounds.left) + margin;
            const visibleRight = Math.min(window.innerWidth, bounds.right) - margin;
            if (submenuRect.right > visibleRight
                && entryRect.left - submenuRect.width >= visibleLeft) {
                submenu.classList.add('dp-menu-submenu--flip');
                submenuRect = submenu.getBoundingClientRect();
            }
            const [minTop, maxTop] = this._getClampRange(bounds.top, bounds.bottom, submenuRect.height, window.innerHeight, margin);
            const clampedTop = Math.min(Math.max(submenuRect.top, minTop), maxTop);
            submenu.style.top = `${Math.round(clampedTop - entryRect.top)}px`;
            submenu.style.display = '';
            submenu.style.visibility = '';
        }
        _visibleButtons(list) {
            return Array.from(list.querySelectorAll(':scope > .dp-menu-entry > .dp-menu-item:not(:disabled)'));
        }
    }

    var MENU_CSS = "/* ============================================================\n * DeskPane-Menu - Default Styles\n * Optional styles for ContextMenu and StartMenu.\n * ============================================================ */\n\n.dp-menu,\n.dp-menu * {\n  box-sizing: border-box;\n}\n\n.dp-menu {\n  z-index: 2147483000;\n  min-width: var(--dp-menu-min-width, 220px);\n  max-width: min(var(--dp-menu-max-width, 360px), calc(100vw - 8px));\n  padding: 5px;\n  border: 1px solid var(--dp-menu-border, rgba(15, 23, 42, 0.20));\n  border-radius: var(--dp-menu-radius, 6px);\n  background: var(--dp-menu-bg, #ffffff);\n  color: var(--dp-menu-color, #172033);\n  box-shadow: var(--dp-menu-shadow, 0 12px 32px rgba(15, 23, 42, 0.22));\n  font-family: var(--dp-font, system-ui, -apple-system, sans-serif);\n  font-size: 13px;\n  line-height: 1.3;\n  user-select: none;\n  pointer-events: auto;\n}\n\n.dp-menu[hidden] {\n  display: none !important;\n}\n\n.dp-menu-list {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.dp-menu-entry {\n  position: relative;\n  margin: 0;\n  padding: 0;\n}\n\n.dp-menu-item {\n  width: 100%;\n  min-height: 34px;\n  display: grid;\n  grid-template-columns: 16px 22px minmax(0, 1fr) auto auto;\n  align-items: center;\n  gap: 7px;\n  padding: 5px 8px;\n  border: 1px solid transparent;\n  border-radius: calc(var(--dp-menu-radius, 6px) - 2px);\n  background: transparent;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  cursor: default;\n  outline: none;\n}\n\n.dp-menu-item:hover,\n.dp-menu-item:focus-visible,\n.dp-menu-entry--expanded > .dp-menu-item {\n  border-color: var(--dp-menu-hover-border, transparent);\n  background: var(--dp-menu-hover-bg, rgba(37, 99, 235, 0.10));\n  color: var(--dp-menu-hover-color, inherit);\n}\n\n.dp-menu-item:disabled {\n  opacity: 0.46;\n  cursor: not-allowed;\n}\n\n.dp-menu-check,\n.dp-menu-icon,\n.dp-menu-submenu-arrow {\n  display: inline-grid;\n  place-items: center;\n  min-width: 0;\n  line-height: 1;\n}\n\n.dp-menu-icon {\n  width: 22px;\n  height: 22px;\n  overflow: hidden;\n  font-size: 17px;\n}\n\n.dp-menu-icon img,\n.dp-menu-icon svg,\n.dp-start-menu-header-icon img,\n.dp-start-menu-header-icon svg {\n  width: 100%;\n  height: 100%;\n  display: block;\n  object-fit: contain;\n}\n\n.dp-menu-label {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.dp-menu-shortcut {\n  margin-left: 12px;\n  color: var(--dp-menu-muted-color, #64748b);\n  font-size: 12px;\n  white-space: nowrap;\n}\n\n.dp-menu-submenu-arrow {\n  color: var(--dp-menu-muted-color, #64748b);\n  font-size: 18px;\n}\n\n.dp-menu-separator {\n  height: 1px;\n  margin: 4px 7px;\n  background: var(--dp-menu-separator, rgba(15, 23, 42, 0.14));\n}\n\n.dp-menu-submenu {\n  position: absolute;\n  top: -5px;\n  left: calc(100% - 3px);\n  z-index: 1;\n  min-width: var(--dp-menu-min-width, 220px);\n  display: none;\n  padding: 5px;\n  border: 1px solid var(--dp-menu-border, rgba(15, 23, 42, 0.20));\n  border-radius: var(--dp-menu-radius, 6px);\n  background: var(--dp-menu-bg, #ffffff);\n  box-shadow: var(--dp-menu-shadow, 0 12px 32px rgba(15, 23, 42, 0.22));\n}\n\n.dp-menu-submenu--flip {\n  right: calc(100% - 3px);\n  left: auto;\n}\n\n.dp-menu-entry:hover > .dp-menu-submenu,\n.dp-menu-entry:focus-within > .dp-menu-submenu,\n.dp-menu-entry--expanded > .dp-menu-submenu {\n  display: block;\n}\n\n.dp-start-menu {\n  width: min(var(--dp-start-menu-width, 410px), calc(100vw - 8px));\n  max-width: calc(100vw - 8px);\n  padding: 7px;\n}\n\n.dp-start-menu-header {\n  min-height: 52px;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 4px 8px 8px;\n  color: var(--dp-start-menu-header-color, inherit);\n  font-weight: 700;\n}\n\n.dp-start-menu-header-icon {\n  width: 42px;\n  height: 42px;\n  display: grid;\n  place-items: center;\n  overflow: hidden;\n  border: 1px solid var(--dp-menu-border, rgba(15, 23, 42, 0.20));\n  border-radius: 5px;\n  background: var(--dp-menu-hover-bg, rgba(37, 99, 235, 0.10));\n  font-size: 20px;\n}\n\n.dp-start-menu-body {\n  min-height: 220px;\n  display: grid;\n  grid-template-columns: minmax(210px, 1fr) minmax(132px, 0.58fr);\n  gap: 6px;\n}\n\n.dp-start-menu-primary,\n.dp-start-menu-secondary {\n  min-width: 0;\n  padding: 5px;\n  border-radius: calc(var(--dp-menu-radius, 6px) - 2px);\n}\n\n.dp-start-menu-body > :only-child {\n  grid-column: 1 / -1;\n}\n\n.dp-start-menu-primary {\n  background: var(--dp-start-menu-primary-bg, rgba(255, 255, 255, 0.82));\n}\n\n.dp-start-menu-secondary {\n  background: var(--dp-start-menu-secondary-bg, rgba(226, 232, 240, 0.64));\n}\n\n.dp-start-menu-footer {\n  display: flex;\n  justify-content: flex-end;\n  padding: 6px 5px 0;\n  border-top: 1px solid var(--dp-menu-separator, rgba(15, 23, 42, 0.14));\n  margin-top: 6px;\n}\n\n.dp-start-menu-footer .dp-menu-list {\n  min-width: 140px;\n}\n\n.dp-start-button-active {\n  filter: brightness(0.96);\n}\n\n@media (max-width: 520px) {\n  .dp-start-menu-body {\n    grid-template-columns: 1fr;\n  }\n\n  .dp-start-menu-secondary {\n    display: none;\n  }\n}\n";

    // ============================================================
    // DeskPane — Runtime CSS injection helpers
    // ============================================================
    function isDeskPaneStyleNode(node) {
        // DeskPane runtime style 都會加 data-dp-style；id fallback 是為了相容早期版本。
        if (node instanceof HTMLStyleElement) {
            if (node.dataset.dpStyle === 'true')
                return true;
            if (node.id.startsWith('dp-') && node.id.endsWith('-styles'))
                return true;
        }
        if (node instanceof HTMLLinkElement) {
            // 使用者可能手動 import/link DeskPane CSS。這些 link 也視為 DeskPane style，
            // 避免 runtime CSS 插在它們後面造成 override 順序反轉。
            const href = node.getAttribute('href') ?? '';
            return href.includes('/deskpane') || href.includes('\\deskpane') || href.includes('deskpane');
        }
        return false;
    }
    function hasManualStyleLoaded(options) {
        const hrefPart = options.hrefPart.toLowerCase();
        for (const node of Array.from(document.querySelectorAll('style,link[rel~="stylesheet"]'))) {
            if (node instanceof HTMLStyleElement) {
                // id/fingerprint 任一命中都代表已載入同一份 core CSS。
                // fingerprint 讓 bundler raw CSS 或 SSR inline style 也能被偵測。
                if (node.id === options.id)
                    return true;
                if (node.textContent?.includes(options.fingerprint))
                    return true;
                continue;
            }
            if (node instanceof HTMLLinkElement) {
                const href = (node.getAttribute('href') ?? '').toLowerCase();
                if (href.includes(hrefPart))
                    return true;
            }
        }
        return false;
    }
    function findInsertionAnchor() {
        const styleNodes = Array.from(document.head.querySelectorAll('style,link[rel~="stylesheet"]'));
        // 插在第一個非 DeskPane style 前，讓 app stylesheet 保持較高優先順序。
        // 這是避免 runtime inject 壓過使用者 override 的關鍵。
        return styleNodes.find(node => !isDeskPaneStyleNode(node)) ?? null;
    }
    /**
     * Injects DeskPane runtime CSS only when the same stylesheet is not already
     * present. Runtime CSS is inserted before app-level stylesheets so project
     * overrides imported later remain authoritative.
     */
    function injectRuntimeCSS(options) {
        if (hasManualStyleLoaded(options))
            return;
        const style = document.createElement('style');
        style.id = options.id;
        style.dataset.dpStyle = 'true';
        style.textContent = options.css;
        const anchor = findInsertionAnchor();
        document.head.insertBefore(style, anchor);
    }

    // ============================================================
    // DeskPane-Menu - CSS injection
    // ============================================================
    const STYLE_ID = 'dp-menu-styles';
    /** Return Menu CSS for applications that manage styles manually. */
    function getMenuCSS() {
        return MENU_CSS;
    }
    function injectMenuStyles() {
        injectRuntimeCSS({
            id: STYLE_ID,
            css: MENU_CSS,
            hrefPart: 'deskpane-menu.css',
            fingerprint: 'DeskPane-Menu - Default Styles',
        });
    }

    // ============================================================
    // DeskPane-Menu - ContextMenu
    // ============================================================
    class ContextMenu {
        constructor(options = {}) {
            this._bindings = new Set();
            if (options.injectStyles !== false)
                injectMenuStyles();
            this._surface = new MenuSurface({
                variant: 'context',
                items: options.items ?? [],
                target: options.target,
                closeOnSelect: options.closeOnSelect ?? true,
                className: options.className,
            });
            this.events = this._surface.events;
        }
        setItems(items) {
            this._surface.setGroups({ items });
        }
        showAt(clientX, clientY, items) {
            if (items)
                this.setItems(items);
            this._surface.showAt(clientX, clientY);
        }
        showFor(anchor, placement = 'bottom-start', offset = 4, items) {
            if (items)
                this.setItems(items);
            this._surface.showFor(anchor, placement, offset);
        }
        hide() {
            this._surface.hide('api');
        }
        isOpen() {
            return this._surface.isOpen();
        }
        getElement() {
            return this._surface.getElement();
        }
        /** Bind the browser contextmenu gesture and return an unbind function. */
        bindTo(element, getItems) {
            const handler = (event) => {
                event.preventDefault();
                const items = getItems?.(event);
                if (items)
                    this.setItems(items);
                this._surface.showAt(event.clientX, event.clientY, 'pointer');
            };
            element.addEventListener('contextmenu', handler);
            const cleanup = () => {
                element.removeEventListener('contextmenu', handler);
                this._bindings.delete(cleanup);
            };
            this._bindings.add(cleanup);
            return cleanup;
        }
        destroy() {
            Array.from(this._bindings).forEach(cleanup => cleanup());
            this._surface.destroy();
        }
    }

    // ============================================================
    // DeskPane-Menu - StartMenu
    // ============================================================
    class StartMenu {
        constructor(options) {
            this._onAnchorClick = (event) => {
                event.preventDefault();
                this.toggle();
            };
            if (options.injectStyles !== false)
                injectMenuStyles();
            this._anchor = options.anchor;
            this._placement = options.placement ?? 'top-start';
            this._offset = options.offset ?? 6;
            this._previousHasPopup = this._anchor.getAttribute('aria-haspopup');
            this._previousExpanded = this._anchor.getAttribute('aria-expanded');
            this._surface = new MenuSurface({
                variant: 'start',
                items: options.items ?? [],
                secondaryItems: options.secondaryItems,
                footerItems: options.footerItems,
                header: options.header,
                target: options.target,
                closeOnSelect: options.closeOnSelect ?? true,
                className: options.className,
            });
            this.events = this._surface.events;
            this._surface.addOutsideIgnore(this._anchor);
            this._anchor.setAttribute('aria-haspopup', 'menu');
            this._anchor.setAttribute('aria-expanded', 'false');
            this._anchor.addEventListener('click', this._onAnchorClick);
            this._surface.events.on('menu:open', () => this._setAnchorOpen(true));
            this._surface.events.on('menu:close', () => this._setAnchorOpen(false));
        }
        setItems(items) {
            this._surface.setGroups({ items });
        }
        setSecondaryItems(secondaryItems) {
            this._surface.setGroups({ secondaryItems });
        }
        setFooterItems(footerItems) {
            this._surface.setGroups({ footerItems });
        }
        setHeader(header) {
            this._surface.setGroups({ header });
        }
        open() {
            this._surface.showFor(this._anchor, this._placement, this._offset);
        }
        close() {
            this._surface.hide('api');
        }
        toggle() {
            if (this.isOpen())
                this.close();
            else
                this.open();
        }
        isOpen() {
            return this._surface.isOpen();
        }
        getElement() {
            return this._surface.getElement();
        }
        destroy() {
            this._anchor.removeEventListener('click', this._onAnchorClick);
            this._surface.destroy();
            this._restoreAttribute('aria-haspopup', this._previousHasPopup);
            this._restoreAttribute('aria-expanded', this._previousExpanded);
            this._anchor.classList.remove('dp-start-button-active');
        }
        _setAnchorOpen(open) {
            this._anchor.setAttribute('aria-expanded', String(open));
            this._anchor.classList.toggle('dp-start-button-active', open);
        }
        _restoreAttribute(name, value) {
            if (value === null)
                this._anchor.removeAttribute(name);
            else
                this._anchor.setAttribute(name, value);
        }
    }

    exports.ContextMenu = ContextMenu;
    exports.StartMenu = StartMenu;
    exports.getMenuCSS = getMenuCSS;

}));
//# sourceMappingURL=deskpane-menu.umd.js.map

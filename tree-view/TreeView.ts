export class TreeView<T = any> {
    private id: string = Date.now().toString();
    activeItem: TreeViewItem<T> | undefined = undefined;
    domElement: HTMLUListElement | undefined = undefined;
    cssClassName: string = `aria-tree-view-${this.id}`;
    items: TreeViewItem<T>[] = [];
    itemDomElementToTreeViewItemMap: Map<HTMLLIElement | HTMLUListElement, TreeViewItem<T>>;
    treeItemExpandButtonPrepend: boolean = true;
    treeItemExpandButtonLabelExpanded: string = 'collapse item';
    treeItemExpandButtonLabelCollapsed: string = 'expand item';
    rendered: boolean = false;
    selectedItems: Set<TreeViewItem<T>>;
    sourceData: ITreeViewItemSourceData<T>[] = [];
    styleElement: HTMLStyleElement | undefined = undefined;
    treeViewItemDataToTreeViewItemMap: Map<ITreeViewItemSourceData<T>, TreeViewItem<T>>;

    private cssStyle = `
.${this.cssClassName} ul[role=group] {
    max-width: 100%;
    width: 100%;
}

.${this.cssClassName} li[role=treeitem] {
    list-style: none;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
}

.${this.cssClassName} li[role=treeitem] a {
    max-width: 90%;    
}

.${this.cssClassName} li[role=treeitem]:before {
    content: ' ';
}

.${this.cssClassName} li[aria-expanded=true] button span:before {
    content: '▾';
}

.${this.cssClassName} li[aria-expanded=false] button span:before {
    content: '▸';
}

#${this.cssClassName} li[aria-selected] > a {
    text-decoration: underline;
}

`;

    keyCode = {
        RETURN: 13,
        SPACE: 32,
        PAGEUP: 33,
        PAGEDOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        TAB: 9
    };



    constructor(private container: HTMLElement, sourceData: ITreeViewItemSourceData<T>[]) {
        this.domElement = document.createElement('ul');
        this.domElement.setAttribute('class', this.cssClassName);
        this.domElement.setAttribute('role', 'tree');
        this.styleElement = document.createElement('style');
        this.domElement.prepend(this.styleElement);
        this.sourceData = sourceData || [];
        this.itemDomElementToTreeViewItemMap = new Map<HTMLLIElement | HTMLUListElement, TreeViewItem<T>>();
        this.treeViewItemDataToTreeViewItemMap = new Map<ITreeViewItemSourceData<T>, TreeViewItem<T>>();
        this.selectedItems = new Set<TreeViewItem<T>>();
        this.setTreeViewStyle(this.cssStyle);

        if(this.sourceData.length > 0) {
            this.buildTreeFromSourceData();
        }
    }

    setId(uid: string): void {
        this.id = uid;
        if (this.domElement) {
            this.domElement.setAttribute('id', this.id);
        }
    }

    addClassName(className: string): void {
        if (this.domElement) {
            this.domElement.classList.add(className);
        }
    }

    setPrependExpandTreeItemButton(value: boolean): void {
        this.treeItemExpandButtonPrepend = value;
    }

    private setTreeViewStyle(cssStyle: string): void {
        if (this.styleElement) {
            this.styleElement.innerHTML = cssStyle;
        }
    }

    private buildTreeFromSourceData(): void {
        let groupSize: number = this.sourceData.length;
        this.sourceData.forEach((item, index) => {
            let treeViewItem = new TreeViewItem<T>(item, this, index, groupSize);
            this.items.push(treeViewItem);
            this.itemDomElementToTreeViewItemMap!.set(treeViewItem.domElement!, treeViewItem);
            this.treeViewItemDataToTreeViewItemMap!.set(item, treeViewItem);
            this.domElement!.appendChild(treeViewItem.domElement!);
        });
        this.addItemKeyEventHandlers();
    }

    private mapKeyUpEvents(element: HTMLLIElement, treeItem: TreeViewItem<T>): void {
        element.addEventListener('keydown', (ev: KeyboardEvent)=>{
            if(ev.keyCode !== this.keyCode.TAB && ev.keyCode !== this.keyCode.RETURN) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
        });
        element.addEventListener('keyup', (ev: KeyboardEvent) => {
            let cancelBubble: boolean = true;
            let previousItem: TreeViewItem<T> | undefined;
            let nextItem: TreeViewItem<T> | undefined;
            let parentItem: TreeViewItem<T> | undefined;

            // Not really deprecated, please ignore
            switch (ev.keyCode) {
                case this.keyCode.SPACE:
                case this.keyCode.RETURN:
                    if (ev.target instanceof HTMLButtonElement) {
                        break;
                    }
                    treeItem.setIsSelected();
                    element.click();
                    break;
                case this.keyCode.RIGHT:
                    if (treeItem!.children.length > 0) {
                        treeItem.setIsExpanded(true);
                        treeItem!.children[0].setIsActive(true);
                    }
                    break;

                case this.keyCode.LEFT:
                    if (treeItem.getIsExpanded()) {
                        treeItem.setIsExpanded(false);
                        break;
                    } else {
                        parentItem = treeItem!.getParent();
                        if (parentItem) {
                            parentItem.setIsActive(true);
                        } else {
                            this.items[0].setIsActive(true);
                        }
                    }
                    break;

                case this.keyCode.DOWN:

                    nextItem = treeItem!.getNextAdjacent();
                    if (nextItem) {
                        nextItem.setIsActive(true);

                    } else {
                        let parentItem = treeItem!.getParent();
                        if (parentItem) {
                            let nextParentSibling = parentItem.getNextSibling();
                            if (nextParentSibling) {
                                nextParentSibling.setIsActive(true);
                            }
                        }
                    }
                    break;

                case this.keyCode.UP:
                    previousItem = treeItem!.getPreviousAdjacent();
                    if (previousItem) {
                        previousItem.setIsActive(true);
                    } else {
                        let parentItem = treeItem!.getParent();
                        if (parentItem) {
                            parentItem.setIsActive(true);
                        }
                    }
                    break;

                case this.keyCode.HOME:
                    let firstItem = this.items[0];
                    if (firstItem) {
                        firstItem.setIsActive(true);
                    }
                    break;

                case this.keyCode.END:
                    let lastItem = this.items[this.items.length - 1];
                    if (lastItem) {
                        lastItem.setIsActive(true);
                    }
                    break;
                default:
                    cancelBubble = false;
            }

            if (cancelBubble) {
                ev.cancelBubble = true;
            }

        });

    }

    private addItemKeyEventHandlers(): void {
        let treeItems = this.domElement!.querySelectorAll('li');
        let treeItemsArray = Array.from(treeItems);

        treeItemsArray.forEach((item) => {
            let treeItem = this.itemDomElementToTreeViewItemMap!.get(item);
            this.mapKeyUpEvents(item, treeItem!);
        });
    }

    addItemClickEventHandler(fn: (treeViewItemSourceData: ITreeViewItemSourceData<T>) => void): void {
        let treeItems = this.domElement!.querySelectorAll('li');
        let treeItemsArray = Array.from(treeItems);

        treeItemsArray.forEach((item) => {
            let treeItem = this.itemDomElementToTreeViewItemMap!.get(item);
            item.addEventListener('click', (ev: MouseEvent) => {
                ev.cancelBubble = true;
                fn(treeItem!.getTreeViewItemData());
            });
        });
    }

    render(): void {
        this.rendered = true;
        this.container.appendChild(this.domElement!);
    }

    collapseAll(): void {
        this.items.forEach((item)=>{
            item.setIsExpanded(false);
        });
    }

    getTreeItemByElement(el: HTMLLIElement): TreeViewItem<T> | undefined {
        return this.itemDomElementToTreeViewItemMap!.get(el);
    }

    getTreeItemByItemSourceData(data: T): TreeViewItem<T> | undefined {
        for (let [key, value] of this.treeViewItemDataToTreeViewItemMap.entries()) {
            if (key.data == data) {
                return value;
            }
        }
        return undefined;
    }

    expandToTreeItem(item: TreeViewItem<T>): void {
        let parent = item.getParent();
        if (parent) {
            parent.setIsExpanded(true);
            this.expandToTreeItem(parent);
        }
    }

    filterTreeItemsByItemData(filterCallback: (itemData: T) => boolean): TreeViewItem<T>[] {
        let items = Array.from(this.treeViewItemDataToTreeViewItemMap.values());
        return items.filter(item => filterCallback(item.data));
    }

    deselectAllItems(): void {
        this.selectedItems.forEach((item: TreeViewItem) => {
            item.setIsSelected(false);
        });
    }

    destroy(): void {

    }
}

export class TreeViewItem<T = any> {
    private childContainerElement: HTMLUListElement | undefined = undefined;
    private labelElement: HTMLAnchorElement;
    private buttonElement: HTMLButtonElement;
    private buttonLabelElement: HTMLElement;
    private isExpanded: boolean = false;
    private isActive: boolean = false;
    private isSelected: boolean = false;

    domElement: HTMLLIElement | undefined = undefined;
    children: TreeViewItem<T>[] = [];
    textContent: string;
    data: T;
    id: string;
    indexInGroup: number | undefined;

    constructor(
        private treeViewItemSourceData: ITreeViewItemSourceData<T>,
        private treeView: TreeView,
        indexInGroup: number,
        groupSize: number,
    ) {
        this.textContent = treeViewItemSourceData.textContent;
        this.data = treeViewItemSourceData.data;
        this.id = treeViewItemSourceData.id;
        this.indexInGroup = indexInGroup;

        this.domElement = document.createElement('li');
        this.domElement.id = treeViewItemSourceData.id;
        this.domElement.setAttribute('role', 'treeitem');
        this.domElement.setAttribute('tabindex', '0');

        this.labelElement = document.createElement('a');
        this.labelElement.setAttribute('role', 'presentation');
        this.labelElement.textContent = treeViewItemSourceData.textContent;
        this.domElement.appendChild(this.labelElement);

        this.domElement.setAttribute('aria-posinset', String(this.indexInGroup + 1));
        this.domElement.setAttribute('aria-setsize', String(groupSize));
        treeView.itemDomElementToTreeViewItemMap!.set(this.domElement!, this);
        treeView.treeViewItemDataToTreeViewItemMap!.set(treeViewItemSourceData, this);

        this.buttonElement = document.createElement('button');
        this.buttonElement.setAttribute('aria-expanded', 'false');

        this.buttonLabelElement = document.createElement('span');
        this.buttonLabelElement.setAttribute('aria-hidden', 'true');

        this.buttonElement.appendChild(this.buttonLabelElement);

        this.buildTreeItemBranchFromSourceData();
    }

    private buildTreeItemBranchFromSourceData(): void {
        if (this.domElement) {
            if (this.treeViewItemSourceData.children && this.treeViewItemSourceData.children.length > 0) {

                this.domElement.setAttribute('data-treeview-role', 'group');

                this.childContainerElement = document.createElement('ul');
                this.childContainerElement.setAttribute('role', 'group');

                this.treeViewItemSourceData.children.forEach((childItem: ITreeViewItemSourceData<T>, index) => {
                    let newTreeViewItem = new TreeViewItem<T>(childItem, this.treeView, index, this.treeViewItemSourceData.children.length);
                    this.children.push(newTreeViewItem);
                    this.childContainerElement!.appendChild(newTreeViewItem.domElement!);
                });

                this.buttonElement.setAttribute('role', 'presentation');
                this.setUpExpandButtonEventHandlers();

                if (this.treeView.treeItemExpandButtonPrepend) {
                    this.domElement.prepend(this.buttonElement);
                } else {
                    this.domElement.appendChild(this.buttonElement);
                }
                this.domElement.appendChild(this.childContainerElement);
                this.setIsExpanded(this.isExpanded);
            }
        }
    }

    private setUpExpandButtonEventHandlers(): void {
        this.buttonElement.addEventListener('click', (ev) => {
            ev.preventDefault();
            this.isExpanded ? this.setIsExpanded(false) : this.setIsExpanded(true);
            ev.stopImmediatePropagation();
        });

        this.buttonElement.addEventListener('keyup', (ev) => {
            if (ev.code === 'Enter' || ev.code === 'Space') {
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
        });

        this.buttonElement.addEventListener('keydown', (ev) => {
            if (ev.code === 'Enter' || ev.code === 'Space') {
                ev.stopImmediatePropagation();
                this.buttonElement.click();
            }
        });

        this.buttonElement.addEventListener('focus', (ev) => {
            if (this.isHtmlElement(ev.target)) {
                if (this.getIsExpanded()) {
                    ev.target.setAttribute('title', this.treeView.treeItemExpandButtonLabelExpanded);
                } else {
                    ev.target.setAttribute('title', this.treeView.treeItemExpandButtonLabelCollapsed);
                }
            }
        });

        this.buttonElement.addEventListener('blur', (ev) => {
            if (this.isHtmlElement(ev.target)) {
                ev.target.removeAttribute('title');
            }
        });
    }

    setIsSelected(selected: boolean = true): void {
        this.isSelected = selected;
        if (selected) {
            this.domElement?.setAttribute('aria-selected', 'true');
            //this.treeView.selectedItems?.setIsSelected(false);
            this.treeView.selectedItems?.add(this);
        } else {
            this.domElement?.removeAttribute('aria-selected');
            this.treeView.selectedItems.delete(this);
        }
    }

    getIsSelected(): boolean {
        return this.isSelected;
    }

    setIsActive(active: boolean, scrollIntoView: boolean = true): void {
        let scrollIntoViewOptions: ScrollIntoViewOptions = {behavior: 'smooth', block: 'center', inline: 'center'};
        if (active) {
            this.treeView.activeItem?.setIsActive(false);
            this.treeView.activeItem = this;
            this.domElement?.focus();

            if (scrollIntoView) {
                this.domElement?.scrollIntoView(scrollIntoViewOptions);
            }

        } else {
            this.treeView.activeItem = undefined;
            this.domElement?.blur();
        }
    }

    getIsActive(): boolean {
        return this.isActive;
    }

    getIsExpanded(): boolean {
        return this.isExpanded;
    }

    setIsExpanded(expanded: boolean = true): void {
        if (this.domElement && this.childContainerElement) {
            this.isExpanded = expanded;
            this.domElement.setAttribute('aria-expanded', `${expanded}`);
            this.buttonElement.setAttribute('aria-expanded', `${expanded}`);

            if (expanded) {
                this.childContainerElement.style.display = 'block';
            } else {
                this.childContainerElement.style.display = 'none';
            }
        }
    }

    getTreeViewItemData(): ITreeViewItemSourceData<T> {
        return this.treeViewItemSourceData;
    }

    focus(): void {
        this.domElement!.focus();
    }

    getNextSibling(): TreeViewItem<T> | undefined {
        if (this.domElement) {
            let nextElement = this.domElement.nextSibling as HTMLLIElement;
            if (nextElement) {
                let nextItem = this.treeView.itemDomElementToTreeViewItemMap!.get(nextElement);
                return nextItem;
            }
        }
        return undefined;
    }

    getPreviousSibling(): TreeViewItem<T> | undefined {
        if (this.domElement) {
            let previousElement = this.domElement.previousSibling as HTMLLIElement;
            if (previousElement) {
                let previousItem = this.treeView.itemDomElementToTreeViewItemMap!.get(previousElement);
                return previousItem;
            }
        }
        return undefined;
    }

    getNextAdjacent(): TreeViewItem<T> | undefined {
        if (this.domElement) {
            if (this.children.length > 0 && this.domElement.getAttribute('aria-expanded') === 'true') {
                let childElement = this.domElement.querySelector('ul');
                if (childElement instanceof HTMLUListElement) {
                    let nextElement = childElement.firstElementChild;
                    if (nextElement instanceof HTMLLIElement) {
                        return this.treeView.itemDomElementToTreeViewItemMap!.get(nextElement);
                    }
                }
            } else {
                return this.getNextSibling();
            }
        }
        return undefined;
    }

    getPreviousAdjacent(): TreeViewItem<T> | undefined {
        if (this.domElement) {
            let parentElementSibling = this.domElement.previousElementSibling;

            if (parentElementSibling instanceof HTMLLIElement && parentElementSibling.getAttribute('aria-expanded') === 'true') {
                if (parentElementSibling.children.length > 0) {
                    let childElement = parentElementSibling.querySelector('ul');
                    if (childElement instanceof HTMLUListElement) {
                        let previousItem = childElement.lastElementChild;
                        if (previousItem instanceof HTMLLIElement) {
                            return this.treeView.itemDomElementToTreeViewItemMap!.get(previousItem);
                        }
                    }
                } else {
                    return undefined;
                }
            } else {
                return this.getPreviousSibling();
            }

        }
        return undefined;
    }

    getParent(): TreeViewItem<T> | undefined {
        if (this.domElement) {
            let parentGroupElement = this.domElement.parentElement as HTMLUListElement;
            let parentItemElement = parentGroupElement.parentElement as HTMLLIElement;

            if (parentItemElement) {
                let parentItem = this.treeView.itemDomElementToTreeViewItemMap!.get(parentItemElement);
                return parentItem;
            }
        }
        return undefined;
    }

    private isHtmlElement(val: any): val is HTMLElement {
        return !!val && val instanceof HTMLElement;
    }
}

export interface ITreeViewItemSourceData<T = any> {
    id: string,
    textContent: string,
    data: T,
    children: ITreeViewItemSourceData<T>[]
}

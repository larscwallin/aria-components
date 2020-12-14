export class TreeView {
    private id: string = 'TV' + Date.now().toString();
    domElement: HTMLUListElement | undefined = undefined;
    styleElement: HTMLStyleElement | undefined = undefined;
    items: TreeViewItem[] = [];
    rendered: boolean = false;
    itemDomElementToTreeViewItemMap: Map<HTMLLIElement | HTMLUListElement, TreeViewItem> | undefined = undefined;
    treeViewItemDataToTreeViewItemMap: Map<ITreeViewItemData, TreeViewItem> | undefined = undefined;
    activeItem: TreeViewItem | undefined = undefined;
    selectedItem: TreeViewItem | undefined = undefined;
    sourceData: ITreeViewItemData[] = [];

    private cssStyle = `

#${this.id} ul[role=group] {
    max-width: 100%;
    width: 100%;
}

#${this.id} li[role=treeitem] {
    list-style: none;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
}

#${this.id} li[role=treeitem] a {
    max-width: 90%;    
}

#${this.id} li[role=treeitem]:before {
    content: ' ';
}

#${this.id} li[aria-expanded=true] button:before {
    content: '▾';
}

#${this.id} li[aria-expanded=false] button:before {
    content: '▸';
}

#${this.id} li[aria-selected] > a {
    text-decoration: underline;
}

`

    private keyCode = {
        RETURN: 13,
        SPACE: 32,
        PAGEUP: 33,
        PAGEDOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    };

    constructor(private container: HTMLElement, sourceData: ITreeViewItemData[], cssStyle?: string) {
        this.domElement = document.createElement('ul');
        this.domElement.setAttribute('id', this.id);
        this.domElement.setAttribute('role', 'tree');
        this.styleElement = document.createElement('style');
        this.domElement.prepend(this.styleElement);
        this.sourceData = sourceData;
        this.itemDomElementToTreeViewItemMap = new Map<HTMLLIElement|HTMLUListElement, TreeViewItem>();
        this.treeViewItemDataToTreeViewItemMap = new Map<ITreeViewItemData, TreeViewItem>();

        if(!cssStyle) {
            this.setTreeViewStyle(this.cssStyle);
        } else {
            this.setTreeViewStyle(this.cssStyle + cssStyle);
        }

        this.buildTree();
    }

    private setTreeViewStyle (cssStyle: string) {
        if(this.styleElement) {
            this.styleElement.innerHTML = cssStyle;
        }
    }

    private buildTree() {
        this.sourceData.forEach((item, index)=>{
            let treeViewItem = new TreeViewItem(item, this, index);
            this.items.push(treeViewItem);
            this.itemDomElementToTreeViewItemMap!.set(treeViewItem.domElement!, treeViewItem);
            this.treeViewItemDataToTreeViewItemMap!.set(item, treeViewItem);
            this.domElement!.appendChild(treeViewItem.domElement!);
        });
    }

    private mapKeyUpEvents(element: HTMLLIElement, treeItem: TreeViewItem) {

        element.addEventListener('keyup', (ev: KeyboardEvent) => {
            ev.cancelBubble = true;
            let previousItem: TreeViewItem | undefined;
            let nextItem: TreeViewItem | undefined;
            let parentItem: TreeViewItem | undefined;


            switch (ev.keyCode) {
                case this.keyCode.SPACE:
                case this.keyCode.RETURN:
                    if(ev.target instanceof HTMLButtonElement) {
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
                    if(treeItem.getIsExpanded()) {
                        treeItem.setIsExpanded(false);
                        break;
                    }
                    parentItem = treeItem!.getParent();
                    if (parentItem) {
                        parentItem.setIsActive(true);
                    } else {
                        this.items[0].setIsActive(true);
                    }
                    break;

                case this.keyCode.DOWN:

                    nextItem = treeItem!.getNextAdjacent();
                    if (nextItem) {
                        nextItem.setIsActive(true);

                    }
                    else {
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
                    }
                    else {
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
            }
        });

    }

    addItemEventHandler(fn: Function) {
        let treeItems = this.domElement!.querySelectorAll('li');
        let treeItemsArray = Array.from(treeItems);

        treeItemsArray.forEach((item)=>{
            let treeItem = this.itemDomElementToTreeViewItemMap!.get(item);
            item.addEventListener('click', (ev: MouseEvent)=>{
                ev.cancelBubble = true;
                fn(treeItem!.getTreeViewItemData());
            });
            this.mapKeyUpEvents(item, treeItem!);
        })
    }

    render(){
        this.rendered = true;
        this.container.appendChild(this.domElement!);
    }

    filter(_filterString: string) {

    }

    getTreeItemByNavigationItem (navItem: ITreeViewItemData): TreeViewItem | undefined {
        return this.treeViewItemDataToTreeViewItemMap!.get(navItem);
    }

    getTreeItemByElement (el: HTMLLIElement): TreeViewItem | undefined {
        return this.itemDomElementToTreeViewItemMap!.get(el);
    }

    getTreeItemByItemData(data: {}): TreeViewItem | undefined {
        this.treeViewItemDataToTreeViewItemMap!.forEach((key, value)=>{
            if(key.data == data) {
                return value;
            }
        });
        return undefined;
    }

    expandToTreeItem(item: TreeViewItem) {
        let parent = item.getParent();
        if(parent) {
            parent.setIsExpanded(true);
            this.expandToTreeItem(parent);
        }
    }

    destroy() {

    }
}


export class TreeViewItem {
    private childContainerElement: HTMLUListElement | undefined = undefined;
    private labelElement: HTMLAnchorElement;
    private buttonElement: HTMLButtonElement;
    private isExpanded: boolean = false;
    private isActive: boolean = false;
    private isSelected: boolean = false;

    domElement: HTMLLIElement | undefined = undefined;
    children: TreeViewItem[] = [];
    textContent: string;
    data: {};
    id: string;
    indexInGroup: number | undefined;

    constructor(private treeItemData: ITreeViewItemData, private treeView: TreeView, indexInGroup: number) {
        this.textContent = treeItemData.textContent;
        this.data = treeItemData.data;
        this.id = treeItemData.id;
        this.indexInGroup = indexInGroup;

        this.domElement = document.createElement('li');
        this.domElement.id = treeItemData.id;
        this.domElement.setAttribute('role', 'treeitem');
        this.domElement.setAttribute('tabindex', '0');

        this.labelElement = document.createElement('a');
        this.labelElement.setAttribute('role', 'presentation');
        this.labelElement.textContent = treeItemData.textContent;
        this.domElement.appendChild(this.labelElement);

        this.domElement.setAttribute('aria-posinset', String(this.indexInGroup + 1));
        this.domElement.setAttribute('aria-setsize', String(this.treeItemData.children.length));
        treeView.itemDomElementToTreeViewItemMap!.set(this.domElement!, this);
        treeView.treeViewItemDataToTreeViewItemMap!.set(treeItemData, this);

        this.buttonElement = document.createElement('button');
        this.buttonElement.setAttribute('role','presentation');

        this.createTree();
    }

    private createTree() {
        if(this.domElement) {
            if(this.treeItemData.children && this.treeItemData.children.length > 0) {

                this.childContainerElement = document.createElement('ul');
                this.childContainerElement.setAttribute('role', 'group');

                this.treeItemData.children.forEach((childItem: ITreeViewItemData, index)=>{
                    let newTreeViewItem = new TreeViewItem(childItem, this.treeView, index);
                    this.children.push(newTreeViewItem);
                    this.childContainerElement!.appendChild(newTreeViewItem.domElement!);
                });

                this.buttonElement.addEventListener('click', (ev)=>{
                    ev.preventDefault();
                    ev.cancelBubble = true;
                    this.isExpanded ?  this.setIsExpanded(false) : this.setIsExpanded(true);
                });

                this.getIsExpanded() ? this.buttonElement.innerHTML = '&nbsp;' : this.buttonElement.innerHTML = '&nbsp;';

                this.domElement.appendChild(this.childContainerElement);
                this.domElement.prepend(this.buttonElement);
                this.setIsExpanded(this.isExpanded);
            }
        }
    }

    setIsSelected(selected: boolean = true) {
        this.isSelected = selected;
        if(selected) {
            this.domElement?.setAttribute('aria-selected', 'true');
            this.treeView.selectedItem?.setIsSelected(false);
            this.treeView.selectedItem = this;
        } else {
            this.domElement?.removeAttribute('aria-selected');
            this.treeView.selectedItem = undefined;
        }
    }

    getIsSelected() {
        return this.isSelected;
    }

    setIsActive(active: boolean, scrollIntoView: boolean = true) {
        let scrollIntoViewOptions: ScrollIntoViewOptions = {behavior: "smooth", block: "center", inline: "center"};
        if(active) {
            this.treeView.activeItem?.setIsActive(false);
            this.treeView.activeItem = this;
            this.domElement?.focus();

            if(scrollIntoView) {
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

    setIsExpanded(expanded: boolean = true) {
        if(this.domElement && this.childContainerElement) {
            this.isExpanded = expanded;
            this.domElement.setAttribute('aria-expanded', expanded + '');

            if(expanded) {
                this.childContainerElement.style.display = 'block';
                this.buttonElement.innerHTML = '&nbsp;';

            } else {
                this.childContainerElement.style.display = 'none';
                this.buttonElement.innerHTML = '&nbsp;';
            }
        }
    }

    getTreeViewItemData(): ITreeViewItemData {
        return this.treeItemData;
    }

    focus() {
        this.domElement!.focus();
    }

    getNextSibling (): TreeViewItem | undefined {
        if(this.domElement) {
            let nextElement = this.domElement.nextSibling as HTMLLIElement;
            if(nextElement) {
                let nextItem = this.treeView.itemDomElementToTreeViewItemMap!.get(nextElement);
                return nextItem;
            } else {
                return undefined;
            }
        }
    }

    getPreviousSibling (): TreeViewItem | undefined {
        if(this.domElement) {
            let previousElement = this.domElement.previousSibling as HTMLLIElement;
            if(previousElement) {
                let previousItem = this.treeView.itemDomElementToTreeViewItemMap!.get(previousElement);
                return previousItem;
            } else {
                return undefined;
            }
        }
    }

    getNextAdjacent (): TreeViewItem | undefined {
        if(this.domElement) {
            if(this.children.length > 0 && this.domElement.getAttribute('aria-expanded') === "true") {
                let childElement = this.domElement.querySelector('ul');
                if(childElement instanceof HTMLUListElement) {
                    let nextElement = childElement.firstElementChild;
                    if(nextElement instanceof HTMLLIElement) {
                        return this.treeView.itemDomElementToTreeViewItemMap!.get(nextElement);
                    }
                }
            } else {
                return this.getNextSibling()
            }
        }
        return undefined;
    }


    getPreviousAdjacent (): TreeViewItem | undefined {
        if(this.domElement) {
            let parentElementSibling = this.domElement.previousElementSibling;

            if(parentElementSibling instanceof HTMLLIElement && parentElementSibling.getAttribute('aria-expanded') === "true"){
                if(parentElementSibling.children.length > 0) {
                    let childElement = parentElementSibling.querySelector('ul');
                    if(childElement instanceof HTMLUListElement) {
                        let previousItem = childElement.lastElementChild;
                        if(previousItem instanceof HTMLLIElement) {
                            return this.treeView.itemDomElementToTreeViewItemMap!.get(previousItem);
                        }
                    }
                } else {
                    return undefined;
                }
            } else {
                return this.getPreviousSibling()
            }

        }
        return undefined;
    }

    getParent (): TreeViewItem | undefined {
        if(this.domElement) {
            let parentGroupElement = this.domElement.parentElement as HTMLUListElement;
            let parentItemElement = parentGroupElement.parentElement as HTMLLIElement;

            if(parentItemElement) {
                let parentItem = this.treeView.itemDomElementToTreeViewItemMap!.get(parentItemElement);
                return parentItem;
            } else {
                return undefined;
            }
        }
    }
}

export interface ITreeViewItemData {
    id: string,
    textContent: string,
    data: {},
    children: ITreeViewItemData[]
}

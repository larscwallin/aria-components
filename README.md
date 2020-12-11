# aria-web-components
The only component, TreeView, is not really a "Web Components", but a WAI-ARIA compatible TypeScript implementation according to the https://www.w3.org/TR/wai-aria-practices-1.1/ note.

## TreeView
Initialize the tree view using `ITreeViewItemData` items and an HTML element to where the component will render to. 

This is the `ITreeViewItemData` type

```
ITreeViewItemData {
    id: string,
    textContent: string,
    data: {},
    children: ITreeViewItemData[]
}
```

### Untested example that should work 😊
```
let treeItems = [{
  id: 'item1',
  textContent: 'This  is item 1',
  data: {
    myCustomDataUrl: 'somewhere-nice.html'
  },
  children: []
}];

this.navigationTree = new TreeView(document.body, treeItems);
this.navigationTree.render();
this.navigationTree.addItemEventHandler((navItem: ITreeViewItemData)=>{
    this.goToNavItem(navItem.data.myCustomDataUrl);
});
```

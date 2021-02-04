# aria-web-components
The only component, TreeView, is not really a "Web Components", but a WAI-ARIA compatible TypeScript implementation according to the https://www.w3.org/TR/wai-aria-practices-1.1/ note.

## TreeView
Initialize the tree view using `ITreeViewItemSourceData` items and an HTML element to where the component will render to. 

This is the `ITreeViewItemSourceData` type

```
ITreeViewItemSourceData {
    id: string,
    textContent: string,
    data: {},
    children: ITreeViewItemData[]
}
```

The `data` property can be any type you wish. It is where you put the item data that is relevant for your app.
To describe your custom item data you just create a TS interface:

```
IMyCustomItemData {
  myCustomDataUrl: string;
}
```
This type is then sent as an argument to the TreeView class as a Generic Type `<IMyCustomItemData>` at time of instantiation to give us type hinting etc.

### Untested example that should work 😊
```
interface IMyCustomItemData {
  myCustomDataUrl: string;
}

let treeItems: ITreeViewItemSourceData<IMyCustomItemData>[] = [];

treeItems = [{
  id: 'item1',
  textContent: 'This  is item 1',
  data: {
    myCustomDataUrl: 'somewhere-nice.html'
  },
  children: []
}];

this.navigationTree = new TreeView<IMyCustomItemData>(document.body, treeItems);
this.navigationTree.addItemEventHandler((navItem: ITreeViewItemSourceData)=>{
    this.goToNavItem(navItem.data.myCustomDataUrl);
});
this.navigationTree.render();
```

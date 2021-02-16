import { ITreeViewItemSourceData, TreeView } from "./TreeView";

interface IMyTreeItemData {
    someData: string
}

let items: ITreeViewItemSourceData<IMyTreeItemData>[] = [];

items = [{
    textContent: "First item",
    id: "1",
    data: {
        someData: "Hey look at me! 😃"
    },
    children: [{
        textContent: "First sub item",
        id: "1_1",
        data: {
            someData: "And what about me? 😎"
        },
        children: []
    }]
},{
    textContent: "Second item",
    id: "2",
    data: {
        someData: "I came second 😮"
    },
    children: []
}, {
    textContent: "Third item",
    id: "3",
    data: {
        someData: "Whatever third place is a charm 😊"
    },
    children: []
}];

let treeView = new TreeView<IMyTreeItemData>(document.body, items);
treeView.addClassName('custom-style');
treeView.addItemClickEventHandler((item: ITreeViewItemSourceData)=>{
    console.log(item.data)
});

treeView.render();

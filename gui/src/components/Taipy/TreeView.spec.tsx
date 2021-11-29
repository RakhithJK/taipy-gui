import React from "react";
import {render} from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

import TreeView from './TreeView';
import { LoV } from "./lovUtils";
import { TaipyImage } from "./utils";
import { INITIAL_STATE, TaipyState } from "../../context/taipyReducers";
import { TaipyContext } from "../../context/taipyContext";

const lov: LoV = [
    ["id1", "Item 1", [["id1.1", "Item 1.1"], ["id1.2", "Item 1.2"]]],
    ["id2", "Item 2"],
    ["id3", "Item 3"],
    ["id4", "Item 4"],
];
const defLov = '[["id10","Default Item"]]';

const imageItem: [string, string | TaipyImage] = ["ii1", {path:"/img/fred.png", text: "Image"}];

describe("TreeView Component", () => {
    it("renders", async () => {
        const {getByText} = render(<TreeView lov={lov} />);
        const elt = getByText("Item 1");
        expect(elt.tagName).toBe("DIV");
    })
    it("uses the class", async () => {
        const {getByText} = render(<TreeView lov={lov} className="taipy-tree" />);
        const elt = getByText("Item 1");
        expect(elt.parentElement?.parentElement?.parentElement?.parentElement?.parentElement).toHaveClass("taipy-tree");
    })
    it("can display an image", async () => {
        const lovWithImage = [...lov, imageItem]
        const {getByAltText} = render(<TreeView lov={lovWithImage} />);
        const elt = getByAltText("Image");
        expect(elt.tagName).toBe("IMG");
    })
    it("shows a tree", async () => {
        const { getByText, queryAllByText } = render(<TreeView lov={lov} filter={true} />);
        const elt = getByText("Item 1");
        expect(queryAllByText(/Item 1\./)).toHaveLength(0)
        userEvent.click(elt);
        getByText("Item 1.2");
        expect(queryAllByText(/Item 1\./)).toHaveLength(2)
    });
    it("displays the right info for lov vs defaultLov", async () => {
        const { getByText, queryAllByText } = render(<TreeView lov={lov} defaultLov={defLov} />);
        getByText("Item 1");
        expect(queryAllByText("Default Item")).toHaveLength(0);
    });
    it("displays the default LoV", async () => {
        const { getByText } = render(<TreeView lov={undefined as unknown as []} defaultLov={defLov} />);
        getByText("Default Item");
    });
    it("shows a selection at start", async () => {
        const {getByText} = render(<TreeView defaultValue="id1" lov={lov} />);
        const elt = getByText("Item 1");
        expect(elt.parentElement).toHaveClass("Mui-selected");
    });
    it("shows a selection at start through value", async () => {
        const {getByText} = render(<TreeView defaultValue="id1" value="id2" lov={lov} />);
        const elt = getByText("Item 1");
        expect(elt.parentElement).not.toHaveClass("Mui-selected");
        const elt2 = getByText("Item 2");
        expect(elt2.parentElement).toHaveClass("Mui-selected");
    });
    it("is disabled", async () => {
        const { getAllByRole } = render(<TreeView lov={lov} active={false} />);
        const elts = getAllByRole("treeitem");
        elts.forEach(elt => expect(elt.firstElementChild).toHaveClass("Mui-disabled"));
    });
    it("is enabled by default", async () => {
        const { getAllByRole } = render(<TreeView lov={lov} />);
        const elts = getAllByRole("treeitem");
        elts.forEach(elt => expect(elt.firstElementChild).not.toHaveClass("Mui-disabled"));
    });
    it("is enabled by active", async () => {
        const { getAllByRole } = render(<TreeView lov={lov} active={true} />);
        const elts = getAllByRole("treeitem");
        elts.forEach(elt => expect(elt.firstElementChild).not.toHaveClass("Mui-disabled"));
    });
    it("dispatch a well formed message base", async () => {
        const dispatch = jest.fn();
        const state: TaipyState = INITIAL_STATE;
        const { getByText } = render(<TaipyContext.Provider value={{ state, dispatch }}>
                <TreeView lov={lov} tp_varname="varname"/>
            </TaipyContext.Provider>);
        const elt = getByText("Item 1");
        userEvent.click(elt);
        expect(dispatch).toHaveBeenCalledWith({name: "varname", payload: {value: ["id1"]}, propagate: true, "type": "SEND_UPDATE_ACTION"});
    });
    //multiple
    it("selects 2 items", async () => {
        const { queryAllByRole } = render(<TreeView lov={lov} multiple={true} value={["id1", "id2"]} />);
        expect(document.querySelectorAll(".Mui-selected")).toHaveLength(2);
    });
    it("dispatch a well formed message for multiple", async () => {
        const dispatch = jest.fn();
        const state: TaipyState = INITIAL_STATE;
        const { getByText } = render(<TaipyContext.Provider value={{ state, dispatch }}>
                <TreeView lov={lov} tp_varname="varname" multiple={true} />
            </TaipyContext.Provider>);
        const elt = getByText("Item 1");
        userEvent.click(elt);
        const elt2 = getByText("Item 2");
        userEvent.click(elt2, {ctrlKey: true});
        const elt3 = getByText("Item 3");
        userEvent.click(elt3, {ctrlKey: true});
        userEvent.click(elt2, {ctrlKey: true});
        expect(dispatch).toHaveBeenLastCalledWith({name: "varname", payload: {value: ["id3", "id1"]}, propagate: true, "type": "SEND_UPDATE_ACTION"});
    });
    //filter
    it("displays an input when filter", async () => {
        const { getByPlaceholderText } = render(<TreeView lov={lov} filter={true} />);
        getByPlaceholderText("Search field");
    });
    it("does not display an input when filter is off", async () => {
        const { queryAllByPlaceholderText } = render(<TreeView lov={lov} filter={false} />);
        expect(queryAllByPlaceholderText("Search field")).toHaveLength(0);
    });
    it("filters items by name", async () => {
        const { getByPlaceholderText, queryAllByText } = render(<TreeView lov={lov} filter={true} />);
        expect(queryAllByText(/Item /)).toHaveLength(4);
        const search = getByPlaceholderText("Search field");
        userEvent.type(search, "m 3");
        expect(queryAllByText(/Item /)).toHaveLength(1);
        userEvent.clear(search);
        expect(queryAllByText(/Item /)).toHaveLength(4);
    });
});
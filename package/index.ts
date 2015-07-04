// Bobril.Core

export type IBobrilChild = boolean|string|IBobrilNode;
export type IBobrilChildren = IBobrilChild|IBobrilChild[];
export type IBobrilCacheChildren = string|IBobrilCacheNode[];
export type IBobrilShimStyleMapping = { [name: string]: (style: any, value: any, oldName: string) => void };

export interface IBobrilRoot {
    // Factory function
    f: () => IBobrilChildren;
    // Root element
    e: HTMLElement;
    // Virtual Dom Cache
    c: IBobrilCacheNode[];
}

export type IBobrilRoots = { [id: string]: IBobrilRoot };

export interface IBobrilAttributes {
    id?: string;
    href?: string;
    value?: boolean|string|string[];
    tabindex?: number;
    [name: string]: any;
}

export interface IBobrilComponent {
    // if id of old node is different from new node it is considered completely different so init will be called before render directly
    // it does prevent calling render method twice on same node
    id?: string;
    // called before new node in vdom should be created, me members (tag, attrs, children, ...) could be modified, ctx is initialized to { data: me.data||{}, me: me, cfg: fromparent }
    init?(ctx: IBobrilCtx, me: IBobrilCacheNode): void;
    // in case of update after shouldChange returns true, you can do any update/init tasks, ctx.data is updated to me.data and oldMe.component updated to me.component before calling this
    // in case of init this is called after init method, oldMe is equal to undefined in that case
    render?(ctx: IBobrilCtx, me: IBobrilNode, oldMe?: IBobrilCacheNode): void;
    // called after all children are rendered, but before updating own attrs
    // so this is useful for kind of layout in JS features
    postRender?(ctx: IBobrilCtx, me: IBobrilNode, oldMe?: IBobrilCacheNode): void;
    // return false when whole subtree should not be changed from last time, you can still update any me members except key, default implementation always return true
    shouldChange?(ctx: IBobrilCtx, me: IBobrilNode, oldMe: IBobrilCacheNode): boolean;
    // called from children to parents order for new nodes
    postInitDom?(ctx: IBobrilCtx, me: IBobrilCacheNode, element: HTMLElement): void;
    // called from children to parents order for updated nodes
    postUpdateDom?(ctx: IBobrilCtx, me: IBobrilCacheNode, element: HTMLElement): void;
    // called just before removing node from dom
    destroy?(ctx: IBobrilCtx, me: IBobrilNode, element: HTMLElement): void;
    // called when bubling event to parent so you could stop bubling without preventing default handling
    shouldStopBubble?(ctx: IBobrilCtx, name: string, param: Object): boolean;
    // called when broadcast wants to dive in this node so you could silence broadcast for you and your children
    shouldStopBroadcast?(ctx: IBobrilCtx, name: string, param: Object): boolean;

    // called on input element after any change with new value (string|boolean)
    onChange?(ctx: IBobrilCtx, value: any): void;

    onKeyDown?(ctx: IBobrilCtx, event: IKeyDownUpEvent): boolean;
    onKeyUp?(ctx: IBobrilCtx, event: IKeyDownUpEvent): boolean;
    onKeyPress?(ctx: IBobrilCtx, event: IKeyPressEvent): boolean;

    // called on input element after click/tap
    onClick?(ctx: IBobrilCtx, event: IBobrilMouseEvent): boolean
    onDoubleClick?(ctx: IBobrilCtx, event: IBobrilMouseEvent): boolean;
    onMouseDown?(ctx: IBobrilCtx, event: IBobrilMouseEvent): boolean;
    onMouseUp?(ctx: IBobrilCtx, event: IBobrilMouseEvent): boolean;
    onMouseOver?(ctx: IBobrilCtx, event: IBobrilMouseEvent): boolean;
    onMouseEnter?(ctx: IBobrilCtx, event: IBobrilMouseEvent): void;
    onMouseLeave?(ctx: IBobrilCtx, event: IBobrilMouseEvent): void;
    onMouseMove?(ctx: IBobrilCtx, event: IBobrilMouseEvent): boolean;
    onPointerDown?(ctx: IBobrilCtx, event: IBobrilPointerEvent): boolean;
    onPointerMove?(ctx: IBobrilCtx, event: IBobrilPointerEvent): boolean;
    onPointerUp?(ctx: IBobrilCtx, event: IBobrilPointerEvent): boolean;
    onPointerCancel?(ctx: IBobrilCtx, event: IBobrilPointerEvent): boolean;

    // this component gained focus
    onFocus?(ctx: IBobrilCtx): void;
    // this component lost focus
    onBlur?(ctx: IBobrilCtx): void;
    // focus moved from outside of this element to some child of this element
    onFocusIn?(ctx: IBobrilCtx): void;
    // focus moved from inside of this element to some outside element
    onFocusOut?(ctx: IBobrilCtx): void;

    // if drag should start, bubbled
    onDragStart?(ctx: IBobrilCtx, dndCtx: IDndStartCtx): boolean;

    // broadcasted after drag started/moved/changed
    onDrag?(ctx: IBobrilCtx, dndCtx: IDndCtx): boolean;
    // broadcasted after drag ended even if without any action
    onDragEnd?(ctx: IBobrilCtx, dndCtx: IDndCtx): boolean;

    // Do you want to allow to drop here? bubbled
    onDragOver?(ctx: IBobrilCtx, dndCtx: IDndOverCtx): boolean;
    // User want to drop draged object here - do it - onDragOver before had to set you target
    onDrop?(ctx: IBobrilCtx, dndCtx: IDndCtx): boolean;

    // this is "static" function that's why it does not have ctx - because it does not exists
    canActivate?(transition: IRouteTransition): IRouteCanResult;
    canDeactivate?(ctx: IBobrilCtx, transition: IRouteTransition): IRouteCanResult;
}

// new node should atleast have tag or component member
export interface IBobrilNode {
    tag?: string;
    key?: string;
    className?: string;
    style?: any;
    attrs?: IBobrilAttributes;
    children?: IBobrilChildren;
    ref?: [IBobrilCtx, string]| ((node: IBobrilCacheNode) => void);
    // set this for children to be set to their ctx.cfg, if undefined your own ctx.cfg will be used anyway
    cfg?: any;
    component?: IBobrilComponent;
    // Bobril does not touch this, it is completely for user passing custom data to component
    // It is very similar to props in ReactJs, it must be immutable, you have access to this through ctx.data
    data?: any;
}

export interface IBobrilCacheNode extends IBobrilNode {
    element?: Node|Node[];
    parent?: IBobrilCacheNode;
    // context which is something like state in React expect data member which is like props in React and me member which points back to IBobrilCacheNode
    ctx?: IBobrilCtx;
}

export interface IBobrilCtx {
    // properties passed from parent component, treat it as immutable
    data?: any;
    me?: IBobrilCacheNode;
    // properties passed from parent component automaticaly, but could be extended for children to IBobrilNode.cfg
    cfg?: any;
    refs?: { [name: string]: IBobrilCacheNode };
}

var DEBUG: boolean;
if (typeof DEBUG === "undefined") DEBUG = true;

function assert(shoudBeTrue: boolean, messageIfFalse?: string) {
    if (DEBUG && !shoudBeTrue)
        throw Error(messageIfFalse || "assertion failed");
}

const isArray = Array.isArray;

function createTextNode(content: string): Text {
    return document.createTextNode(content);
}

function createElement(name: string): HTMLElement {
    return document.createElement(name);
}

var hasTextContent = "textContent" in createTextNode("");

function isObject(value: any): boolean {
    return typeof value === "object";
}

var inSvg: boolean = false;
var updateCall: Array<boolean> = [];
var updateInstance: Array<IBobrilCacheNode> = [];
var setValueCallback: (el: Element, node: IBobrilCacheNode, newValue: any, oldValue: any) => void = (el: Element, node: IBobrilCacheNode, newValue: any, oldValue: any): void => {
    if (newValue !== oldValue)
        (<any>el)["value"] = newValue;
}

export function setSetValue(callback: (el: Element, node: IBobrilCacheNode, newValue: any, oldValue: any) => void): (el: Element, node: IBobrilCacheNode, newValue: any, oldValue: any) => void {
    var prev = setValueCallback;
    setValueCallback = callback;
    return prev;
}

function newHashObj() {
    return Object.create(null);
}

var vendors = ["webkit", "Moz", "ms", "o"];
var testingDivStyle: any = document.createElement("div").style;
function testPropExistence(name: string) {
    return typeof testingDivStyle[name] === "string";
}

var mapping: IBobrilShimStyleMapping = newHashObj();

var isUnitlessNumber = {
    boxFlex: true,
    boxFlexGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexNegative: true,
    flexPositive: true,
    flexShrink: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    strokeDashoffset: true,
    widows: true,
    zIndex: true,
    zoom: true,
};

function renamer(newName: string) {
    return (style: any, value: any, oldName: string) => {
        style[newName] = value;
        style[oldName] = undefined;
    };
};

function renamerpx(newName: string) {
    return (style: any, value: any, oldName: string) => {
        if (typeof value === "number") {
            style[newName] = value + "px";
        } else {
            style[newName] = value;
        }
        style[oldName] = undefined;
    };
}

function pxadder(style: any, value: any, name: string) {
    if (typeof value === "number")
        style[name] = value + "px";
}

export function ieVersion() {
    return (<any>document).documentMode;
}

function shimStyle(newValue: any) {
    var k = Object.keys(newValue);
    for (var i = 0, l = k.length; i < l; i++) {
        var ki = k[i];
        var mi = mapping[ki];
        var vi = newValue[ki];
        if (vi === undefined) continue;  // don't want to map undefined
        if (mi === undefined) {
            if (DEBUG) {
                if (ki === "float" && window.console && console.error) console.error("In style instead of 'float' you have to use 'cssFloat'");
                if (/-/.test(ki) && window.console && console.warn) console.warn("Style property " + ki + " contains dash (must use JS props instead of css names)");
            }
            if (testPropExistence(ki)) {
                mi = ((<any>isUnitlessNumber)[ki] === true) ? null : pxadder;
            } else {
                var titleCaseKi = ki.replace(/^\w/, match => match.toUpperCase());
                for (var j = 0; j < vendors.length; j++) {
                    if (testPropExistence(vendors[j] + titleCaseKi)) {
                        mi = (((<any>isUnitlessNumber)[ki] === true) ? renamer : renamerpx)(vendors[j] + titleCaseKi); break;
                    }
                }
                if (mi === undefined) {
                    mi = ((<any>isUnitlessNumber)[ki] === true) ? null : pxadder;
                    if (DEBUG && window.console && console.warn) console.warn("Style property " + ki + " is not supported in this browser");
                }
            }
            mapping[ki] = mi;
        }
        if (mi !== null)
            mi(newValue, vi, ki);
    }
}

function removeProperty(s: any, name: string) {
    (<any>s)[name] = "";
}

function updateStyle(n: IBobrilCacheNode, el: HTMLElement, newStyle: any, oldStyle: any) {
    var s = el.style;
    if (isObject(newStyle)) {
        shimStyle(newStyle);
        var rule: string;
        if (isObject(oldStyle)) {
            for (rule in oldStyle) {
                if (!(rule in newStyle))
                    removeProperty(s, rule);
            }
            for (rule in newStyle) {
                var v = newStyle[rule];
                if (v !== undefined) {
                    if (oldStyle[rule] !== v) s[<any>rule] = v;
                } else {
                    removeProperty(s, rule);
                }
            }
        } else {
            if (oldStyle)
                s.cssText = "";
            for (rule in newStyle) {
                var v = newStyle[rule];
                if (v !== undefined)
                    s[<any>rule] = v;
            }
        }
    } else if (newStyle) {
        s.cssText = newStyle;
    } else {
        if (isObject(oldStyle)) {
            for (rule in oldStyle) {
                removeProperty(s, rule);
            }
        } else if (oldStyle) {
            s.cssText = "";
        }
    }
}

function setClassName(el: Element, className: string) {
    if (inSvg)
        el.setAttribute("class", className);
    else
        (<HTMLElement>el).className = className;
}

function updateElement(n: IBobrilCacheNode, el: Element, newAttrs: IBobrilAttributes, oldAttrs: IBobrilAttributes): IBobrilAttributes {
    var attrName: string, newAttr: any, oldAttr: any, valueOldAttr: any, valueNewAttr: any;
    for (attrName in newAttrs) {
        newAttr = newAttrs[attrName];
        oldAttr = oldAttrs[attrName];
        if (attrName === "value" && !inSvg) {
            valueOldAttr = oldAttr;
            valueNewAttr = newAttr;
            oldAttrs[attrName] = newAttr;
            continue;
        }
        if (oldAttr !== newAttr) {
            oldAttrs[attrName] = newAttr;
            if (inSvg) {
                if (attrName === "href") el.setAttributeNS("http://www.w3.org/1999/xlink", "href", newAttr);
                else el.setAttribute(attrName, newAttr);
            } else if (attrName in el && !(attrName === "list" || attrName === "form")) {
                (<any>el)[attrName] = newAttr;
            } else el.setAttribute(attrName, newAttr);
        }
    }
    for (attrName in oldAttrs) {
        if (oldAttrs[attrName] !== undefined && !(attrName in newAttrs)) {
            oldAttrs[attrName] = undefined;
            el.removeAttribute(attrName);
        }
    }
    if (valueNewAttr !== undefined) {
        setValueCallback(el, n, valueNewAttr, valueOldAttr);
    }
    return oldAttrs;
}

function pushInitCallback(c: IBobrilCacheNode, aupdate: boolean) {
    var cc = c.component;
    if (cc) {
        if ((<any>cc)[aupdate ? "postUpdateDom" : "postInitDom"]) {
            updateCall.push(aupdate);
            updateInstance.push(c);
        }
    }
}

function findCfg(parent: IBobrilCacheNode): any {
    var cfg: any;
    while (parent) {
        cfg = parent.cfg;
        if (cfg !== undefined) break;
        if (parent.ctx) {
            cfg = parent.ctx.cfg;
            break;
        }
        parent = parent.parent;
    }
    return cfg;
}

function setRef(ref: [IBobrilCtx, string]| ((node: IBobrilCacheNode) => void), value: IBobrilCacheNode) {
    if (ref == null) return;
    if (typeof ref === "function") {
        (<(node: IBobrilCacheNode) => void>ref)(value);
        return;
    }
    var ctx = (<[IBobrilCtx, string]>ref)[0];
    var refs = ctx.refs;
    if (!refs) {
        refs = newHashObj();
        ctx.refs = refs;
    }
    refs[(<[IBobrilCtx, string]>ref)[1]] = value;
}

export function createNode(n: IBobrilNode, parentNode: IBobrilNode, createInto: Element, createBefore: Node): IBobrilCacheNode {
    var c = <IBobrilCacheNode>{ // This makes CacheNode just one object class = fast
        tag: n.tag,
        key: n.key,
        ref: n.ref,
        className: n.className,
        style: n.style,
        attrs: n.attrs,
        children: n.children,
        component: n.component,
        data: n.data,
        cfg: n.cfg,
        parent: parentNode,
        element: undefined,
        ctx: undefined
    };
    var backupInSvg = inSvg;
    var component = c.component;
    var el: Node;
    setRef(c.ref, c);
    if (component) {
        var ctx: IBobrilCtx = { data: c.data || {}, me: c, cfg: findCfg(parentNode) };
        c.ctx = ctx;
        if (component.init) {
            component.init(ctx, c);
        }
        if (component.render) {
            component.render(ctx, c);
        }
    }
    var tag = c.tag;
    var children = c.children;
    if (tag === undefined) {
        if (typeof children === "string") {
            el = createTextNode(<string>children);
            c.element = el;
            createInto.insertBefore(el, createBefore);
        } else {
            createChildren(c, createInto, createBefore);
        }
        if (component) {
            if (component.postRender) {
                component.postRender(c.ctx, c);
            }
        }
        return c;
    } else if (tag === "/") {
        var htmltext = <string>children;
        if (htmltext === "") {
            // nothing needs to be created
        } else if (createBefore == null) {
            var before = createInto.lastChild;
            (<HTMLElement>createInto).insertAdjacentHTML("beforeend", htmltext);
            c.element = <Node[]>[];
            if (before) {
                before = before.nextSibling;
            } else {
                before = createInto.firstChild;
            }
            while (before) {
                (<Node[]>c.element).push(before);
                before = before.nextSibling;
            }
        } else {
            el = createBefore;
            var elprev = createBefore.previousSibling;
            var removeEl = false;
            var parent = createInto;
            if (!(<HTMLElement>el).insertAdjacentHTML) {
                el = parent.insertBefore(createElement("i"), el);
                removeEl = true;
            }
            (<HTMLElement>el).insertAdjacentHTML("beforebegin", htmltext);
            if (elprev) {
                elprev = elprev.nextSibling;
            }
            else {
                elprev = parent.firstChild;
            }
            var newElements: Array<Node> = [];
            while (elprev !== el) {
                newElements.push(elprev);
                elprev = elprev.nextSibling;
            }
            (<IBobrilCacheNode>n).element = newElements;
            if (removeEl) {
                parent.removeChild(el);
            }
        }
        if (component) {
            if (component.postRender) {
                component.postRender(c.ctx, c);
            }
        }
        return c;
    } else if (inSvg || tag === "svg") {
        el = <HTMLElement>document.createElementNS("http://www.w3.org/2000/svg", tag);
        inSvg = true;
    } else if (!el) {
        el = createElement(tag);
    }
    createInto.insertBefore(el, createBefore);
    c.element = el;
    createChildren(c, <Element>el, null);
    if (component) {
        if (component.postRender) {
            component.postRender(c.ctx, c);
        }
    }
    if (c.attrs) c.attrs = updateElement(c, <HTMLElement>el, c.attrs, {});
    if (c.style) updateStyle(c, <HTMLElement>el, c.style, undefined);
    var className = c.className;
    if (className) setClassName(<HTMLElement>el, className);
    inSvg = backupInSvg;
    pushInitCallback(c, false);
    return c;
}

function normalizeNode(n: any): IBobrilNode {
    var t = typeof n;
    if (t === "string") {
        return { children: n };
    }
    if (t === "boolean") return null;
    return <IBobrilNode>n;
}

function createChildren(c: IBobrilCacheNode, createInto: Element, createBefore: Node): void {
    var ch = c.children;
    if (!ch)
        return;
    if (!isArray(ch)) {
        if (typeof ch === "string") {
            if (hasTextContent) {
                createInto.textContent = ch;
            } else {
                (<HTMLElement>createInto).innerText = ch;
            }
            return;
        }
        ch = [ch];
    }
    ch = (<IBobrilNode[]>ch).slice(0);
    var i = 0, l = (<IBobrilNode[]>ch).length;
    while (i < l) {
        var item = (<IBobrilNode[]>ch)[i];
        if (isArray(item)) {
            (<IBobrilNode[]>ch).splice.apply(ch, (<any>[i, 1]).concat(item));
            l = (<IBobrilNode[]>ch).length;
            continue;
        }
        item = normalizeNode(item);
        if (item == null) {
            (<IBobrilNode[]>ch).splice(i, 1);
            l--;
            continue;
        }
        var j = (<IBobrilNode[]>ch)[i] = createNode(item, c, createInto, createBefore);
        i++;
    }
    c.children = ch;
}

function destroyNode(c: IBobrilCacheNode) {
    setRef(c.ref, null);
    let ch = c.children;
    if (isArray(ch)) {
        for (var i = 0, l = (<IBobrilCacheNode[]>ch).length; i < l; i++) {
            destroyNode((<IBobrilCacheNode[]>ch)[i]);
        }
    }
    let component = c.component;
    if (component) {
        if (component.destroy)
            component.destroy(c.ctx, c, <HTMLElement>c.element);
    }
}

function removeNodeRecursive(c: IBobrilCacheNode) {
    var el = c.element;
    if (isArray(el)) {
        var pa = (<Node[]>el)[0].parentNode;
        if (pa) {
            for (let i = 0; i < (<Node[]>el).length; i++) {
                pa.removeChild((<Node[]>el)[i]);
            }
        }
    } else if (el != null) {
        let p = (<Node>el).parentNode;
        if (p) p.removeChild(<Node>el);
    } else {
        var ch = c.children;
        if (isArray(ch)) {
            for (var i = 0, l = (<IBobrilCacheNode[]>ch).length; i < l; i++) {
                removeNodeRecursive((<IBobrilCacheNode[]>ch)[i]);
            }
        }
    }
}

function removeNode(c: IBobrilCacheNode) {
    destroyNode(c);
    removeNodeRecursive(c);
}

var roots: IBobrilRoots = newHashObj();

function nodeContainsNode(c: IBobrilCacheNode, n: Node, resIndex: number, res: IBobrilCacheNode[]): IBobrilCacheNode[] {
    var el = c.element;
    var ch = c.children;
    if (isArray(el)) {
        for (var ii = 0; ii < (<Node[]>el).length; ii++) {
            if ((<Node[]>el)[ii] === n) {
                res.push(c);
                if (isArray(ch)) {
                    return <IBobrilCacheNode[]>ch;
                }
                return null;
            }
        }
    } else if (el == null) {
        if (isArray(ch)) {
            for (var i = 0; i < (<IBobrilCacheNode[]>ch).length; i++) {
                var result = nodeContainsNode((<IBobrilCacheNode[]>ch)[i], n, resIndex, res);
                if (result !== undefined) {
                    res.splice(resIndex, 0, c);
                    return result;
                }
            }
        }
    } else if (el === n) {
        res.push(c);
        if (isArray(ch)) {
            return <IBobrilCacheNode[]>ch;
        }
        return null;
    }
    return undefined;
}

export function vdomPath(n: Node): IBobrilCacheNode[] {
    var res: IBobrilCacheNode[] = [];
    if (n == null) return res;
    var rootIds = Object.keys(roots);
    var rootElements = rootIds.map((i) => roots[i].e || document.body);
    var nodeStack: Node[] = [];
    rootFound: while (n) {
        for (var j = 0; j < rootElements.length; j++) {
            if (n === rootElements[j]) break rootFound;
        }
        nodeStack.push(n);
        n = n.parentNode;
    }
    if (!n || nodeStack.length === 0) return res;
    var currentCacheArray: IBobrilChildren = null;
    var currentNode = nodeStack.pop();
    rootFound2: for (j = 0; j < rootElements.length; j++) {
        if (n === rootElements[j]) {
            var rc = roots[rootIds[j]].c;
            for (var k = 0; k < rc.length; k++) {
                var rck = rc[k];
                var findResult = nodeContainsNode(rck, currentNode, res.length, res);
                if (findResult !== undefined) {
                    currentCacheArray = findResult;
                    break rootFound2;
                }
            }
        }
    }
    while (nodeStack.length) {
        currentNode = nodeStack.pop();
        if (currentCacheArray && (<any>currentCacheArray).length) for (var i = 0, l = (<any>currentCacheArray).length; i < l; i++) {
            var bn = (<IBobrilCacheNode[]>currentCacheArray)[i];
            var findResult = nodeContainsNode(bn, currentNode, res.length, res);
            if (findResult !== undefined) {
                currentCacheArray = findResult;
                currentNode = null;
                break;
            }
        }
        if (currentNode) {
            res.push(null);
            break;
        }
    }
    return res;
}

export function deref(n: Node): IBobrilCacheNode {
    var s = vdomPath(n);
    if (s.length == 0) return null;
    return s[s.length - 1];
}

function finishUpdateNode(n: IBobrilNode, c: IBobrilCacheNode, component: IBobrilComponent) {
    if (component) {
        if (component.postRender) {
            component.postRender(c.ctx, n, c);
        }
    }
    c.data = n.data;
    pushInitCallback(c, true);
}

export function updateNode(n: IBobrilNode, c: IBobrilCacheNode, createInto: Element, createBefore: Node, deepness: number): IBobrilCacheNode {
    var component = n.component;
    var backupInSvg = inSvg;
    var bigChange = false;
    var ctx = c.ctx;
    if (component && ctx != null) {
        if ((<any>ctx)[ctxInvalidated] === frameCounter) {
            deepness = Math.max(deepness, (<any>ctx)[ctxDeepness]);
        }
        if (component.id !== c.component.id) {
            bigChange = true;
        } else {
            if (c.parent != undefined)
                ctx.cfg = findCfg(c.parent);
            if (component.shouldChange)
                if (!component.shouldChange(ctx, n, c))
                    return c;
            (<any>ctx).data = n.data || {};
            c.component = component;
            if (component.render)
                component.render(ctx, n, c);
            c.cfg = n.cfg;
        }
    }
    if (DEBUG) {
        if (!((n.ref == null && c.ref == null) ||
            ((n.ref != null && c.ref != null && (typeof n.ref === "function" || typeof c.ref === "function" ||
                (<[IBobrilCtx, string]>n.ref)[0] === (<[IBobrilCtx, string]>c.ref)[0] && (<[IBobrilCtx, string]>n.ref)[1] === (<[IBobrilCtx, string]>c.ref)[1]))))) {
            if (window.console && console.warn) console.warn("ref changed in child in update");
        }
    }
    var newChildren = n.children;
    var cachedChildren = c.children;
    var tag = n.tag;
    if (bigChange || (component && ctx == null)) {
        // it is big change of component.id or old one was not even component => recreate
    } else if (tag === "/") {
        if (c.tag === "/" && cachedChildren === newChildren) {
            finishUpdateNode(n, c, component);
            return c;
        }
    } else if (tag === c.tag) {
        if (tag === undefined) {
            if (typeof newChildren === "string" && typeof cachedChildren === "string") {
                if (newChildren !== cachedChildren) {
                    var el = <Element>c.element;
                    if (hasTextContent) {
                        el.textContent = newChildren;
                    } else {
                        (<HTMLElement>el).nodeValue = newChildren;
                    }
                    c.children = newChildren;
                }
            } else {
                if (deepness <= 0) {
                    if (isArray(cachedChildren))
                        selectedUpdate(<IBobrilCacheNode[]>c.children, createInto, createBefore);
                } else {
                    c.children = updateChildren(createInto, newChildren, cachedChildren, c, createBefore, deepness - 1);
                }
            }
            finishUpdateNode(n, c, component);
            return c;
        } else {
            if (tag === "svg") {
                inSvg = true;
            }
            var el = <Element>c.element;
            if ((typeof newChildren === "string") && !isArray(cachedChildren)) {
                if (newChildren !== cachedChildren) {
                    if (hasTextContent) {
                        el.textContent = newChildren;
                    } else {
                        (<HTMLElement>el).innerText = newChildren;
                    }
                    cachedChildren = newChildren;
                }
            } else {
                if (deepness <= 0) {
                    if (isArray(cachedChildren))
                        selectedUpdate(<IBobrilCacheNode[]>c.children, el, createBefore);
                } else {
                    cachedChildren = updateChildren(el, newChildren, cachedChildren, c, null, deepness - 1);
                }
            }
            c.children = cachedChildren;
            finishUpdateNode(n, c, component);
            if (c.attrs || n.attrs)
                c.attrs = updateElement(c, el, n.attrs || {}, c.attrs || {});
            updateStyle(c, <HTMLElement>el, n.style, c.style);
            c.style = n.style;
            var className = n.className;
            if (className !== c.className) {
                setClassName(el, className || "");
                c.className = className;
            }
            inSvg = backupInSvg;
            return c;
        }
    }
    var parEl = c.element;
    if (isArray(parEl)) parEl = (<Node[]>parEl)[0];
    if (parEl == null) parEl = createInto; else parEl = (<Node>parEl).parentNode;
    var r: IBobrilCacheNode = createNode(n, c.parent, <Element>parEl, getDomNode(c));
    removeNode(c);
    return r;
}

export function getDomNode(c: IBobrilCacheNode): Node {
    var el = c.element;
    if (el != null) {
        if (isArray(el)) return (<Node[]>el)[0];
        return <Node>el;
    }
    var ch = c.children;
    if (!isArray(ch)) return null;
    for (var i = 0; i < (<IBobrilCacheNode[]>ch).length; i++) {
        el = getDomNode((<IBobrilCacheNode[]>ch)[i]);
        if (el) return <Node>el;
    }
    return null;
}

function findNextNode(a: IBobrilCacheNode[], i: number, len: number, def: Node): Node {
    while (++i < len) {
        var ai = a[i];
        if (ai == null) continue;
        var n = getDomNode(ai);
        if (n != null) return n;
    }
    return def;
}

export function callPostCallbacks() {
    var count = updateInstance.length;
    for (var i = 0; i < count; i++) {
        var n = updateInstance[i];
        if (updateCall[i]) {
            n.component.postUpdateDom(n.ctx, n, <HTMLElement>n.element);
        } else {
            n.component.postInitDom(n.ctx, n, <HTMLElement>n.element);
        }
    }
    updateCall = [];
    updateInstance = [];
}

function updateNodeInUpdateChildren(newNode: IBobrilNode, cachedChildren: IBobrilCacheNode[], cachedIndex: number, cachedLength: number, createBefore: Node, element: Element, deepness: number) {
    cachedChildren[cachedIndex] = updateNode(newNode, cachedChildren[cachedIndex], element,
        findNextNode(cachedChildren, cachedIndex, cachedLength, createBefore), deepness);
}

function reorderInUpdateChildrenRec(c: IBobrilCacheNode, element: Element, before: Node): void {
    var el = c.element;
    if (el != null) {
        if (isArray(el)) {
            for (var i = 0; i < (<Node[]>el).length; i++) {
                element.insertBefore((<Node[]>el)[i], before);
            }
        } else
            element.insertBefore(<Node>el, before);
        return;
    }
    var ch = c.children;
    if (!isArray(ch)) return null;
    for (var i = 0; i < (<IBobrilCacheNode[]>ch).length; i++) {
        reorderInUpdateChildrenRec((<IBobrilCacheNode[]>ch)[i], element, before);
    }
}

function reorderInUpdateChildren(cachedChildren: IBobrilCacheNode[], cachedIndex: number, cachedLength: number, createBefore: Node, element: Element) {
    var before = findNextNode(cachedChildren, cachedIndex, cachedLength, createBefore);
    var cur = cachedChildren[cachedIndex];
    var what = getDomNode(cur);
    if (what != null && what !== before) {
        reorderInUpdateChildrenRec(cur, element, before);
    }
}

function reorderAndUpdateNodeInUpdateChildren(newNode: IBobrilNode, cachedChildren: IBobrilCacheNode[], cachedIndex: number, cachedLength: number, createBefore: Node, element: Element, deepness: number) {
    var before = findNextNode(cachedChildren, cachedIndex, cachedLength, createBefore);
    var cur = cachedChildren[cachedIndex];
    var what = getDomNode(cur);
    if (what != null && what !== before) {
        reorderInUpdateChildrenRec(cur, element, before);
    }
    cachedChildren[cachedIndex] = updateNode(newNode, cur, element, before, deepness);
}

export function updateChildren(element: Element, newChildren: any, cachedChildren: any, parentNode: IBobrilNode, createBefore: Node, deepness: number): IBobrilCacheNode[] {
    if (newChildren == null) newChildren = <IBobrilNode[]>[];
    if (!isArray(newChildren)) {
        newChildren = [newChildren];
    }
    if (cachedChildren == null) cachedChildren = <IBobrilCacheNode>[];
    if (!isArray(cachedChildren)) {
        if (element.firstChild) element.removeChild(element.firstChild);
        cachedChildren = <any>[];
    }
    newChildren = newChildren.slice(0);
    var newLength = newChildren.length;
    var cachedLength = cachedChildren.length;
    var newIndex: number;
    for (newIndex = 0; newIndex < newLength;) {
        var item = newChildren[newIndex];
        if (isArray(item)) {
            newChildren.splice.apply(newChildren, [newIndex, 1].concat(item));
            newLength = newChildren.length;
            continue;
        }
        item = normalizeNode(item);
        if (item == null) {
            newChildren.splice(newIndex, 1);
            newLength--;
            continue;
        }
        newChildren[newIndex] = item;
        newIndex++;
    }
    var newEnd = newLength;
    var cachedEnd = cachedLength;
    newIndex = 0;
    var cachedIndex = 0;
    while (newIndex < newEnd && cachedIndex < cachedEnd) {
        if (newChildren[newIndex].key === cachedChildren[cachedIndex].key) {
            updateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
            newIndex++;
            cachedIndex++;
            continue;
        }
        while (true) {
            if (newChildren[newEnd - 1].key === cachedChildren[cachedEnd - 1].key) {
                newEnd--;
                cachedEnd--;
                updateNodeInUpdateChildren(newChildren[newEnd], cachedChildren, cachedEnd, cachedLength, createBefore, element, deepness);
                if (newIndex < newEnd && cachedIndex < cachedEnd)
                    continue;
            }
            break;
        }
        if (newIndex < newEnd && cachedIndex < cachedEnd) {
            if (newChildren[newIndex].key === cachedChildren[cachedEnd - 1].key) {
                cachedChildren.splice(cachedIndex, 0, cachedChildren[cachedEnd - 1]);
                cachedChildren.splice(cachedEnd, 1);
                reorderAndUpdateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
                newIndex++;
                cachedIndex++;
                continue;
            }
            if (newChildren[newEnd - 1].key === cachedChildren[cachedIndex].key) {
                cachedChildren.splice(cachedEnd, 0, cachedChildren[cachedIndex]);
                cachedChildren.splice(cachedIndex, 1);
                cachedEnd--;
                newEnd--;
                reorderAndUpdateNodeInUpdateChildren(newChildren[newEnd], cachedChildren, cachedEnd, cachedLength, createBefore, element, deepness);
                continue;
            }
        }
        break;
    }
    if (cachedIndex === cachedEnd) {
        if (newIndex === newEnd) {
            return cachedChildren;
        }
        // Only work left is to add new nodes
        while (newIndex < newEnd) {
            cachedChildren.splice(cachedIndex, 0, createNode(newChildren[newIndex], parentNode, element,
                findNextNode(cachedChildren, cachedIndex - 1, cachedLength, createBefore)));
            cachedIndex++;
            cachedEnd++;
            cachedLength++;
            newIndex++;
        }
        return cachedChildren;
    }
    if (newIndex === newEnd) {
        // Only work left is to remove old nodes
        while (cachedIndex < cachedEnd) {
            cachedEnd--;
            removeNode(cachedChildren[cachedEnd]);
            cachedChildren.splice(cachedEnd, 1);
        }
        return cachedChildren;
    }
    // order of keyed nodes ware changed => reorder keyed nodes first
    var cachedKeys: { [keyName: string]: number } = newHashObj();
    var newKeys: { [keyName: string]: number } = newHashObj();
    var key: string;
    var node: IBobrilNode;
    var backupNewIndex = newIndex;
    var backupCachedIndex = cachedIndex;
    var deltaKeyless = 0;
    for (; cachedIndex < cachedEnd; cachedIndex++) {
        node = cachedChildren[cachedIndex];
        key = node.key;
        if (key != null) {
            assert(!(key in <any>cachedKeys));
            cachedKeys[key] = cachedIndex;
        }
        else
            deltaKeyless--;
    }
    var keyLess = -deltaKeyless - deltaKeyless;
    for (; newIndex < newEnd; newIndex++) {
        node = newChildren[newIndex];
        key = node.key;
        if (key != null) {
            assert(!(key in <any>newKeys));
            newKeys[key] = newIndex;
        }
        else
            deltaKeyless++;
    }
    keyLess += deltaKeyless;
    var delta = 0;
    newIndex = backupNewIndex;
    cachedIndex = backupCachedIndex;
    var cachedKey: string;
    while (cachedIndex < cachedEnd && newIndex < newEnd) {
        if (cachedChildren[cachedIndex] === null) { // already moved somethere else
            cachedChildren.splice(cachedIndex, 1);
            cachedEnd--;
            cachedLength--;
            delta--;
            continue;
        }
        cachedKey = cachedChildren[cachedIndex].key;
        if (cachedKey == null) {
            cachedIndex++;
            continue;
        }
        key = newChildren[newIndex].key;
        if (key == null) {
            newIndex++;
            while (newIndex < newEnd) {
                key = newChildren[newIndex].key;
                if (key != null)
                    break;
                newIndex++;
            }
            if (key == null)
                break;
        }
        var akpos = cachedKeys[key];
        if (akpos === undefined) {
            // New key
            cachedChildren.splice(cachedIndex, 0, createNode(newChildren[newIndex], parentNode, element,
                findNextNode(cachedChildren, cachedIndex - 1, cachedLength, createBefore)));
            delta++;
            newIndex++;
            cachedIndex++;
            cachedEnd++;
            cachedLength++;
            continue;
        }
        if (!(cachedKey in <any>newKeys)) {
            // Old key
            removeNode(cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex, 1);
            delta--;
            cachedEnd--;
            cachedLength--;
            continue;
        }
        if (cachedIndex === akpos + delta) {
            // Inplace update
            updateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
            newIndex++;
            cachedIndex++;
        } else {
            // Move
            cachedChildren.splice(cachedIndex, 0, cachedChildren[akpos + delta]);
            delta++;
            cachedChildren[akpos + delta] = null;
            reorderAndUpdateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
            cachedIndex++;
            cachedEnd++;
            cachedLength++;
            newIndex++;
        }
    }
    // remove old keyed cached nodes
    while (cachedIndex < cachedEnd) {
        if (cachedChildren[cachedIndex] === null) { // already moved somethere else
            cachedChildren.splice(cachedIndex, 1);
            cachedEnd--;
            cachedLength--;
            continue;
        }
        if (cachedChildren[cachedIndex].key != null) { // this key is only in old
            removeNode(cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex, 1);
            cachedEnd--;
            cachedLength--;
            continue;
        }
        cachedIndex++;
    }
    // add new keyed nodes
    while (newIndex < newEnd) {
        key = newChildren[newIndex].key;
        if (key != null) {
            cachedChildren.splice(cachedIndex, 0, createNode(newChildren[newIndex], parentNode, element,
                findNextNode(cachedChildren, cachedIndex - 1, cachedLength, createBefore)));
            cachedEnd++;
            cachedLength++;
            delta++;
            cachedIndex++;
        }
        newIndex++;
    }
    // Without any keyless nodes we are done
    if (!keyLess)
        return cachedChildren;
    // calculate common (old and new) keyless
    keyLess = (keyLess - Math.abs(deltaKeyless)) >> 1;
    // reorder just nonkeyed nodes
    newIndex = backupNewIndex;
    cachedIndex = backupCachedIndex;
    while (newIndex < newEnd) {
        if (cachedIndex < cachedEnd) {
            cachedKey = cachedChildren[cachedIndex].key;
            if (cachedKey != null) {
                cachedIndex++;
                continue;
            }
        }
        key = newChildren[newIndex].key;
        if (newIndex < cachedEnd && key === cachedChildren[newIndex].key) {
            if (key != null) {
                newIndex++;
                continue;
            }
            updateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, newIndex, cachedLength, createBefore, element, deepness);
            keyLess--;
            newIndex++;
            cachedIndex = newIndex;
            continue;
        }
        if (key != null) {
            assert(newIndex === cachedIndex);
            if (keyLess === 0 && deltaKeyless < 0) {
                while (true) {
                    removeNode(cachedChildren[cachedIndex]);
                    cachedChildren.splice(cachedIndex, 1);
                    cachedEnd--;
                    cachedLength--;
                    deltaKeyless++;
                    assert(cachedIndex !== cachedEnd, "there still need to exist key node");
                    if (cachedChildren[cachedIndex].key != null)
                        break;
                }
                continue;
            }
            while (cachedChildren[cachedIndex].key == null)
                cachedIndex++;
            assert(key === cachedChildren[cachedIndex].key);
            cachedChildren.splice(newIndex, 0, cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex + 1, 1);
            reorderInUpdateChildren(cachedChildren, newIndex, cachedLength, createBefore, element)
            // just moving keyed node it was already updated before
            newIndex++;
            cachedIndex = newIndex;
            continue;
        }
        if (cachedIndex < cachedEnd) {
            cachedChildren.splice(newIndex, 0, cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex + 1, 1);
            reorderAndUpdateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, newIndex, cachedLength, createBefore, element, deepness);
            keyLess--;
            newIndex++;
            cachedIndex++;
        } else {
            cachedChildren.splice(newIndex, 0, createNode(newChildren[newIndex], parentNode, element,
                findNextNode(cachedChildren, newIndex - 1, cachedLength, createBefore)));
            cachedEnd++;
            cachedLength++;
            newIndex++;
            cachedIndex++;
        }
    }
    while (cachedEnd > newIndex) {
        cachedEnd--;
        removeNode(cachedChildren[cachedEnd]);
        cachedChildren.splice(cachedEnd, 1);
    }
    return cachedChildren;
}

var hasNativeRaf = false;
var nativeRaf = window.requestAnimationFrame;
if (nativeRaf) {
    nativeRaf((param) => { if (param === +param) hasNativeRaf = true; });
}

export const now = Date.now || (() => (new Date).getTime());
var startTime = now();
var lastTickTime = 0;

function requestAnimationFrame(callback: (time: number) => void) {
    if (hasNativeRaf) {
        nativeRaf(callback);
    } else {
        var delay = 50 / 3 + lastTickTime - now();
        if (delay < 0) delay = 0;
        window.setTimeout(() => {
            lastTickTime = now();
            callback(lastTickTime - startTime);
        }, delay);
    }
}

var ctxInvalidated = "$invalidated";
var ctxDeepness = "$deepness";
var fullRecreateRequested = false;
var scheduled = false;
var uptimeMs = 0;
var frameCounter = 0;
var lastFrameDurationMs = 0;
var renderFrameBegin = 0;

var regEvents: { [name: string]: Array<(ev: any, target: Node, node: IBobrilCacheNode) => boolean> } = {};
var registryEvents: { [name: string]: Array<{ priority: number; callback: (ev: any, target: Node, node: IBobrilCacheNode) => boolean }> } = {};

export function addEvent(name: string, priority: number, callback: (ev: any, target: Node, node: IBobrilCacheNode) => boolean): void {
    var list = registryEvents[name] || [];
    list.push({ priority: priority, callback: callback });
    registryEvents[name] = list;
}

export function emitEvent(name: string, ev: any, target: Node, node: IBobrilCacheNode): boolean {
    var events = regEvents[name];
    if (events) for (var i = 0; i < events.length; i++) {
        if (events[i](ev, target, node))
            return true;
    }
    return false;
}

function addListener(el: EventTarget, name: string) {
    if (name[0] == "!") return;
    var capture = (name[0] == "^");
    var eventName = name;
    if (capture) {
        eventName = name.slice(1);
    }
    function enhanceEvent(ev: Event) {
        ev = ev || window.event;
        var t = ev.target || ev.srcElement || el;
        var n = deref(<any>t);
        emitEvent(name, ev, <Node>t, n);
    }
    if (("on" + eventName) in window) el = window;
    el.addEventListener(eventName, enhanceEvent, capture);
}

var eventsCaptured = false;

function initEvents() {
    if (eventsCaptured)
        return;
    eventsCaptured = true;
    var eventNames = Object.keys(registryEvents);
    for (var j = 0; j < eventNames.length; j++) {
        var eventName = eventNames[j];
        var arr = registryEvents[eventName];
        arr = arr.sort((a, b) => a.priority - b.priority);
        regEvents[eventName] = arr.map(v => v.callback);
    }
    registryEvents = null;
    var body = document.body;
    for (var i = 0; i < eventNames.length; i++) {
        addListener(body, eventNames[i]);
    }
}

function selectedUpdate(cache: IBobrilCacheNode[], element: Element, createBefore: Node) {
    var len = cache.length;
    for (var i = 0; i < len; i++) {
        var node = cache[i];
        var ctx = node.ctx;
        if (ctx != null && (<any>ctx)[ctxInvalidated] === frameCounter) {
            var cloned: IBobrilNode = { data: ctx.data, component: node.component };
            cache[i] = updateNode(cloned, node, element, createBefore, (<any>ctx)[ctxDeepness]);
        } else if (isArray(node.children)) {
            var backupInSvg = inSvg;
            if (node.tag === "svg") inSvg = true;
            selectedUpdate(<IBobrilCacheNode[]>node.children, (<Element>node.element) || element, findNextNode(cache, i, len, createBefore));
            inSvg = backupInSvg;
        }
    }
}

var beforeFrameCallback: () => void = () => { };
var afterFrameCallback: (root: IBobrilCacheChildren) => void = () => { };

export function setBeforeFrame(callback: () => void): () => void {
    var res = beforeFrameCallback;
    beforeFrameCallback = callback;
    return res;
}

export function setAfterFrame(callback: (root: IBobrilCacheChildren) => void): (root: IBobrilCacheChildren) => void {
    var res = afterFrameCallback;
    afterFrameCallback = callback;
    return res;
}

function findLastNode(children: IBobrilCacheNode[]): Node {
    for (var i = children.length - 1; i >= 0; i--) {
        var c = children[i];
        var el = c.element;
        if (el != null) {
            if (isArray(el)) {
                var l = (<Node[]>el).length;
                if (l === 0)
                    continue;
                return (<Node[]>el)[l - 1];
            }
            return <Node>el;
        }
        var ch = c.children;
        if (!isArray(ch))
            continue;
        var res = findLastNode(<IBobrilCacheNode[]>ch);
        if (res != null)
            return res;
    }
    return null;
}

function update(time: number) {
    renderFrameBegin = now();
    initEvents();
    frameCounter++;
    uptimeMs = time;
    scheduled = false;
    beforeFrameCallback();
    var fullRefresh = false;
    if (fullRecreateRequested) {
        fullRecreateRequested = false;
        fullRefresh = true;
    }
    var rootIds = Object.keys(roots);
    for (var i = 0; i < rootIds.length; i++) {
        var r = roots[rootIds[i]];
        if (!r) continue;
        var rc = r.c;
        var insertBefore = findLastNode(rc);
        if (insertBefore != null) insertBefore = insertBefore.nextSibling;
        if (fullRefresh) {
            var newChildren = r.f();
            r.e = r.e || document.body;
            r.c = updateChildren(r.e, newChildren, rc, null, insertBefore, 1e6);
        }
        else {
            selectedUpdate(rc, r.e, insertBefore);
        }
    }
    callPostCallbacks();
    afterFrameCallback(roots["0"].c);
    lastFrameDurationMs = now() - renderFrameBegin;
}

export function invalidate(ctx?: Object, deepness?: number) {
    if (fullRecreateRequested)
        return;
    if (ctx != null) {
        if (deepness == undefined) deepness = 1e6;
        if ((<any>ctx)[ctxInvalidated] !== frameCounter + 1) {
            (<any>ctx)[ctxInvalidated] = frameCounter + 1;
            (<any>ctx)[ctxDeepness] = deepness;
        } else {
            if (deepness > (<any>ctx)[ctxDeepness])
                (<any>ctx)[ctxDeepness] = deepness;
        }
    } else {
        fullRecreateRequested = true;
    }
    if (scheduled)
        return;
    scheduled = true;
    requestAnimationFrame(update);
}

var lastRootId = 0;

export function addRoot(factory: () => IBobrilChildren, element?: HTMLElement): string {
    lastRootId++;
    var rootId = "" + lastRootId;
    roots[rootId] = { f: factory, e: element, c: [] };
    invalidate();
    return rootId;
}

export function removeRoot(id: string): void {
    var root = roots[id];
    if (!root) return;
    if (root.c.length) {
        root.c = <any>updateChildren(root.e, <any>[], root.c, null, null, 1e9);
    }
    delete roots[id];
}

export function getRoots(): IBobrilRoots {
    return roots;
}

var beforeInit: () => void = invalidate;

export function init(factory: () => any, element?: HTMLElement) {
    removeRoot("0");
    roots["0"] = { f: factory, e: element, c: [] };
    beforeInit();
}

export function setBeforeInit(callback: (cb: () => void) => void): void {
    let prevBeforeInit = beforeInit;
    beforeInit = () => {
        callback(prevBeforeInit);
    }
}

export function bubble(node: IBobrilCacheNode, name: string, param: any): IBobrilCtx {
    while (node) {
        var c = node.component;
        if (c) {
            var ctx = node.ctx;
            var m = (<any>c)[name];
            if (m) {
                if (m.call(c, ctx, param))
                    return ctx;
            }
            m = (<any>c).shouldStopBubble;
            if (m) {
                if (m.call(c, ctx, name, param))
                    break;
            }
        }
        node = node.parent;
    }
    return null;
}

function broadcastEventToNode(node: IBobrilCacheNode, name: string, param: any): IBobrilCtx {
    if (!node)
        return null;
    var c = node.component;
    if (c) {
        var ctx = node.ctx;
        var m = (<any>c)[name];
        if (m) {
            if (m.call(c, ctx, param))
                return ctx;
        }
        m = c.shouldStopBroadcast;
        if (m) {
            if (m.call(c, ctx, name, param))
                return null;
        }
    }
    var ch = node.children;
    if (isArray(ch)) {
        for (var i = 0; i < (<IBobrilCacheNode[]>ch).length; i++) {
            var res = broadcastEventToNode((<IBobrilCacheNode[]>ch)[i], name, param);
            if (res != null)
                return res;
        }
    } else {
        return broadcastEventToNode(ch, name, param);
    }
}

export function broadcast(name: string, param: any): IBobrilCtx {
    var k = Object.keys(roots);
    for (var i = 0; i < k.length; i++) {
        var ch = roots[k[i]].c;
        if (ch != null) {
            for (var j = 0; j < ch.length; j++) {
                var res = broadcastEventToNode(ch[j], name, param);
                if (res != null)
                    return res;
            }
        }
    }
    return null;
}

function merge(f1: Function, f2: Function): Function {
    return (...params: any[]) => {
        var result = f1.apply(this, params);
        if (result) return result;
        return f2.apply(this, params);
    }
}

var emptyObject = {};

function mergeComponents(c1: IBobrilComponent, c2: IBobrilComponent) {
    var res = Object.create(c1);
    for (var i in c2) {
        if (!(i in <any>emptyObject)) {
            var m = (<any>c2)[i];
            var origM = (<any>c1)[i];
            if (i === "id") {
                res[i] = ((origM != null) ? origM : "") + "/" + m;
            } else if (typeof m === "function" && origM != null && typeof origM === "function") {
                res[i] = merge(origM, m);
            } else {
                res[i] = m;
            }
        }
    }
    return res;
}

export function preEnhance(node: IBobrilNode, methods: IBobrilComponent): IBobrilNode {
    var comp = node.component;
    if (!comp) {
        node.component = methods;
        return node;
    }
    node.component = mergeComponents(methods, comp);
    return node;
}

export function postEnhance(node: IBobrilNode, methods: IBobrilComponent): IBobrilNode {
    var comp = node.component;
    if (!comp) {
        node.component = methods;
        return node;
    }
    node.component = mergeComponents(comp, methods);
    return node;
}

export function assign(target: Object, ...sources: Object[]): Object {
    if (target == null) target = {};
    let totalArgs = arguments.length;
    for (let i = 1; i < totalArgs; i++) {
        let source = arguments[i];
        if (source == null) continue;
        let keys = Object.keys(source);
        let totalKeys = keys.length;
        for (let j = 0; j < totalKeys; j++) {
            let key = keys[j];
            (<any>target)[key] = (<any>source)[key];
        }
    }
    return target;
}

export function preventDefault(event: Event) {
    var pd = event.preventDefault;
    if (pd) pd.call(event); else (<any>event).returnValue = false;
}

function cloneNodeArray(a: IBobrilChild[]): IBobrilChild[] {
    a = a.slice(0);
    for (var i = 0; i < a.length; i++) {
        var n = a[i];
        if (isArray(n)) {
            a[i] = cloneNodeArray(<IBobrilChild[]>n);
        } else if (isObject(n)) {
            a[i] = cloneNode(n);
        }
    }
    return a;
}

export function cloneNode(node: IBobrilNode): IBobrilNode {
    var r = <IBobrilNode>assign({}, node);
    if (r.attrs) {
        r.attrs = <IBobrilAttributes>assign({}, r.attrs);
    }
    if (isObject(r.style)) {
        r.style = assign({}, r.style);
    }
    var ch = r.children;
    if (ch) {
        if (isArray(ch)) {
            r.children = cloneNodeArray(<IBobrilChild[]>ch);
        } else if (isObject(ch)) {
            r.children = cloneNode(ch);
        }
    }
    return r;
}

export function setStyleShim(name: string, action: (style: any, value: any, oldName: string) => void) { mapping[name] = action; }

export function uptime() { return uptimeMs; }

export function lastFrameDuration() { return lastFrameDurationMs; }

export function frame() { return frameCounter; }

export function invalidated() { return scheduled; }

// Bobril.Media
export const enum BobrilDeviceCategory {
    Mobile = 0,
    Tablet = 1,
    Desktop = 2,
    LargeDesktop = 3
}

export interface IBobrilMedia {
    width: number;
    height: number;
    orientation: number;
    deviceCategory: BobrilDeviceCategory;
    portrait: boolean;
}

var media: IBobrilMedia = null;
var breaks = [
    [414, 800, 900], //portrait widths
    [736, 1280, 1440] //landscape widths
];

function emitOnMediaChange() {
    media = null;
    invalidate();
    return false;
}

var events = ["resize", "orientationchange"];
for (var i = 0; i < events.length; i++)
    addEvent(events[i], 10, emitOnMediaChange);

export function accDeviceBreaks(newBreaks?: number[][]): number[][] {
    if (newBreaks != null) {
        breaks = newBreaks;
        emitOnMediaChange();
    }
    return breaks;
}

var viewport = window.document.documentElement;

export function getMedia(): IBobrilMedia {
    if (media == null) {
        var w = viewport.clientWidth;
        var h = viewport.clientHeight;
        var o: any = (<any>window).orientation;
        var p = h >= w;
        if (o == null) o = (p ? 0 : 90);
        var device = 0;
        while (w > breaks[+!p][device]) device++;
        media = {
            width: w,
            height: h,
            orientation: o,
            deviceCategory: device,
            portrait: p
        };
    }
    return media;
}

// Bobril.Promise

export interface Thenable<R> {
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Thenable<U>;
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => void): Thenable<U>;
}

export const asap = (() => {
    var callbacks: Array<() => void> = [];

    function executeCallbacks() {
        var cbList = callbacks;
        callbacks = [];
        for (var i = 0, len = cbList.length; i < len; i++) {
            cbList[i]();
        }
    }

    var onreadystatechange = 'onreadystatechange';
    // Modern browsers, fastest async
    if ((<any>window).MutationObserver) {
        var hiddenDiv = document.createElement("div");
        (new MutationObserver(executeCallbacks)).observe(hiddenDiv, { attributes: true });
        return (callback: () => void) => {
            if (!callbacks.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            callbacks.push(callback);
        };
        // Browsers that support postMessage
    } else if (!window.setImmediate && window.postMessage && window.addEventListener) {
        var MESSAGE_PREFIX = "basap" + Math.random(), hasPostMessage = false;

        var onGlobalMessage = (event: any) => {
            if (event.source === window && event.data === MESSAGE_PREFIX) {
                hasPostMessage = false;
                executeCallbacks();
            }
        };

        window.addEventListener("message", onGlobalMessage, false);

        return (fn: () => void) => {
            callbacks.push(fn);

            if (!hasPostMessage) {
                hasPostMessage = true;
                window.postMessage(MESSAGE_PREFIX, "*");
            }
        };
        // IE browsers without postMessage
    } else if (!window.setImmediate && onreadystatechange in document.createElement('script')) {
        var scriptEl: any;
        return (callback: () => void) => {
            callbacks.push(callback);
            if (!scriptEl) {
                scriptEl = document.createElement("script");
                scriptEl[onreadystatechange] = () => {
                    scriptEl[onreadystatechange] = null;
                    scriptEl.parentNode.removeChild(scriptEl);
                    scriptEl = null;
                    executeCallbacks();
                };
                document.body.appendChild(scriptEl);
            }
        };
        // All other browsers
    } else {
        var timeout: number;
        var timeoutFn = window.setImmediate || setTimeout;
        return (callback: () => void) => {
            callbacks.push(callback);
            if (!timeout) {
                timeout = timeoutFn(() => {
                    timeout = undefined;
                    executeCallbacks();
                }, 0);
            }
        };
    }
})();

(function() {
    if (!(<any>window).Promise) {
        // Polyfill for Function.prototype.bind
        function bind(fn: (args: any) => void, thisArg: any) {
            return function() {
                fn.apply(thisArg, arguments);
            }
        }

        function handle(deferred: Array<(v: any) => any>) {
            if (this.s/*tate*/ === null) {
                this.d/*eferreds*/.push(deferred);
                return;
            }
            asap(() => {
                var cb = this.s/*tate*/ ? deferred[0] : deferred[1];
                if (cb == null) {
                    (this.s/*tate*/ ? deferred[2] : deferred[3])(this.v/*alue*/);
                    return;
                }
                var ret: any;
                try {
                    ret = cb(this.v/*alue*/);
                } catch (e) {
                    deferred[3](e);
                    return;
                }
                deferred[2](ret);
            });
        }

        function finale() {
            for (var i = 0, len = this.d/*eferreds*/.length; i < len; i++) {
                handle.call(this, this.d/*eferreds*/[i]);
            }
            this.d/*eferreds*/ = null;
        }

        function reject(newValue: any) {
            this.s/*tate*/ = false;
            this.v/*alue*/ = newValue;
            finale.call(this);
        }

        /**
         * Take a potentially misbehaving resolver function and make sure
         * onFulfilled and onRejected are only called once.
         *
         * Makes no guarantees about asynchrony.
         */
        function doResolve(fn: (fulfill: (v: any) => void, reject: (r: any) => void) => void, onFulfilled: (value: any) => void, onRejected: (reason: any) => void) {
            var done = false;
            try {
                fn((value: any) => {
                    if (done) return;
                    done = true;
                    onFulfilled(value);
                }, (reason: any) => {
                    if (done) return;
                    done = true;
                    onRejected(reason);
                });
            } catch (ex) {
                if (done) return;
                done = true;
                onRejected(ex);
            }
        }

        function resolve(newValue: any) {
            try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
                if (newValue === this) throw new TypeError('Promise selfresolve');
                if (Object(newValue) === newValue) {
                    var then = newValue.then;
                    if (typeof then === 'function') {
                        doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this));
                        return;
                    }
                }
                this.s/*tate*/ = true;
                this.v/*alue*/ = newValue;
                finale.call(this);
            } catch (e) { reject.call(this, e); }
        }

        function Promise(fn: (onFulfilled: (value: any) => void, onRejected: (reason: any) => void) => void) {
            this.s/*tate*/ = null;
            this.v/*alue*/ = null;
            this.d/*eferreds*/ = <Array<Array<() => void>>>[];

            doResolve(fn, bind(resolve, this), bind(reject, this));
        }

        Promise.prototype.then = function(onFulfilled: any, onRejected?: any) {
            var me = this;
            return new (<any>Promise)((resolve: any, reject: any) => {
                handle.call(me, [onFulfilled, onRejected, resolve, reject]);
            });
        };

        (<any>Promise).all = function() {
            var args = (<any>[]).slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

            return new (<any>Promise)((resolve: (value: any) => void, reject: (reason: any) => void) => {
                if (args.length === 0) {
                    resolve(args);
                    return;
                }
                var remaining = args.length;
                function res(i: number, val: any) {
                    try {
                        if (val && (typeof val === 'object' || typeof val === 'function')) {
                            var then = val.then;
                            if (typeof then === 'function') {
                                then.call(val, (val: any) => { res(i, val) }, reject);
                                return;
                            }
                        }
                        args[i] = val;
                        if (--remaining === 0) {
                            resolve(args);
                        }
                    } catch (ex) {
                        reject(ex);
                    }
                }
                for (var i = 0; i < args.length; i++) {
                    res(i, args[i]);
                }
            });
        };

        (<any>Promise).resolve = (value: any) => {
            if (value && typeof value === 'object' && value.constructor === Promise) {
                return value;
            }

            return new (<any>Promise)((resolve: (value: any) => void) => {
                resolve(value);
            });
        };

        (<any>Promise).reject = (value: any) => new (<any>Promise)((resolve: any, reject: (reason: any) => void) => {
            reject(value);
        });

        (<any>Promise).race = (values: any[]) => new (<any>Promise)((resolve: any, reject: any) => {
            for (var i = 0, len = values.length; i < len; i++) {
                values[i].then(resolve, reject);
            }
        });

        (<any>window)['Promise'] = <any>Promise;
    }
})();

// Bobril.StyleShim

/// <reference path="bobril.d.ts"/>

if (ieVersion() === 9) {
    function addFilter(s: any, v: string) {
        if (s.zoom == null) s.zoom = "1";
        var f = s.filter;
        s.filter = (f == null) ? v : f + " " + v;
    }

    var simpleLinearGradient = /^linear\-gradient\(to (.+?),(.+?),(.+?)\)/ig;

    setStyleShim("background", (s: any, v: any, oldName: string) => {
        var match = simpleLinearGradient.exec(v);
        if (match == null) return;
        var dir = match[1];
        var color1 = match[2];
        var color2 = match[3];
        var tmp: string;
        switch (dir) {
            case "top": dir = "0"; tmp = color1; color1 = color2; color2 = tmp; break;
            case "bottom": dir = "0"; break;
            case "left": dir = "1"; tmp = color1; color1 = color2; color2 = tmp; break;
            case "right": dir = "1"; break;
            default: return;
        }
        s[oldName] = "none";
        addFilter(s, "progid:DXImageTransform.Microsoft.gradient(startColorstr='" + color1 + "',endColorstr='" + color2 + "', gradientType='" + dir + "')");
    });
} else {
    var teststyle = document.createElement("div").style;
    teststyle.cssText = "background:-webkit-linear-gradient(top,red,red)";
    if (teststyle.background.length > 0) {
        var startsWithGradient = /^(?:repeating\-)?(?:linear|radial)\-gradient/ig;
        var revdirs = { top: "bottom", bottom: "top", left: "right", right: "left" };
        function gradientWebkitter(style: any, value: any, name: string) {
            if (startsWithGradient.test(value)) {
                var pos = (<string>value).indexOf("(to ");
                if (pos > 0) {
                    pos += 4;
                    var posend = (<string>value).indexOf(",", pos);
                    var dir = (<string>value).slice(pos, posend);
                    dir = dir.split(" ").map(v=> (<any>revdirs)[v] || v).join(" ");
                    value = (<string>value).slice(0, pos - 3) + dir + (<string>value).slice(posend);
                }
                value = "-webkit-" + value;
            }
            style[name] = value;
        };
        setStyleShim("background", gradientWebkitter);
    }
}

// Bobril.OnChange

/// <reference path="bobril.d.ts"/>
/// <reference path="bobril.onchange.d.ts"/>

var bvalue = "b$value";
var tvalue = "value";

function isCheckboxlike(el: HTMLInputElement) {
    var t = el.type;
    return t === "checkbox" || t === "radio";
}

function stringArrayEqual(a1: string[], a2: string[]): boolean {
    var l = a1.length;
    if (l !== a2.length) return false;
    for (var j = 0; j < l; j++) {
        if (a1[j] !== a2[j]) return false;
    }
    return true;
}

function stringArrayContains(a: string[], v: string): boolean {
    for (var j = 0; j < a.length; j++) {
        if (a[j] === v) return true;
    }
    return false;
}

function selectedArray(options: HTMLSelectElement): string[] {
    var res: string[] = [];
    for (var j = 0; j < options.length; j++) {
        if (options[j].selected) res.push(options[j].value);
    }
    return res;
}

var prevSetValueCallback = setSetValue((el: Element, node: IBobrilCacheNode, newValue: any, oldValue: any) => {
    var tagName = el.tagName;
    var isSelect = tagName === "SELECT";
    var isInput = tagName === "INPUT" || tagName === "TEXTAREA";
    if (!isInput && !isSelect) {
        prevSetValueCallback(el, node, newValue, oldValue);
        return;
    }
    if (node.ctx === undefined) node.ctx = {};
    if (oldValue === undefined) {
        (<any>node.ctx)[bvalue] = newValue;
    }
    var isMultiSelect = isSelect && (<HTMLSelectElement>el).multiple;
    var emitDiff = false;
    if (isMultiSelect) {
        var options = (<HTMLSelectElement>el).options;
        var currentMulti = selectedArray(options);
        if (!stringArrayEqual(newValue, currentMulti)) {
            if (oldValue === undefined || stringArrayEqual(currentMulti, oldValue) || !stringArrayEqual(newValue, (<any>node.ctx)[bvalue])) {
                for (var j = 0; j < options.length; j++) {
                    options[j].selected = stringArrayContains(newValue, options[j].value);
                }
                currentMulti = selectedArray(options);
                if (stringArrayEqual(currentMulti, newValue)) {
                    emitDiff = true;
                }
            } else {
                emitDiff = true;
            }
        }
    } else if (isInput || isSelect) {
        if (isInput && isCheckboxlike(<HTMLInputElement>el)) {
            var currentChecked = (<any>el).checked;
            if (newValue !== currentChecked) {
                if (oldValue === undefined || currentChecked === oldValue || newValue !== (<any>node.ctx)[bvalue]) {
                    (<any>el).checked = newValue;
                } else {
                    emitDiff = true;
                }
            }
        } else {
            var isCombobox = isSelect && (<HTMLSelectElement>el).size < 2;
            var currentValue = ((<any>el)[tvalue]);
            if (newValue !== currentValue) {
                if (oldValue === undefined || currentValue === oldValue || newValue !== (<any>node.ctx)[bvalue]) {
                    if (isSelect) {
                        if (newValue === "") {
                            (<HTMLSelectElement>el).selectedIndex = isCombobox ? 0 : -1;
                        } else {
                            (<any>el)[tvalue] = newValue;
                        }
                        if (newValue !== "" || isCombobox) {
                            currentValue = ((<any>el)[tvalue]);
                            if (newValue !== currentValue) {
                                emitDiff = true;
                            }
                        }
                    } else {
                        (<any>el)[tvalue] = newValue;
                    }
                } else {
                    emitDiff = true;
                }
            }
        }
    }
    if (emitDiff) {
        emitOnChange(null, el, node);
    } else {
        (<any>node.ctx)[bvalue] = newValue;
    }
});

function emitOnChange(ev: Event, target: Node, node: IBobrilCacheNode) {
    if (target && target.nodeName === "OPTION") {
        target = document.activeElement;
        node = deref(target);
    }
    if (!node) {
        return false;
    }
    var c = node.component;
    if (!c)
        return false;
    if (!c.onChange)
        return false;
    var ctx = node.ctx;
    var tagName = (<Element>target).tagName;
    var isSelect = tagName === "SELECT";
    var isMultiSelect = isSelect && (<HTMLSelectElement>target).multiple;
    if (isMultiSelect) {
        var vs = selectedArray((<HTMLSelectElement>target).options);
        if (!stringArrayEqual((<any>ctx)[bvalue], vs)) {
            (<any>ctx)[bvalue] = vs;
            c.onChange(ctx, vs);
        }
    } else if (isCheckboxlike(<HTMLInputElement>target)) {
        // Postpone change event so onClick will be processed before it
        if (ev && ev.type === "change") {
            setTimeout(() => {
                emitOnChange(null, target, node);
            }, 10);
            return false;
        }
        if ((<HTMLInputElement>target).type === "radio") {
            var radios = document.getElementsByName((<HTMLInputElement>target).name);
            for (var j = 0; j < radios.length; j++) {
                var radio = radios[j];
                var radionode = deref(radio);
                if (!radionode) continue;
                var radiocomponent = radionode.component;
                if (!radiocomponent) continue;
                if (!radiocomponent.onChange) continue;
                var radioctx = radionode.ctx;
                var vrb = (<HTMLInputElement>radio).checked;
                if ((<any>radioctx)[bvalue] !== vrb) {
                    (<any>radioctx)[bvalue] = vrb;
                    radiocomponent.onChange(radioctx, vrb);
                }
            }
        } else {
            var vb = (<HTMLInputElement>target).checked;
            if ((<any>ctx)[bvalue] !== vb) {
                (<any>ctx)[bvalue] = vb;
                c.onChange(ctx, vb);
            }
        }
    } else {
        var v = (<HTMLInputElement>target).value;
        if ((<any>ctx)[bvalue] !== v) {
            (<any>ctx)[bvalue] = v;
            c.onChange(ctx, v);
        }
    }
    return false;
}

// click here must have lower priority (higher number) over mouse handlers
var events = ["input", "cut", "paste", "keydown", "keypress", "keyup", "click", "change"];
for (var i = 0; i < events.length; i++)
    addEvent(events[i], 10, emitOnChange);

// Bobril.OnKey

export interface IKeyDownUpEvent {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
    which: number;
}

export interface IKeyPressEvent {
    charCode: number;
}

function buildParam(ev: KeyboardEvent): IKeyDownUpEvent {
    return {
        shift: ev.shiftKey,
        ctrl: ev.ctrlKey,
        alt: ev.altKey,
        meta: ev.metaKey || false,
        which: ev.which || ev.keyCode,
    };
}

function emitOnKeyDown(ev: KeyboardEvent, target: Node, node: IBobrilCacheNode) {
    if (!node)
        return false;
    var param: IKeyDownUpEvent = buildParam(ev);
    if (bubble(node, "onKeyDown", param)) {
        preventDefault(ev);
        return true;
    }
    return false;
}
function emitOnKeyUp(ev: KeyboardEvent, target: Node, node: IBobrilCacheNode) {
    if (!node)
        return false;
    var param: IKeyDownUpEvent = buildParam(ev);
    if (bubble(node, "onKeyUp", param)) {
        preventDefault(ev);
        return true;
    }
    return false;
}
function emitOnKeyPress(ev: KeyboardEvent, target: Node, node: IBobrilCacheNode) {
    if (!node)
        return false;
    if (ev.which === 0) // don't want special key presses
        return false;
    var param: IKeyPressEvent = { charCode: ev.which || ev.keyCode };
    if (bubble(node, "onKeyPress", param)) {
        preventDefault(ev);
        return true;
    }
    return false;
}

addEvent("keydown", 50, emitOnKeyDown);
addEvent("keyup", 50, emitOnKeyUp);
addEvent("keypress", 50, emitOnKeyPress);

// Bobril.Mouse

export interface IBobrilMouseEvent {
    x: number;
    y: number;
    // 1 - left (or touch), 2 - middle, 3 - right <- it does not make sense but that's W3C
    button: number;
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
}

export const enum BobrilPointerType {
    Mouse = 0,
    Touch = 1,
    Pen = 2
}

export interface IBobrilPointerEvent extends IBobrilMouseEvent {
    id: number;
    type: BobrilPointerType;
}

const enum Consts {
    MoveOverIsNotTap = 13,
    TapShouldBeShorterThanMs = 750,
    MaxBustDelay = 500,
    MaxBustDelayForIE = 800,
    BustDistance = 50
}

let ownerCtx: any = null;
let invokingOwner: boolean;
const onClickText = "onClick";

export function isMouseOwner(ctx: any): boolean {
    return ownerCtx === ctx;
}

export function isMouseOwnerEvent(): boolean {
    return invokingOwner;
}

export function registerMouseOwner(ctx: any): void {
    ownerCtx = ctx;
}

export function releaseMouseOwner(): void {
    ownerCtx = null;
}

function invokeMouseOwner(handlerName: string, param: any): boolean {
    if (ownerCtx == null) {
        return false;
    }

    var handler = ownerCtx.me.component[handlerName];
    if (!handler) { // no handler available
        return false;
    }
    invokingOwner = true;
    var stop = handler(ownerCtx, param);
    invokingOwner = false;
    return stop;
}

function hasPointerEventsNoneB(node: IBobrilCacheNode): boolean {
    while (node) {
        var s = node.style;
        if (s) {
            var e = s.pointerEvents;
            if (e !== undefined) {
                if (e === "none")
                    return true;
                return false;
            }
        }
        node = node.parent;
    }
    return false;
}

function hasPointerEventsNone(target: Node): boolean {
    var bNode = deref(target);
    return hasPointerEventsNoneB(bNode);
}

function revertVisibilityChanges(hiddenEls: { t: HTMLElement; p: string }[]): boolean {
    if (hiddenEls.length) {
        for (var i = hiddenEls.length - 1; i >= 0; --i) {
            hiddenEls[i].t.style.visibility = hiddenEls[i].p;
        }
        return true;
    }
    return false;
}

function pushAndHide(hiddenEls: { t: HTMLElement; p: string }[], t: HTMLElement) {
    hiddenEls.push({ t: t, p: t.style.visibility });
    t.style.visibility = "hidden";
}

function pointerThroughIE(ev: MouseEvent, target: Node, node: IBobrilCacheNode): boolean {
    var hiddenEls: { t: HTMLElement; p: string }[] = [];
    var t = <HTMLElement>target;
    while (hasPointerEventsNone(t)) {
        pushAndHide(hiddenEls, t);
        t = <HTMLElement>document.elementFromPoint(ev.x, ev.y);
    }
    if (revertVisibilityChanges(hiddenEls)) {
        try {
            t.dispatchEvent(ev);
        } catch (e) {
            return false;
        }
        preventDefault(ev);
        return true;
    }
    return false;
}

function addEvent5(name: string, callback: (ev: any, target: Node, node: IBobrilCacheNode) => boolean) {
    addEvent(name, 5, callback);
}

var pointersEventNames = ["PointerDown", "PointerMove", "PointerUp", "PointerCancel"];
var i: number;
if (ieVersion() && ieVersion() < 11) {
    // emulate pointer-events: none in older ie
    var mouseEvents = [
        "click", "dblclick", "drag", "dragend",
        "dragenter", "dragleave", "dragover", "dragstart",
        "drop", "mousedown", "mousemove", "mouseout",
        "mouseover", "mouseup", "mousewheel", "scroll", "wheel"];
    for (i = 0; i < mouseEvents.length; ++i) {
        addEvent(mouseEvents[i], 1, pointerThroughIE);
    }
}

function type2Bobril(t: any): BobrilPointerType {
    if (t == "mouse") return BobrilPointerType.Mouse;
    if (t == "pen") return BobrilPointerType.Pen;
    return BobrilPointerType.Touch;
}

function pointerEventsNoneFix(x: number, y: number, target: Node, node: IBobrilCacheNode): [Node, IBobrilCacheNode] {
    var hiddenEls: { t: HTMLElement; p: string }[] = [];
    var t = <HTMLElement>target;
    while (hasPointerEventsNoneB(node)) {
        pushAndHide(hiddenEls, t);
        t = <HTMLElement>document.elementFromPoint(x, y);
        node = deref(t);
    }
    revertVisibilityChanges(hiddenEls);
    return [t, node];
}

function buildHandlerPointer(name: string) {
    return function handlePointerDown(ev: PointerEvent, target: Node, node: IBobrilCacheNode): boolean {
        if (hasPointerEventsNoneB(node)) {
            var fixed = pointerEventsNoneFix(ev.x, ev.y, target, node);
            target = fixed[0];
            node = fixed[1];
        }
        var param: IBobrilPointerEvent = { id: ev.pointerId, type: type2Bobril(ev.pointerType), x: ev.clientX, y: ev.clientY, button: ev.button + 1, shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
        if (emitEvent("!" + name, param, target, node)) {
            preventDefault(ev);
            return true;
        }
        return false;
    }
}

function buildHandlerTouch(name: string) {
    return function handlePointerDown(ev: TouchEvent, target: Node, node: IBobrilCacheNode): boolean {
        var preventDef = false;
        for (var i = 0; i < ev.changedTouches.length; i++) {
            var t = ev.changedTouches[i];
            target = <HTMLElement>document.elementFromPoint(t.clientX, t.clientY);
            node = deref(target);
            var param: IBobrilPointerEvent = { id: t.identifier + 2, type: BobrilPointerType.Touch, x: t.clientX, y: t.clientY, button: 1, shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
            if (emitEvent("!" + name, param, target, node))
                preventDef = true;
        }
        if (preventDef) {
            preventDefault(ev);
            return true;
        }
        return false;
    }
}

function buildHandlerMouse(name: string) {
    return function handlePointer(ev: MouseEvent, target: Node, node: IBobrilCacheNode): boolean {
        target = <HTMLElement>document.elementFromPoint(ev.clientX, ev.clientY);
        node = deref(target);
        if (hasPointerEventsNoneB(node)) {
            var fixed = pointerEventsNoneFix(ev.clientX, ev.clientY, target, node);
            target = fixed[0];
            node = fixed[1];
        }
        var param: IBobrilPointerEvent = { id: 1, type: BobrilPointerType.Mouse, x: ev.clientX, y: ev.clientY, button: decodeButton(ev), shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
        if (emitEvent("!" + name, param, target, node)) {
            preventDefault(ev);
            return true;
        }
        return false;
    }
}

if (window.onpointerdown !== undefined) {
    for (i = 0; i < 4 /*pointersEventNames.length*/; i++) {
        var name = pointersEventNames[i];
        addEvent5(name.toLowerCase(), buildHandlerPointer(name));
    }
} else if (window.onmspointerdown !== undefined) {
    for (i = 0; i < 4 /*pointersEventNames.length*/; i++) {
        var name = pointersEventNames[i];
        addEvent5("MS" + name, buildHandlerPointer(name));
    }
} else {
    if ((<any>window).ontouchstart !== undefined) {
        addEvent5("touchstart", buildHandlerTouch(pointersEventNames[0]/*"PointerDown"*/));
        addEvent5("touchmove", buildHandlerTouch(pointersEventNames[1]/*"PointerMove"*/));
        addEvent5("touchend", buildHandlerTouch(pointersEventNames[2]/*"PointerUp"*/));
        addEvent5("touchcancel", buildHandlerTouch(pointersEventNames[3]/*"PointerCancel"*/));
    }
    addEvent5("mousedown", buildHandlerMouse(pointersEventNames[0]/*"PointerDown"*/));
    addEvent5("mousemove", buildHandlerMouse(pointersEventNames[1]/*"PointerMove"*/));
    addEvent5("mouseup", buildHandlerMouse(pointersEventNames[2]/*"PointerUp"*/));
}

for (var j = 0; j < 4 /*pointersEventNames.length*/; j++) {
    ((name: string) => {
        var onname = "on" + name;
        addEvent("!" + name, 50, (ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode) => {
            return invokeMouseOwner(onname, ev) || (bubble(node, onname, ev) != null);
        });
    })(pointersEventNames[j]);
}

var pointersDown: { [id: number]: BobrilPointerType } = newHashObj();
var toBust: Array<number>[] = [];
var firstPointerDown = -1;
var firstPointerDownTime = 0;
var firstPointerDownX = 0;
var firstPointerDownY = 0;
var tapCanceled = false;

function diffLess(n1: number, n2: number, diff: number) {
    return Math.abs(n1 - n2) < diff;
}

var prevMousePath: IBobrilCacheNode[] = [];

function mouseEnterAndLeave(ev: IBobrilPointerEvent) {
    var t = <HTMLElement>document.elementFromPoint(ev.x, ev.y);
    var toPath = vdomPath(t);
    var node = toPath.length == 0 ? null : toPath[toPath.length - 1];
    if (hasPointerEventsNoneB(node)) {
        var fixed = pointerEventsNoneFix(ev.x, ev.y, t, node);
        t = <HTMLElement>fixed[0];
        toPath = vdomPath(t);
    }

    bubble(node, "onMouseOver", ev);

    var common = 0;
    while (common < prevMousePath.length && common < toPath.length && prevMousePath[common] === toPath[common])
        common++;

    var i = prevMousePath.length;
    var n: IBobrilCacheNode;
    var c: IBobrilComponent;
    while (i > common) {
        i--;
        n = prevMousePath[i];
        if (n) {
            c = n.component;
            if (c && c.onMouseLeave)
                c.onMouseLeave(n.ctx, ev);
        }
    }
    while (i < toPath.length) {
        n = toPath[i];
        if (n) {
            c = n.component;
            if (c && c.onMouseEnter)
                c.onMouseEnter(n.ctx, ev);
        }
        i++;
    }
    prevMousePath = toPath;
    return false;
};

function noPointersDown(): boolean {
    return Object.keys(pointersDown).length === 0;
}

function bustingPointerDown(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    if (firstPointerDown === -1 && noPointersDown()) {
        firstPointerDown = ev.id;
        firstPointerDownTime = now();
        firstPointerDownX = ev.x;
        firstPointerDownY = ev.y;
        tapCanceled = false;
        mouseEnterAndLeave(ev);
    }
    pointersDown[ev.id] = ev.type;
    if (firstPointerDown !== ev.id) {
        tapCanceled = true;
    }
    return false;
}

function bustingPointerMove(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    // Browser forgot to send mouse up? Let's fix it
    if (ev.type === BobrilPointerType.Mouse && ev.button === 0 && pointersDown[ev.id] != null) {
        ev.button = 1;
        emitEvent("!PointerUp", ev, target, node);
        ev.button = 0;
    }
    if (firstPointerDown === ev.id) {
        mouseEnterAndLeave(ev);
        if (!diffLess(firstPointerDownX, ev.x, Consts.MoveOverIsNotTap) || !diffLess(firstPointerDownY, ev.y, Consts.MoveOverIsNotTap))
            tapCanceled = true;
    } else if (noPointersDown()) {
        mouseEnterAndLeave(ev);
    }
    return false;
}

function bustingPointerUp(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    delete pointersDown[ev.id];
    if (firstPointerDown == ev.id) {
        mouseEnterAndLeave(ev);
        firstPointerDown = -1;
        if (ev.type == BobrilPointerType.Touch && !tapCanceled) {
            if (now() - firstPointerDownTime < Consts.TapShouldBeShorterThanMs) {
                emitEvent("!PointerCancel", ev, target, node);
                var handled = invokeMouseOwner(onClickText, ev) || (bubble(node, onClickText, ev) != null);
                var delay = (ieVersion()) ? Consts.MaxBustDelayForIE : Consts.MaxBustDelay;
                toBust.push([ev.x, ev.y, now() + delay, handled ? 1 : 0]);
                return handled;
            }
        }
    }
    return false;
}

function bustingPointerCancel(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    delete pointersDown[ev.id];
    if (firstPointerDown == ev.id) {
        firstPointerDown = -1;
    }
    return false;
}

function bustingClick(ev: MouseEvent, target: Node, node: IBobrilCacheNode): boolean {
    var n = now();
    for (var i = 0; i < toBust.length; i++) {
        var j = toBust[i];
        if (j[2] < n) {
            toBust.splice(i, 1);
            i--;
            continue;
        }
        if (diffLess(j[0], ev.clientX, Consts.BustDistance) && diffLess(j[1], ev.clientY, Consts.BustDistance)) {
            toBust.splice(i, 1);
            if (j[3]) preventDefault(ev);
            return true;
        }
    }
    return false;
}

var bustingEventNames = ["!PointerDown", "!PointerMove", "!PointerUp", "!PointerCancel", "click"];
var bustingEventHandlers = [bustingPointerDown, bustingPointerMove, bustingPointerUp, bustingPointerCancel, bustingClick];
for (var i = 0; i < 5 /*bustingEventNames.length*/; i++) {
    addEvent(bustingEventNames[i], 3, bustingEventHandlers[i]);
}

function createHandlerMouse(handlerName: string) {
    return (ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode) => {
        if (firstPointerDown != ev.id && !noPointersDown()) return false;
        if (invokeMouseOwner(handlerName, ev) || bubble(node, handlerName, ev)) {
            return true;
        }
        return false;
    };
}

var mouseHandlerNames = ["Down", "Move", "Up", "Up"];
for (var i = 0; i < 4; i++) {
    addEvent(bustingEventNames[i], 80, createHandlerMouse("onMouse" + mouseHandlerNames[i]));
}

function decodeButton(ev: MouseEvent): number {
    return ev.which || ev.button;
}

function createHandler(handlerName: string) {
    return (ev: MouseEvent, target: Node, node: IBobrilCacheNode) => {
        var param: IBobrilMouseEvent = { x: ev.clientX, y: ev.clientY, button: decodeButton(ev) || 1, shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
        if (invokeMouseOwner(handlerName, param) || bubble(node, handlerName, param)) {
            preventDefault(ev);
            return true;
        }
        return false;
    };
}

export function nodeOnPoint(x: number, y: number): IBobrilCacheNode {
    var target = <HTMLElement>document.elementFromPoint(x, y);
    var node = deref(target);
    if (hasPointerEventsNoneB(node)) {
        var fixed = pointerEventsNoneFix(x, y, target, node);
        node = fixed[1];
    }
    return node;
}

function handleSelectStart(ev: any, target: Node, node: IBobrilCacheNode): boolean {
    while (node) {
        var s = node.style;
        if (s) {
            var us = s.userSelect;
            if (us === "none") {
                preventDefault(ev);
                return true;
            }
            if (us) {
                break;
            }
        }
        node = node.parent;
    }
    return false;
}

addEvent5("selectstart", handleSelectStart);

// click must have higher priority over onchange detection
addEvent5("click", createHandler(onClickText));
addEvent5("dblclick", createHandler("onDoubleClick"));

export const pointersDownCount = () => Object.keys(pointersDown).length;
export const firstPointerDownId = () => firstPointerDown;
export const ignoreClick = (x: number, y: number) => {
    var delay = ieVersion() ? Consts.MaxBustDelayForIE : Consts.MaxBustDelay;
    toBust.push([x, y, now() + delay, 1]);
};

// Bobril.Focus

let currentActiveElement: Element = null;
let currentFocusedNode: IBobrilNode = null;
let nodestack: IBobrilCacheNode[] = [];

function emitOnFocusChange(): void {
    var newActiveElement = document.hasFocus() ? document.activeElement : null;
    if (newActiveElement !== currentActiveElement) {
        currentActiveElement = newActiveElement;
        var newstack = vdomPath(currentActiveElement);
        var common = 0;
        while (common < nodestack.length && common < newstack.length && nodestack[common] === newstack[common])
            common++;
        var i = nodestack.length - 1;
        var n: IBobrilCacheNode;
        var c: IBobrilComponent;
        if (i >= common) {
            n = nodestack[i];
            if (n) {
                c = n.component;
                if (c && c.onBlur)
                    c.onBlur(n.ctx);
            }
            i--;
        }
        while (i >= common) {
            n = nodestack[i];
            if (n) {
                c = n.component;
                if (c && c.onFocusOut)
                    c.onFocusOut(n.ctx);
            }
            i--;
        }
        i = common;
        while (i + 1 < newstack.length) {
            n = newstack[i];
            if (n) {
                c = n.component;
                if (c && c.onFocusIn)
                    c.onFocusIn(n.ctx);
            }
            i++;
        }
        if (i < newstack.length) {
            n = newstack[i];
            if (n) {
                c = n.component;
                if (c && c.onFocus)
                    c.onFocus(n.ctx);
            }
            i++;
        }
        nodestack = newstack;
        currentFocusedNode = nodestack.length == 0 ? null : nodestack[nodestack.length - 1];
    }
}

function emitOnFocusChangeIE(): void {
    setTimeout(emitOnFocusChange, 10);
    emitOnFocusChange();
}

var events = ["focus", "blur", "keydown", "keyup", "keypress", "mousedown", "mouseup", "mousemove", "touchstart", "touchend"];
for (var i = 0; i < events.length; i++)
    addEvent(events[i], 50, <any>(ieVersion() ? emitOnFocusChangeIE : emitOnFocusChange));

export function focused(): IBobrilCacheNode {
    return currentFocusedNode;
}

const focusableTag = /^input$|^select$|^textarea$|^button$/;
export function focus(node: IBobrilCacheNode): boolean {
    if (node == null) return false;
    if (typeof node === "string") return false;
    var style = node.style;
    if (style != null) {
        if (style.visibility === "hidden")
            return false;
        if (style.display === "none")
            return false;
    }
    var attrs = node.attrs;
    if (attrs != null) {
        var ti = attrs.tabindex || (<any>attrs).tabIndex; // < tabIndex is here because of backward compatibility
        if (ti !== undefined || focusableTag.test(node.tag)) {
            if (+ti === -1)
                return false;
            var el = node.element;
            (<HTMLElement>el).focus();
            emitOnFocusChange();
            return true;
        }
    }
    var children = node.children;
    if (isArray(children)) {
        for (var i = 0; i < (<IBobrilChild[]>children).length; i++) {
            if (focus((<IBobrilChild[]>children)[i]))
                return true;
        }
        return false;
    }
    return focus(children);
}

// Bobril.Scroll
let callbacks: Array<() => void> = [];

function emitOnScroll() {
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i]();
    }
    return false;
}

// capturing event to hear everything
addEvent("^scroll", 10, emitOnScroll);

export function addOnScroll(callback: () => void): void {
    callbacks.push(callback);
}

export function removeOnScroll(callback: () => void): void {
    for (var i = 0; i < callbacks.length; i++) {
        if (callbacks[i] === callback) {
            callbacks.splice(i, 1);
            return;
        }
    }
}

const isHtml = /^(?:html)$/i;
const isScrollOrAuto = /^(?:auto)$|^(?:scroll)$/i;
// inspired by https://github.com/litera/jquery-scrollintoview/blob/master/jquery.scrollintoview.js
export function isScrollable(el: Element): [boolean, boolean] {
    var styles: any = window.getComputedStyle(el);
    var res: [boolean, boolean] = [true, true];
    if (!isHtml.test(el.nodeName)) {
        res[0] = isScrollOrAuto.test(styles.overflowX);
        res[1] = isScrollOrAuto.test(styles.overflowY);
    }
    res[0] = res[0] && el.scrollWidth > el.clientWidth;
    res[1] = res[1] && el.scrollHeight > el.clientHeight;
    return res;
}

// returns standart X,Y order
export function getWindowScroll(): [number, number] {
    var left = window.pageXOffset;
    var top = window.pageYOffset;
    return [left, top];
}

// Bobril.Dnd

export const enum DndOp {
    None = 0,
    Link = 1,
    Copy = 2,
    Move = 3
}

export const enum DndEnabledOps {
    None = 0,
    Link = 1,
    Copy = 2,
    LinkCopy = 3,
    Move = 4,
    MoveLink = 5,
    MoveCopy = 6,
    MoveCopyLink = 7
}

export interface IDndCtx {
    id: number;
    listData(): string[];
    hasData(type: string): boolean;
    getData(type: string): any;
    enabledOperations: DndEnabledOps;
    operation: DndOp;
    local: boolean;
    ended: boolean;
    // drag started at this pointer position
    startX: number;
    startY: number;
    // actual mouse/touch pointer position
    x: number;
    y: number;
    // delta of left top position of dragged object when drag started, usually negative
    deltaX: number;
    deltaY: number;
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
}

export interface IDndStartCtx {
    id: number;
    addData(type: string, data: any): boolean;
    setEnabledOps(ops: DndEnabledOps): void;
    setDragNodeView(view: (dnd: IDndCtx) => IBobrilNode): void;
}

export interface IDndOverCtx extends IDndCtx {
    setOperation(operation: DndOp): void;
}

let lastDndId = 0;
let dnds: IDndCtx[] = [];
let systemdnd: IDndCtx = null;
let rootId: string = null;

var DndCtx = function(pointerId: number) {
    this.id = ++lastDndId;
    this.pointerid = pointerId;
    this.enabledOperations = DndEnabledOps.MoveCopyLink;
    this.operation = DndOp.None;
    this.local = true;
    this.ended = false;
    this.targetCtx = null;
    this.dragView = null;
    this.startX = 0;
    this.startY = 0;
    this.x = 0;
    this.y = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.shift = false;
    this.ctrl = false;
    this.alt = false;
    this.meta = false;
    this.data = newHashObj();
    if (pointerId >= 0)
        pointer2Dnd[pointerId] = this;
    dnds.push(this);
    if (rootId == null) {
        rootId = addRoot(dndRootFactory);
    }
};

var DndComp: IBobrilComponent = {
    render(ctx: IBobrilCtx, me: IBobrilNode) {
        var dnd: IDndCtx = ctx.data;
        me.tag = "div";
        me.style = { position: "absolute", left: dnd.x, top: dnd.y };
        me.children = (<any>dnd).dragView(dnd);
    }
};

var DndRootComp: IBobrilComponent = {
    render(ctx: IBobrilCtx, me: IBobrilNode) {
        var res: IBobrilNode[] = [];
        for (var i = 0; i < dnds.length; i++) {
            var dnd = dnds[i];
            if ((<any>dnd).dragView != null && (dnd.x != 0 || dnd.y != 0)) {
                res.push({ key: "" + dnd.id, data: dnd, component: DndComp });
            }
        }
        me.tag = "div";
        me.style = { position: "fixed", userSelect: "none", pointerEvents: "none", left: 0, top: 0, right: 0, bottom: 0 };
        me.children = res;
    },
    onDrag(ctx: IBobrilCtx): boolean {
        invalidate(ctx);
        return false;
    }
};

function dndRootFactory(): IBobrilChildren {
    return { component: DndRootComp };
}

var dndProto = DndCtx.prototype;
dndProto.setOperation = function(operation: DndOp): void {
    this.operation = operation;
}

dndProto.setDragNodeView = function(view: (dnd: IDndCtx) => IBobrilNode): void {
    this.dragView = view;
}

dndProto.addData = function(type: string, data: any): boolean {
    this.data[type] = data;
    return true;
}

dndProto.listData = function(): string[] {
    return Object.keys(this.data);
}

dndProto.hasData = function(type: string): boolean {
    return this.data[type] !== undefined;
}

dndProto.getData = function(type: string): any {
    return this.data[type];
}

dndProto.setEnabledOps = function(ops: DndEnabledOps): void {
    this.enabledOperations = ops;
}

dndProto.cancelDnd = function(): void {
    dndmoved(null, this);
    this.ended = true;
    broadcast("onDragEnd", this);
    this.destroy();
}

dndProto.destroy = function(): void {
    delete pointer2Dnd[this.pointerid];
    for (var i = 0; i < dnds.length; i++) {
        if (dnds[i] === this) {
            dnds.splice(i, 1);
            break;
        }
    }
    if (systemdnd === this) {
        systemdnd = null;
    }
    if (dnds.length === 0) {
        removeRoot(rootId);
        rootId = null;
    }
}

var pointer2Dnd = newHashObj();

function handlePointerDown(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.cancelDnd();
    }
    if (ev.button === 1) {
        pointer2Dnd[ev.id] = { lastX: ev.x, lastY: ev.y, totalX: 0, totalY: 0, startX: ev.x, startY: ev.y, sourceNode: node };
    }
    return false;
}

function dndmoved(node: IBobrilCacheNode, dnd: IDndCtx) {
    (<any>dnd).targetCtx = bubble(node, "onDragOver", dnd);
    if ((<any>dnd).targetCtx == null) {
        dnd.operation = DndOp.None;
    }
    broadcast("onDrag", dnd);
}

function updateDndFromPointerEvent(dnd: IDndCtx, ev: IBobrilPointerEvent) {
    dnd.shift = ev.shift;
    dnd.ctrl = ev.ctrl;
    dnd.alt = ev.alt;
    dnd.meta = ev.meta;
}

function handlePointerMove(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.x = ev.x;
        dnd.y = ev.y;
        updateDndFromPointerEvent(dnd, ev);
        dndmoved(node, dnd);
        return true;
    } else if (dnd && dnd.totalX != null) {
        dnd.totalX += Math.abs(ev.x - dnd.lastX);
        dnd.totalY += Math.abs(ev.y - dnd.lastY);
        dnd.lastX = ev.x;
        dnd.lastY = ev.y;
        if (dnd.totalX + dnd.totalY > 10) {
            node = dnd.sourceNode;
            var startX = dnd.startX;
            var startY = dnd.startY;
            dnd = new (<any>DndCtx)(ev.id);
            dnd.startX = startX;
            dnd.startY = startY;
            dnd.x = ev.x;
            dnd.y = ev.y;
            updateDndFromPointerEvent(dnd, ev);
            var sourceCtx = bubble(node, "onDragStart", dnd);
            if (sourceCtx) {
                var htmlNode = getDomNode(sourceCtx.me);
                if (htmlNode == null) {
                    dnd.destroy();
                    return false;
                }
                var boundFn = (<Element>htmlNode).getBoundingClientRect;
                if (boundFn) {
                    var rect = boundFn.call(htmlNode);
                    dnd.deltaX = rect.left - startX;
                    dnd.deltaY = rect.top - startY;
                }
                dndmoved(node, dnd);
                return true;
            } else {
                dnd.destroy();
            }
        }
    }
    return false;
}

function handlePointerUp(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.x = ev.x;
        dnd.y = ev.y;
        updateDndFromPointerEvent(dnd, ev);
        dndmoved(node, dnd);
        var t: IBobrilCtx = dnd.targetCtx;
        if (t && bubble(t.me, "onDrop", dnd)) {
            dnd.ended = true;
            broadcast("onDragEnd", dnd);
            dnd.destroy();
        } else {
            dnd.cancelDnd();
        }
        return true;
    } else if (dnd) {
        delete pointer2Dnd[ev.id];
    }
    return false;
}

function handlePointerCancel(ev: IBobrilPointerEvent, target: Node, node: IBobrilCacheNode): boolean {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.cancelDnd();
    } else {
        delete pointer2Dnd[ev.id];
    }
    return false;
}

function updateFromNative(dnd: IDndCtx, ev: DragEvent) {
    dnd.shift = ev.shiftKey;
    dnd.ctrl = ev.ctrlKey;
    dnd.alt = ev.altKey;
    dnd.meta = ev.metaKey;
    dnd.x = ev.clientX;
    dnd.y = ev.clientY;
    var node = nodeOnPoint(dnd.x, dnd.y); // Needed to correctly emulate pointerEvents:none
    dndmoved(node, dnd);
}

const effectAllowedTable = ["none", "link", "copy", "copyLink", "move", "linkMove", "copyMove", "all"];

function handleDragStart(ev: DragEvent, target: Node, node: IBobrilCacheNode): boolean {
    var dnd: IDndCtx = systemdnd;
    if (dnd != null) {
        (<any>dnd).destroy();
    }
    var activePointerIds = Object.keys(pointer2Dnd);
    var startX = ev.clientX, startY = ev.clientY, poid = -1;
    for (var i = 0; i < activePointerIds.length; i++) {
        dnd = pointer2Dnd[activePointerIds[i]];
        if ((<any>dnd).totalX != null) {
            poid = +activePointerIds[i];
            startX = dnd.startX;
            startY = dnd.startY;
            delete pointer2Dnd[poid];
            break;
        }
    }
    dnd = new (<any>DndCtx)(poid);
    systemdnd = dnd;
    dnd.x = ev.clientX;
    dnd.y = ev.clientY;
    dnd.startX = startX;
    dnd.startY = startY;
    var sourceCtx = bubble(node, "onDragStart", dnd);
    if (sourceCtx) {
        var htmlNode = getDomNode(sourceCtx.me);
        if (htmlNode == null) {
            (<any>dnd).destroy();
            return false;
        }
        var boundFn = (<Element>htmlNode).getBoundingClientRect;
        if (boundFn) {
            var rect = boundFn.call(htmlNode);
            dnd.deltaX = rect.left - startX;
            dnd.deltaY = rect.top - startY;
        }
        var eff = effectAllowedTable[dnd.enabledOperations];
        var dt = ev.dataTransfer;
        dt.effectAllowed = eff;
        if ((<any>dt).setDragImage) {
            var div = document.createElement("div");
            div.style.pointerEvents = "none";
            (<any>dt).setDragImage(div, 0, 0);
        } else {
            // For IE10 and IE11 hack to hide default drag element
            var style = (<HTMLElement>htmlNode).style;
            var opacityBackup = style.opacity;
            var widthBackup = style.width;
            var heightBackup = style.height;
            var paddingBackup = style.padding;
            style.opacity = "0";
            style.width = "0";
            style.height = "0";
            style.padding = "0";
            window.setTimeout(() => {
                style.opacity = opacityBackup;
                style.width = widthBackup;
                style.height = heightBackup;
                style.padding = paddingBackup;
            }, 0);
        }
        var datas = (<any>dnd).data;
        var dataKeys = Object.keys(datas);
        for (var i = 0; i < dataKeys.length; i++) {
            try {
                var k = dataKeys[i];
                var d = datas[k];
                if (typeof d !== "string")
                    d = JSON.stringify(d);
                ev.dataTransfer.setData(k, d);
            }
            catch (e) {
                if (DEBUG)
                    if (window.console) console.log("Cannot set dnd data to " + dataKeys[i]);
            }
        }
        updateFromNative(dnd, ev);
    } else {
        (<any>dnd).destroy();
    }
    return false;
}

function setDropEffect(ev: DragEvent, op: DndOp) {
    ev.dataTransfer.dropEffect = ["none", "link", "copy", "move"][op];
}

function handleDragOver(ev: DragEvent, target: Node, node: IBobrilCacheNode): boolean {
    var dnd = systemdnd;
    if (dnd == null) {
        dnd = new (<any>DndCtx)(-1);
        systemdnd = dnd;
        dnd.x = ev.clientX;
        dnd.y = ev.clientY;
        dnd.startX = dnd.x;
        dnd.startY = dnd.y;
        dnd.local = false;
        var dt = ev.dataTransfer;
        var eff = 0;
        try {
            var effectAllowed = dt.effectAllowed;
        }
        catch (e) { }
        for (; eff < 7; eff++) {
            if (effectAllowedTable[eff] === effectAllowed) break;
        }
        dnd.enabledOperations = eff;
        var dttypes = dt.types;
        if (dttypes) {
            for (var i = 0; i < dttypes.length; i++) {
                var tt = dttypes[i];
                if (tt === "text/plain") tt = "Text";
                else if (tt === "text/uri-list") tt = "Url";
                (<any>dnd).data[tt] = null;
            }
        } else {
            if (dt.getData("Text") !== undefined) (<any>dnd).data["Text"] = null;
        }
    }
    updateFromNative(dnd, ev);
    setDropEffect(ev, dnd.operation);
    if (dnd.operation != DndOp.None) {
        preventDefault(ev);
        return true;
    }
    return false;
}

function handleDrag(ev: DragEvent, target: Node, node: IBobrilCacheNode): boolean {
    var x = ev.clientX;
    var y = ev.clientY;
    var m = getMedia();
    if (systemdnd != null && (x === 0 && y === 0 || x < 0 || y < 0 || x >= m.width || y >= m.height)) {
        systemdnd.x = 0;
        systemdnd.y = 0;
        systemdnd.operation = DndOp.None;
        broadcast("onDrag", systemdnd);
    }
    return false;
}

function handleDragEnd(ev: DragEvent, target: Node, node: IBobrilCacheNode): boolean {
    if (systemdnd != null) {
        systemdnd.ended = true;
        broadcast("onDragEnd", systemdnd);
        (<any>systemdnd).cancelDnd();
    }
    return false;
}

function handleDrop(ev: DragEvent, target: Node, node: IBobrilCacheNode): boolean {
    var dnd = systemdnd;
    if (dnd == null)
        return false;
    dnd.x = ev.clientX;
    dnd.y = ev.clientY;
    if (!dnd.local) {
        var dataKeys = Object.keys((<any>dnd).data);
        var dt = ev.dataTransfer;
        for (let i = 0; i < dataKeys.length; i++) {
            var k = dataKeys[i];
            var d: any;
            if (k === "Files") {
                d = [].slice.call(dt.files, 0); // What a useless FileList type! Get rid of it.
            } else {
                d = dt.getData(k);
                if (typeof d !== "string") {
                    d = JSON.parse(d);
                }
            }
            (<any>dnd).data[k] = d;
        }
    }
    updateFromNative(dnd, ev);
    var t: IBobrilCtx = (<any>dnd).targetCtx;
    if (t && bubble(t.me, "onDrop", dnd)) {
        setDropEffect(ev, dnd.operation);
        dnd.ended = true;
        broadcast("onDragEnd", dnd);
        (<any>dnd).destroy();
        preventDefault(ev);
    } else {
        (<any>dnd).cancelDnd();
    }
    return true;
}

function justPreventDefault(ev: any, target: Node, node: IBobrilCacheNode): boolean {
    preventDefault(ev);
    return true;
}

addEvent("!PointerDown", 4, handlePointerDown);
addEvent("!PointerMove", 4, handlePointerMove);
addEvent("!PointerUp", 4, handlePointerUp);
addEvent("!PointerCancel", 4, handlePointerCancel);

addEvent("dragstart", 5, handleDragStart);
addEvent("dragover", 5, handleDragOver);
addEvent("dragend", 5, handleDragEnd);
addEvent("drag", 5, handleDrag);
addEvent("drop", 5, handleDrop);
addEvent("dragenter", 5, justPreventDefault);
addEvent("dragleave", 5, justPreventDefault);
export const getDnds = () => dnds;

// Bobril.Router

export interface Params {
    [name: string]: string
}

// Just marker interface
export interface IRoute {
    name?: string;
    url?: string;
    data?: Object;
    handler: IRouteHandler;
    keyBuilder?: (params: Params) => string;
    children?: Array<IRoute>;
    isDefault?: boolean;
    isNotFound?: boolean;
}

export const enum RouteTransitionType {
    Push,
    Replace,
    Pop
}

export interface IRouteTransition {
    inApp: boolean;
    type: RouteTransitionType;
    name: string;
    params: Params;
}

export type IRouteCanResult = boolean | Thenable<boolean> | IRouteTransition | Thenable<IRouteTransition>;

export type IRouteHandler = IBobrilComponent | ((data: any) => IBobrilNode);

export interface IRouteConfig {
    // name cannot contain ":" or "/"
    name?: string;
    url?: string;
    data?: Object;
    handler: IRouteHandler;
    keyBuilder?: (params: Params) => string;
}

// Heavily inspired by https://github.com/rackt/react-router/ Thanks to authors

interface OutFindMatch {
    p: Params
}

function emitOnHashChange() {
    invalidate();
    return false;
}

addEvent("hashchange", 10, emitOnHashChange);

let myAppHistoryDeepness = 0;

function push(path: string, inapp: boolean): void {
    var l = window.location;
    if (inapp) {
        l.hash = path.substring(1);
        myAppHistoryDeepness++;
    } else {
        l.href = path;
    }
}

function replace(path: string, inapp: boolean) {
    var l = window.location;
    if (inapp) {
        l.replace(l.pathname + l.search + path);
    } else {
        l.replace(path);
    }
}

function pop() {
    myAppHistoryDeepness--;
    window.history.back();
}

let rootRoutes: IRoute[];
let nameRouteMap: { [name: string]: IRoute } = {};

function encodeUrl(url: string): string {
    return encodeURIComponent(url).replace(/%20/g, "+");
}

function decodeUrl(url: string): string {
    return decodeURIComponent(url.replace(/\+/g, " "));
}

function encodeUrlPath(path: string): string {
    return String(path).split("/").map(encodeUrl).join("/");
}

const paramCompileMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|[*.()\[\]\\+|{}^$]/g;
const paramInjectMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$?]*[?]?)|[*]/g;

let compiledPatterns: { [pattern: string]: { matcher: RegExp; paramNames: string[] } } = {};

function compilePattern(pattern: string) {
    if (!(pattern in <any>compiledPatterns)) {
        var paramNames: Array<string> = [];
        var source = pattern.replace(paramCompileMatcher, (match: string, paramName: string) => {
            if (paramName) {
                paramNames.push(paramName);
                return "([^/?#]+)";
            } else if (match === "*") {
                paramNames.push("splat");
                return "(.*?)";
            } else {
                return "\\" + match;
            }
        });

        compiledPatterns[pattern] = {
            matcher: new RegExp("^" + source + "$", "i"),
            paramNames: paramNames
        };
    }

    return compiledPatterns[pattern];
}

function extractParamNames(pattern: string): string[] {
    return compilePattern(pattern).paramNames;
}

// Extracts the portions of the given URL path that match the given pattern.
// Returns null if the pattern does not match the given path.
function extractParams(pattern: string, path: string): Params {
    var object = compilePattern(pattern);
    var match = decodeUrl(path).match(object.matcher);

    if (!match)
        return null;

    var params: { [name: string]: string } = {};

    var pn = object.paramNames;
    var l = pn.length;
    for (var i = 0; i < l; i++) {
        params[pn[i]] = match[i + 1];
    }

    return params;
}

// Returns a version of the given route path with params interpolated.
// Throws if there is a dynamic segment of the route path for which there is no param.
function injectParams(pattern: string, params?: Params) {
    params = params || {};

    var splatIndex = 0;

    return pattern.replace(paramInjectMatcher, (match: string, paramName: string) => {
        paramName = paramName || "splat";

        // If param is optional don't check for existence
        if (paramName.slice(-1) !== "?") {
            if (params[paramName] == null)
                throw new Error("Missing \"" + paramName + "\" parameter for path \"" + pattern + "\"");
        } else {
            paramName = paramName.slice(0, -1);
            if (params[paramName] == null) {
                return "";
            }
        }

        var segment: string;
        if (paramName === "splat" && Array.isArray(params[paramName])) {
            segment = params[paramName][splatIndex++];

            if (segment == null)
                throw new Error("Missing splat # " + splatIndex + " for path \"" + pattern + "\"");
        } else {
            segment = params[paramName];
        }

        return encodeUrlPath(segment);
    });
}

function findMatch(path: string, rs: Array<IRoute>, outParams: OutFindMatch): IRoute[] {
    var l = rs.length;
    var notFoundRoute: IRoute;
    var defaultRoute: IRoute;
    var params: Params;
    for (var i = 0; i < l; i++) {
        var r = rs[i];
        if (r.isNotFound) {
            notFoundRoute = r; continue;
        }
        if (r.isDefault) {
            defaultRoute = r; continue;
        }
        if (r.children) {
            var res = findMatch(path, r.children, outParams);
            if (res) {
                res.push(r);
                return res;
            }
        }
        if (r.url) {
            params = extractParams(r.url, path);
            if (params) {
                outParams.p = params;
                return [r];
            }
        }
    }
    if (defaultRoute) {
        params = extractParams(defaultRoute.url, path);
        if (params) {
            outParams.p = params;
            return [defaultRoute];
        }
    }
    if (notFoundRoute) {
        params = extractParams(notFoundRoute.url, path);
        if (params) {
            outParams.p = params;
            return [notFoundRoute];
        }
    }
    return null;
};

let activeRoutes: IRoute[] = [];
let futureRoutes: IRoute[];
let activeParams: Params = newHashObj();
let nodesArray: IBobrilCacheNode[] = [];
let setterOfNodesArray: ((node: IBobrilCacheNode) => void)[] = [];
const urlRegex = /\:|\//g;

function isInApp(name: string): boolean {
    return !urlRegex.test(name);
}

function isAbsolute(url: string): boolean {
    return url[0] === "/";
}

function noop(): IBobrilNode {
    return null;
}

function getSetterOfNodesArray(idx: number): (node: IBobrilCacheNode) => void {
    while (idx >= setterOfNodesArray.length) {
        setterOfNodesArray.push(((a: IBobrilCacheNode[], i: number) =>
            ((n: IBobrilCacheNode) => {
                if (n)
                    a[i] = n
            }))(nodesArray, idx));
    }
    return setterOfNodesArray[idx];
}

var firstRouting = true;
function rootNodeFactory(): IBobrilNode {
    var path = window.location.hash.substr(1);
    if (!isAbsolute(path)) path = "/" + path;
    var out: OutFindMatch = { p: {} };
    var matches = findMatch(path, rootRoutes, out) || [];
    if (firstRouting) {
        firstRouting = false;
        currentTransition = { inApp: true, type: RouteTransitionType.Pop, name: null, params: null };
        transitionState = -1;
    }
    if (currentTransition && currentTransition.type === RouteTransitionType.Pop && transitionState < 0) {
        currentTransition.inApp = true;
        if (currentTransition.name == null && matches.length > 0) {
            currentTransition.name = matches[0].name;
            currentTransition.params = out.p;
            nextIteration();
        }
        return null;
    }
    if (currentTransition == null) {
        activeRoutes = matches;
        while (nodesArray.length > activeRoutes.length) nodesArray.pop();
        while (nodesArray.length < activeRoutes.length) nodesArray.push(null);
        activeParams = out.p;
    }
    var fn: (otherdata?: any) => IBobrilNode = noop;
    for (var i = 0; i < activeRoutes.length; i++) {
        ((fninner: Function, r: IRoute, routeParams: Params, i: number) => {
            fn = (otherdata?: any) => {
                var data: any = r.data || {};
                assign(data, otherdata);
                data.activeRouteHandler = fninner;
                data.routeParams = routeParams;
                var handler = r.handler;
                var res: IBobrilNode;
                if (typeof handler === "function") {
                    res = (<(data: any) => IBobrilNode>handler)(data);
                } else {
                    res = { key: undefined, ref: undefined, data, component: handler };
                }
                if (r.keyBuilder) res.key = r.keyBuilder(routeParams);
                res.ref = getSetterOfNodesArray(i);
                return res;
            }
        })(fn, activeRoutes[i], activeParams, i);
    }
    return fn();
}

function joinPath(p1: string, p2: string): string {
    if (isAbsolute(p2))
        return p2;
    if (p1[p1.length - 1] === "/")
        return p1 + p2;
    return p1 + "/" + p2;
}

function registerRoutes(url: string, rs: Array<IRoute>): void {
    var l = rs.length;
    for (var i = 0; i < l; i++) {
        var r = rs[i];
        var u = url;
        var name = r.name;
        if (!name && url === "/") {
            name = "root";
            r.name = name;
            nameRouteMap[name] = r;
        }
        else if (name) {
            nameRouteMap[name] = r;
            u = joinPath(u, name);
        }
        if (r.isDefault) {
            u = url;
        } else if (r.isNotFound) {
            u = joinPath(url, "*");
        } else if (r.url) {
            u = joinPath(url, r.url);
        }
        r.url = u;
        if (r.children)
            registerRoutes(u, r.children);
    }
}

export function routes(rootroutes: IRoute|IRoute[]): void {
    if (!isArray(rootroutes)) {
        rootroutes = <IRoute[]>[rootroutes];
    }
    registerRoutes("/", <IRoute[]>rootroutes);
    rootRoutes = <IRoute[]>rootroutes;
    init(rootNodeFactory);
}

export function route(config: IRouteConfig, nestedRoutes?: Array<IRoute>): IRoute {
    return { name: config.name, url: config.url, data: config.data, handler: config.handler, keyBuilder: config.keyBuilder, children: nestedRoutes };
}

export function routeDefault(config: IRouteConfig): IRoute {
    return { name: config.name, data: config.data, handler: config.handler, keyBuilder: config.keyBuilder, isDefault: true };
}

export function routeNotFound(config: IRouteConfig): IRoute {
    return { name: config.name, data: config.data, handler: config.handler, keyBuilder: config.keyBuilder, isNotFound: true };
}

export function isActive(name: string, params?: Params): boolean {
    if (params) {
        for (var prop in params) {
            if (params.hasOwnProperty(prop)) {
                if (activeParams[prop] !== params[prop]) return false;
            }
        }
    }
    for (var i = 0, l = activeRoutes.length; i < l; i++) {
        if (activeRoutes[i].name === name) {
            return true;
        }
    }
    return false;
}

export function urlOfRoute(name: string, params?: Params): string {
    if (isInApp(name)) {
        var r = nameRouteMap[name];
        return "#" + injectParams(r.url, params);
    }
    return name;
}

export function link(node: IBobrilNode, name: string, params?: Params): IBobrilNode {
    node.data = node.data || {};
    node.data.active = isActive(name, params);
    node.data.url = urlOfRoute(name, params);
    node.data.transition = createRedirectPush(name, params);
    postEnhance(node, {
        render(ctx: IBobrilCtx, me: IBobrilNode) {
            me.attrs = me.attrs || {};
            if (me.tag === "a") {
                me.attrs.href = ctx.data.url;
            }
            me.className = me.className || "";
            if (ctx.data.active) {
                me.className += " active";
            }
        },
        onClick(ctx: IBobrilCtx) {
            runTransition(ctx.data.transition);
            return true;
        }
    });
    return node;
}

export function createRedirectPush(name: string, params?: Params): IRouteTransition {
    return {
        inApp: isInApp(name),
        type: RouteTransitionType.Push,
        name: name,
        params: params || {}
    }
}

export function createRedirectReplace(name: string, params?: Params): IRouteTransition {
    return {
        inApp: isInApp(name),
        type: RouteTransitionType.Replace,
        name: name,
        params: params || {}
    }
}

export function createBackTransition(): IRouteTransition {
    return {
        inApp: myAppHistoryDeepness > 0,
        type: RouteTransitionType.Pop,
        name: null,
        params: {}
    }
}

var currentTransition: IRouteTransition = null;
var nextTransition: IRouteTransition = null;
var transitionState: number = 0;

function doAction(transition: IRouteTransition) {
    switch (transition.type) {
        case RouteTransitionType.Push:
            push(urlOfRoute(transition.name, transition.params), transition.inApp);
            break;
        case RouteTransitionType.Replace:
            replace(urlOfRoute(transition.name, transition.params), transition.inApp);
            break;
        case RouteTransitionType.Pop:
            pop();
            break;
    }
    invalidate();
}

function nextIteration(): void {
    while (true) {
        if (transitionState >= 0 && transitionState < activeRoutes.length) {
            let node = nodesArray[transitionState];
            transitionState++;
            if (!node) continue;
            let comp = node.component;
            if (!comp) continue;
            let fn = comp.canDeactivate;
            if (!fn) continue;
            let res = fn.call(comp, node.ctx, currentTransition);
            (<any>Promise).resolve(res).then((resp) => {
                if (resp === true) { }
                else if (resp === false) {
                    currentTransition = null; nextTransition = null;
                    return;
                } else {
                    nextTransition = resp;
                }
                nextIteration();
            }).catch(console.log.bind(console));
            return;
        } else if (transitionState == activeRoutes.length) {
            if (nextTransition) {
                if (currentTransition && currentTransition.type == RouteTransitionType.Push) {
                    push(urlOfRoute(currentTransition.name, currentTransition.params), currentTransition.inApp);
                }
                currentTransition = nextTransition;
                nextTransition = null;
            }
            transitionState = -1;
            if (!currentTransition.inApp || currentTransition.type === RouteTransitionType.Pop) {
                doAction(currentTransition);
                return;
            }
        } else if (transitionState === -1) {
            var out: OutFindMatch = { p: {} };
            var matches = findMatch(urlOfRoute(currentTransition.name, currentTransition.params), rootRoutes, out) || [];
            futureRoutes = matches;
            transitionState = -2;
        } else if (transitionState === -2 - futureRoutes.length) {
            if (nextTransition) {
                transitionState = activeRoutes.length;
                continue;
            }
            if (currentTransition.type !== RouteTransitionType.Pop) {
                doAction(currentTransition);
            } else {
                invalidate();
            }
            currentTransition = null;
            return;
        } else {
            if (nextTransition) {
                transitionState = activeRoutes.length;
                continue;
            }
            let rr = futureRoutes[futureRoutes.length + 1 + transitionState];
            transitionState--;
            let handler = rr.handler;
            let comp: IBobrilComponent = null;
            if (typeof handler === "function") {
                let node = (<(data: any) => IBobrilNode>handler)({});
                if (!node) continue;
                comp = node.component;
            } else {
                comp = handler;
            }
            if (!comp) continue;
            let fn = comp.canActivate;
            if (!fn) continue;
            let res = fn.call(comp, currentTransition);
            (<any>Promise).resolve(res).then((resp) => {
                if (resp === true) { }
                else if (resp === false) {
                    currentTransition = null; nextTransition = null;
                    return;
                } else {
                    nextTransition = resp;
                }
                nextIteration();
            }).catch(console.log.bind(console));
            return;
        }
    }
}

export function runTransition(transition: IRouteTransition): void {
    if (currentTransition != null) {
        nextTransition = transition;
        return;
    }
    firstRouting = false;
    currentTransition = transition;
    transitionState = 0;
    nextIteration();
}

// Bobril.Style

// definition for Bobril defined class
export type IBobrilStyleDef = string;
// object case if for inline style declaration, undefined, null, true and false values are ignored
export type IBobrilStyle = Object | IBobrilStyleDef | boolean;
// place inline styles at end for optimal speed
export type IBobrilStyles = IBobrilStyle | IBobrilStyle[];

interface ISprite {
    styleid: IBobrilStyleDef;
    url: string;
    width: number;
    height: number;
    left: number;
    top: number;
}

interface IInternalStyle {
    name: string;
    parent?: IBobrilStyleDef|IBobrilStyleDef[];
    style: any;
    expStyle: any;
    inlStyle?: any;
    pseudo?: { [name: string]: string };
}

var allStyles: { [id: string]: IInternalStyle } = newHashObj();
var allSprites: { [key: string]: ISprite } = newHashObj();
var allNameHints: { [name: string]: boolean } = newHashObj();

var rebuildStyles = false;
var htmlStyle: HTMLStyleElement = null;
var globalCounter: number = 0;
const isIE9 = ieVersion() === 9;

var chainedBeforeFrame = setBeforeFrame(beforeFrame);

function buildCssSubRule(parent: string): string {
    let posColon = parent.indexOf(':');
    if (posColon === -1) return allStyles[parent].name;
    return allStyles[parent.substring(0, posColon)].name + parent.substring(posColon);
}

function buildCssRule(parent: string|string[], name: string): string {
    let result = "";
    if (parent) {
        if (isArray(parent)) {
            for (let i = 0; i < parent.length; i++) {
                if (i > 0) {
                    result += ",";
                }
                result += "." + buildCssSubRule(parent[i]) + "." + name;
            }
        } else {
            result = "." + buildCssSubRule(<string>parent) + "." + name;
        }
    } else {
        result = "." + name;
    }
    return result;
}

function flattenStyle(cur: any, curPseudo: any, style: any, stylePseudo: any): void {
    if (typeof style === "string") {
        let externalStyle = allStyles[style];
        if (externalStyle === undefined) {
            throw new Error("uknown style " + style);
        }
        flattenStyle(cur, curPseudo, externalStyle.style, externalStyle.pseudo);
    } else if (typeof style === "function") {
        style(cur, curPseudo);
    } else if (isArray(style)) {
        for (let i = 0; i < style.length; i++) {
            flattenStyle(cur, curPseudo, style[i], undefined);
        }
    } else if (typeof style === "object") {
        for (let key in style) {
            if (!Object.prototype.hasOwnProperty.call(style, key)) continue;
            let val = style[key];
            if (typeof val === "function") {
                val = val(cur, key);
            }
            cur[key] = val;
        }
    }
    if (stylePseudo != null && curPseudo != null) {
        for (let pseudoKey in stylePseudo) {
            let curPseudoVal = curPseudo[pseudoKey];
            if (curPseudoVal === undefined) {
                curPseudoVal = newHashObj();
                curPseudo[pseudoKey] = curPseudoVal;
            }
            flattenStyle(curPseudoVal, undefined, stylePseudo[pseudoKey], undefined);
        }
    }
}

function beforeFrame() {
    if (rebuildStyles) {
        var stylestr = "";
        for (var key in allStyles) {
            var ss = allStyles[key];
            let parent = ss.parent;
            let name = ss.name;
            let style = newHashObj();
            let flattenPseudo = newHashObj();
            flattenStyle(undefined, flattenPseudo, undefined, ss.pseudo);
            flattenStyle(style, flattenPseudo, ss.style, undefined);
            var extractedInlStyle: any = null;
            if (style["pointerEvents"]) {
                extractedInlStyle = newHashObj();
                extractedInlStyle["pointerEvents"] = style["pointerEvents"];
            }
            if (isIE9) {
                if (style["userSelect"]) {
                    if (extractedInlStyle == null)
                        extractedInlStyle = newHashObj();
                    extractedInlStyle["userSelect"] = style["userSelect"];
                    delete style["userSelect"];
                }
            }
            ss.inlStyle = extractedInlStyle;
            ss.expStyle = assign(newHashObj(), style); // clone it so it stays unshimed
            shimStyle(style);
            let cssStyle = inlineStyleToCssDeclaration(style);
            if (cssStyle.length > 0)
                stylestr += buildCssRule(parent, name) + " {" + cssStyle + "}\n";
            for (var key2 in flattenPseudo) {
                let sspi = flattenPseudo[key2];
                shimStyle(sspi);
                stylestr += buildCssRule(parent, name + ":" + key2) + " {" + inlineStyleToCssDeclaration(sspi) + "}\n";
            }
        }
        var styleElement = document.createElement("style");
        styleElement.type = 'text/css';
        if ((<any>styleElement).styleSheet) {
            (<any>styleElement).styleSheet.cssText = stylestr;
        } else {
            styleElement.appendChild(document.createTextNode(stylestr));
        }

        var head = document.head || document.getElementsByTagName('head')[0];
        if (htmlStyle != null) {
            head.replaceChild(styleElement, htmlStyle);
        }
        else {
            head.appendChild(styleElement);
        }
        htmlStyle = styleElement;
        rebuildStyles = false;
    }
    chainedBeforeFrame();
}

function apply(s: IBobrilStyles, className: string, inlineStyle: any): [string, any] {
    if (typeof s === "boolean") {
        // skip
    } else if (typeof s === "string") {
        var sd = allStyles[s];
        if (inlineStyle != null) {
            inlineStyle = assign(inlineStyle, sd.expStyle);
        } else {
            if (className == null) className = sd.name; else className = className + " " + sd.name;
            var inls = sd.inlStyle;
            if (inls) {
                if (inlineStyle == null) {
                    inlineStyle = inls;
                } else {
                    inlineStyle = assign(inlineStyle, inls);
                }
            }
        }
    } else if (Array.isArray(s)) {
        for (var i = 0; i < (<IBobrilStyle[]>s).length; i++) {
            [className, inlineStyle] = apply((<IBobrilStyle[]>s)[i], className, inlineStyle);
        }
    } else {
        if (inlineStyle == null) inlineStyle = s;
        else inlineStyle = assign(inlineStyle, s);
    }
    return [className, inlineStyle];
}

export function style(node: IBobrilNode, ...styles: IBobrilStyles[]): IBobrilNode {
    var className = node.className;
    var inlineStyle = node.style;
    for (var i = 0; i < styles.length; i++) {
        [className, inlineStyle] = apply(styles[i], className, inlineStyle);
    }
    node.className = className;
    node.style = inlineStyle;
    return node;
}

var uppercasePattern = /([A-Z])/g;
var msPattern = /^ms-/;

function hyphenateStyle(s: string): string {
    if (s === "cssFloat") return "float";
    return s.replace(uppercasePattern, '-$1').toLowerCase().replace(msPattern, '-ms-');
}

function inlineStyleToCssDeclaration(style: any): string {
    var res = "";
    for (var key in style) {
        var v = style[key];
        if (v === undefined) continue;
        res += hyphenateStyle(key) + ":" + (v === "" ? '""' : v) + ";";
    }
    res = res.slice(0, -1);
    return res;
}

export function styleDef(style: any, pseudo?: { [name: string]: any }, nameHint?: string): IBobrilStyleDef {
    return styleDefEx(null, style, pseudo, nameHint);
}

export function styleDefEx(parent: IBobrilStyleDef|IBobrilStyleDef[], style: any, pseudo?: { [name: string]: any }, nameHint?: string): IBobrilStyleDef {
    if (nameHint && nameHint !== "b-") {
        if (allNameHints[nameHint]) {
            var counter = 1;
            while (allNameHints[nameHint + counter]) counter++;
            nameHint = nameHint + counter;
        }
        allNameHints[nameHint] = true;
    } else {
        nameHint = "b-" + globalCounter++;
    }
    shimStyle(style);
    var processedPseudo: { [name: string]: string } = null;
    if (pseudo) {
        processedPseudo = newHashObj();
        for (var key in pseudo) {
            if (!Object.prototype.hasOwnProperty.call(pseudo, key)) continue;
            processedPseudo[key] = pseudo[key];
        }
    }
    allStyles[nameHint] = { name: nameHint, parent, style, expStyle: null, inlStyle: null, pseudo: processedPseudo };
    invalidateStyles();
    return nameHint;
}

export function invalidateStyles(): void {
    rebuildStyles = true;
    invalidate();
}

function updateSprite(spDef: ISprite): void {
    var stDef = allStyles[spDef.styleid];
    var style: any = { backgroundImage: `url(${spDef.url})`, width: spDef.width, height: spDef.height };
    if (spDef.left || spDef.top) {
        style.backgroundPosition = `${-spDef.left}px ${-spDef.top}px`;
    }
    stDef.style = style;
    invalidateStyles();
}

export function sprite(url: string, color?: string, width?: number, height?: number, left?: number, top?: number): IBobrilStyleDef {
    var key = url + ":" + (color || "") + ":" + (width || 0) + ":" + (height || 0) + ":" + (left || 0) + ":" + (top || 0);
    var spDef = allSprites[key];
    if (spDef) return spDef.styleid;
    var styleid = styleDef({ width: 0, height: 0 });
    spDef = { styleid: styleid, url: url, width: width, height: height, left: left || 0, top: top || 0 };
    if (width == null || height == null || color != null) {
        var image = new Image();
        image.addEventListener("load", () => {
            if (spDef.width == null) spDef.width = image.width;
            if (spDef.height == null) spDef.height = image.height;
            if (color != null) {
                var canvas = document.createElement("canvas");
                canvas.width = spDef.width;
                canvas.height = spDef.height;
                var ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
                ctx.drawImage(image, -spDef.left, -spDef.top);
                var imgdata = ctx.getImageData(0, 0, spDef.width, spDef.height);
                var imgd = imgdata.data;
                var cred = parseInt(color.substr(1, 2), 16);
                var cgreen = parseInt(color.substr(3, 2), 16);
                var cblue = parseInt(color.substr(5, 2), 16);
                for (var i = 0; i < imgd.length; i += 4) {
                    if (imgd[i] === 0x80 && imgd[i + 1] === 0x80 && imgd[i + 2] === 0x80) {
                        imgd[i] = cred; imgd[i + 1] = cgreen; imgd[i + 2] = cblue;
                    }
                }
                ctx.putImageData(imgdata, 0, 0);
                spDef.url = canvas.toDataURL();
                spDef.left = 0;
                spDef.top = 0;
            }
            updateSprite(spDef);
        });
        image.src = url;
    } else {
        updateSprite(spDef);
    }
    allSprites[key] = spDef;
    return styleid;
}

export function spriteb(width: number, height: number, left: number, top: number): IBobrilStyleDef {
    let url = "bundle.png";
    var key = url + "::" + width + ":" + height + ":" + left + ":" + top;
    var spDef = allSprites[key];
    if (spDef) return spDef.styleid;
    var styleid = styleDef({ width: 0, height: 0 });
    spDef = { styleid: styleid, url: url, width: width, height: height, left: left, top: top };
    updateSprite(spDef);
    allSprites[key] = spDef;
    return styleid;
}

// Bobril.svgExtensions

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): { x: number; y: number } {
    var angleInRadians = angleInDegrees * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.sin(angleInRadians)), y: centerY - (radius * Math.cos(angleInRadians))
    };
}

function svgDescribeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, startWithLine: boolean) {
    var absDeltaAngle = Math.abs(endAngle - startAngle);
    var close = false;
    if (absDeltaAngle > 360 - 0.01) {
        if (endAngle > startAngle) endAngle = startAngle - 359.9;
        else endAngle = startAngle + 359.9;
        if (radius === 0) return "";
        close = true;
    } else {
        if (radius === 0) {
            return [
                startWithLine ? "L" : "M", x, y
            ].join(" ");
        }
    }
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var arcSweep = (absDeltaAngle <= 180) ? "0" : "1";
    var largeArg = (endAngle > startAngle) ? "0" : "1";
    var d = [
        (startWithLine ? "L" : "M"), start.x, start.y, "A", radius, radius, 0, arcSweep, largeArg, end.x, end.y
    ].join(" ");
    if (close) d += "Z";
    return d;
}

export function svgPie(x: number, y: number, radiusBig: number, radiusSmall: number, startAngle: number, endAngle: number): string {
    var p = svgDescribeArc(x, y, radiusBig, startAngle, endAngle, false);
    var nextWithLine = true;
    if (p[p.length - 1] === "Z") nextWithLine = false;
    if (radiusSmall === 0) {
        if (!nextWithLine) return p;
    }
    return p + svgDescribeArc(x, y, radiusSmall, endAngle, startAngle, nextWithLine) + "Z";
}

export function svgCircle(x: number, y: number, radius: number): string {
    return svgDescribeArc(x, y, radius, 0, 360, false);
}

export function svgRect(x: number, y: number, width: number, height: number): string {
    return "M" + x + " " + y + "h" + width + "v" + height + "h" + (-width) + "Z";
}

// Bobril.l10n

export interface IL10NConfig {
    defaultLocale?: string;
    pathToIntlJs?: string;
    pathToIntlLocaleDataJsonp?: string;
    pathToIntlMessageFormatJs?: string;
    pathToIntlMessageFormatLocaleData?: string;
    pathToTranslation?: (locale: string) => string;
}

interface IIntlMessageFormat {
    format(params?: Object): string;
}

declare const IntlMessageFormat: any;

export function jsonp(url: string): Promise<any> {
    return new Promise((r, e) => {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.onload = () => {
            r(null);
        };
        script.onerror = (ev) => {
            e('Failed to load ' + url);
        };
        script.src = url;
        document.head.appendChild(script);
    });
}

let cfg: IL10NConfig = {};
let loadedLocales: { [name: string]: boolean } = Object.create(null);
let registeredTranslations: { [name: string]: string[] } = Object.create(null);
let initWasStarted = false;
let needIntlPolyfill = false;
let currentLocale = '';
let currentTranslations: string[] = [];
let currentCachedFormat: IIntlMessageFormat[] = [];
let stringCachedFormats: { [input: string]: IIntlMessageFormat } = Object.create(null);

function currentTranslationMessage(message: number): string {
    let text = currentTranslations[message];
    if (text === undefined) {
        throw new Error('message ' + message + ' is not defined');
    }
    return text;
}

export function t(message: string | number, params?: Object, translationHelp?: string): string {
    if (currentLocale.length === 0) {
        throw new Error('before using t you need to wait for initialization of l10n');
    }
    let format: IIntlMessageFormat;
    if (typeof message === 'number') {
        if (params == null) {
            return currentTranslationMessage(message);
        }
        format = currentCachedFormat[message];
        if (format === undefined) {
            format = new IntlMessageFormat(currentTranslationMessage(message), currentLocale);
            currentCachedFormat[message] = format;
        }
    } else {
        if (params == null) return message;
        format = stringCachedFormats[message];
        if (format === undefined) {
            format = new IntlMessageFormat(message, currentLocale);
            stringCachedFormats[message] = format;
        }
    }
    return format.format(params);
}

export function initLocalization(config?: IL10NConfig): Promise<any> {
    if (initWasStarted) {
        throw new Error('initLocalization must be called only once');
    }
    cfg = config;
    initWasStarted = true;
    var prom = Promise.resolve(null);
    if (!(<any>window).Intl) {
        needIntlPolyfill = true;
        if (config.pathToIntlJs) prom = Promise.all<any>([prom, jsonp(config.pathToIntlJs)]);
    }
    if (config.pathToIntlMessageFormatJs) {
        prom = Promise.all<any>([prom, jsonp(config.pathToIntlMessageFormatJs)]);
    }
    prom = prom.then(() => setLocale(config.defaultLocale || 'en'));
    setBeforeInit((cb) => {
        prom.then(cb);
    });
    return prom;
}

export function setLocale(locale: string): Promise<any> {
    let prom = Promise.resolve(null);
    if (currentLocale === locale)
        return prom;
    if (!loadedLocales[locale]) {
        loadedLocales[locale] = true;
        prom = Promise.all([
            needIntlPolyfill && cfg.pathToIntlLocaleDataJsonp && jsonp(cfg.pathToIntlLocaleDataJsonp + locale + ".js"),
            cfg.pathToIntlMessageFormatLocaleData && jsonp(cfg.pathToIntlMessageFormatLocaleData + locale.substring(0, 2) + ".js"),
            cfg.pathToTranslation && jsonp(cfg.pathToTranslation(locale))
        ]);
    }
    prom = prom.then(() => {
        currentLocale = locale;
        currentTranslations = registeredTranslations[locale];
        currentCachedFormat = [];
        currentCachedFormat.length = currentTranslations.length;
    });
    return prom;
}

export function getLocale(): string {
    return currentLocale;
}

export function registerTranslations(locale: string, msgs: string[]): void {
    registeredTranslations[locale] = msgs;
}

(<any>window)['bobrilRegisterTranslations'] = registerTranslations;

import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { graphviz } from 'd3-graphviz';
const defaultOptions = {
    fit: true,
    height: 500,
    width: 500,
    zoom: false,
};
let counter = 0;
const getId = () => `graphviz${counter++}`;
const Graphviz = ({ dot, className, options = {} }) => {
    const id = useMemo(getId, []);
    useEffect(() => {
        graphviz(`#${id}`, Object.assign(Object.assign({}, defaultOptions), options)).renderDot(dot);
    }, [dot, options]);
    return React.createElement("div", { className: className, id: id });
};
export { Graphviz };
export default Graphviz;
//# sourceMappingURL=Graphviz.js.map
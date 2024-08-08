/// <reference types="react" />
import { GraphvizOptions } from 'd3-graphviz';
interface IGraphvizProps {
    dot: string;
    options?: GraphvizOptions;
    className?: string;
}
declare const Graphviz: ({ dot, className, options }: IGraphvizProps) => JSX.Element;
export { Graphviz, IGraphvizProps };
export default Graphviz;

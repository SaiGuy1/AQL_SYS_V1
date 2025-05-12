
declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    w: number;
    h: number;
    x: number;
    y: number;
    i: string;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    moved?: boolean;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export interface ReactGridLayoutProps {
    className?: string;
    style?: React.CSSProperties;
    width?: number;
    autoSize?: boolean;
    cols?: number;
    draggableCancel?: string;
    draggableHandle?: string;
    compactType?: 'vertical' | 'horizontal' | null;
    layout?: Layout[];
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight?: number;
    maxRows?: number;
    isBounded?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
    preventCollision?: boolean;
    useCSSTransforms?: boolean;
    transformScale?: number;
    resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
    onLayoutChange?: (layout: Layout[]) => void;
    onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    children: React.ReactNode[];
  }

  export interface ResponsiveProps extends ReactGridLayoutProps {
    breakpoints?: {[breakpoint: string]: number};
    breakpoint?: string;
    cols?: {[breakpoint: string]: number};
    layouts?: {[breakpoint: string]: Layout[]};
    margin?: {[breakpoint: string]: [number, number]};
    containerPadding?: {[breakpoint: string]: [number, number]};
    onBreakpointChange?: (breakpoint: string, cols: number) => void;
    onLayoutChange?: (currentLayout: Layout[], allLayouts: {[breakpoint: string]: Layout[]}) => void;
    onWidthChange?: (width: number, margin: [number, number], cols: number, containerPadding: [number, number] | null) => void;
  }

  export default class ReactGridLayout extends React.Component<ReactGridLayoutProps> {}
  
  export class Responsive extends React.Component<ResponsiveProps> {}
  
  export function WidthProvider<P>(
    ComposedComponent: React.ComponentType<P>
  ): React.ComponentType<P>;
}

import * as React from 'react';
import { ReactElement, SVGProps } from 'react';
import { Props as SectorProps } from '../shape/Sector';
import { ActiveShape, AnimationDuration, AnimationTiming, ChartOffsetInternal, Coordinate, DataKey, LegendType, PresentationAttributesAdaptChildEvent, TooltipType } from '../util/types';
import { TooltipPayload } from '../state/tooltipSlice';
import { PieSettings } from '../state/types/PieSettings';
import { ImplicitLabelListType } from '../component/LabelList';
interface PieDef {
    /** The abscissa of pole in polar coordinate  */
    cx?: number | string;
    /** The ordinate of pole in polar coordinate  */
    cy?: number | string;
    /** The start angle of first sector */
    startAngle?: number;
    /** The end angle of last sector */
    endAngle?: number;
    paddingAngle?: number;
    /** The inner radius of sectors */
    innerRadius?: number | string;
    /** The outer radius of sectors */
    outerRadius?: number | string | ((dataPoint: any) => number | string);
    cornerRadius?: number | string;
}
type PieLabelLine = ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>) | SVGProps<SVGPathElement> | boolean;
export type PieLabel = ImplicitLabelListType;
export type PieSectorData = {
    cx: number;
    cy: number;
    dataKey?: string;
    endAngle: number;
    innerRadius: number;
    midAngle?: number;
    middleRadius?: number;
    name?: string | number;
    outerRadius: number;
    paddingAngle?: number;
    payload?: any;
    percent?: number;
    startAngle: number;
    tooltipPayload?: ReadonlyArray<TooltipPayload>;
    tooltipPosition: Coordinate;
    value: number;
};
export type PieSectorDataItem = SectorProps & PieSectorData;
interface PieProps extends PieDef {
    id?: string;
    className?: string;
    /**
     * Defaults to 'value' if not specified.
     */
    dataKey?: DataKey<any>;
    nameKey?: DataKey<any>;
    /** The minimum angle for no-zero element */
    minAngle?: number;
    legendType?: LegendType;
    tooltipType?: TooltipType;
    /** TODO: review this as an external prop - it seems to have no effect */
    /** the max radius of pie */
    maxRadius?: number;
    hide?: boolean;
    /** the input data */
    data?: any[];
    activeShape?: ActiveShape<PieSectorDataItem>;
    inactiveShape?: ActiveShape<PieSectorDataItem>;
    labelLine?: PieLabelLine;
    label?: ImplicitLabelListType;
    animationEasing?: AnimationTiming;
    isAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: AnimationDuration;
    onAnimationStart?: () => void;
    onAnimationEnd?: () => void;
    onMouseEnter?: (data: any, index: number, e: React.MouseEvent) => void;
    onMouseLeave?: (data: any, index: number, e: React.MouseEvent) => void;
    onClick?: (data: any, index: number, e: React.MouseEvent) => void;
    rootTabIndex?: number;
}
export interface PieLabelRenderProps extends PieDef {
    name: string;
    percent?: number;
    stroke: string;
    index?: number;
    textAnchor: string;
    x: number;
    y: number;
    [key: string]: any;
}
type PieSvgAttributes = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'ref'>;
export type Props = PieSvgAttributes & PieProps;
type RealPieData = any;
export type PieCoordinate = {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    maxRadius: number;
};
export declare function computePieSectors({ pieSettings, displayedData, cells, offset, }: {
    pieSettings: PieSettings;
    displayedData: ReadonlyArray<RealPieData>;
    cells: ReadonlyArray<ReactElement> | undefined;
    offset: ChartOffsetInternal;
}): ReadonlyArray<PieSectorDataItem> | undefined;
export declare function Pie(outsideProps: Props): React.JSX.Element;
export declare namespace Pie {
    var displayName: string;
}
export {};

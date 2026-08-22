/**
 * Living Vector Scene Graph & Design Document Contracts
 *
 * Models visual elements as reactive scene graph nodes that can be
 * created, inspected, modified, and serialized back to standards-compliant SVG.
 */

export type NodeType = 'text' | 'rect' | 'circle' | 'image' | 'path' | 'group';

export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number; // degrees
}

export interface TextNode extends BaseNode {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '500' | '600' | '700' | '800';
  fill: string;
  textAnchor: 'start' | 'middle' | 'end';
  letterSpacing?: number;
  lineHeight?: number;
  maxWidth?: number;
}

export interface RectNode extends BaseNode {
  type: 'rect';
  width: number;
  height: number;
  rx: number; // corner radius
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface CircleNode extends BaseNode {
  type: 'circle';
  r: number; // radius
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface ImageNode extends BaseNode {
  type: 'image';
  width: number;
  height: number;
  href: string; // URL or data URI
  assetId?: string; // Project Vault asset reference
  preserveAspectRatio?: string;
  rx?: number;
}

export interface PathNode extends BaseNode {
  type: 'path';
  d: string; // SVG path data
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface GroupNode extends BaseNode {
  type: 'group';
  children: SceneNode[];
}

export type SceneNode =
  | TextNode
  | RectNode
  | CircleNode
  | ImageNode
  | PathNode
  | GroupNode;

export interface BackgroundConfig {
  type: 'color' | 'gradient';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    startColor: string;
    endColor: string;
    angle?: number;
  };
}

export interface DesignDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  viewBox: string;
  background: BackgroundConfig;
  rootNodes: SceneNode[];
  rawDefs?: string; // Stored SVG <defs> like gradients and filters
}

export type ActiveTool = 'select' | 'pan' | 'text' | 'rect' | 'circle' | 'image';

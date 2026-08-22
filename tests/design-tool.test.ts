import { describe, it, expect } from 'vitest';
import {
  svgStringToSceneGraph,
  sceneGraphToSvgString,
  createEmptyDocument,
} from '@/lib/design-tool/parser';
import { DesignHistory } from '@/lib/design-tool/history';
import { useDesignStore } from '@/lib/design-tool/useDesignStore';
import { TextNode, RectNode } from '@/lib/design-tool/types';

describe('Design Tool Living Scene Graph & Parser', () => {
  it('creates an empty design document with default layers', () => {
    const doc = createEmptyDocument('doc_test', 'Test Design');
    expect(doc.id).toBe('doc_test');
    expect(doc.width).toBe(1200);
    expect(doc.height).toBe(630);
    expect(doc.rootNodes.length).toBeGreaterThanOrEqual(2);
  });

  it('serializes a Scene Graph DesignDocument to valid SVG markup', () => {
    const doc = createEmptyDocument('doc_test', 'Test Design');
    const svg = sceneGraphToSvgString(doc);

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 1200 630"');
    expect(svg).toContain('Visual Design Studio');
    expect(svg).toContain('</svg>');
  });

  it('manages Undo and Redo stacks with DesignHistory', () => {
    const history = new DesignHistory(10);
    const docA = createEmptyDocument('doc_a', 'Initial');
    const docB = { ...docA, name: 'Edited' };

    history.pushState(docA);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    const undone = history.undo(docB);
    expect(undone?.name).toBe('Initial');
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);

    const redone = history.redo(undone!);
    expect(redone?.name).toBe('Edited');
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('mutates scene graph nodes and preserves state in useDesignStore', () => {
    const store = useDesignStore.getState();
    store.loadEmptyDocument('doc_1', 'Store Test');

    const initialNodesCount = useDesignStore.getState().document.rootNodes.length;

    // Add Text Node
    const textNode: TextNode = {
      id: 'text_custom_1',
      type: 'text',
      name: 'Agentic Typography',
      visible: true,
      locked: false,
      opacity: 1,
      x: 150,
      y: 200,
      text: 'Agentic Typography',
      fontSize: 32,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      fill: '#38BDF8',
      textAnchor: 'start',
    };

    useDesignStore.getState().addNode(textNode);
    expect(useDesignStore.getState().document.rootNodes.length).toBe(initialNodesCount + 1);

    // Update node properties
    useDesignStore.getState().updateNode('text_custom_1', {
      fontSize: 48,
      fill: '#F43F5E',
    });

    const updatedNode = useDesignStore
      .getState()
      .document.rootNodes.find((n) => n.id === 'text_custom_1') as TextNode;

    expect(updatedNode.fontSize).toBe(48);
    expect(updatedNode.fill).toBe('#F43F5E');

    // Toggle Visibility
    useDesignStore.getState().toggleNodeVisibility('text_custom_1');
    const hiddenNode = useDesignStore
      .getState()
      .document.rootNodes.find((n) => n.id === 'text_custom_1') as TextNode;
    expect(hiddenNode.visible).toBe(false);

    // Delete Node
    useDesignStore.getState().deleteNode('text_custom_1');
    expect(
      useDesignStore.getState().document.rootNodes.some((n) => n.id === 'text_custom_1')
    ).toBe(false);
  });

  it('supports debounced continuous dragging without flooding history', () => {
    useDesignStore.getState().loadEmptyDocument('doc_drag', 'Drag Test');

    const rectNode: RectNode = {
      id: 'rect_drag_1',
      type: 'rect',
      name: 'Drag Rect',
      visible: true,
      locked: false,
      opacity: 1,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rx: 0,
      fill: '#FFFFFF',
    };

    useDesignStore.getState().addNode(rectNode);
    const initialDoc = JSON.parse(JSON.stringify(useDesignStore.getState().document));

    // Simulate 30 continuous drag frames (e.g. mousemove at 60fps) with pushHistory: false
    for (let i = 1; i <= 30; i++) {
      useDesignStore.getState().updateNode('rect_drag_1', { x: 50 + i * 2, y: 50 + i * 2 }, { pushHistory: false });
    }

    // Node is at final position (110, 110)
    const finalNode = useDesignStore
      .getState()
      .document.rootNodes.find((n) => n.id === 'rect_drag_1') as RectNode;
    expect(finalNode.x).toBe(110);
    expect(finalNode.y).toBe(110);

    // Commit a single history snapshot at drag completion
    useDesignStore.getState().commitSnapshot(initialDoc);

    // Undo should restore position back to (50, 50) in ONE step!
    useDesignStore.getState().undo();
    const restoredNode = useDesignStore
      .getState()
      .document.rootNodes.find((n) => n.id === 'rect_drag_1') as RectNode;
    expect(restoredNode.x).toBe(50);
    expect(restoredNode.y).toBe(50);
  });
});


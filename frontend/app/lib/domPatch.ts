// Side-effect module: harden a few DOM APIs against extension-driven mutations.
// Imported from a client component (AuthGate) so it runs very early in the /app bundle.

const PATCH_FLAG = "__amline_dom_patch_v2__";

function install() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[PATCH_FLAG]) return;
  w[PATCH_FLAG] = true;

  const doc = document;

  const cleanupDocumentChildren = () => {
    try {
      const kids = Array.from(doc.childNodes || []);
      for (const n of kids) {
        if (n && n.nodeType === Node.ELEMENT_NODE && n !== doc.documentElement) {
          try {
            if (doc.body) doc.body.appendChild(n);
            else n.parentNode?.removeChild(n);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  };

  cleanupDocumentChildren();

  try {
    const docProto = Document.prototype as unknown as {
      appendChild: (node: Node) => Node;
      insertBefore: (node: Node, ref: Node | null) => Node;
    };

    const origAppend = docProto.appendChild;
    docProto.appendChild = function patchedAppendChild(node: Node) {
      try {
        if (this === doc && node && node.nodeType === Node.ELEMENT_NODE && node !== doc.documentElement) {
          const target = doc.body || doc.head || doc.documentElement;
          if (target) return target.appendChild(node);
          return node;
        }
      } catch {
        // ignore
      }
      return origAppend.call(this as unknown as Document, node);
    };

    const origInsert = docProto.insertBefore;
    docProto.insertBefore = function patchedInsertBefore(node: Node, ref: Node | null) {
      try {
        if (this === doc && node && node.nodeType === Node.ELEMENT_NODE && node !== doc.documentElement) {
          const target = doc.head || doc.body || doc.documentElement;
          if (target) {
            const before = ref && target.contains(ref) ? ref : target.firstChild;
            return target.insertBefore(node, before);
          }
          return node;
        }
      } catch {
        // ignore
      }
      return origInsert.call(this as unknown as Document, node, ref);
    };
  } catch {
    // ignore
  }

  try {
    const nodeProto = Node.prototype as unknown as { removeChild: (child: Node) => Node };
    const origRemove = nodeProto.removeChild;
    nodeProto.removeChild = function patchedRemoveChild(child: Node) {
      try {
        return origRemove.call(this as unknown as Node, child);
      } catch (e: unknown) {
        const name = (e as { name?: string } | null)?.name;
        if (name === "NotFoundError") return child;
        throw e;
      }
    };
  } catch {
    // ignore
  }

  try {
    const start = Date.now();
    const mo = new MutationObserver(() => {
      cleanupDocumentChildren();
      if (Date.now() - start > 3000) {
        try {
          mo.disconnect();
        } catch {
          // ignore
        }
      }
    });
    mo.observe(doc, { childList: true, subtree: true });
  } catch {
    // ignore
  }
}

install();


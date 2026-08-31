import { useEffect, useRef, useState } from "react";
import { Check, FileText, Loader2 } from "lucide-react";
import { api, apiPath } from "../_kit/api/client";
import { useAppMutations } from "../_kit/hooks/hooks";
import { Button, Modal } from "../_kit/components/primitives";

const DESIGN_COUNT = 8;
const DESIGNS = Array.from({ length: DESIGN_COUNT }, (_, i) => i + 1);

const PDFJS_VERSION = "4.0.379";
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// Loaded once and cached — every design switch reuses the same pdf.js
// module instead of re-fetching it from the CDN.
let pdfjsLoad = null;
function loadPdfjs() {
  if (!pdfjsLoad) {
    pdfjsLoad = import(/* webpackIgnore: true */ `${PDFJS_BASE}/pdf.min.mjs`).then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return pdfjsLoad;
}

/**
 * "Choose Design" modal — lets the user browse the 8 available payslip
 * PDF layouts and preview each on demand (one at a time, never all 8 at
 * once) before saving their pick to Client.pdf_design.
 *
 * Preview PDFs use the client's real name/logo/company details with dummy
 * employee/salary data (see ClientViewSet.pdf_preview on the backend) —
 * nothing is persisted until "Save Design" is clicked.
 *
 * The preview is rendered ourselves onto a <canvas> via pdf.js rather than
 * handed to the browser's native PDF viewer in an <iframe> — that native
 * viewer brings its own toolbar/scrollbars and doesn't reliably fit an odd-
 * shaped panel, which is exactly what we don't want for a quick side-by-
 * side design picker.
 */
export default function ChooseDesignModal({ client, onClose, onSaved }) {
  const { mutateSaveClient } = useAppMutations();

  const [selected, setSelected] = useState(client?.pdf_design || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);   // current pdf.js document, for cleanup
  const renderTaskRef = useRef(null); // in-flight canvas render, for cancellation
  const requestSeq = useRef(0);

  const renderPage = async (pdfDoc) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const page = await pdfDoc.getPage(1);
    const unscaled = page.getViewport({ scale: 1 });
    // Fit the A4 page inside the container on whichever axis is tighter,
    // so the whole page is always visible with no crop and no scrollbars.
    const scale = Math.min(
      container.clientWidth / unscaled.width,
      container.clientHeight / unscaled.height
    );
    const viewport = page.getViewport({ scale: scale > 0 ? scale : 1 });

    // Always render at least 3x the CSS display size — on a standard
    // (non-retina) monitor, devicePixelRatio is 1, and rendering the PDF's
    // vector text at exactly 1x makes it look noticeably softer than a
    // real PDF viewer. Supersampling here and letting CSS present it at
    // the smaller fitted size fixes that regardless of the monitor's DPR.
    // Diminishing returns above ~3x — the extra pixels stop being visible
    // once they exceed the monitor's actual resolution, so this isn't
    // pushed further by default.
    const outputScale = Math.max(window.devicePixelRatio || 1, 3);
    canvas.width = viewport.width * outputScale;
    canvas.height = viewport.height * outputScale;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    if (renderTaskRef.current) renderTaskRef.current.cancel();
    const task = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") throw err;
    }
  };

  const loadPreview = async (design) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const [pdfjsLib, response] = await Promise.all([
        loadPdfjs(),
        api.get(apiPath(`clients/${client.id}/pdf-preview/?design=${design}`), {
          responseType: "arraybuffer",
        }),
      ]);
      if (seq !== requestSeq.current) return; // a newer request has since started

      const pdfDoc = await pdfjsLib.getDocument({ data: response.data }).promise;
      if (seq !== requestSeq.current) { pdfDoc.destroy(); return; }

      if (pdfDocRef.current) pdfDocRef.current.destroy();
      pdfDocRef.current = pdfDoc;

      await renderPage(pdfDoc);
      if (seq !== requestSeq.current) return;
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError("Couldn't load this design's preview. Try another design.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview(selected);
    return () => {
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      if (pdfDocRef.current) pdfDocRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fit the current page if the panel is resized (e.g. window resize).
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(() => {
      if (pdfDocRef.current) renderPage(pdfDocRef.current);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const pick = (design) => {
    if (design === selected) return;
    setSelected(design);
    loadPreview(design);
  };

  const save = () => {
    mutateSaveClient.mutate(
      { id: client.id, formData: { pdf_design: selected } },
      { onSuccess: () => { onSaved?.(selected); onClose?.(); } }
    );
  };

  return (
    <Modal title="Choose Payslip Design" onClose={onClose} size="l">
      <div className="flex gap-4" style={{ height: "70vh", minHeight: 0 }}>
        {/* Design list */}
        <div className="w-48 shrink-0 space-y-1.5 overflow-y-auto pr-1" style={{ minHeight: 0 }}>
          {DESIGNS.map((design) => {
            const isSelected = design === selected;
            return (
              <button
                key={design}
                type="button"
                onClick={() => pick(design)}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
                style={{
                  background: isSelected ? "var(--blue-bg)" : "var(--surface-2)",
                  border: `1px solid ${isSelected ? "var(--blue-border)" : "var(--border-3)"}`,
                  color: isSelected ? "var(--blue-text-strong)" : "var(--text-primary)",
                }}
              >
                <FileText size={14} />
                Design {design}
                {isSelected && <Check size={14} className="ml-auto" />}
              </button>
            );
          })}
        </div>

        {/* Preview pane — our own canvas render, not a native PDF viewer */}
        <div
          ref={containerRef}
          className="flex-1 rounded-xl flex items-center justify-center relative"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-3)", overflow: "hidden", minWidth: 0, minHeight: 0 }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: loading || error ? "none" : "block", boxShadow: "var(--shadow-xl)" }}
          />
          {loading && (
            <div className="flex flex-col items-center gap-2 absolute" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={20} className="animate-spin" />
              <span className="text-xs">Rendering preview…</span>
            </div>
          )}
          {!loading && error && (
            <div className="text-sm px-4 text-center absolute" style={{ color: "var(--red-text-strong)" }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Currently saved: Design {client?.pdf_design || 1}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={mutateSaveClient.isPending}
            className="btn-glass inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <Button
            onClick={save}
            disabled={mutateSaveClient.isPending || loading || !!error}
          >
            {mutateSaveClient.isPending ? "Saving…" : "Save Design"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
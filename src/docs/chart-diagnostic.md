# Chart Rendering Diagnostic & Resolution

## Root Cause Analysis

Multiple charts in the "Constellation" application (specifically the **Submission Phase**, **Spend Breakdown**, and **Accruals vs Submitted** charts) were exhibiting "collapsed" or "missing" segments. After a deep diagnostic pass, the following root causes were identified:

1.  **Key Character Mismatch (Primary Issue):**
    In `SubmissionPhaseStackedBarCard`, the raw data used EM DASH characters (`—`) in keys, while the mapping logic and Recharts `Bar` components used EN DASH characters (`–`). While the mapping code appeared to handle this, Recharts is extremely sensitive to character encoding. Any discrepancy (including leading/trailing spaces or dash types) causes the data key to return `undefined`, resulting in a 0-width segment that "disappears" from the stack.

2.  **Stacking Logic & Radius Conflicts:**
    In the `SpendBreakdown` chart, the use of `radius` on every segment in a stacked bar can cause rendering artifacts if a segment is very small (e.g., < 5%). If the first or last segment is too small to accommodate the radius, it can cause the entire stack's layout to jitter or collapse.

3.  **Persona Context Awareness:**
    The chart components were receiving a `variant` prop (Dealer vs OEM) but were not consistently using it to switch data sets or adjust scaling, leading to visual parity issues when switching personas.

4.  **Language Dynamic Resizing:**
    Filter labels in French often exceed the width of their English counterparts. Hardcoded widths on container elements were clipping these labels or causing layout overflows.

## Resolution Steps

1.  **Normalized Data Keys:** 
    All internal data keys have been normalized to use standard hyphens (`-`) for robustness, while display labels continue to use the `LanguageProvider` `t()` function to ensure correct visual representation (including proper typography in French).

2.  **Robust Stacking:**
    Revised the `Bar` radius logic to only apply rounding to the "outermost" edges of the stack (leftmost and rightmost) to prevent internal collapse.

3.  **Persona-Specific Data Loading:**
    Updated the components to react to the `variant` prop, providing tailored datasets and scaling for Dealer and OEM views as specified in the Figma references.

4.  **Dynamic Filtering:**
    Removed hardcoded widths from `FilterSelect` instances to allow `w-fit` and `min-w-max` to naturally handle translated strings.

5.  **Tooltip Consistency:**
    Standardized `DatavizTooltip` to ensure all series names and values are passed through the translation hook before rendering.

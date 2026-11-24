import { applyRefine } from "./applyRefine";
import { applyNormalize } from "./applyNormalize";

/** Turn what was said for a step into its final report value. */
export async function fillField(step, raw, data) {
  let value = (raw || "").trim();
  if (value && step.refine) value = await applyRefine(value, step.refine, data);
  if (value && step.normalize) value = applyNormalize(value, step.normalize);
  return value;
}

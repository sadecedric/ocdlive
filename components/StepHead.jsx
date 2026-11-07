/** Titre d'étape, identique sur les quatre formulaires du tunnel. */
export default function StepHead({ step, title, subtitle, children }) {
  return (
    <div className="step-head">
      <p className="step-eyebrow">Étape {step} sur 5</p>
      <h1>{title}</h1>
      {subtitle && <p className="step-sub">{subtitle}</p>}
      {children}
    </div>
  );
}

import { Camera } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { getBodyAssessmentsData } from "@/lib/data";
import { formatAssessmentDate } from "@/lib/body-assessment";
import { PageHeader, Card, Badge } from "@/components/ui";

export default async function AlunoEvolucaoPage() {
  const profile = await getCurrentProfile();
  const assessments = await getBodyAssessmentsData(profile.id);
  const current = assessments[0];
  const previous = assessments[1];
  const points = assessments
    .slice()
    .reverse()
    .slice(-8)
    .map((assessment, index, list) => {
      const weights = list.map((item) => item.weight);
      const min = Math.min(...weights);
      const max = Math.max(...weights);
      const span = max - min || 1;
      return {
        label: formatAssessmentDate(assessment.assessmentDate).slice(0, 5),
        x: 10 + index * (80 / Math.max(list.length - 1, 1)),
        y: 92 - ((assessment.weight - min) / span) * 64,
      };
    });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <>
      <PageHeader eyebrow="Dados reais" title="Evolucao" showBack={false} />

      {!current ? (
        <section className="px-5">
          <Card>
            <p className="lbl">Historico vazio</p>
            <h2 className="mt-2 text-lg font-bold">Nenhuma avaliacao cadastrada</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">Quando o personal registrar uma avaliacao fisica, seus graficos e medidas aparecem aqui.</p>
          </Card>
        </section>
      ) : (
        <>
          <section className="px-5">
            <Card className="p-0">
              <div className="p-4 pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="mono tnum text-[34px] font-bold leading-none tracking-[-0.05em]">{current.weight.toFixed(1).replace(".", ",")}</span>
                      <span className="pb-1 text-sm font-bold text-neutral-500">kg</span>
                    </div>
                    <p className="lbl mt-2">Peso atual</p>
                  </div>
                  {previous ? <Badge tone={current.weight <= previous.weight ? "success" : "warning"}>{formatDiff(current.weight - previous.weight, "kg")}</Badge> : null}
                </div>
              </div>

              <div className="px-3 pb-3">
                {points.length > 1 ? (
                  <svg viewBox="0 0 100 122" className="mt-2 h-44 w-full overflow-visible" aria-label="Evolucao de peso">
                    <polyline points={line} fill="none" stroke="#0A84FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    {points.map((point) => (
                      <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="1.8" fill="#0A84FF" />
                    ))}
                    {points.map((point) => (
                      <text key={point.label} x={point.x} y="115" textAnchor="middle" className="fill-neutral-400 text-[4px] font-bold">
                        {point.label}
                      </text>
                    ))}
                  </svg>
                ) : (
                  <div className="mt-4 rounded-[16px] bg-[var(--surface)] p-4 text-sm font-semibold text-neutral-500">
                    Cadastre mais uma avaliacao para gerar o grafico comparativo.
                  </div>
                )}
              </div>
            </Card>
          </section>

          <section className="mt-3 grid grid-cols-3 gap-3 px-5">
            <Card className="p-3">
              <p className="mono text-xl font-bold text-[var(--blue)]">{current.bmi}</p>
              <p className="lbl mt-2">IMC</p>
            </Card>
            <Card className="p-3">
              <p className="mono text-xl font-bold text-[var(--amber)]">{current.measurements.waist ?? "--"} cm</p>
              <p className="lbl mt-2">Cintura</p>
            </Card>
            <Card className="p-3">
              <p className="mono text-xl font-bold text-[var(--green)]">{current.leanMass} kg</p>
              <p className="lbl mt-2">Magra</p>
            </Card>
          </section>

          <section className="mt-6 px-5">
            <p className="lbl mb-3">Fotos de evolucao</p>
            <div className="grid grid-cols-3 gap-3">
              {(["front", "side", "back"] as const).map((type) => (
                <div key={type}>
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-[14px] border border-[var(--hair)] bg-[var(--surface)]">
                    {current.photos[type] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={current.photos[type]} alt={type} className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="size-5 text-neutral-600" />
                    )}
                  </div>
                  <p className="lbl mt-2 text-center">{photoLabel[type]}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 px-5">
            <p className="lbl mb-3">Historico real</p>
            <div className="grid gap-3">
              {assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold">{formatAssessmentDate(assessment.assessmentDate)}</h2>
                      <p className="mt-1 text-xs font-medium text-neutral-500">{assessment.weight} kg · {assessment.bodyFatPercentage}% gordura</p>
                    </div>
                    <Badge tone="blue">{assessment.protocolType.toUpperCase()}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

const photoLabel = {
  front: "Frente",
  side: "Lateral",
  back: "Posterior",
};

function formatDiff(value: number, unit: string) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded} ${unit}`;
}

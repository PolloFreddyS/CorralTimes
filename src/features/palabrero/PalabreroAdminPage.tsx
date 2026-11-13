import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader, PhaseNotice } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Field, Input, NativeSelect } from '@/components/ui/form';
import { MAX_ATTEMPTS, WORD_LENGTH } from '@shared/domain/palabrero';

export function PalabreroAdminPage() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="El Palabrero" title="Juego de palabras de la edición" description={`${WORD_LENGTH} letras · ${MAX_ATTEMPTS} intentos · la respuesta solo vive en el servidor.`}
        actions={<Button asChild variant="outline" size="sm"><Link to="/juegos" target="_blank"><ExternalLink aria-hidden />Probar demo pública</Link></Button>} />
      <div className="flex items-start gap-2 border-2 border-green p-3 text-sm">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-green" />
        <p>La respuesta nunca se envía al navegador: cada intento se valida en el Worker, que solo devuelve la retroalimentación por letra. El build verifica que la respuesta demo no aparezca en el bundle público.</p>
      </div>
      <form className="grid max-w-3xl gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} aria-label="Configuración del palabrero">
        <Field id="pz-answer" label="Respuesta" required hint="5 letras, validada contra el diccionario.">
          <Input id="pz-answer" autoComplete="off" disabled />
        </Field>
        <Field id="pz-clue" label="Pista">
          <Input id="pz-clue" disabled />
        </Field>
        <Field id="pz-diff" label="Dificultad">
          <NativeSelect id="pz-diff" disabled><option>Normal</option></NativeSelect>
        </Field>
        <Field id="pz-from" label="Activo desde">
          <Input id="pz-from" type="datetime-local" disabled />
        </Field>
        <div className="sm:col-span-2"><Button disabled>Guardar palabrero</Button></div>
      </form>
      <PhaseNotice phase={8}>Configuración por edición, vocabulario español validado + diccionario comunitario, ventana de activación/expiración y rate limiting de intentos.</PhaseNotice>
    </div>
  );
}

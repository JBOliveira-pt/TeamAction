import { fetchPerfilAtletaGeral } from '@/app/lib/data';
import GeralClient from './geral-client';

export const dynamic = 'force-dynamic';

export default async function GeralPage() {
    const dados = await fetchPerfilAtletaGeral();

    const dataNascimento = dados?.user?.data_nascimento ?? null;
    let dataNascimentoFormatted: string | null = null;
    if (dataNascimento) {
        try {
            dataNascimentoFormatted = new Date(
                dataNascimento,
            ).toLocaleDateString('pt-PT');
        } catch {
            dataNascimentoFormatted = String(dataNascimento);
        }
    }

    const addrParts = [
        dados?.user?.morada,
        dados?.user?.codigo_postal,
        dados?.user?.cidade,
        dados?.user?.pais,
    ].filter(Boolean);
    const endereco = addrParts.length > 0 ? addrParts.join(', ') : null;

    return (
        <GeralClient
            email={dados?.user?.email ?? null}
            telefone={dados?.user?.telefone ?? null}
            morada={dados?.user?.morada ?? null}
            cidade={dados?.user?.cidade ?? null}
            codigoPostal={dados?.user?.codigo_postal ?? null}
            pais={dados?.user?.pais ?? null}
            dataNascimento={dataNascimento}
            dataNascimentoFormatted={dataNascimentoFormatted}
            mao={dados?.atleta?.mao_dominante ?? null}
            equipa={dados?.atleta?.equipa_nome ?? null}
            endereco={endereco}
            menor={dados?.user?.menor_idade ?? null}
            nomeEncarregado={dados?.guardian?.name ?? null}
            emailEncarregado={dados?.guardian?.email ?? null}
            aprovado={dados?.user?.status ?? null}
        />
    );
}

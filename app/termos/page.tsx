import Link from "next/link";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";

export default function TermosPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
                    <Link
                        href="/"
                        className="transition-opacity hover:opacity-80"
                    >
                        <Image
                            src={ASSETS.logoFullWhite}
                            alt="TeamAction"
                            width={160}
                            height={40}
                            className="h-auto w-auto max-w-[160px]"
                        />
                    </Link>
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                    >
                        ← Voltar ao início
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-4xl px-4 py-16">
                <h1 className="text-3xl font-bold text-slate-900">
                    Termos de Uso
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Última atualização: 12 de abril de 2026
                </p>

                <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-700">
                    {/* 1 — Aceitação */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            1. Aceitação dos Termos
                        </h2>
                        <p>
                            Ao aceder e utilizar a plataforma{" "}
                            <strong>TeamAction</strong>, concorda com os
                            presentes Termos de Uso e com a nossa{" "}
                            <Link
                                href="/privacidade"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                Política de Privacidade
                            </Link>
                            . Se não concordar com qualquer parte destes termos,
                            não deverá utilizar a plataforma.
                        </p>
                    </section>

                    {/* 2 — Descrição */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            2. Descrição do Serviço
                        </h2>
                        <p>
                            A TeamAction é uma plataforma digital de gestão
                            desportiva que permite a clubes, treinadores,
                            atletas e responsáveis gerir equipas, treinos,
                            jogos, avaliações, recibos e comunicações de forma
                            centralizada e intuitiva. O serviço é prestado por
                            via eletrónica nos termos da Diretiva 2000/31/CE
                            (Diretiva sobre Comércio Eletrónico) e do
                            Decreto-Lei n.º 7/2004.
                        </p>
                    </section>

                    {/* 3 — Registo e Conta */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            3. Registo e Conta
                        </h2>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                É necessário criar uma conta para aceder às
                                funcionalidades da plataforma.
                            </li>
                            <li>
                                O utilizador é responsável por manter a
                                confidencialidade das suas credenciais de
                                acesso.
                            </li>
                            <li>
                                Os dados fornecidos durante o registo devem ser
                                verdadeiros, completos e atualizados.
                            </li>
                            <li>
                                Menores de 18 anos devem ter um responsável
                                vinculado à sua conta, em conformidade com o
                                artigo 8.º do RGPD e a Lei n.º 58/2019.
                            </li>
                        </ul>
                    </section>

                    {/* 4 — Tipos de Conta */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            4. Tipos de Conta
                        </h2>
                        <p className="mb-2">
                            A plataforma disponibiliza os seguintes perfis de
                            utilizador, cada um com permissões específicas:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                <strong>Presidente/Clube:</strong> gestão
                                completa do clube, equipas, convites e planos.
                            </li>
                            <li>
                                <strong>Treinador:</strong> gestão de treinos,
                                convocatórias, avaliações e exercícios.
                            </li>
                            <li>
                                <strong>Atleta:</strong> acesso ao próprio
                                perfil, agenda, avaliações e estatísticas.
                            </li>
                            <li>
                                <strong>Responsável:</strong> acompanhamento de
                                atletas menores vinculados.
                            </li>
                        </ul>
                    </section>

                    {/* 5 — Uso Aceitável */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            5. Uso Aceitável
                        </h2>
                        <p className="mb-2">
                            Ao utilizar a plataforma, compromete-se a:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                Não utilizar a plataforma para fins ilegais ou
                                não autorizados.
                            </li>
                            <li>
                                Não tentar aceder a contas ou dados de outros
                                utilizadores sem autorização.
                            </li>
                            <li>
                                Não interferir no funcionamento normal da
                                plataforma.
                            </li>
                            <li>
                                Não carregar conteúdo ilegal, ofensivo,
                                difamatório ou que viole direitos de terceiros.
                            </li>
                            <li>
                                Respeitar os direitos de propriedade intelectual
                                da TeamAction e de terceiros.
                            </li>
                        </ul>
                    </section>

                    {/* 6 — Moderação de Conteúdos (DSA) */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            6. Moderação de Conteúdos
                        </h2>
                        <p className="mb-2">
                            Em conformidade com o Regulamento dos Serviços
                            Digitais (Regulamento (UE) 2022/2065 — Digital
                            Services Act):
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                A TeamAction pode remover ou restringir a
                                visibilidade de conteúdo que viole estes Termos
                                ou a legislação aplicável.
                            </li>
                            <li>
                                Qualquer utilizador pode reportar conteúdo
                                ilícito ou contrário aos Termos através do
                                e-mail{" "}
                                <a
                                    href="mailto:teamaction@outlook.pt"
                                    className="font-medium text-blue-600 underline transition hover:text-blue-800"
                                >
                                    teamaction@outlook.pt
                                </a>
                                .
                            </li>
                            <li>
                                As decisões de moderação serão comunicadas ao
                                utilizador afetado com a respetiva
                                fundamentação.
                            </li>
                            <li>
                                O utilizador tem direito a contestar decisões de
                                moderação no prazo de 6 meses após notificação.
                            </li>
                        </ul>
                    </section>

                    {/* 7 — Planos e Pagamentos */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            7. Planos e Pagamentos
                        </h2>
                        <p>
                            A plataforma pode oferecer diferentes planos de
                            subscrição. Os detalhes, preços e funcionalidades de
                            cada plano são apresentados na página de planos.
                            Todos os preços incluem IVA quando aplicável. A
                            TeamAction reserva-se o direito de alterar preços ou
                            funcionalidades com aviso prévio de 30 dias aos
                            utilizadores afetados.
                        </p>
                    </section>

                    {/* 8 — Direito de Livre Resolução */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            8. Direito de Livre Resolução
                        </h2>
                        <p>
                            Nos termos da Diretiva 2011/83/UE (Direitos dos
                            Consumidores) e do Decreto-Lei n.º 24/2014, caso
                            seja um consumidor, tem o direito de resolver o
                            contrato no prazo de 14 dias a contar da data de
                            subscrição de um plano pago, sem necessidade de
                            indicar qualquer motivo. Para exercer este direito,
                            entre em contacto connosco através de{" "}
                            <a
                                href="mailto:teamaction@outlook.pt"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                teamaction@outlook.pt
                            </a>
                            . O reembolso será processado no prazo de 14 dias
                            utilizando o mesmo meio de pagamento.
                        </p>
                    </section>

                    {/* 9 — Propriedade Intelectual */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            9. Propriedade Intelectual
                        </h2>
                        <p>
                            Todo o conteúdo da plataforma — incluindo design,
                            código-fonte, logótipos, textos e funcionalidades —
                            é propriedade da TeamAction ou dos seus licenciantes
                            e está protegido pela legislação portuguesa e
                            europeia de propriedade intelectual (Código do
                            Direito de Autor e Diretiva 2001/29/CE). Não é
                            permitida a reprodução, distribuição ou modificação
                            sem autorização prévia por escrito.
                        </p>
                    </section>

                    {/* 10 — Limitação de Responsabilidade */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            10. Limitação de Responsabilidade
                        </h2>
                        <p>
                            Na máxima extensão permitida pela legislação
                            aplicável, a TeamAction não se responsabiliza por
                            danos indiretos, incidentais ou consequenciais
                            resultantes da utilização da plataforma. Não
                            garantimos disponibilidade ininterrupta ou ausência
                            de erros. Esta limitação não afeta os direitos do
                            consumidor previstos na legislação da UE que não
                            podem ser excluídos contratualmente.
                        </p>
                    </section>

                    {/* 11 — Suspensão e Encerramento */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            11. Suspensão e Encerramento
                        </h2>
                        <p>
                            Reservamo-nos o direito de suspender ou encerrar
                            contas que violem estes Termos de Uso. Antes da
                            suspensão, será emitida uma notificação com a
                            fundamentação da decisão, salvo em situações de
                            urgência ou obrigação legal. O utilizador pode
                            solicitar o encerramento da sua conta a qualquer
                            momento.
                        </p>
                    </section>

                    {/* 12 — Alterações */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            12. Alterações aos Termos
                        </h2>
                        <p>
                            Podemos atualizar estes Termos de Uso
                            periodicamente. Quaisquer alterações substanciais
                            serão notificadas com antecedência mínima de 15
                            dias. A utilização continuada da plataforma após o
                            período de notificação constitui aceitação dos novos
                            termos.
                        </p>
                    </section>

                    {/* 13 — Lei Aplicável e Jurisdição */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            13. Lei Aplicável e Jurisdição
                        </h2>
                        <p>
                            Estes Termos de Uso são regidos pela legislação
                            portuguesa e pela legislação da União Europeia
                            diretamente aplicável, incluindo o RGPD (Regulamento
                            (UE) 2016/679), o DSA (Regulamento (UE) 2022/2065) e
                            a Diretiva 2011/83/UE. Em caso de litígio, será
                            competente o foro da comarca de Lisboa, sem prejuízo
                            das normas imperativas de proteção do consumidor que
                            confiram competência ao tribunal do domicílio do
                            utilizador.
                        </p>
                    </section>

                    {/* 14 — Resolução Alternativa de Litígios */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            14. Resolução Alternativa de Litígios
                        </h2>
                        <p>
                            Em conformidade com o Regulamento (UE) n.º 524/2013
                            e a Diretiva 2013/11/UE, informamos que a Comissão
                            Europeia disponibiliza uma plataforma de Resolução
                            de Litígios em Linha (RLL) acessível em{" "}
                            <a
                                href="https://ec.europa.eu/consumers/odr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                https://ec.europa.eu/consumers/odr
                            </a>
                            . Pode igualmente recorrer a entidades de Resolução
                            Alternativa de Litígios (RAL) acreditadas em
                            Portugal, disponíveis em{" "}
                            <a
                                href="https://www.consumidor.gov.pt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                www.consumidor.gov.pt
                            </a>
                            .
                        </p>
                    </section>

                    {/* 15 — Contacto */}
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            15. Contacto
                        </h2>
                        <p>
                            Para questões relacionadas com estes Termos de Uso,
                            contacte-nos através de{" "}
                            <a
                                href="mailto:teamaction@outlook.pt"
                                className="font-medium text-blue-600 underline transition hover:text-blue-800"
                            >
                                teamaction@outlook.pt
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </main>

            {/* Mini footer */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6">
                    <p className="text-xs text-slate-400">
                        © {new Date().getFullYear()} TeamAction
                    </p>
                    <Link
                        href="/privacidade"
                        className="text-xs text-slate-500 transition hover:text-slate-700"
                    >
                        Política de Privacidade
                    </Link>
                </div>
            </footer>
        </div>
    );
}
